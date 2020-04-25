import { TSWebSocket, Action } from "@typesafe-store/store"



namespace devToolsServerTypes {


    export type DevToolsConnectionInitialteMessage = { kind: "InitiateDevToolsConnection", type: "DevTools", appName?: string }

    export type AppInitialConnectedMessage = { kind: "InitiateAppConnection", appName: string, type: "App" }

    export type StartMessage = { kind: "StartMessage", id: string }

    export type ActionMessage = { kind: "Action", action: Action, stateChanged: Record<string, any>, id: String, appName: string }

    export type Message = DevToolsConnectionInitialteMessage | AppInitialConnectedMessage | ActionMessage | StartMessage



    export namespace operations {
        export type GetMessage = TSWebSocket<string, string, Message, Error>
        export type SendMessage = TSWebSocket<string, string, Message, Error>
    }



}

export default devToolsServerTypes