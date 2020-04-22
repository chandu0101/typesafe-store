import { WS, TSDevToolsServerConnection } from "./server"

export type Action = any

export type ConnectionInitialteMessage = { kind: "InitiateConnection", type: "App" | "DevTools" }

export type AppConnectedMessage = { kind: "AppConnection", appName: string, id: string }

export type StartMessage = { kind: "StartMessage", id: string }

export type ActionMessage = { kind: "Action", action: Action, id: String, appName: string }

export type StateMessage = { kind: "State", action: Action, id: String, appName: string }

export type Message = ConnectionInitialteMessage | ActionMessage | StartMessage
    | AppConnectedMessage

export type DevToolServerGlobalMeta = {
    connections: TSDevToolsServerConnection[]
}