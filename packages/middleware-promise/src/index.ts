

import { MiddleWare, TSPromiseFieldValue, TypeSafeStore, Dispatch, GetActionFromReducers, ReducerGroup, Action, PromiseRequest, ActionInternalMeta, } from "@typesafe-store/store"


function isPromiseAction(rg: ReducerGroup<any, any, any, any>, action: Action) {
    return rg.m.a[action.name] && rg.m.a[action.name].p
}

type GenericPromiseValue = TSPromiseFieldValue<any, any>

async function processPromiseAction<R extends Record<string, ReducerGroup<any, any, any, any>>>(store: TypeSafeStore<R>, action: GetActionFromReducers<R>, rg: ReducerGroup<any, any, any, any>) {
    const pRequest = (action as any).promise as PromiseRequest<any>
    let abortController: AbortController | undefined = undefined
    let data: any = undefined
    if (pRequest._abortable) {
        abortController = new AbortController()
    }
    const resultLoading: GenericPromiseValue = { loading: true, abortController }
    const ai: ActionInternalMeta = { kind: "Data", data: resultLoading, processed: true }
    store.dispatch({ ...action, _internal: ai })
    try {
        data = abortController ? await pRequest.promiseFn(abortController.signal) : await pRequest.promiseFn()
    } catch (error) {
        const resultError: GenericPromiseValue = { error }
        const ai: ActionInternalMeta = { kind: "Data", data: resultError, processed: true }
        store.dispatch({ ...action, _internal: ai })
    }
    const resultSuccess: GenericPromiseValue = { data }
    const ais: ActionInternalMeta = { kind: "Data", data: resultSuccess, processed: true }
    store.dispatch({ ...action, _internal: ais })
}



export default function createPromiseMiddleware(): MiddleWare<any> {
    return (store: TypeSafeStore<any>) => (next: Dispatch<Action>) => (action: Action) => {
        if (action._internal && action._internal.processed) { // if already processed by other middlewares just pass through
            return next(action)
        }
        const rg = store.getReducerGroup(action.group)
        if (isPromiseAction(rg, action)) { //
            return processPromiseAction(store, action, rg)
        } else {
            return next(action)
        }

    }
}
