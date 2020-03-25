
     // this file is auto generated on 2020-03-25T23:26:47.177Z, don't modify it
     import { ReducerGroup,FetchVariants } from "@typesafe-store/reducer"
     import { v1 as uuid } from "uuid";
type Todo = {
    text: string;
    id: string;
    completed: boolean;
};

           export type TodosReducerState = {todos:Todo[]}
           
           export type TodosReducerAction = {name :"createTodo",group:"TodosReducer",payload:string} | {name :"markFirstTodoComplete",group:"TodosReducer"} | {name :"deleteTodoAtIndex",group:"TodosReducer",payload:number}
  
           export type TodosReducerAsyncAction = undefined
  
           export const TodosReducerReducerGroup: ReducerGroup<TodosReducerState,TodosReducerAction,"TodosReducer",TodosReducerAsyncAction> = { r: 
    (state:TodosReducerState,action:TodosReducerAction) => {
       const t = action.name
       switch(t) {
         case "createTodo" : {
                    const text = (action as any).payload
                    return { ...state, todos:state.todos.concat({ id: uuid(), text, completed: false }) }
                }
case "markFirstTodoComplete" : {
                    
                    return { ...state, todos:[...state.todos.map((_tstore_v,_i) => _i === 0 ? {..._tstore_v,completed:true} : _tstore_v)] }
                }
case "deleteTodoAtIndex" : {
                    const index = (action as any).payload
                    return { ...state, todos:[...state.todos.slice(0,index),...state.todos.slice(index + 1)] }
                }
       }
    }
  ,g:"TodosReducer",ds:{todos:[]},m:{async:undefined,
    f:undefined,
    gql:undefined
  }}
  
          

    