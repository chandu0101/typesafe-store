

import {
    MiddleWare, TypeSafeStore,
    Dispatch, GetActionFromReducers, ReducerGroup, Action, FetchRequest, FetchVariants, FUrl,
    Json, FetchAsyncData, FetchBody, FetchActionMeta
} from "@typesafe-store/store"


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

    if (fRequest.body) {
        if (meta.grpc) {
            options.body = meta.grpc.sf(fRequest.body)
        }
        else if (meta.body === "string") {
            options.body = JSON.stringify(fRequest.body)
        } else {
            options.body = fRequest.body as any
        }
    }
    return options
}

type GenericFetchAsyncData = FetchAsyncData<any, any, any, any, any>

//TODO optimistic stream type ops
async function processFetchAction<R extends Record<string, ReducerGroup<any, any, any, any>>>(store: TypeSafeStore<R>, action: GetActionFromReducers<R>, rg: ReducerGroup<any, any, any, any>) {
    const fetchRequest: FetchRequest<FetchVariants, FUrl, FetchBody, any> = (action as any).fetch
    const fetchMeta = rg.m.a[action.name].f!
    const url = getUrl(fetchRequest.url)
    const options = getOptions(fetchRequest, fetchMeta)
    let typeOp = fetchMeta.typeops
    if (fetchRequest.optimisticResponse) { // optimistic response 
        const opResponse: GenericFetchAsyncData = { data: fetchRequest.optimisticResponse }
        if (fetchMeta.typeops) {
            store.dispatch({
                ...action, _internal: {
                    processed: true,
                    kind: "DataAndTypeOps",
                    data: opResponse, typeOp: { name: fetchMeta.typeops.name, obj: fetchMeta.typeops.obj }
                }
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
        store.dispatch({ ...action, _internal: { processed: true, data: resultError } })
    }
    let response = undefined as any
    const responseType = fetchMeta.response

    if (responseType === "json") {
        response = await res.json()
    } else if (responseType === "blob") {
        response = await res.blob()
    } else if (responseType === "arrayBuffer") {
        response = await res.arrayBuffer()
    } else if (responseType === "text") {
        response = await res.text()
    }
    let resultSuccess: GenericFetchAsyncData = { data: response }

    store.dispatch({ ...action, _internal: { processed: true, data: resultSuccess } })
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