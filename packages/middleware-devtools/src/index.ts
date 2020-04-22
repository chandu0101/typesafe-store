
import {
    ReducerGroup, FetchAction, ActionMeta, MiddleWare, Dispatch, GetActionFromReducers,
    FetchVariants, Json, TypeSafeStore, Action, FetchRequest, FUrl
} from "@typesafe-store/store"


type Options = {}

export function createDevToolsMiddleware<R extends Record<string, ReducerGroup<any, any, any, any>>>(options: Options): MiddleWare<R> {

    return (store: TypeSafeStore<R>) => (next: Dispatch<GetActionFromReducers<R>>) => (action: GetActionFromReducers<R>) => {

        next(action)

    }
}