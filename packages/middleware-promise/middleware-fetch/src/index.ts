

import { MiddleWare, PromiseData, TypeSafeStore, Dispatch, GetActionFromReducers, ReducerGroup, Action, } from "@typesafe-store/store"


function isPromiseAction(rg: ReducerGroup<any, any, any, any>, action: Action) {
    return rg.m.f && rg.m.f[action.name]
}

async function processPromiseAction<R extends Record<string, ReducerGroup<any, any, any, any>>>(store: TypeSafeStore<R>, action: GetActionFromReducers<R>, rg: ReducerGroup<any, any, any, any>) {
    try {
        const pc = (action as any).promise as (() => Promise<any>)
        const resultLoading: PromiseData<any> = { loading: true }
        store.dispatch({ ...action, _internal: { processed: true, data: resultLoading } })
        const data = await pc()
        const resultSuccess: PromiseData<any> = { data }
        store.dispatch({ ...action, _internal: { processed: true, data: resultSuccess } })
    } catch (error) {
        const resultError: PromiseData<any> = { error }
        store.dispatch({ ...action, _internal: { processed: true, data: resultError } })
    }
}


export default function promiseMiddleware<R extends Record<string, ReducerGroup<any, any, any, any>>>(): MiddleWare<R> {
    return (store: TypeSafeStore<R>) => (next: Dispatch<GetActionFromReducers<R>>) => (action: GetActionFromReducers<R>) => {
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