

         
export type WorkerFetchInput = { kind: "Fetch", input: { url: string, options: RequestInit, responseType: string, abortable?: boolean, freq?: any, grpc?: { dsf: string }, graphql?: { multiOp?: boolean }, tf?: string }, }
export type WorkerSyncInput = { kind: "Sync", input: { propAccessArray: string[], payload?: any, abortable?: boolean, state: any, workerFunction: string } }
export type WorkerAbort = { kind: "WorkerAbort" }
export type WorkerInput = WorkerFetchInput
    | WorkerSyncInput | WorkerAbort

export type WorkerOutputStatus = "Processing" | "Success" | "Error"

export type WorkerFetchOutput = { kind: "Fetch", status: WorkerOutputStatus, stream?: boolean, grpc?: boolean, error?: any, rejectionError?: boolean, result?: { data?: any, completed?: boolean, error?: any } }

export type WorkerSyncOutput = { kind: "Sync", status: WorkerOutputStatus, error?: any, abortError?: any, result?: any }

export type WorkerOutput = WorkerFetchOutput | WorkerSyncOutput


         
onmessage = async (e) => {
    const wi = e.data as WorkerInput
    try {
        if (wi.kind == "WorkerAbort") {
            const abc = (self as any).globalAbortController
            if (abc) {
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
            await _processSync(wi.input)
        }
    } catch (error) {
        const erm: WorkerOutput = { kind: wi.kind as any, error, status: "Error" }
        postMessage(erm)
    } finally {
        (self as any).globalAbortController = null
    }
}

         
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
        abc.signal.addEventListener("abort", () => {
            const wo: WorkerOutput = { kind: "Sync", status: "Success", abortError: new Error("aborted by user"), result: null }
            postMessage(wo)
            resolve()
        })
        const v = (self as any)[workerFunction]({ _trg_satate: state, payload: payload, propAccessArray: propAccessArray })
        const wo: WorkerOutput = { kind: "Sync", status: "Success", result: v }
        postMessage(wo)
        resolve()
    })
}



          
     (self as any)["SyncReducer_calculateFactorialOffload"] = (_input:any) => {
         const _trg_satate = _input._trg_satate
         const {n} = _input.payload;
         let ans = 1;
for (let i = 2; i <= n; i++) {
            ans = ans * i
        }
_trg_satate.factorialOffload = ans
         return _getValuesFromState(_trg_satate,_input.propAccessArray)
      }
    
        