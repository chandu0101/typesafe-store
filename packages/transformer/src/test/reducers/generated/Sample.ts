
     // this file is auto generated on 2019-12-23T01:34:34.319Z, don't modify it
     import { ReducerGroup } from "@typesafe-store/reducer"
     
         export type SampleState = {name:string,count:number,person:{ name: string; age: number; },books:Book[],optionalTodos:(Todo | undefined)[],config:{ count?: number | undefined; status?: string | undefined; obj1?: { one: number; obj1c?: { two: string; } | undefined; } | undefined; arr1?: string[] | undefined; }}
         
         export type SampleAction = {name :"changeName",group:"Sample",payload:string} | {name :"increment",group:"Sample"} | {name :"chnagePersonName",group:"Sample",payload:string} | {name :"changePersonAge",group:"Sample",payload:number} | {name :"addBooks",group:"Sample",payload:Book[]} | {name :"removeLastBook",group:"Sample"} | {name :"removeFirstBook",group:"Sample"} | {name :"replaceBooks",group:"Sample",payload:Book[]} | {name :"fillBookAt0",group:"Sample",payload:Book} | {name :"modifyBookAt0",group:"Sample"} | {name :"modifyBookAtIndex",group:"Sample",payload:number} | {name :"chnageNameAndCount",group:"Sample",payload:{name: string, count: number}} | {name :"changeConfigCount",group:"Sample",payload:number} | {name :"modifyConfigObj1",group:"Sample",payload:string} | {name :"setConfigObj1",group:"Sample",payload:{ one: number; obj1c?: { two: string; } | undefined; } | undefined} | {name :"addTodo",group:"Sample",payload:Todo}

         export const SampleReducerGroup: ReducerGroup<SampleState,SampleAction,"Sample"> = { r: 
      (state:SampleState,action:SampleAction) => {
         const t = action.name
         switch(t) {
           case "changeName" : {
                    const name = (action as any).payload
                    return { ...state, name:name }
                }
case "increment" : {
                let _tr_count = state.count
                _tr_count += 1
_tr_count += 1
                return { ...state, count:_tr_count }
            }
case "chnagePersonName" : {
                    const name = (action as any).payload
                    return { ...state, person:{...state.person,name:name} }
                }
case "changePersonAge" : {
                    const age = (action as any).payload
                    return { ...state, person:{...state.person,age:age} }
                }
case "addBooks" : {
                    const books = (action as any).payload
                    return { ...state, books:state.books.concat(...books) }
                }
case "removeLastBook" : {
                    
                    return { ...state, books:state.books.slice(0,-1) }
                }
case "removeFirstBook" : {
                    
                    return { ...state, books:[...state.books.slice(0,0),...state.books.slice(1)] }
                }
case "replaceBooks" : {
                    const books = (action as any).payload
                    return { ...state, books:books }
                }
case "fillBookAt0" : {
                    const book = (action as any).payload
                    return { ...state, books:[...state.books].fill(book,0) }
                }
case "modifyBookAt0" : {
                    
                    return { ...state, books:[...state.books.map((v,_i) => _i === 1 ? {...v,name:"modifiedName"} : v)] }
                }
case "modifyBookAtIndex" : {
                    const index = (action as any).payload
                    return { ...state, books:[...state.books.map((v,_i) => _i === index ? {...v,name:`modified${index}Name`} : v)] }
                }
case "chnageNameAndCount" : {
                    const { name,count } = (action as any).payload
                    return { ...state, person:{...state.person,name:name},count:count }
                }
case "changeConfigCount" : {
                    const count = (action as any).payload
                    return { ...state, config:{...state.config,count:count} }
                }
case "modifyConfigObj1" : {
                    const input = (action as any).payload
                    return { ...state, config:{ ...state.config,obj1:state.config.obj1 ? {...state.config.obj1,one:state.config.obj1!.one + 1} : state.config.obj1 } }
                }
case "setConfigObj1" : {
                    const ob1 = (action as any).payload
                    return { ...state, config:{...state.config,obj1:ob1} }
                }
case "addTodo" : {
                    const todo = (action as any).payload
                    return { ...state, optionalTodos:state.optionalTodos.concat(todo) }
                }
         }
      }
    ,g:"Sample",ds:{name:"First",count:1,person:{ name: "P12", age: 10 },books:[],optionalTodos:[],config:{}},m:{}}

        

    