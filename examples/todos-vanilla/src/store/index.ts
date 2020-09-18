import { TodosReducerGroup } from "./reducers/generated/todos-reducer-gen";
import { TypeSafeStore, GetActionFromReducers } from "@typesafe-store/store";



const reducers = { todos: TodosReducerGroup }

export const store = new TypeSafeStore({ reducers, middleWares: [] })

export type AppReducers = typeof reducers

export type AppState = typeof store.state

export type AppAction = GetActionFromReducers<AppReducers>