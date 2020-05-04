import { WorkerSyncOutput, WorkerOutput, WorkerSyncInput } from ".";
import { WORKER_STATE_EXTRACTOR_FUNCTION_NAME } from "../constants";



// function _getPropsAccess(obj: any, propAccess: string): any {
//     let result: any = obj
//     propAccess.split(".").some(v => {
//         const pav = result[v]
//         if (pav) {
//             result = pav
//         } else {
//             result = pav
//             return true
//         }
//     })
//     return result
// }

// function _getValuesFromState(obj: any, propAccessArray: string[]) {
//     const result: any = {}
//     propAccessArray.forEach(pa => {
//         result[pa] = _getPropsAccess(obj, pa)
//     })
//     return result
// }



// async function _processSync(_input: WorkerSyncInput["input"]) {
//     const { workerFunction, state, propAccessArray, payload } = _input
//     const v = (self as any)[workerFunction]({ _trg_satate: state, payload: payload, propAccessArray: propAccessArray })
//     const wo: WorkerOutput = { kind: "Sync", status: "Success", result: v }
//     postMessage(wo)
// }


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

async function _processSync(_input: WorkerSyncInput["input"]) {
    const { workerFunction, state, propAccessArray, payload } = _input
    const v = (self as any)[workerFunction]({ _trg_satate: state, payload: payload, propAccessArray: propAccessArray })
    const wo: WorkerOutput = { kind: "Sync", status: "Success", result: v }
    postMessage(wo)
}


`