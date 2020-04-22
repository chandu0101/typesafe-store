

import {
    MiddleWare, TypeSafeStore,
    Dispatch, GetActionFromReducers, ReducerGroup, Action, FetchRequest, FetchVariants, FUrl,
    Json, FetchAsyncData, FetchBody, FetchActionMeta,
    ActionInternalMeta
} from "@typesafe-store/store"
import GrpcUtils from "./grpc"


function isFetchAction(rg: ReducerGroup<any, any, any, any>, action: Action) {
    return rg.m.a[action.name] && rg.m.a[action.name].f
}


function getUrl(url: FUrl): string {
    let path = url.path
    if (url.params) {
        Object.entries(url.params).forEach(([key, value]) => {
            path = path.replace(`{${key}}`, value.toString())
        })
    }
    if (url.queryParams) {
        const query = Object.entries(url.queryParams)
            .filter(([key, value]) => value)
            .map(([key, value]) => `${key}=${JSON.stringify(value)}`).join("&")
        if (query !== "") {
            path = `${path}?${query}`
        }
    }
    return path
}

function getOptions<FV extends FetchVariants, U extends FUrl, B extends FetchBody>(
    fRequest: FetchRequest<FV, U, B, any>, meta: FetchActionMeta) {
    const options: RequestInit = { method: fRequest.type }
    options.headers = {}
    if (fRequest.body) {
        if (meta.grpc) {
            options.headers["Content-Type"] = "application/grpc-web+proto"
            options.body = GrpcUtils.frameRequest(meta.grpc.sf(fRequest.body))
        }
        else if (meta.body === "string") {
            options.headers["Content-Type"] = "application/json"
            options.body = JSON.stringify(fRequest.body)
        } else {
            options.body = fRequest.body as any
        }
    }
    return options
}

type GenericFetchAsyncData = FetchAsyncData<any, any, any, any, any>


async function processFetchAction<R extends Record<string, ReducerGroup<any, any, any, any>>>(store: TypeSafeStore<R>, action: GetActionFromReducers<R>, rg: ReducerGroup<any, any, any, any>) {
    const fetchRequest: FetchRequest<FetchVariants, FUrl, FetchBody, any> = (action as any).fetch
    const fetchMeta = rg.m.a[action.name].f!
    const url = getUrl(fetchRequest.url)
    const options = getOptions(fetchRequest, fetchMeta)
    if (fetchRequest.optimisticResponse) { // optimistic response 
        if (fetchMeta.response === "stream") {
            throw new Error(`Optimistic response not supported in case of stream`)
        }
        const opResponse: GenericFetchAsyncData = { data: fetchRequest.optimisticResponse, optimistic: true }
        if (fetchMeta.typeops) {
            const im: ActionInternalMeta = {
                processed: true,
                kind: "DataAndTypeOps",
                data: opResponse, typeOp: fetchMeta.typeops
            }
            store.dispatch({
                ...action, _internal: im
            })
        } else {
            store.dispatch({ ...action, _internal: { processed: true, kind: "Data", data: opResponse } })
        }
    } else {
        const resultLoading: GenericFetchAsyncData = { loading: true }
        store.dispatch({ ...action, _internal: { processed: true, kind: "Data", data: resultLoading } })
    }

    const res = await fetch(url, options)
    if (!res.ok) {
        const resultError: GenericFetchAsyncData = { error: res.statusText, completed: true }
        let ai: ActionInternalMeta = null as any
        if (fetchMeta.typeops) {
            ai = {
                processed: true, data: resultError,
                optimisticFailed: fetchRequest.optimisticResponse,
                kind: "DataAndTypeOps", typeOp: fetchMeta.typeops,
            }
        } else {
            ai = { kind: "Data", data: resultError, processed: true }
        }
        store.dispatch({ ...action, _internal: ai })
    }

    const responseType = fetchMeta.response

    const processStream = async <R>(reader: ReadableStreamDefaultReader<R>): Promise<any> => {
        const result = await reader.read()
        if (result.done) {
            const resultSuccess: GenericFetchAsyncData = { completed: true }
            let ai: ActionInternalMeta = null as any
            if (fetchMeta.typeops) {
                ai = { kind: "DataAndTypeOps", processed: true, data: resultSuccess, typeOp: fetchMeta.typeops }
            } else {
                ai = { kind: "Data", processed: true, data: resultSuccess }
            }
            store.dispatch({ ...action, _internal: ai })
            return
        } else {
            let v = result.value
            if (fetchMeta.grpc) {
                const gv = GrpcUtils.parseResponseBytes(v as any)
                if (gv) { // if we get only headers in respose then ignore that 
                    const dsd = fetchMeta.grpc.dsf(gv)
                    const rdata = fetchMeta.tf ? fetchMeta.tf(dsd) : dsd
                    const resultSuccess: GenericFetchAsyncData = { data: rdata }
                    let ai: ActionInternalMeta = null as any
                    if (fetchMeta.typeops) {
                        ai = { kind: "DataAndTypeOps", processed: true, data: resultSuccess, typeOp: fetchMeta.typeops }
                    } else {
                        ai = { kind: "Data", processed: true, data: resultSuccess }
                    }
                    store.dispatch({ ...action, _internal: ai })
                }
            } else { // 
                const rdata = fetchMeta.tf ? fetchMeta.tf(v) : v
                const resultSuccess: GenericFetchAsyncData = { data: rdata }
                let ai: ActionInternalMeta = null as any
                if (fetchMeta.typeops) {
                    ai = { kind: "DataAndTypeOps", processed: true, data: resultSuccess, typeOp: fetchMeta.typeops }
                } else {
                    ai = { kind: "Data", processed: true, data: resultSuccess }
                }
                store.dispatch({ ...action, _internal: ai })
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


        if (fetchMeta.graphql) {
            if (fetchMeta.graphql.multiOp) { // multi graphql op `query q1 {id} ; query d2 {id2}`
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

                const resultSuccess: GenericFetchAsyncData = { data: datas, error: errorsArr, completed: true }
                const ai: ActionInternalMeta = { kind: "Data", data: resultSuccess, processed: true }
                store.dispatch({ ...action, _internal: ai })

            } else {
                if (response.data) {
                    let rdata = response.data
                    let successResult: GenericFetchAsyncData = {
                        data: rdata,
                        error: response.errors,
                        completed: true
                    } // in graphql for successfull operations also we get errors
                    let ai: ActionInternalMeta = null as any
                    if (fetchMeta.typeops) {
                        ai = {
                            kind: "DataAndTypeOps", processed: true, data: successResult, typeOp: fetchMeta.typeops,
                            optimisticSuccess: fetchRequest.optimisticResponse
                        }
                    } else {
                        ai = { kind: "Data", processed: true, data: successResult }
                    }
                    store.dispatch({ ...action, _internal: ai })
                } else { // graphql error eventhough network op success.
                    const errorResult: GenericFetchAsyncData = { error: response.error.errors, completed: true }
                    let ai: ActionInternalMeta = null as any
                    if (fetchMeta.typeops) {
                        ai = {
                            kind: "DataAndTypeOps", processed: true, data: errorResult, typeOp: fetchMeta.typeops,
                            optimisticFailed: fetchRequest.optimisticResponse
                        }
                    } else {
                        ai = { kind: "Data", processed: true, data: errorResult }
                    }
                    store.dispatch({ ...action, _internal: ai })
                }
            }
        } else {
            if (fetchMeta.grpc) {
                const newBytes = GrpcUtils.parseResponseBytes(response as any)
                if (newBytes) {
                    response = fetchMeta.grpc.dsf(newBytes)
                }
            }
            if (fetchMeta.tf) {
                response = fetchMeta.tf(response)
            }
            const resultSuccess = { data: response, completed: true }
            let ai: ActionInternalMeta = null as any
            if (fetchMeta.typeops) {
                ai = {
                    kind: "DataAndTypeOps", processed: true, data: resultSuccess,
                    optimisticSuccess: fetchRequest.optimisticResponse, typeOp: fetchMeta.typeops
                }
            } else {
                ai = { kind: "Data", processed: true, data: resultSuccess }
            }
            store.dispatch({ ...action, _internal: ai })
        }


    }



}

export default function fetchMiddleware<R extends Record<string, ReducerGroup<any, any, any, any>>>(): MiddleWare<R> {
    return (store: TypeSafeStore<R>) => (next: Dispatch<GetActionFromReducers<R>>) => (action: GetActionFromReducers<R>) => {
        if (action._internal && action._internal.processed) { // if already processed by other middlewares just pass through
            return next(action)
        }
        const rg = store.getReducerGroup(action.group)
        if (isFetchAction(rg, action)) { //
            return processFetchAction(store, action, rg)
        } else {
            return next(action)
        }

    }
}