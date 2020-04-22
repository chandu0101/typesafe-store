import { Action } from "@typesafe-store/store"



namespace reducerTypes {

    export namespace app {
        export type Route = "actions" | "about"
        export type AppName = string
        export type AppData = { actions: Action[], state: any }
    }
}

export default reducerTypes