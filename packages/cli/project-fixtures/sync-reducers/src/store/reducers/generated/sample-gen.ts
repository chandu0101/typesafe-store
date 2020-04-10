
           // this file is auto generated on 2020-04-10T12:23:31.406Z, don't modify it
           import { ReducerGroup,FetchVariants,PromiseData } from "@typesafe-store/store"
           import { Fetch } from "@typesafe-store/store";
type Book = {
    name: string;
    year: number;
};
type Todo = {
    id: string;
    completed?: boolean;
    text: string;
};
type GetBooks = Fetch<{
    path: "books";
}, string[], unknown>;

           export type SampleState = {name:string,count:number,count2?:number,frameworks?:string[],person:{ name: string; age: number; },books:Book[],optionalTodos:(Todo | undefined)[],config:{
        count?: number;
        status?: string;
        obj1?: { one: number; obj1c?: { value: string } };
        obj2?: {
            two: number;
            obj2a?: { name: string; obj2ao?: { value: string } }[];
        };
        arr1?: string[];
        arr2?: Array<Array<{ name: string }>>;
        arr3?: Array<Array<{ name: string } | undefined> | undefined>;
    },getBooks:GetBooks,getTwoBooks:Fetch<{ path: "", queryParams: { limit: 2 } }, Book[], unknown>}
           
           export type SampleAction = {name: "changeName" ,group :"Sample",payload:string} | {name: "increment" ,group :"Sample"} | {name: "changePersonName" ,group :"Sample",payload:string} | {name: "changePersonAge" ,group :"Sample",payload:number} | {name: "addBooks" ,group :"Sample",payload:Book[]} | {name: "removeLastBook" ,group :"Sample"} | {name: "removeFirstBook" ,group :"Sample"} | {name: "replaceBooks" ,group :"Sample",payload:Book[]} | {name: "fillBookAt0" ,group :"Sample",payload:Book} | {name: "modifyBookAt0" ,group :"Sample"} | {name: "modifyBookAtIndex" ,group :"Sample",payload:number} | {name: "chnageNameAndCount" ,group :"Sample",payload:{name: string, count: number}} | {name: "changeConfigCount" ,group :"Sample",payload:number} | {name: "modifyConfigObj1" ,group :"Sample"} | {name: "setConfigObj1" ,group :"Sample",payload:{ one: number; obj1c?: { value: string } }} | {name: "setConfigObj1C" ,group :"Sample",payload:string} | {name: "setConfigObj2" ,group :"Sample",payload:{
        two: number;
        obj2a?: { name: string; obj2ao?: { value: string } }[];
    }} | {name: "setConfigObj2a" ,group :"Sample",payload:string} | {name: "setConfigArr2" ,group :"Sample",payload:Array<Array<{ name: string }>>} | {name: "addTodo" ,group :"Sample",payload:Todo} | {name: "completeFirstTodo" ,group :"Sample"} | {name: "completeTodoAtIndex" ,group :"Sample",payload:number} | {name: "addFrameWork" ,group :"Sample",payload:string}
  
           export type SampleAsyncAction = undefined
  
           export const SampleGroup: ReducerGroup<SampleState,SampleAction,"Sample",SampleAsyncAction> = { r: 
    (_trg_satate:SampleState,action:SampleAction) => {
       const t = action.name
       switch(t) {
         case "changeName" : {
                    const name = (action as any).payload as (string)
                    return { ..._trg_satate, name:name }
                }
case "increment" : {
                let _tr_count = _trg_satate.count
let _tr_count2 = _trg_satate.count2
                _tr_count++;
_tr_count++;
if(_tr_count2) {
                            _tr_count2!++;
                        }
                return { ..._trg_satate, count:_tr_count,count2:_tr_count2 }
            }
case "changePersonName" : {
                    const name = (action as any).payload as (string)
                    return { ..._trg_satate, person:{..._trg_satate.person,name:name} }
                }
case "changePersonAge" : {
                    const age = (action as any).payload as (number)
                    return { ..._trg_satate, person:{..._trg_satate.person,age:age} }
                }
case "addBooks" : {
                    const books = (action as any).payload as (Book[])
                    return { ..._trg_satate, books:_trg_satate.books.concat(...books) }
                }
case "removeLastBook" : {
                    
                    return { ..._trg_satate, books:_trg_satate.books.slice(0,-1) }
                }
case "removeFirstBook" : {
                    
                    return { ..._trg_satate, books:[..._trg_satate.books.slice(0,0),..._trg_satate.books.slice(0 + 1)] }
                }
case "replaceBooks" : {
                    const books = (action as any).payload as (Book[])
                    return { ..._trg_satate, books:books }
                }
case "fillBookAt0" : {
                    const book = (action as any).payload as (Book)
                    return { ..._trg_satate, books:[..._trg_satate.books].fill(book,0) }
                }
case "modifyBookAt0" : {
                    
                    return { ..._trg_satate, books:[..._trg_satate.books.map((_tstore_v,_i) => _i === 1 ? {..._tstore_v,name:"modifiedName"} : _tstore_v)] }
                }
case "modifyBookAtIndex" : {
                    const index = (action as any).payload as (number)
                    return { ..._trg_satate, books:[..._trg_satate.books.map((_tstore_v,_i) => _i === index ? {..._tstore_v,name:`modified${index}Name`} : _tstore_v)] }
                }
case "chnageNameAndCount" : {
                    const { name,count } = (action as any).payload as ({name: string, count: number})
                    return { ..._trg_satate, person:{..._trg_satate.person,name:name},count:count }
                }
case "changeConfigCount" : {
                    const count = (action as any).payload as (number)
                    return { ..._trg_satate, config:{..._trg_satate.config,count:count} }
                }
case "modifyConfigObj1" : {
                    
                    return { ..._trg_satate, config:{ ..._trg_satate.config,obj1:_trg_satate.config.obj1 ? {..._trg_satate.config.obj1,one:_trg_satate.config.obj1!.one + 1} : _trg_satate.config.obj1 } }
                }
case "setConfigObj1" : {
                    const ob1 = (action as any).payload as ({ one: number; obj1c?: { value: string } })
                    return { ..._trg_satate, config:{..._trg_satate.config,obj1:ob1} }
                }
case "setConfigObj1C" : {
                    const v = (action as any).payload as (string)
                    return { ..._trg_satate, config:{ ..._trg_satate.config,obj1:_trg_satate.config.obj1 ? _trg_satate.config.obj1 ? { ..._trg_satate.config.obj1,obj1c:_trg_satate.config.obj1!.obj1c ? {..._trg_satate.config.obj1!.obj1c,value:v} : _trg_satate.config.obj1!.obj1c } : _trg_satate.config.obj1 : _trg_satate.config.obj1 } }
                }
case "setConfigObj2" : {
                    const ob2 = (action as any).payload as ({
        two: number;
        obj2a?: { name: string; obj2ao?: { value: string } }[];
    })
                    return { ..._trg_satate, config:{..._trg_satate.config,obj2:ob2} }
                }
case "setConfigObj2a" : {
                    const v = (action as any).payload as (string)
                    return { ..._trg_satate, config:{ ..._trg_satate.config,obj2:_trg_satate.config.obj2 ? _trg_satate.config.obj2 ? { ..._trg_satate.config.obj2,obj2a:_trg_satate.config.obj2!.obj2a ? [..._trg_satate.config.obj2!.obj2a.map((_tstore_v,_i) => _i === 0 ? _tstore_v ? {..._tstore_v,obj2ao:_trg_satate.config.obj2!.obj2a![0].obj2ao ? {..._trg_satate.config.obj2!.obj2a![0].obj2ao,value:v} : _trg_satate.config.obj2!.obj2a![0].obj2ao} : _tstore_v : _tstore_v)] : _trg_satate.config.obj2!.obj2a } : _trg_satate.config.obj2 : _trg_satate.config.obj2 } }
                }
case "setConfigArr2" : {
                    const a = (action as any).payload as (Array<Array<{ name: string }>>)
                    return { ..._trg_satate, config:{..._trg_satate.config,arr2:a} }
                }
case "addTodo" : {
                    const todo = (action as any).payload as (Todo)
                    return { ..._trg_satate, optionalTodos:_trg_satate.optionalTodos.concat(todo) }
                }
case "completeFirstTodo" : {
                    
                    return { ..._trg_satate, optionalTodos:[..._trg_satate.optionalTodos.map((_tstore_v,_i) => _i === 0 ? _tstore_v ? {..._tstore_v,completed:true} : _tstore_v : _tstore_v)] }
                }
case "completeTodoAtIndex" : {
                    const index = (action as any).payload as (number)
                    return { ..._trg_satate, optionalTodos:[..._trg_satate.optionalTodos.map((_tstore_v,_i) => _i === index ? _tstore_v ? {..._tstore_v,completed:true} : _tstore_v : _tstore_v)] }
                }
case "addFrameWork" : {
                    const name = (action as any).payload as (string)
                    return { ..._trg_satate, frameworks:_trg_satate.frameworks ? _trg_satate.frameworks.concat(name) : _trg_satate.frameworks }
                }
       }
    }
  ,g:"Sample",ds:{name:"First",count:1,person:{ name: "P12", age: 10 },books:[],optionalTodos:[],config:{},getBooks:{},getTwoBooks:{}},m:{async:undefined,
    f:undefined,
    p:undefined
  }}
  
          

          