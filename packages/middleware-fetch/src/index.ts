

import { MiddleWare, TypeSafeStore, Dispatch, GetActionFromReducers, ReducerGroup, Action, FetchRequest, FetchVariants, FUrl, Json, FetchAsyncData } from "@typesafe-store/store"


function isFetchAction(rg: ReducerGroup<any, any, any, any>, action: Action) {
    return rg.m.f && rg.m.f[action.name]
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
            .map(([key, value]) => `${key}=${value}`).join("&")
        if (query !== "") {
            path = `${path}?${query}`
        }
    }
    return path
}

function getOptions<FV extends FetchVariants, U extends FUrl, B extends Json>(fmeta: FetchRequest<FV, U, B>) {
    const options: RequestInit = { method: fmeta.type }
    if (fmeta.body) {
        options.body = JSON.stringify(fmeta.body)
    }
    return options
}

async function processFetchAction<R extends Record<string, ReducerGroup<any, any, any, any>>>(store: TypeSafeStore<R>, action: GetActionFromReducers<R>, rg: ReducerGroup<any, any, any, any>) {
    const fetchRequest: FetchRequest<FetchVariants, FUrl, Json> = (action as any).fetch
    const fetchMeta = rg.m.f[action.name]
    const url = getUrl(fetchRequest.url)
    const options = getOptions(fetchRequest)
    const resultLoading: FetchAsyncData<any, any, any, any, any> = { loading: true }
    store.dispatch({ ...action, _internal: { processed: true, data: resultLoading } })
    const res = await fetch(url, options)
    if (!res.ok) {
        const resultError: FetchAsyncData<any, any, any, any, any> = { error: res.statusText }
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

    const resultSuccess: FetchAsyncData<any, any, any, any, any> = { data: response }
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