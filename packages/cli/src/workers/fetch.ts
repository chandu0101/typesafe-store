import { WorkerOutput, WorkerFetchInput } from ".";
// import { FetchRejectionError } from "../../../store/src";


// async function _processFetch(_input: WorkerFetchInput["input"]) {
//     const { url, options, responseType, abortable, freq, graphql, grpc, tf } = _input
//     let res: Response = null as any
//     try {
//         res = await fetch(url, options)
//     } catch (error) {
//         const resultError = { error, completed: true }
//         const wo: WorkerOutput = { kind: "Fetch", status: "Success", rejectionError: true, stream: true, result: resultError }
//         postMessage(wo)
//         return
//     }
//     console.log("*************** Resp : ", res.ok, res.status);
//     if (!res.ok) {
//         const errorResult = { error: res.statusText, completed: true }
//         const wo: WorkerOutput = { kind: "Fetch", status: "Success", stream: true, result: errorResult }
//         postMessage(wo)
//     } else {
//         const processStream = async <R>(reader: ReadableStreamDefaultReader<R>): Promise<any> => {
//             const result = await reader.read()
//             if (result.done) {
//                 const resultSuccess = { completed: true }
//                 const wo: WorkerOutput = { kind: "Fetch", status: "Success", stream: true, result: resultSuccess }
//                 postMessage(wo)
//                 return
//             } else {
//                 let v = result.value
//                 if (grpc) {
//                     const gv = (self as any)["_grpc_chunk_parser"](v)
//                     if (gv) { // if we get only headers in respose then ignore that 
//                         const dsd = (self as any)[grpc.dsf](gv)
//                         const rdata = tf ? (self as any)[tf](dsd, freq) : dsd
//                         const resultSuccess = { data: rdata }
//                         const wo: WorkerOutput = { kind: "Fetch", status: "Processing", stream: true, result: resultSuccess }
//                         postMessage(wo)
//                     }
//                 } else { // 
//                     const rdata = tf ? (self as any)[tf](v, freq) : v
//                     const resultSuccess = { data: rdata }
//                     const wo: WorkerOutput = { kind: "Fetch", status: "Processing", stream: true, result: resultSuccess }
//                     postMessage(wo)
//                 }
//                 return processStream(reader)
//             }
//         }

//         if (responseType === "stream") {
//             processStream(res.body!.getReader())
//         } else {
//             let response = undefined as any
//             if (responseType === "json") {
//                 response = await res.json()
//             } else if (responseType === "blob") {
//                 response = await res.blob()
//             } else if (responseType === "arrayBuffer") {
//                 response = await res.arrayBuffer()
//             } else if (responseType === "text") {
//                 response = await res.text()
//             }

//             if (graphql) {
//                 if (graphql.multiOp) { // multi graphql op query q1 {id} ; query d2 {id2}
//                     const resp: any[] = response
//                     let allErrors = true
//                     let datas: any[] = []
//                     const errorsArr: any[] = []
//                     resp.forEach(v => {
//                         if (v.data) {
//                             allErrors = false
//                             datas.push(v.data)
//                             errorsArr.push(v.errors || [])
//                         } else {
//                             datas.push(null)
//                             errorsArr.push(v.error.erros)
//                         }
//                     })

//                     const resultSuccess = { data: datas, error: errorsArr, completed: true }
//                     const wo: WorkerOutput = { kind: "Fetch", status: "Success", result: resultSuccess }
//                     postMessage(wo)

//                 } else {
//                     if (response.data) {
//                         let rdata = response.data
//                         let successResult = {
//                             data: rdata,
//                             error: response.errors,
//                             completed: true
//                         } // in graphql for successfull operations also we get errors
//                         const wo: WorkerOutput = { kind: "Fetch", status: "Success", result: successResult }
//                         postMessage(wo)
//                     } else { // graphql error eventhough network op success.
//                         const errorResult = { error: response.error.errors, completed: true }
//                         const wo: WorkerOutput = { kind: "Fetch", status: "Success", result: errorResult }
//                         postMessage(wo)
//                     }
//                 }
//             } else {
//                 if (grpc) {
//                     const newBytes = (self as any)["_grpc_chunk_parser"](response)
//                     if (newBytes) {
//                         response = (self as any)[grpc.dsf](newBytes)
//                         if (tf) {
//                             response = (self as any)[tf](response, freq)
//                         }
//                     } else {
//                         response = null //we got only headersin grpc response
//                     }
//                 } else {
//                     if (tf) {
//                         response = (self as any)[tf](response, freq)
//                     }
//                 }
//                 const resultSuccess = { data: response, completed: true }
//                 const wo: WorkerOutput = { kind: "Fetch", status: "Success", result: resultSuccess }
//                 postMessage(wo)
//             }
//         }
//     }
// }



export const PROCESS_FETCH_CODE = `
async function _processFetch(_input: any) {
    const { url, options, responseType, abortable, freq, graphql, grpc, tf } = _input
    let res: Response = null as any
    if (abortable) {
        (self as any).globalAbortController = new AbortController()
    }
    try {
        const gabc = (self as any).globalAbortController
        if (gabc) {
            options.signal = gabc.signal
        }
        res = await fetch(url, options)
    } catch (error) {
        (self as any).globalAbortController = null
        const resultError = { error, completed: true }
        const wo: WorkerOutput = { kind: "Fetch", status: "Success", rejectionError: true, stream: true, result: resultError }
        postMessage(wo)
        return;
    }
    (self as any).globalAbortController = null
    console.log("*************** Resp : ", res.ok, res.status);
    if (!res.ok) {
        const errorResult = { error: res.statusText, completed: true }
        const wo: WorkerOutput = { kind: "Fetch", status: "Success", stream: true, result: errorResult }
        postMessage(async function _processFetch(_input: WorkerFetchInput["input"]) {
            const { url, options, responseType, abortable, freq, graphql, grpc, tf } = _input
            let res: Response = null as any
            try {
                res = await fetch(url, options)
            } catch (error) {
                const resultError = { error, completed: true }
                const wo: WorkerOutput = { kind: "Fetch", status: "Success", rejectionError: true, stream: true, result: resultError }
                postMessage(wo)
                return
            }
            console.log("*************** Resp : ", res.ok, res.status);
            if (!res.ok) {
                const errorResult = { error: res.statusText, completed: true }
                const wo: WorkerOutput = { kind: "Fetch", status: "Success", stream: true, result: errorResult }
                postMessage(wo)
            } else {
                const processStream = async <R>(reader: ReadableStreamDefaultReader<R>): Promise<any> => {
                    const result = await reader.read()
                    if (result.done) {
                        const resultSuccess = { completed: true }
                        const wo: WorkerOutput = { kind: "Fetch", status: "Success", stream: true, result: resultSuccess }
                        postMessage(wo)
                        return
                    } else {
                        let v = result.value
                        if (grpc) {
                            const gv = (self as any)["_grpc_chunk_parser"](v)
                            if (gv) { // if we get only headers in respose then ignore that 
                                const dsd = (self as any)[grpc.dsf](gv)
                                const rdata = tf ? (self as any)[tf](dsd, freq) : dsd
                                const resultSuccess = { data: rdata }
                                const wo: WorkerOutput = { kind: "Fetch", status: "Processing", stream: true, result: resultSuccess }
                                postMessage(wo)
                            }
                        } else { // 
                            const rdata = tf ? (self as any)[tf](v, freq) : v
                            const resultSuccess = { data: rdata }
                            const wo: WorkerOutput = { kind: "Fetch", status: "Processing", stream: true, result: resultSuccess }
                            postMessage(wo)
                        }
                        return processStream(reader)
                    }
                }
        
                if (responseType === "stream") {
                    processStream(res.body!.getReader())
                } else {
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
        
                    if (graphql) {
                        if (graphql.multiOp) { 
                            const resp: any[] = response
                            let allErrors = true
                            let datas: any[] = []
                            const errorsArr: any[] = []
                            resp.forEach(v => {
                                if (v.data) {
                                    allErrors = false
                                    datas.push(v.data)
                                    errorsArr.push(v.errors || [])
                                } else {
                                    datas.push(null)
                                    errorsArr.push(v.error.erros)
                                }
                            })
        
                            const resultSuccess = { data: datas, error: errorsArr, completed: true }
                            const wo: WorkerOutput = { kind: "Fetch", status: "Success", result: resultSuccess }
                            postMessage(wo)
        
                        } else {
                            if (response.data) {
                                let rdata = response.data
                                let successResult = {
                                    data: rdata,
                                    error: response.errors,
                                    completed: true
                                } // in graphql for successfull operations also we get errors
                                const wo: WorkerOutput = { kind: "Fetch", status: "Success", result: successResult }
                                postMessage(wo)
                            } else { // graphql error eventhough network op success.
                                const errorResult = { error: response.error.errors, completed: true }
                                const wo: WorkerOutput = { kind: "Fetch", status: "Success", result: errorResult }
                                postMessage(wo)
                            }
                        }
                    } else {
                        if (grpc) {
                            const newBytes = (self as any)["_grpc_chunk_parser"](response)
                            if (newBytes) {
                                response = (self as any)[grpc.dsf](newBytes)
                                if (tf) {
                                    response = (self as any)[tf](response, freq)
                                }
                            } else {
                                response = null //we got only headersin grpc response
                            }
                        } else {
                            if (tf) {
                                response = (self as any)[tf](response, freq)
                            }
                        }
                        const resultSuccess = { data: response, completed: true }
                        const wo: WorkerOutput = { kind: "Fetch", status: "Success", result: resultSuccess }
                        postMessage(wo)
                    }
                }
            }
        }
        
`