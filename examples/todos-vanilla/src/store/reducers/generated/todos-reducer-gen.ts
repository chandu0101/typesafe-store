
       // this file is auto generated on 2020-04-01T02:14:46.821Z, don't modify it
       import { ReducerGroup,FetchVariants } from "@typesafe-store/store"
       import { Todo, TodoVisibilityFilter } from "../../types/index"
import { Todos2 } from "../type2"
import { v1 as uuid } from "uuid"
const s: Todos2 = "25";

           export type TodosReducerState = {list:Todo[],visibility_filter:TodoVisibilityFilter}
           
           export type TodosReducerAction = {name: "createTodo" ,group :"TodosReducer",payload:string} | {name: "deleteTodo" ,group :"TodosReducer",payload:string} | {name: "editTodo" ,group :"TodosReducer",payload:{id: string, text: string}} | {name: "completeTodo" ,group :"TodosReducer",payload:string} | {name: "completeAllTodos" ,group :"TodosReducer"} | {name: "clearCompleted" ,group :"TodosReducer"} | {name: "showTodos" ,group :"TodosReducer",payload:TodoVisibilityFilter}
  
           export type TodosReducerAsyncAction = undefined
  
           export const TodosReducerGroup: ReducerGroup<TodosReducerState,TodosReducerAction,"TodosReducer",TodosReducerAsyncAction> = { r: 
    (state:TodosReducerState,action:TodosReducerAction) => {
       const t = action.name
       switch(t) {
         case "createTodo" : {
                    const text = (action as any).payload as (string)
                    return { ...state, list:state.list.concat({ title: text, completed: false, id: uuid() }) }
                }
case "deleteTodo" : {
                    const id = (action as any).payload as (string)
                    return { ...state, list:state.list.filter(t => t.id !== id) }
                }
case "editTodo" : {
                    const { id,text } = (action as any).payload as ({id: string, text: string})
                    return { ...state, list:state.list.map(t => t.id === id ? { ...t, title: text } : t) }
                }
case "completeTodo" : {
                    const id = (action as any).payload as (string)
                    return { ...state, list:state.list.map(t => t.id === id ? { ...t, completed: !t.completed } : t) }
                }
case "completeAllTodos" : {
                let _tr_list = state.list
                const areAllmarked = state.list.every(t => t.completed)
_tr_list = state.list.map(t => ({ ...t, completed: !areAllmarked }))
                return { ...state, list:_tr_list }
            }
case "clearCompleted" : {
                    
                    return { ...state, list:state.list.filter(t => t.completed === false) }
                }
case "showTodos" : {
                    const filter = (action as any).payload as (TodoVisibilityFilter)
                    return { ...state, visibility_filter:filter }
                }
       }
    }
  ,g:"TodosReducer",ds:{list:[],visibility_filter:TodoVisibilityFilter.SHOW_ALL},m:{async:undefined,
    f:undefined,
    gql:undefined
  }}
  
          

      