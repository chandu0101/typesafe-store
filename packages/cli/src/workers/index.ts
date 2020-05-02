import { MetaUtils } from "../utils/meta-utils";
import { WorkerFunction } from "../types";
import { ConfigUtils } from "../utils/config-utils";
import { FileUtils } from "../utils/file-utils";
import { PROCESS_FETCH_CODE } from "./fetch";
import { PROCESS_SYNC_CODE } from "./sync";
import * as fs from "fs";
import { join } from "path"

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

    static saveWorkerFunctionsToDisk(fns: WorkerFunction[]) {
        const path = ConfigUtils.getWorkerFunctionsMetaFilePath()
        const content = JSON.stringify(fns)
        FileUtils.writeFileSync(path, content)
    }

    static getWorkerFunctionsFromDisk() {
        let result: WorkerFunction[] = []
        const path = join("workers", "workers-functions.json")
        if (fs.existsSync(path)) {
            const data = FileUtils.readFileSync(path)
            result = JSON.parse(data)
        }
        return result;
    }

    static createWorkersFile() {
        const wm = MetaUtils.getWorkersMeta()
        if (!wm.isChanged) return
        const workerFunctions = wm.fns;
        this.saveWorkerFunctionsToDisk(workerFunctions)
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
export type WorkerInput = WorkerFetchInput
    | WorkerSyncInput

export type WorkerOutputStatus = "Processing" | "Success" | "Error"

export type WorkerFetchOutput = { kind: "Fetch", status: WorkerOutputStatus, stream?: boolean, grpc?: boolean, error?: any, rejectionError?: boolean, result?: { data?: any, completed?: boolean, error?: any } }

export type WorkerSyncOutput = { kind: "Sync", status: WorkerOutputStatus, error?: any, abortError?: any, result?: any }

export type WorkerOutput = WorkerFetchOutput | WorkerSyncOutput


const WORKER_TYPES = `
export type WorkerFetchInput = { kind: "Fetch", input: { url: string, options: RequestInit, responseType: string, abortable?: boolean, freq?: any, grpc?: { dsf: string }, graphql?: { multiOp?: boolean }, tf?: string }, }
export type WorkerSyncInput = { kind: "Sync", input: { propAccessArray: string[], payload?: any, abortable?: boolean, state: any, workerFunction: string } }
export type WorkerInput = WorkerFetchInput
    | WorkerSyncInput

export type WorkerOutputStatus = "Processing" | "Success" | "Error"

export type WorkerFetchOutput = { kind: "Fetch", status: WorkerOutputStatus, stream?: boolean, grpc?: boolean, error?: any, rejectionError?: boolean, result?: { data?: any, completed?: boolean, error?: any } }

export type WorkerSyncOutput = { kind: "Sync", status: WorkerOutputStatus, error?: any, abortError?: any, result?: any }

export type WorkerOutput = WorkerFetchOutput | WorkerSyncOutput

`
// onmessage = async (e) => {
//     const wi = e.data as WorkerInput
//     try {
//         if (wi.kind === "Fetch") {
//             let m: WorkerOutput = { kind: wi.kind, status: "Processing" }
//             postMessage(m)
//             await _processFetch(wi.input)

//         } else if (wi.kind === "Sync") {
//             let m: WorkerOutput = { kind: wi.kind, status: "Processing" }
//             postMessage(m)
//             await _processSync(wi.input)
//         }
//     } catch (error) {
//         const erm: WorkerOutput = { kind: wi.kind as any, error, status: "Error" }
//         postMessage(erm)
//     } finally {

//     }
// }


const ONMESSAGE_CODE = `
onmessage = async (e) => {
    const wi = e.data as WorkerInput
    try {
        if (wi.kind === "Fetch") {
            let m: WorkerOutput = { kind: wi.kind, status: "Processing" }
            postMessage(m)
            await _processFetch(wi.input)

        } else if (wi.kind === "Sync") {
            let m: WorkerOutput = { kind: wi.kind, status: "Processing" }
            postMessage(m)
            await _processSync(wi.input)
        }
    } catch (error) {
        const erm: WorkerOutput = { kind: wi.kind as any, error, status: "Error" }
        postMessage(erm)
    } finally {

    }
}
`