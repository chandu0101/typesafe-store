
           // this file is auto generated on 2020-04-25T13:04:48.713Z, don't modify it
           import { ReducerGroup,FetchVariants,PromiseData,FetchRequest } from "@typesafe-store/store"
           
           export type SyncReducerState = {count:number}
           
           export type SyncReducerAction = {name: "increment" ,group :"SyncReducer"} | {name: "decrement" ,group :"SyncReducer"}
  
           export type SyncReducerAsyncAction = undefined

           export type SyncReducerGroupType =  ReducerGroup<SyncReducerState,SyncReducerAction,"SyncReducer",SyncReducerAsyncAction>
  
           export const SyncReducerGroup: SyncReducerGroupType  = { r: 
    (_trg_satate:SyncReducerState,_trg_action:SyncReducerAction) => {
       const t = _trg_action.name
       switch(t) {
         case "increment" : {
                    
                    return { ..._trg_satate, count:_trg_satate.count + 1 }
                }
case "decrement" : {
                    
                    return { ..._trg_satate, count:_trg_satate.count + 1 }
                }
       }
    }
  ,g:"SyncReducer",ds:{count:0},m:{async:undefined,a:{}}}
  
          
export const dummy = "1";

          