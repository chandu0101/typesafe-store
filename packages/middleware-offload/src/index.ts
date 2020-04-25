
import {
    ReducerGroup, FetchAction, ActionMeta, MiddleWare, Dispatch, GetActionFromReducers,
    FetchVariants, Json, TypeSafeStore, Action, FetchRequest, FUrl
} from "@typesafe-store/store"

//TODO fetch should align fetch-middleware , import scripts from pbf


type WorkerInput = { kind: "Fetch", input: { url: string, options: RequestInit, workerFunction?: string } }
    | { kind: "Sync", input: { propAccessArray: string[], payload?: any, state: any, workerFunction: string } }

type WorkerOutputStatus = "Processing" | "Success" | "Error"
type WorkerOutput = { kind: "Fetch", status: WorkerOutputStatus, error?: any, result?: { data?: any, error?: any } } | { kind: "Sync", status: WorkerOutputStatus, error?: any, result?: any }

type Options = { workerUrl: string, poolSize?: number }
type GenericReducerGroup = ReducerGroup<any, any, any, any>
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
    readonly worker: Worker
    isRunning = false
    private action!: Action
    private actionMeta!: ActionMeta<any>
    constructor(url: string, public readonly store: TypeSafeStore<any>,
        private queue: Queue[]) {
        this.worker = new Worker(url)
        this.worker.onmessage = (e) => {
            this.handleOutput(e.data)
        }
    }

    private handleOutput = (wo: WorkerOutput) => {
        if (wo.kind === "Fetch") {
            if (wo.status === "Processing") {
                this.store.dispatch({ ...this.action, _internal: { processed: true, kind: "Data", data: { loading: true } } })
            } else if (wo.status === "Success") {
                const result = wo.result!
                let data = {}
                if (result.error) {
                    data = { error: result.error }
                } else {
                    data = { data: result.data }
                }
                this.store.dispatch({ ...this.action, _internal: { processed: true, kind: "Data", data } })
                this.isRunning = false
                this.handleDone()
            } else if (wo.status === "Error") {
                this.isRunning = false
                throw new Error(wo.error)
            }

        } else if (wo.kind === "Sync") {
            if (wo.status === "Processing") {
                // do nothing
            } else if (wo.status === "Success") {
                const result = wo.result
                const stateKey = this.store.getStateKeyForGroup(this.action.group)
                const state = this.store.state[stateKey]
                const newState = this.actionMeta.offload!.workerResponseToState(state, result)
                this.store.dispatch({ ...this.action, _internal: { processed: true, kind: "State", data: newState } })
                this.isRunning = false
                this.handleDone()
            } else if (wo.status === "Error") {
                this.isRunning = false
                throw new Error(wo.error)
            }
        }
    }

    private handleDone() {
        if (this.queue.length > 0) {
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
        const wi: WorkerInput = { kind: "Sync", input: { state, workerFunction, propAccessArray } }
        this.worker.postMessage(wi)
    }


    private getFetchUrl(url: FUrl): string {
        let path = url.path
        if (url.params) {
            Object.entries(url.params).forEach(([key, value]) => {
                path = path.replace(`{${key}}`, value.toString())
            })
        }
        if (url.queryParams) {
            const query = Object.entries(url.queryParams)
                .map(([key, value]) => `${key}=${value}`).join("&")
            if (query !== "") {
                path = `${path}?${query}`
            }
        }
        return path
    }

    private getFetchOptions(fr: FetchRequest<FetchVariants, FUrl, any, any>) {
        const options: RequestInit = { method: fr.type }
        if (fr.body) {
            options.body = JSON.stringify(fr.body)
        }
        return options
    }

    private handleFetchAction(action: FetchAction, actionMeta: ActionMeta<any>) {
        const url = this.getFetchUrl(action.fetch.url)
        const options = this.getFetchOptions(action.fetch)
        let workerFunction: string | undefined = undefined
        if (actionMeta.f!.offload) {
            workerFunction = this.createWorkerFunctionName()
        }
        const wi: WorkerInput = { kind: "Fetch", input: { url, options, workerFunction } }
        this.worker.postMessage(wi)
    }

}

const getWorker = (workers: TSWorker[], options: Options, store: TypeSafeStore<any>, queue: Queue[]) => {
    let worker: TSWorker | undefined = undefined
    if (workers.length === options.poolSize) {
        workers.some(w => {
            if (!w.isRunning) {
                worker = w
                return true
            }
        })
    } else { // create worker 
        const w = new TSWorker(options.workerUrl, store, queue)
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


export function createOffloadMiddleware<R extends Record<string, ReducerGroup<any, any, any, any>>>(options: Options): MiddleWare<R> {
    let workers: TSWorker[] = []
    let queue: Queue[] = []
    if (!options.poolSize) {
        options = { ...options, poolSize: 4 }
    }
    return (store: TypeSafeStore<R>) => (next: Dispatch<GetActionFromReducers<R>>) => (action: GetActionFromReducers<R>) => {
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