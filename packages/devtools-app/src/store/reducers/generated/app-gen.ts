
           // this file is auto generated on 2020-04-25T07:45:37.556Z, don't modify it
           import { ReducerGroup,FetchVariants,PromiseData,FetchRequest } from "@typesafe-store/store"
           import { Action } from "@typesafe-store/store"
import reducerTypes from "../types"
import devToolsServerTypes from "../../apis/websockets/devtools-server/types"

           export type AppReducerState = {route:reducerTypes.app.Route,wsUrl:string,appName?:reducerTypes.app.AppName,appsData:Record<reducerTypes.app.AppName, reducerTypes.app.AppData>,wsMessage:devToolsServerTypes.operations.GetMessage,wsSendMessage:devToolsServerTypes.operations.SendMessage}
           
           export type AppReducerAction = {name: "setAppName" ,group :"AppReducer",payload:string} | {name: "setRoute" ,group :"AppReducer",payload:reducerTypes.app.Route} | {name: "setWsUrl" ,group :"AppReducer",payload:string} | {name: "initializeApp" ,group :"AppReducer",payload:string} | {name: "addAction" ,group :"AppReducer",payload:{appName: string, action: reducerTypes.app.DAction}} | {name: "resetApp" ,group :"AppReducer",payload:{appName: string, actions: reducerTypes.app.DAction[]}}
  
           export type AppReducerAsyncAction = {name:"wsMessage",group:"AppReducer", ws: NonNullable<devToolsServerTypes.operations.GetMessage["_wsmeta"]>  } | {name:"wsSendMessage",group:"AppReducer", ws: NonNullable<devToolsServerTypes.operations.SendMessage["_wsmeta"]>  }

           export type AppReducerGroupType =  ReducerGroup<AppReducerState,AppReducerAction,"AppReducer",AppReducerAsyncAction>
  
           export const AppReducerGroup: AppReducerGroupType  = { r: 
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
case "setWsUrl" : {
                    const url = (_trg_action as any).payload as (string)
                    return { ..._trg_satate, wsUrl:url,appsData:{},appName:undefined,wsMessage:{},wsSendMessage:{} }
                }
case "initializeApp" : {
                    const appName = (_trg_action as any).payload as (string)
                    return { ..._trg_satate, appName:appName,appsData:{..._trg_satate.appsData,[appName]:{ actions: [], name: appName, status: "Connected" }} }
                }
case "addAction" : {
                    const { appName,action } = (_trg_action as any).payload as ({appName: string, action: reducerTypes.app.DAction})
                    return { ..._trg_satate, appsData:{ ..._trg_satate.appsData, [appName]: {..._trg_satate.appsData[appName] ,actions:_trg_satate.appsData[appName].actions.concat(action)}  } }
                }
case "resetApp" : {
                    const { appName,actions } = (_trg_action as any).payload as ({appName: string, actions: reducerTypes.app.DAction[]})
                    return { ..._trg_satate, appsData:{ ..._trg_satate.appsData, [appName]: {..._trg_satate.appsData[appName],actions:actions }} }
                }
       }
    }
  ,g:"AppReducer",ds:{route:"actions",wsUrl:"wss://locahost:8998",appsData:{},wsMessage:{},wsSendMessage:{}},m:{async:undefined,a:{wsMessage:{ws: {}},wsSendMessage:{ws: {}}}}}
  
          

          