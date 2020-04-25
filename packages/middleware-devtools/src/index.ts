
import {
    ReducerGroup, FetchAction, ActionMeta, MiddleWare, Dispatch, GetActionFromReducers,
    FetchVariants, Json, TypeSafeStore, Action, FetchRequest, FUrl
} from "@typesafe-store/store"


type ConnectionInitialteMessage = { kind: "InitiateAppConnection", type: "App", appName: string }

// type AppConnectedMessage = { kind: "AppConnection", appName: string, id: string }

type StartMessage = { kind: "StartMessage", id: string }

type ActionMessage = { kind: "Action", action: Action, stateChanged: Record<string, any>, id: String, appName: string }


type Message = ConnectionInitialteMessage | ActionMessage | StartMessage


type Options = {
    url?: string,
    appName: () => string;
    connectInProd?: boolean,
    actionProcessor?: (a: Action) => Action
}

const DEVTOOL_MIDDLEWARE_ACTION_GROUP = "DEVTOOL_MIDDLEWARE_SERVER_ACTION_GROUP"

type DevToolsAppCloseAction = { name: "close", group: typeof DEVTOOL_MIDDLEWARE_ACTION_GROUP }

type DevToolsAppStartAction = { name: "start", group: typeof DEVTOOL_MIDDLEWARE_ACTION_GROUP }

type DevToolsAppReplaceStateAction = { name: "replaceState", group: typeof DEVTOOL_MIDDLEWARE_ACTION_GROUP, payload: string }

type DevToolsAppAction = DevToolsAppCloseAction | DevToolsAppStartAction | DevToolsAppReplaceStateAction

export function createDevtoolMiddlewareServerCloseAction() {
    return { name: "close", group: DEVTOOL_MIDDLEWARE_ACTION_GROUP } as any
}


class DMW {
    isAppStarted = false
    private ws!: WebSocket
    private store!: TypeSafeStore<any>
    private unSub?: () => any
    private url: string
    private appName: string
    private queue: ActionMessage[] = []

    constructor(public readonly options: Options) {
        this.url = options.url || "ws://localhost:8998"
        this.appName = options.appName()
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
            kind: "InitiateAppConnection", type: "App",
            appName: this.appName
        }
        console.log("Devtools middleware : ");
        this.ws.send(JSON.stringify(m))
    }

    private handleMessage = (e: MessageEvent) => {
        const m: Message = JSON.parse(e.data)
        if (m.kind === "Action") {
            const action: DevToolsAppAction = m.action as any
            if (action.group === DEVTOOL_MIDDLEWARE_ACTION_GROUP) {
                if (action.name === "close") {
                    this.ws.close()
                } else if (action.name === "start") {
                    this.connect()
                } else if (action.name === "replaceState") {
                    this.replaceState(action.payload, action)
                }
            }
        }

    }

    private replaceState = (newState: string, action: Action) => {
        const newS: any = JSON.parse(newState);
        (this.store as any)["_state"] = newS
        Object.entries(this.store.selectorListeners).forEach(([key, value]) => {
            value.forEach(v => {
                v.listener({ name: action.name, group: action.group })
            })
        })
    }

    private handleClose = (e: CloseEvent) => {
        if (this.unSub) {
            this.unSub()
        }
    }

    setStore = (store: TypeSafeStore<any>) => {
        try {
            this.store = store;
            if (this.unSub) {
                this.unSub()
            }
            this.unSub = this.store._addCompleteHook(this.onCompleteHook)
            const m: ActionMessage = {
                kind: "Action",
                action: { name: "Initialize", group: DEVTOOL_MIDDLEWARE_ACTION_GROUP, },
                stateChanged: this.store.state,
                appName: this.appName,
                id: ""
            }
            if (this.ws.readyState === 1) {
                this.ws.send(JSON.stringify(m))
            } else {
                this.queue.push(m)
            }

        } catch (error) {
            console.log("Erron in setting store :", error);
        }
    }

    onCompleteHook = (action: Action, statekeys: { name: string, prevValue: any }[]) => {
        if (this.ws.readyState === 1) {
            try {
                if (this.queue.length > 0) {
                    this.queue.forEach(qm => {
                        this.ws.send(JSON.stringify(qm))
                    })
                    this.queue = []
                }
                const state = statekeys.reduce((prv, skPair) => {
                    prv[skPair.name] = this.getObjectsChanged(skPair.name, skPair.prevValue)
                    return prv;
                }, {} as Record<string, any>)
                let a = action
                if (this.options.actionProcessor) {
                    a = this.options.actionProcessor(a)
                }
                const m: ActionMessage = {
                    kind: "Action", appName: this.appName,
                    stateChanged: state,
                    action: a,
                    id: ""
                }
                this.ws.send(JSON.stringify(m))
            } catch (error) {
                console.log("Error while sending state to devtools server", error);
            }
        }
    }

    getObjectsChanged = (statekey: string, prevValue: any) => {
        const currentValue = this.store.state[statekey]
        return Object.entries(currentValue).reduce((prv, [key, value]) => {
            const pkv = prevValue[key]
            if (pkv !== value) {
                prv[key] = value;
            }
            return prv;
        }, {} as Record<string, any>)
    }


    closeConnection = () => {
        this.ws.close()
    }

}

export function createDevToolsMiddleware<R extends Record<string, ReducerGroup<any, any, any, any>>>(options: Options): MiddleWare<R> {
    let dmw: DMW | undefined = undefined
    if (options.connectInProd || process.env.NODE_ENV === "development") {
        dmw = new DMW(options)
    }
    return (store: TypeSafeStore<R>) => (next: Dispatch<GetActionFromReducers<R>>) => (action: GetActionFromReducers<R>) => {
        if (dmw) {
            if (!dmw.isAppStarted) {
                dmw.isAppStarted = true
                dmw.setStore(store)
            }
            if (action.group === DEVTOOL_MIDDLEWARE_ACTION_GROUP && action.name === "close") {
                dmw.closeConnection()
            } else {
                next(action)
            }
        } else {
            next(action)
        }

    }
}