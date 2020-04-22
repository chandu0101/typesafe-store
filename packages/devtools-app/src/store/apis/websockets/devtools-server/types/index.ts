import { TSWebSocket, Action } from "@typesafe-store/store"



namespace devToolsServerTypes {


    export type ConnectionInitialteMessage = { kind: "InitiateConnection", type: "App" | "DevTools" }

    export type AppConnectedMessage = { kind: "AppConnection", appName: string, id: string }

    export type StartMessage = { kind: "StartMessage", id: string }

    export type ActionMessage = { kind: "Action", action: Action, id: String, appName: string }

    export type StateMessage = { kind: "State", action: Action, id: String, appName: string }

    export type Message = ConnectionInitialteMessage | ActionMessage | StartMessage
        | AppConnectedMessage


    export namespace operations {
        export type GetMessage = TSWebSocket<"ws://localhost:8998", string, Message, Error>
    }



}

export default devToolsServerTypes