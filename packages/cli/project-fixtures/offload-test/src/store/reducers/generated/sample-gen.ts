
           // this file is auto generated on 2020-04-13T11:25:56.175Z, don't modify it
           import { ReducerGroup,FetchVariants,PromiseData,FetchRequest } from "@typesafe-store/store"
           import { Offload } from "@typesafe-store/store"

           export type SampleReducerState = {book:{ name: string, },config:{
        one: { a: string },
        two: { b: string }
    },book2:{ b1: { name: string } }}
           
           export type SampleReducerAction = {name: "changeBookName" ,group :"SampleReducer",payload:string}
  
           export type SampleReducerAsyncAction = undefined
  
           export const SampleReducerGroup: ReducerGroup<SampleReducerState,SampleReducerAction,"SampleReducer",SampleReducerAsyncAction> = { r: 
    (_trg_satate:SampleReducerState,action:SampleReducerAction) => {
       const t = action.name
       switch(t) {
         case "changeBookName" : {
                const name = (action as any).payload as (string)
let _tr_book = {..._trg_satate.book}
let _tr_config = {..._trg_satate.config,one:{..._trg_satate.config.one,a:"12"}, two:{..._trg_satate.config.two,b:""}}
let _tr_book2 = { ..._trg_satate.book2,b1:{..._trg_satate.book2.b1,name:"2"} }
                
                   new Array(10000000).fill(undefined).forEach((v ,i) => {
                       
                  if(_tr_book.name.length > i) {  
                        const r = Math.random()
                    }
                
                    })
                
_tr_book.name = name
_tr_config.one.a = "12"
_tr_config.two.b = ""
_tr_book2.b1.name = "2"
                return { ..._trg_satate, book:_tr_book,config:_tr_config,book2:_tr_book2 }
            }
       }
    }
  ,g:"SampleReducer",ds:{book:{ name: "react" },config:{} as any,book2:{} as any},m:{async:undefined,a:{changeBookName:{offload:{
        stateToWorkerIn: 
      (_trg_satate: SampleReducerState) => {
          return {book: {name: _trg_satate.book.name},config: {one:{a: _trg_satate.config.one.a}, two:{b: _trg_satate.config.two.b}},book2: {b1: {name: _trg_satate.book2.b1.name}}}
      }
    ,
        workerResponseToState: 
       (_trg_satate: SampleReducerState,_wr:any) => {
          return {..._trg_satate,book: {..._trg_satate.book,name:_wr["book.name"]}, config: {..._trg_satate.config,one:{..._trg_satate.config.one,a:_wr["config.one.a"]}, two:{..._trg_satate.config.two,b:_wr["config.two.b"]}}, book2: { ..._trg_satate.book2,b1:{..._trg_satate.book2.b1,name:_wr["book2.b1.name"]} } }
       }
    ,
        propAccessArray: ["book.name","config.one.a","config.two.b","book2.b1.name"]
    }}}}}
  
          

          