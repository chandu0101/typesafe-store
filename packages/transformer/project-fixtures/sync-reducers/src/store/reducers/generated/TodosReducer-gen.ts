
// this file is auto generated on 2020-03-31T12:22:26.980Z, don't modify it
import { ReducerGroup, FetchVariants } from "@typesafe-store/reducer"
import { v1 as uuid } from "uuid";
type Todo = {
  text: string;
  id: string;
  completed: boolean;
};

export type TodosReducerState = { list: Todo[] }

export type TodosReducerAction = { name: "createTodo", group: "TodosReducer", payload: string } | { name: "markFirstTodoComplete", group: "TodosReducer" } | { name: "deleteTodoAtIndex", group: "TodosReducer", payload: number } | { name: "chnageSecondTodoOnly", group: "TodosReducer", payload: number } | { name: "markAllOfThemAsCompleted", group: "TodosReducer", payload: number[] }

export type TodosReducerAsyncAction = undefined

export const TodosReducerReducerGroup: ReducerGroup<TodosReducerState, TodosReducerAction, "TodosReducer", TodosReducerAsyncAction> = {
  r:
    (state: TodosReducerState, action: TodosReducerAction) => {
      const t = action.name
      switch (t) {
        case "createTodo": {
          const text1 = (action as any).payload
          return { ...state, list: state.list.concat({ id: uuid(), text: text1, completed: false }) }
        }
        case "markFirstTodoComplete": {

          return { ...state, list: [...state.list.map((_tstore_v, _i) => _i === 0 ? { ..._tstore_v, completed: true } : _tstore_v)] }
        }
        case "deleteTodoAtIndex": {
          const index = (action as any).payload
          return { ...state, list: [...state.list.slice(0, index), ...state.list.slice(index + 1)] }
        }
        case "chnageSecondTodoOnly": {
          const index = (action as any).payload
          let _tr_list = [...state.list]

          if (index === 1) {
            _tr_list[index].completed = true
          }

          return { ...state, list: _tr_list }
        }
        case "markAllOfThemAsCompleted": {
          const indexes = (action as any).payload
          let _tr_list = [...state.list]

          indexes.forEach((i: number) => {
            _tr_list[i].completed = true
          })

          return { ...state, list: _tr_list }
        }
      }
    }
  , g: "TodosReducer", ds: { list: [] }, m: {
    async: undefined,
    f: undefined,
    gql: undefined
  }
}



