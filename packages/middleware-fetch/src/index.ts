

import { ReducerGroup, Action, FetchMeta, FetchVariants, FUrl, Json } from "@typesafe-store/reducer"
import { MiddleWare, TypeSafeStore, Dispatch } from "@typesafe-store/store"


function isFetchAction(rg: ReducerGroup<any, any, any, any>, action: Action) {
    return rg.m.f && rg.m.f[action.name]
}


async function processFetchAction<R extends Record<string, ReducerGroup<any, any, any, any>>>(store: TypeSafeStore<R>, action: Action, rg: ReducerGroup<any, any, any, any>) {
    const fetchMeta: FetchMeta<FetchVariants, FUrl, Json> = (action as any).fetch

}

export default function fetchMiddleware<R extends Record<string, ReducerGroup<any, any, any, any>>>(): MiddleWare<R> {
    return (store: TypeSafeStore<R>) => (next: Dispatch) => (action: Action) => {
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