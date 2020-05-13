
import {
    ReducerGroup, FetchAction, ActionMeta, MiddleWare, Dispatch, GetActionFromReducers,
    FetchVariants, Json, TypeSafeStore, Action, FetchRequest, FUrl,
    ActionInternalMeta, OflloadActionResult,
    FetchActionMeta,
    FetchFieldValue,
    FetchRejectionError,
    AbortError
} from "@typesafe-store/store"

import { FetchMiddlewareUtils, FetchMiddlewareOptions } from "@typesafe-store/middleware-fetch"


export type WorkerFetchInput = { kind: "Fetch", input: { url: string, options: RequestInit, responseType: string, abortable?: boolean, freq?: any, grpc?: { dsf: string }, graphql?: { multiOp?: boolean }, tf?: string }, }
export type WorkerSyncInput = { kind: "Sync", input: { propAccessArray: string[], payload?: any, abortable?: boolean, state: any, workerFunction: string } }
export type WorkerInput = WorkerFetchInput
    | WorkerSyncInput

export type WorkerOutputStatus = "Processing" | "Success" | "Error"

export type WorkerFetchOutput = { kind: "Fetch", status: WorkerOutputStatus, stream?: boolean, grpc?: boolean, error?: any, rejectionError?: boolean, result?: { data?: any, completed?: boolean, error?: any } }

export type WorkerSyncOutput = { kind: "Sync", status: WorkerOutputStatus, error?: any, abortError?: any, result?: any }

export type WorkerOutput = WorkerFetchOutput | WorkerSyncOutput

type Options = { workerUrl: string, poolSize?: number, fetchMiddlewareOptions?: FetchMiddlewareOptions }
type GenericReducerGroup = ReducerGroup<any, any, any, any>
type GenericFetchAsyncData = FetchFieldValue<any, any, any, any, any>
type Queue = { action: Action, rg: GenericReducerGroup }

const isOffloadAction = (action: Action, rg: GenericReducerGroup) => {
    const actionMeta = rg.m.a[action.name]
    if (!actionMeta) {
        return false
    }
    if (actionMeta.offload) {
        return true
    }
    if (actionMeta.f && actionMeta.f.offload) {
        return true
    }
    return false;
}

class TSWorker {
    worker!: Worker
    isRunning = false
    isTerminated = false
    private action!: Action
    private actionMeta!: ActionMeta<any>
    private abortController?: AbortController
    constructor(private readonly url: string, public readonly store: TypeSafeStore<any>,
        private queue: Queue[], private readonly moptions: Options) {
        this.createWorker()
    }

    createWorker = () => {
        this.isTerminated = false
        this.isRunning = false
        this.worker = new Worker(this.url)
        this.worker.onmessage = (e) => {
            this.handleOutput(e.data)
        }
    }

    private handleOutput = (wo: WorkerOutput) => {
        if (wo.kind === "Fetch") {
            this.handleFetchOutput(wo)
        } else if (wo.kind === "Sync") {
            this.handleSyncOutput(wo)
        }
    }

    private handleFetchOutput = (wo: WorkerFetchOutput) => {
        const fetchMeta = this.actionMeta as FetchActionMeta
        const fetchRequest = (this.action as FetchAction).fetch
        const action = this.action
        if (wo.status === "Processing") {
            let ai: ActionInternalMeta = null as any
            let result = null as any
            if (wo.stream) { // streams are sent as processing 
                result = wo.result
            }
            else if (fetchRequest.optimisticResponse) { // optimistic response 
                if (fetchMeta.response === "stream") {
                    throw new Error(`Optimistic response not supported in case of stream`)
                }
                result = { data: fetchRequest.optimisticResponse, abortController: this.abortController, optimistic: true }
            } else {
                result = { loading: true, abortController: this.abortController }
            }
            if (fetchMeta.typeOps) {
                ai = { processed: true, kind: "DataAndTypeOps", typeOp: fetchMeta.typeOps, data: result }
            } else {
                ai = { processed: true, kind: "Data", data: result }
            }
            this.store.dispatch({ ...action, _internal: ai })
        } else if (wo.status === "Success") {
            let result = wo.result!
            if (wo.rejectionError && fetchRequest.offline && result.error.name !== "AbortError") {
                this.store.addNetworkOfflineAction(this.action)
                const resultOffline: GenericFetchAsyncData = { offline: true, optimistic: !!fetchRequest.optimisticResponse, completed: true }
                let ai: ActionInternalMeta = { kind: "Data", data: resultOffline, processed: true }
                //TODO how to handle typeops offline optimistic case?
                // if (fetchMeta.typeOps) {
                //     ai = {
                //         processed: true, data: resultError,
                //         optimisticFailed: fetchRequest.optimisticResponse,
                //         kind: "DataAndTypeOps", typeOp: fetchMeta.typeOps,
                //     }
                // } else {
                //     ai = { kind: "Data", data: resultError, processed: true }
                // }
                this.store.dispatch({ ...action, _internal: ai })
            } else {
                let ai: ActionInternalMeta = null as any
                if (wo.rejectionError) {
                    result.error = new FetchRejectionError(result.error)
                }
                if (fetchMeta.typeOps) {
                    if (result.error) {
                        ai = {
                            processed: true, data: result,
                            optimisticFailed: fetchRequest.optimisticResponse,
                            kind: "DataAndTypeOps", typeOp: fetchMeta.typeOps,
                        }
                    } else {
                        ai = {
                            processed: true, data: result,
                            optimisticSuccess: fetchRequest.optimisticResponse,
                            kind: "DataAndTypeOps", typeOp: fetchMeta.typeOps,
                        }
                    }

                } else {
                    ai = { kind: "Data", data: result, processed: true }
                }
                this.store.dispatch({ ...action, _internal: ai })
            }

            this.isRunning = false
            this.handleDone()
        } else if (wo.status === "Error") {
            this.isRunning = false
            throw new Error(wo.error)
        }

    }

    private handleSyncOutput = (wo: WorkerSyncOutput) => {
        console.log("handleSyncOutput", wo);
        if (wo.status === "Processing") {
            const result: OflloadActionResult = { loading: true, abortController: this.abortController }
            const ai: ActionInternalMeta = { kind: "Data", processed: true, data: result }
            this.store.dispatch({ ...this.action, _internal: ai })
        } else if (wo.status === "Success") {
            if (wo.abortError) {
                const result: OflloadActionResult = { completed: true, error: wo.abortError }
                const ai: ActionInternalMeta = { kind: "Data", processed: true, data: result }
                this.store.dispatch({ ...this.action, _internal: ai })
            } else {
                const result = wo.result
                const stateKey = this.store.getStateKeyForGroup(this.action.group)
                const state = this.store.state[stateKey];
                const newState = this.actionMeta.offload!.workerResponseToState(state, result);
                (newState as any)[this.action.name] = { completed: true };
                const ai: ActionInternalMeta = { kind: "State", processed: true, data: newState }
                this.store.dispatch({ ...this.action, _internal: ai })
            }
            this.isRunning = false
            this.handleDone()
        } else if (wo.status === "Error") {
            this.isRunning = false
            throw new Error(wo.error)
        }
    }

    private handleDone() {
        if (!this.isTerminated && this.queue.length > 0) {
            const q = this.queue[0]
            this.queue.splice(0, 1)
            this.handleAction(q.action, q.rg)
        }
    }

    handleAction(action: Action, rg: GenericReducerGroup) {
        this.isRunning = true
        const actionMeta = rg.m.a[action.name]
        this.action = action
        this.actionMeta = actionMeta
        this.abortController = undefined
        if (actionMeta.offload) {
            this.handleSyncAction(action, actionMeta)
        } else if (actionMeta.f && actionMeta.f.offload) {
            this.handleFetchAction(action as any, actionMeta)
        }
    }
    private createWorkerFunctionName() {
        const { name, group } = this.action
        return `${group.split("/").join("_")}_${name}`
    }

    private handleSyncAction(action: Action, actionMeta: ActionMeta<any>) {
        const stateKey = this.store.getStateKeyForGroup(action.group)
        const estate = this.store.state[stateKey]
        const state = actionMeta.offload!.stateToWorkerIn(estate)
        const workerFunction = this.createWorkerFunctionName()
        const propAccessArray = actionMeta.offload!.propAccessArray
        let abortable = false
        const payload = (action as any).payload;
        if (payload !== null && payload !== undefined && payload._abortable === true) {
            this.abortController = new AbortController()
            abortable = true
            this.abortController.signal.addEventListener("abort", this.handleAbort)
        }
        const wi: WorkerInput = { kind: "Sync", input: { state, abortable, payload, workerFunction, propAccessArray } }
        this.worker.postMessage(wi)

    }

    private handleAbort = () => {
        console.log("handleAbort");
        this.worker.terminate()
        this.abortController = undefined
        this.isTerminated = true
        const aError = new AbortError("aborted by user")
        if (this.actionMeta.offload) {
            const wo: WorkerOutput = { kind: "Sync", status: "Success", abortError: aError }
            this.handleSyncOutput(wo)
        } else if (this.actionMeta.f && this.actionMeta.f.offload) {
            const wo: WorkerOutput = { kind: "Fetch", status: "Success", rejectionError: true, result: { error: aError, completed: true } }
            this.handleFetchOutput(wo)
        }
    }

    private handleFetchAction(action: FetchAction, actionMeta: ActionMeta<any>) {
        const fMeta = actionMeta as FetchActionMeta
        const fRequest = action.fetch
        let freqToSend: any | undefined = undefined
        let tfName: string | undefined = undefined
        if (fMeta.tf) {
            tfName = `${this.createWorkerFunctionName()}_fetch_transform`;
            freqToSend = fRequest
        }
        if (fRequest.abortable) {
            this.abortController = new AbortController()
            this.abortController.signal.addEventListener("abort", this.handleAbort)
        }
        const responseType = fMeta.response
        const url = FetchMiddlewareUtils.getUrl(fRequest.url)
        const globalUrlOptions = FetchMiddlewareUtils.getGlobalUrlOptions(url, this.moptions.fetchMiddlewareOptions)
        const options = FetchMiddlewareUtils.getOptions(fRequest, fMeta, globalUrlOptions)

        const wi: WorkerFetchInput = {
            kind: "Fetch", input: {
                url,
                abortable: fRequest.abortable,
                graphql: fMeta.graphql,
                options, responseType, freq: freqToSend, tf: tfName
            }
        }
        this.worker.postMessage(wi)
    }

}

const getWorker = (workers: TSWorker[], options: Options, store: TypeSafeStore<any>, queue: Queue[]) => {
    let worker: TSWorker | undefined = undefined
    if (workers.length === options.poolSize) {
        workers.some(w => {
            if (w.isTerminated) { // when user aborted an offload action worker goes to terminate stage we need to create worker again
                w.createWorker()
                worker = w;
                return true
            }
            else if (!w.isRunning) {
                worker = w
                return true
            }
        })
    } else { // create worker 
        const w = new TSWorker(options.workerUrl, store, queue, options)
        workers.push(w)
        worker = w
    }
    return worker
}

const handleOffloadAction = ({ action, workers, store, rg, queue, options }: {
    options: Options,
    store: TypeSafeStore<any>,
    rg: ReducerGroup<any, any, any, any>,
    action: Action, workers: TSWorker[], queue: Queue[]
}) => {
    const worker = getWorker(workers, options, store, queue)
    if (worker) {
        worker.handleAction(action, rg)
    } else {
        queue.push({ action, rg })
    }
}


export default function createOffloadMiddleware(options: Options): MiddleWare<any> {
    let workers: TSWorker[] = []
    let queue: Queue[] = []
    if (!options.poolSize) {
        options = { ...options, poolSize: 4 }
    }
    return (store: TypeSafeStore<any>) => (next: Dispatch<Action>) => (action: Action) => {
        if (action._internal && action._internal.processed) { // if already processed by other middlewares just pass through
            return next(action)
        }
        const rg = store.getReducerGroup(action.group)
        if (isOffloadAction(action, rg)) {
            handleOffloadAction({ workers, queue, options, action, rg, store })
        } else {
            next(action)
        }

    }
}