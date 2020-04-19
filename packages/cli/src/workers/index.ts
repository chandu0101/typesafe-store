import { MetaUtils } from "../utils/meta-utils";
import { WorkerFunction } from "../types";
import { ConfigUtils } from "../utils/config-utils";
import { FileUtils } from "../utils/file-utils";
import { WORKER_STATE_EXTRACTOR_FUNCTION_NAME } from "../constants"
import { worker } from "cluster";

const GET_PROP_ACCESS_FUNCTION_NAME = "_getPropsAccess"

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

        type WorkerInput = { kind: "Fetch", input: { url: string, options: RequestInit, workerFunction?: string }, }
        | { kind: "Sync", input: { propAccessArray: string[], payload?: any, state: any, workerFunction: string } }

        type WorkerOutputStatus = "Processing" | "Success" | "Error"
        type WorkerOutput = { kind: "Fetch", status: WorkerOutputStatus, error?: any, result?: { data?: any, error?: any } } | { kind: "Sync", status: WorkerOutputStatus, error?: any, result?: any }
        onmessage = async (e) => {
        const wi = e.data as WorkerInput
        try {
            if (wi.kind === "Fetch") {
                let m: WorkerOutput = { kind: wi.kind, status: "Processing" }
                postMessage(m)
                const result = await _processFetch(wi.input)
                m = { kind: wi.kind, status: "Success", result }
                postMessage(m)
            } else if (wi.kind === "Sync") {
                let m: WorkerOutput = { kind: wi.kind, status: "Processing" }
                postMessage(m)
                const result = (self as any)[wi.input.workerFunction]({ _trg_satate: wi.input.state, payload: wi.input.payload, propAccessArray: wi.input.propAccessArray })
                m = { kind: wi.kind, status: "Success", result }
                postMessage(m)
            }
        } catch (error) {
            const erm: WorkerOutput = { kind: wi.kind, error, status: "Error" }
            postMessage(erm)
        }
        }

        function ${GET_PROP_ACCESS_FUNCTION_NAME}(obj: any, propAccess: string): any  {
            let result: any = obj
            propAccess.split(".").some(v => {
                const pav = result[v]
                if (pav) {
                    result = pav
                } else {
                    result = pav
                    return true
                }
            })
            return result
        }

        function ${WORKER_STATE_EXTRACTOR_FUNCTION_NAME}(obj: any, propAccessArray: string[]) {
            const result: any = {}
            propAccessArray.forEach(pa => {
                result[pa] = _getPropsAccess(obj, pa)
            })
            return result
        }

        async function _processFetch(_input: any) {
            const { url, options, responseType, workerFunction } = _input
            const res = await fetch(url, options)
            if (!res.ok) {
                return { error: res.statusText }
            }
            let response = undefined as any
            if (responseType === "json") {
                response = await res.json()
            } else if (responseType === "blob") {
                response = await res.blob()
            } else if (responseType === "arrayBuffer") {
                response = await res.arrayBuffer()
            } else if (responseType === "text") {
                response = await res.text()
            }
            if (workerFunction) {
                response = (self as any)[workerFunction](response)
            }
            return { data: response }
        }

          ${fns}
        `
        FileUtils.writeFileSync(path, output)
        this.setIsChanged(false)
    }

}


// worker inbuilt code , copy this to final worker output 

function _getPropsAccess(obj: any, propAccess: string): any {
    let result: any = obj
    propAccess.split(".").some(v => {
        const pav = result[v]
        if (pav) {
            result = pav
        } else {
            result = pav
            return true
        }
    })
    return result
}

// function _getValuesFromState(obj: any, propAccessArray: string[]) {
//     const result: any = {}
//     propAccessArray.forEach(pa => {
//         result[pa] = _getPropsAccess(obj, pa)
//     })
//     return result
// }

// async function _processFetch(_input: any) {
//     const { url, options, responseType, workerFunction } = _input
//     const res = await fetch(url, options)
//     if (!res.ok) {
//         return { error: res.statusText }
//     }
//     let response = undefined as any
//     if (responseType === "json") {
//         response = await res.json()
//     } else if (responseType === "blob") {
//         response = await res.blob()
//     } else if (responseType === "arrayBuffer") {
//         response = await res.arrayBuffer()
//     } else if (responseType === "text") {
//         response = await res.text()
//     }
//     if (workerFunction) {
//         response = (self as any)[workerFunction](response)
//     }
//     return { data: response }
// }

// type WorkerInput = { kind: "Fetch", input: { url: string, options: RequestInit, workerFunction?: string }, }
//     | { kind: "Sync", input: { propAccessArray: string[], payload?: any, state: any, workerFunction: string } }

// type WorkerOutputStatus = "Processing" | "Success" | "Error"
// type WorkerOutput = { kind: "Fetch", status: WorkerOutputStatus, error?: any, result?: { data?: any, error?: any } } | { kind: "Sync", status: WorkerOutputStatus, error?: any, result?: any }
// onmessage = async (e) => {
//     const wi = e.data as WorkerInput
//     try {
//         if (wi.kind === "Fetch") {
//             let m: WorkerOutput = { kind: wi.kind, status: "Processing" }
//             postMessage(m)
//             const result = await _processFetch(wi.input)
//             m = { kind: wi.kind, status: "Success", result }
//             postMessage(m)
//         } else if (wi.kind === "Sync") {
//             let m: WorkerOutput = { kind: wi.kind, status: "Processing" }
//             postMessage(m)
//             const result = (self as any)[wi.input.workerFunction]({ _trg_satate: wi.input.state, payload: wi.input.payload, propAccessArray: wi.input.propAccessArray })
//             m = { kind: wi.kind, status: "Success", result }
//             postMessage(m)
//         }
//     } catch (error) {
//         const erm: WorkerOutput = { kind: wi.kind, error, status: "Error" }
//         postMessage(erm)
//     }
// }