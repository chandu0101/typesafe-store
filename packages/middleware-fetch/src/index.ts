

import { ReducerGroup, Action, FetchMeta, FetchVariants, FUrl, Json, FetchAsyncData } from "@typesafe-store/reducer"
import { MiddleWare, TypeSafeStore, Dispatch, GetActionFromReducers } from "@typesafe-store/store"


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
        path = `${path}?${query}`
    }
    return path
}

function getOptions<FV extends FetchVariants, U extends FUrl, B extends Json>(fmeta: FetchMeta<FV, U, B>) {
    const options: RequestInit = { method: fmeta.type }
    if (fmeta.body) {
        options.body = JSON.stringify(fmeta.body)
    }
    return options
}

async function processFetchAction<R extends Record<string, ReducerGroup<any, any, any, any>>>(store: TypeSafeStore<R>, action: GetActionFromReducers<R>, rg: ReducerGroup<any, any, any, any>) {
    const fetchMeta: FetchMeta<FetchVariants, FUrl, Json> = (action as any).fetch
    const url = getUrl(fetchMeta.url)
    const options = getOptions(fetchMeta)
    const resultLoading: FetchAsyncData<any, any, any, any, any> = { loading: true }
    store.dipatch({ ...action, _internal: { processed: true, data: resultLoading } })
    const res = await fetch(url, options)
    if (!res.ok) {
        const resultError: FetchAsyncData<any, any, any, any, any> = { error: res.statusText }
        store.dipatch({ ...action, _internal: { processed: true, data: resultError } })
    }
    const json = await res.json() //TODO check for other resposne types 
    const resultSuccess: FetchAsyncData<any, any, any, any, any> = { data: json }
    store.dipatch({ ...action, _internal: { processed: true, data: resultSuccess } })
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