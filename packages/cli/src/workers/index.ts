import { MetaUtils } from "../utils/meta-utils";
import { WorkerFunction } from "../types";
import { ConfigUtils } from "../utils/config-utils";
import { FileUtils } from "../utils/file-utils";
import { PROCESS_FETCH_CODE } from "./fetch";
import { PROCESS_SYNC_CODE } from "./sync";


export class WorkersUtils {

    private static getWorkerFunctions() {
        return MetaUtils.getWorkersMeta().fns
    }

    private static setIsChanged(value: boolean) {
        const wm = MetaUtils.getWorkersMeta()
        wm.isChanged = value
    }

    static addWorkerFunction(fn: WorkerFunction) {
        const workerFunctions = this.getWorkerFunctions()

        const isAdded = workerFunctions.some(f => {
            if (f.group === fn.group && f.name === fn.name) {
                f.code = fn.code
                return true
            }
        })
        if (!isAdded) {
            workerFunctions.push(fn)
        }
        this.setIsChanged(true)
    }

    static removeWorkerFunction(name: string, group: string) {
        const workerFunctions = this.getWorkerFunctions()
        let index = - 1
        workerFunctions.some((wf, i) => {
            if (wf.name === name && group === wf.group) {
                index = i;
                return true
            }
        })
        if (index > -1) {
            workerFunctions.splice(index, 1)
            this.setIsChanged(true)
        }

    }

    static createFunctionNameFromGroup(name: string, gorup: string) {
        return `${gorup.split("/").join("_")}_${name}`
    }

    static createWorkersFile() {
        const wm = MetaUtils.getWorkersMeta()
        if (!wm.isChanged) return
        const workerFunctions = wm.fns;
        const path = ConfigUtils.getOutputPathForWorkers()
        const fns = workerFunctions.map(f => {
            return f.code
        }).join("\n")
        const output = `

         ${WORKER_TYPES}
         ${ONMESSAGE_CODE}
         ${PROCESS_FETCH_CODE}
         ${PROCESS_SYNC_CODE}
          ${fns}
        `
        FileUtils.writeFileSync(path, output)
        this.setIsChanged(false)
    }

}


// worker inbuilt code , copy this to final worker output 


export type WorkerFetchInput = { kind: "Fetch", input: { url: string, options: RequestInit, responseType: string, abortable?: boolean, freq?: any, grpc?: { dsf: string }, graphql?: { multiOp?: boolean }, tf?: string }, }
export type WorkerSyncInput = { kind: "Sync", input: { propAccessArray: string[], payload?: any, abortable?: boolean, state: any, workerFunction: string } }
export type WorkerAbort = { kind: "WorkerAbort" }
export type WorkerInput = WorkerFetchInput
    | WorkerSyncInput | WorkerAbort

export type WorkerOutputStatus = "Processing" | "Success" | "Error"

export type WorkerFetchOutput = { kind: "Fetch", status: WorkerOutputStatus, stream?: boolean, grpc?: boolean, error?: any, rejectionError?: boolean, result?: { data?: any, completed?: boolean, error?: any } }

export type WorkerSyncOutput = { kind: "Sync", status: WorkerOutputStatus, error?: any, abortError?: any, result?: any }

export type WorkerOutput = WorkerFetchOutput | WorkerSyncOutput


const WORKER_TYPES = `
export type WorkerFetchInput = { kind: "Fetch", input: { url: string, options: RequestInit, responseType: string, abortable?: boolean, freq?: any, grpc?: { dsf: string }, graphql?: { multiOp?: boolean }, tf?: string }, }
export type WorkerSyncInput = { kind: "Sync", input: { propAccessArray: string[], payload?: any, abortable?: boolean, state: any, workerFunction: string } }
export type WorkerAbort = { kind: "WorkerAbort" }
export type WorkerInput = WorkerFetchInput
    | WorkerSyncInput | WorkerAbort

export type WorkerOutputStatus = "Processing" | "Success" | "Error"

export type WorkerFetchOutput = { kind: "Fetch", status: WorkerOutputStatus, stream?: boolean, grpc?: boolean, error?: any, rejectionError?: boolean, result?: { data?: any, completed?: boolean, error?: any } }

export type WorkerSyncOutput = { kind: "Sync", status: WorkerOutputStatus, error?: any, abortError?: any, result?: any }

export type WorkerOutput = WorkerFetchOutput | WorkerSyncOutput

`
// onmessage = async (e) => {
//     const wi = e.data as WorkerInput
//     try {
//         if (wi.kind == "WorkerAbort") {
//             const abc = (self as any).globalAbortController
//             if (abc) {
//                 abc.abort()
//             }
//         }
//         else if (wi.kind === "Fetch") {
//             let m: WorkerOutput = { kind: wi.kind, status: "Processing" }
//             postMessage(m)
//             await _processFetch(wi.input)

//         } else if (wi.kind === "Sync") {
//             let m: WorkerOutput = { kind: wi.kind, status: "Processing" }
//             postMessage(m)
//             await _proccessSync(wi.input)
//         }
//     } catch (error) {
//         const erm: WorkerOutput = { kind: wi.kind, error, status: "Error" }
//         postMessage(erm)
//     } finally {
//         (self as any).globalAbortController = null
//     }
// }


const ONMESSAGE_CODE = `
onmessage = async (e) => {
    const wi = e.data as WorkerInput
    try {
        if (wi.kind == "WorkerAbort") {
            const abc = (self as any).globalAbortController
            if(abc) {
                abc.abort()
            }
        }
        else if (wi.kind === "Fetch") {
            let m: WorkerOutput = { kind: wi.kind, status: "Processing" }
            postMessage(m)
            await _processFetch(wi.input)

        } else if (wi.kind === "Sync") {
            let m: WorkerOutput = { kind: wi.kind, status: "Processing" }
            postMessage(m)
            await _proccessSync(wi.input)
        }
    } catch (error) {
        const erm: WorkerOutput = { kind: wi.kind, error, status: "Error" }
        postMessage(erm)
    } finally {
        (self as any).globalAbortController = null
    }
}
`