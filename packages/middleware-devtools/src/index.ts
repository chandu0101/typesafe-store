
import {
    ReducerGroup, FetchAction, ActionMeta, MiddleWare, Dispatch, GetActionFromReducers,
    FetchVariants, Json, TypeSafeStore, Action, FetchRequest, FUrl
} from "@typesafe-store/store"



type ConnectionInitialteMessage = { kind: "InitiateConnection", type: "App" | "DevTools", appName: string }

type AppConnectedMessage = { kind: "AppConnection", appName: string, id: string }

type StartMessage = { kind: "StartMessage", id: string }

type ActionMessage = { kind: "Action", action: Action, id: String, appName: string }

type StateMessage = { kind: "State", state: any, id: String, appName: string }

type Message = ConnectionInitialteMessage | ActionMessage | StartMessage
    | AppConnectedMessage

type Options = {
    url?: string,
    appName: () => string;
    connectInProd?: boolean
}

const DEVTOOL_MIDDLEWARE_ACTION_GROUP = "DEVTOOL_MIDDLEWARE_SERVER_ACTION_GROUP"

export function createDevtoolMiddlewareServerCloseAction() {
    return { name: "close", group: DEVTOOL_MIDDLEWARE_ACTION_GROUP } as any
}


class DMW {
    isAppStarted = false
    private ws!: WebSocket
    private store!: TypeSafeStore<any>
    private unSub?: () => any
    constructor(public readonly url: string, private readonly appName: string) {
        this.connect()
    }

    private connect = () => {
        this.ws = new WebSocket(this.url)
        this.ws.onopen = this.handleOpen
        this.ws.onmessage = this.handleMessage
        this.ws.onclose = this.handleClose
    }

    private handleOpen = (e: Event) => {
        const m: ConnectionInitialteMessage = {
            kind: "InitiateConnection", type: "App",
            appName: this.appName
        }
        console.log("Devtools middleware : ");
        this.ws.send(JSON.stringify(m))
    }

    private handleMessage = (e: MessageEvent) => {
        const m: Message = JSON.parse(e.data)
        if (m.kind === "Action") {
            if (m.action.group === DEVTOOL_MIDDLEWARE_ACTION_GROUP && m.action.name === "close") {
                this.ws.close()
            } else if (m.action.group === DEVTOOL_MIDDLEWARE_ACTION_GROUP && m.action.name === "open") {
                this.isAppStarted = false
                this.connect()
            }
        }

    }

    private handleClose = (e: CloseEvent) => {
        if (this.unSub) {
            this.unSub()
        }
    }

    setStore = (store: TypeSafeStore<any>) => {
        this.store = store;
    }
    sendAction = (a: Action) => {
        console.log("Devtools MiddleWare send action:", a);
        if (this.ws.readyState === 1) {
            try {
                const m: ActionMessage = { kind: "Action", action: a, appName: this.appName, id: "" }
                this.ws.send(JSON.stringify(m))
            } catch (error) {
                console.log("Error while sending action message to devtool server ", error);
            }
        }
    }

    onCompleteHook = () => {
        if (this.ws.readyState === 1) {
            try {
                const m: StateMessage = {
                    kind: "State", appName: this.appName,
                    state: JSON.stringify(this.store.state), id: ""
                }
                this.ws.send(JSON.stringify(m))
            } catch (error) {
                console.log("Error while sending state to devtools server", error);
            }

        }
    }


    closeConnection = () => {
        this.ws.close()
    }
    setCompleteHookUnSubscriber = (un: () => any) => {
        this.unSub = un;
    }

}

export function createDevToolsMiddleware<R extends Record<string, ReducerGroup<any, any, any, any>>>(options: Options): MiddleWare<R> {
    let dmw: DMW | undefined = undefined
    if (options.connectInProd || process.env.NODE_ENV === "development") {
        const url = options.url || "ws://localhost:8998"
        dmw = new DMW(url, options.appName())
    }
    return (store: TypeSafeStore<R>) => (next: Dispatch<GetActionFromReducers<R>>) => (action: GetActionFromReducers<R>) => {
        if (dmw) {
            if (!dmw.isAppStarted) {
                dmw.isAppStarted = true
                dmw.setStore(store)
                const us = store._addCompleteHook(dmw.onCompleteHook)
                dmw.setCompleteHookUnSubscriber(us)
            }
            if (action.group === DEVTOOL_MIDDLEWARE_ACTION_GROUP && action.name === "close") {
                dmw.closeConnection()
            } else {
                dmw.sendAction(action)
                next(action)
            }
        } else {
            next(action)
        }

    }
}