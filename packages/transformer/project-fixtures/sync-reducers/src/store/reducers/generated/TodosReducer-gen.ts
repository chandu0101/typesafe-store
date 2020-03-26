
     // this file is auto generated on 2020-03-26T02:32:03.492Z, don't modify it
     import { ReducerGroup,FetchVariants } from "@typesafe-store/reducer"
     import { v1 as uuid } from "uuid";
type Todo = {
    text: string;
    id: string;
    completed: boolean;
};

           export type TodosReducerState = {list:Todo[]}
           
           export type TodosReducerAction = {name :"createTodo",group:"TodosReducer",payload:string} | {name :"markFirstTodoComplete",group:"TodosReducer"} | {name :"deleteTodoAtIndex",group:"TodosReducer",payload:number}
  
           export type TodosReducerAsyncAction = undefined
  
           export const TodosReducerReducerGroup: ReducerGroup<TodosReducerState,TodosReducerAction,"TodosReducer",TodosReducerAsyncAction> = { r: 
    (state:TodosReducerState,action:TodosReducerAction) => {
       const t = action.name
       switch(t) {
         case "createTodo" : {
                    const text = (action as any).payload
                    return { ...state, list:state.list.concat({ id: uuid(), text, completed: false }) }
                }
case "markFirstTodoComplete" : {
                    
                    return { ...state, list:[...state.list.map((_tstore_v,_i) => _i === 0 ? {..._tstore_v,completed:true} : _tstore_v)] }
                }
case "deleteTodoAtIndex" : {
                    const index = (action as any).payload
                    return { ...state, list:[...state.list.slice(0,index),...state.list.slice(index + 1)] }
                }
       }
    }
  ,g:"TodosReducer",ds:{list:[]},m:{async:undefined,
    f:undefined,
    gql:undefined
  }}
  
          

    