
           // this file is auto generated on 2020-05-02T08:23:37.057Z, don't modify it
           import { ReducerGroup,FetchVariants,FetchRequest,SyncActionOffloadStatus} from "@typesafe-store/store"
           import reducersTypes from "../types";
import { Offload } from "@typesafe-store/store";

           export type SyncReducerState = {count:number,book:reducersTypes.sync.Book,factorial:number,factorialOffload:number,calculateFactorialOffload :SyncActionOffloadStatus}
           
           export type SyncReducerAction = {name: "increment" ,group :"SyncReducer"} | {name: "decrement" ,group :"SyncReducer"} | {name: "setBookName" ,group :"SyncReducer",payload:string} | {name: "calculateFactorial" ,group :"SyncReducer",payload:number} | {name: "calculateFactorialOffload" ,group :"SyncReducer",payload:{n: number,_abortable?: boolean}}
  
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
                    
                    return { ..._trg_satate, count:_trg_satate.count - 1 }
                }
case "setBookName" : {
                    const name = (_trg_action as any).payload as (string)
                    return { ..._trg_satate, book:{..._trg_satate.book,name:name} }
                }
case "calculateFactorial" : {
                const n = (_trg_action as any).payload as (number)
let _tr_factorial = _trg_satate.factorial
                let ans = 1;
for (let i = 2; i <= n; i++) {
            ans = ans * i
        }
_tr_factorial = ans
                return { ..._trg_satate, factorial:_tr_factorial }
            }
case "calculateFactorialOffload" : {
            throw new Error(" calculateFactorialOffload is an offload action, looks like you didn't added offlod middlware ")
        }
       }
    }
  ,g:"SyncReducer",ds:{count:0, book:{ name: "React" }, factorial:1, factorialOffload:1, calculateFactorialOffload:{}},m:{async:undefined,a:{calculateFactorialOffload:{offload:{
        stateToWorkerIn: 
      (_trg_satate: SyncReducerState) => {
          return {}
      }
    ,
        workerResponseToState: 
       (_trg_satate: SyncReducerState,_wr:any) => {
          return {..._trg_satate,factorialOffload:_wr["factorialOffload"] }
       }
    ,
        propAccessArray: ["factorialOffload"]
    }}},dpersistKeys:[]}}
  
          

          