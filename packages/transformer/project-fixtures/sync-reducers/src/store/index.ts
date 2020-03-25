import { TodosReducerReducerGroup } from "./reducers/generated/TodosReducer-gen";
import { TypeSafeStore } from "@typesafe-store/store"




const reducers = { todos: TodosReducerReducerGroup }

const store = new TypeSafeStore({ reducers, middleWares: [] })

