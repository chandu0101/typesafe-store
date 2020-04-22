
           // this file is auto generated on 2020-04-22T08:46:52.901Z, don't modify it
           import { ReducerGroup,FetchVariants,PromiseData,FetchRequest } from "@typesafe-store/store"
           import { Action } from "@typesafe-store/store"
import reducerTypes from "../types"
import devToolsServerTypes from "../../apis/websockets/devtools-server/types"

           export type AppReducerState = {route:reducerTypes.app.Route,appName:reducerTypes.app.AppName,appsData:Record<reducerTypes.app.AppName, reducerTypes.app.AppData>,wsMessage:devToolsServerTypes.operations.GetMessage}
           
           export type AppReducerAction = {name: "setAppName" ,group :"AppReducer",payload:string} | {name: "setRoute" ,group :"AppReducer",payload:reducerTypes.app.Route} | {name: "initializeApp" ,group :"AppReducer",payload:string} | {name: "addAction" ,group :"AppReducer",payload:{appName: string, action: Action}} | {name: "replaceState" ,group :"AppReducer",payload:{appName: string, state: any}}
  
           export type AppReducerAsyncAction = {name:"wsMessage",group:"AppReducer", ws: NonNullable<devToolsServerTypes.operations.GetMessage["_wsmeta"]>  }
  
           export const AppReducerGroup: ReducerGroup<AppReducerState,AppReducerAction,"AppReducer",AppReducerAsyncAction> = { r: 
    (_trg_satate:AppReducerState,_trg_action:AppReducerAction) => {
       const t = _trg_action.name
       switch(t) {
         case "setAppName" : {
                    const name = (_trg_action as any).payload as (string)
                    return { ..._trg_satate, appName:name }
                }
case "setRoute" : {
                    const route = (_trg_action as any).payload as (reducerTypes.app.Route)
                    return { ..._trg_satate, route:route }
                }
case "initializeApp" : {
                    const appName = (_trg_action as any).payload as (string)
                    return { ..._trg_satate, appName:appName,appsData:{..._trg_satate.appsData,[appName]:{ actions: [], state: null }} }
                }
case "addAction" : {
                    const { appName,action } = (_trg_action as any).payload as ({appName: string, action: Action})
                    return { ..._trg_satate, appsData:{ ..._trg_satate.appsData, [appName]: {..._trg_satate.appsData[appName] ,actions:_trg_satate.appsData[appName].actions.concat(action)}  } }
                }
case "replaceState" : {
                    const { appName,state } = (_trg_action as any).payload as ({appName: string, state: any})
                    return { ..._trg_satate, appsData:{ ..._trg_satate.appsData, [appName]: {..._trg_satate.appsData[appName],state:state }} }
                }
       }
    }
  ,g:"AppReducer",ds:{route:"actions",appName:"",appsData:{},wsMessage:{}},m:{async:undefined,a:{wsMessage:{ws: {}}}}}
  
          

          