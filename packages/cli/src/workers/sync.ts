import { SyncWorkerInput, WorkerOutput } from ".";
import { WORKER_STATE_EXTRACTOR_FUNCTION_NAME } from "../constants";



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

function _getValuesFromState(obj: any, propAccessArray: string[]) {
    const result: any = {}
    propAccessArray.forEach(pa => {
        result[pa] = _getPropsAccess(obj, pa)
    })
    return result
}



async function _processSync(_input: SyncWorkerInput["input"]) {
    const { workerFunction, state, abortable, propAccessArray, payload } = _input
    if (!abortable) {
        const v = (self as any)[workerFunction]({ _trg_satate: state, payload: payload, propAccessArray: propAccessArray })
        const wo: WorkerOutput = { kind: "Sync", status: "Success", result: v }
        postMessage(wo)
        return
    }
    (self as any).globalAbortController = new AbortController()
    await new Promise((resolve) => {
        const abc = (self as any).globalAbortController as AbortController
        abc.signal.onabort = () => {
            const wo: WorkerOutput = { kind: "Sync", status: "Success", abortError: new Error("aborted by user"), result: null }
            postMessage(wo)
            resolve()
        }
        const v = (self as any)[workerFunction]({ _trg_satate: state, payload: payload, propAccessArray: propAccessArray })
        const wo: WorkerOutput = { kind: "Sync", status: "Success", result: v }
        postMessage(wo)
        resolve()
    })
}


export const PROCESS_SYNC_CODE = `
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

function _getValuesFromState(obj: any, propAccessArray: string[]) {
    const result: any = {}
    propAccessArray.forEach(pa => {
        result[pa] = _getPropsAccess(obj, pa)
    })
    return result
}

async function _processSync(_input: SyncWorkerInput["input"]) {
    const { workerFunction, state, abortable, propAccessArray, payload } = _input
    if (!abortable) {
        const v = (self as any)[workerFunction]({ _trg_satate: state, payload: payload, propAccessArray: propAccessArray })
        const wo: WorkerOutput = { kind: "Sync", status: "Success", result: v }
        postMessage(wo)
        return
    }
    (self as any).globalAbortController = new AbortController()
    await new Promise((resolve) => {
        const abc = (self as any).globalAbortController as AbortController
        abc.signal.onabort = () => {
            const wo: WorkerOutput = { kind: "Sync", status: "Success", abortError: new Error("aborted by user"), result: null }
            postMessage(wo)
            resolve()
        }
        const v = (self as any)[workerFunction]({ _trg_satate: state, payload: payload, propAccessArray: propAccessArray })
        const wo: WorkerOutput = { kind: "Sync", status: "Success", result: v }
        postMessage(wo)
        resolve()
    })
}

`