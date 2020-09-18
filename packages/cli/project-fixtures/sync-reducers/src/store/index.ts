// import { TodosReducerReducerGroup } from "./reducers/generated/TodosReducer-gen";
import { TypeSafeStore, GetActionFromReducers } from "@typesafe-store/store"




const reducers = { todos: null as any }

export const store = new TypeSafeStore({ reducers, middleWares: [] })

export type AppState = typeof store.state

export type AppAction = GetActionFromReducers<typeof reducers>