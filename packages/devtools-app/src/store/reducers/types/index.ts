import { Action } from "@typesafe-store/store"



namespace reducerTypes {


    export namespace app {
        export type AppConnectionStatus = "Connected" | "Disconnected"
        export type Route = "actions" | "about"
        export type AppName = string
        export type DAction = Action & { state: Record<string, any> }
        export type DactionType = "Sync" | "Fetch" | "WS" | "Promise" | "Unknown"
        export type AppData = { actions: DAction[], name: string, status: AppConnectionStatus }
    }
}

export default reducerTypes