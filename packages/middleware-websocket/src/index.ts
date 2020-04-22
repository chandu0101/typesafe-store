
import {
    ReducerGroup, FetchAction, ActionMeta, MiddleWare, Dispatch, GetActionFromReducers,
    FetchVariants, Json, TypeSafeStore, Action, FetchRequest, FUrl,
    WebSocketAction,
    WebSocketMessage
} from "@typesafe-store/store"


const TS_WEBSOCKET_GLOBAL_GROUP = "TS_WEBSOCKET_GLOBAL"


/**
 *  onOpenMessage : If you want to send a message onopen  connection
 *  parseMessage: parse web socket response message and give back id that is passed in createMessage
 */
export type TSWebSocketOptions = {
    protocols?: string[], headers?: Json, reconnect?: boolean,
    reconnectTimes?: number,
    createMessage?: (messagePassedFromAction: any, id: string) => WebSocketMessage,
    parseMessage?: (data: any) => [any, string],
    onOpenMessage?: () => WebSocketMessage,
}

type WebSocketGlobalAction = Action & { payload: string }

type TSWebSocketMetaOptions = { isGraphql?: boolean }

type CreateWebSocketMiddlewareOptions = { urlOptions: Record<string, TSWebSocketOptions> }
type GenericReducerGroup = ReducerGroup<any, any, any, any>

type ClientsType = Record<string, TSWebSocket>

const isWebSocketAction = (action: Action, rg: GenericReducerGroup) => {
    const actionMeta = rg.m.a[action.name]
    return actionMeta && actionMeta.ws || action.group === TS_WEBSOCKET_GLOBAL_GROUP
}

export const createGlobalSocketCloseAction = (url: string): any => {
    return { name: "close", group: TS_WEBSOCKET_GLOBAL_GROUP, payload: url }
}

const enum GraphqlMessages {
    CONNECTION_INIT = 'connection_init',
    CONNECTION_ACK = 'connection_ack',
    CONNECTION_ERROR = 'connection_error',
    CONNECTION_KEEP_ALIVE = 'ka',
    START = 'start',
    STOP = 'stop',
    CONNECTION_TERMINATE = 'connection_terminate',
    DATA = 'data',
    ERROR = 'error',
    COMPLETE = 'complete'
}

class TSWebSocket {
    private ws!: WebSocket
    private subscriptions: Action[] = []
    private queue: WebSocketAction[] = []
    private isReady = false
    private reconnectTimeoutId?: number
    private reconnectedTimes: number = 0
    private isForceClose = false
    private delay = 1000;
    constructor(private url: string, private options: TSWebSocketOptions, private metaOptions: { isGraphql?: boolean }, private store: TypeSafeStore<any>) {
        if (options.reconnect && !options.reconnectTimes) {
            options.reconnectTimes = Number.POSITIVE_INFINITY
        }
        this.connect()
    }

    private connect = () => {
        let protocols = this.metaOptions.isGraphql ? ["graphql-ws"] : []
        if (this.options.protocols) {
            protocols = this.options.protocols
        }
        this.ws = new WebSocket(this.url, protocols)
        this.ws.onopen = this.handleOpen
        this.ws.onmessage = this.handleOnMessage
        this.ws.onerror = this.handleOnError
        this.ws.onclose = this.handleOnClose
    }

    private tryReconnect = () => {
        if (this.reconnectTimeoutId) {
            clearTimeout(this.reconnectTimeoutId)
        }
        this.delay = this.delay * 2; // TODO exponential delay  
        this.reconnectTimeoutId = window.setTimeout(() => {
            this.connect()
        }, this.delay)
        this.reconnectedTimes++
    }

    private handleOpen = (e: Event) => {
        // Initiate the connection
        this.isForceClose = false
        this.reconnectedTimes = 0
        this.delay = 1000
        if (this.metaOptions.isGraphql) {
            this.ws.send(JSON.stringify({
                type: GraphqlMessages.CONNECTION_INIT,
                payload: { headears: this.options.headers }
            }))
        } else { // generic
            if (this.options.onOpenMessage) {
                this.ws.send(this.options.onOpenMessage())
            }
        }

    }


    private processQueue = () => {
        if (this.queue.length > 0) {
            this.queue.forEach(a => {
                this.handleAction(a)
            })
            this.queue = []
        }
    }

    private getActionFromId = (id: string): Action | undefined => {
        let result: Action | undefined = undefined
        this.subscriptions.some(a => {
            const sid = this.getId(a)
            if (sid === id) {
                result = a
                return true
            }
        })
        return result
    }


    private handleOnMessage = (e: MessageEvent) => {
        if (this.metaOptions.isGraphql) {
            this.handleGraphqlMessage(e)
        } else { // generic 
            let data = e.data
            if (!this.options.parseMessage) {
                throw new Error("You should provide a parseMessage function which should return unique id that was passed as input to createMessage while sending")
            }
            const [rData, id] = this.options.parseMessage(data)
            const a = this.getActionFromId(id)
            if (a) {
                this.dispatchActionToStore(a, { data: rData })
            }
        }
    }

    private handleGraphqlMessage = (e: MessageEvent) => {
        const data = JSON.parse(e.data)
        switch (data.type) {
            case GraphqlMessages.CONNECTION_ACK: {
                // This is the successful response to GQL.CONNECTION_INIT
                this.isReady = true
                this.processQueue()
                break
            }
            case GraphqlMessages.CONNECTION_ERROR: {
                // This may occur:
                // 1. In response to GQL.CONNECTION_INIT
                // 2. In case of parsing errors in the client which will not disconnect.
                //TODO 
                break
            }
            case GraphqlMessages.CONNECTION_KEEP_ALIVE: {
                // This may occur:
                // 1. After GQL.CONNECTION_ACK,
                // 2. Periodically to keep the connection alive.
                break
            }
            case GraphqlMessages.DATA: {
                // This message is sent after GQL.START to transfer the result of the GraphQL subscription.
                const a = this.getActionFromId(data.id)
                if (a) {
                    this.dispatchActionToStore(a, {
                        error: data.payload.errors,
                        data: data.payload.data
                    })
                }
                break
            }
            case GraphqlMessages.ERROR: {
                // This method is sent when a subscription fails. This is usually dues to validation errors
                // as resolver errors are returned in GQL.DATA messages.
                const a = this.getActionFromId(data.id)
                if (a) {
                    this.store.dispatch({ ...a, _internal: { processed: true, kind: "Data", data: { error: data.payload } } })
                    //TODO do we need remove subscription from here ...
                }
                break
            }
            case GraphqlMessages.COMPLETE: {
                // This is sent when the operation is done and no more dta will be sent.
                let ac: Action | undefined = undefined
                this.subscriptions.some(a => {
                    const id = this.getId(a)
                    if (id === data.id) {
                        ac = a
                        return true
                    }
                })
                if (ac) {
                    this.dispatchActionToStore(ac, { completed: true })
                    this.removeFromSubscriptions(ac)
                }
                break
            }
        }

    }
    private removeFromSubscriptions = (a: Action) => {
        let prevLenth = this.subscriptions.length
        this.subscriptions = this.subscriptions.filter(sa => sa.name !== a.name && sa.group !== a.group)
        return prevLenth !== this.subscriptions.length
    }

    private dispatchActionToStore = (a: Action, data: any) => {
        this.store.dispatch({ ...a, _internal: { processed: true, data, kind: "Data" } })
    }

    private handleOnError = (e: Event) => {
        //  websocket onclose will be called  after this we do cleaning over  there ...
        // [...this.queue, ...this.subscriptions].forEach(a => {
        //     this.dispatchActionToStore(a, { error: new Error("WebSocet Error"), completed: true })
        // })
        // this.queue = []
        // this.subscriptions = []
        // this.isReady = false
    }

    private handleOnClose = (e: CloseEvent) => {

        if (this.isForceClose || !this.options.reconnect || (this.options.reconnect && this.options.reconnectTimes! < this.reconnectedTimes)) {
            // The code 1000 (Normal Closure) is special, and results in no error or payload.
            const error = e.code === 1000 ? null : new Error(e.reason);

            [...this.subscriptions, ...this.queue].forEach(sa => {
                this.dispatchActionToStore(sa, { error: error, completed: true })
            })
            this.subscriptions = []
            this.queue = []
            this.isReady = false
        } else {
            this.tryReconnect()
        }

    }
    private getId = (action: Action) => `${action.group}.${action.name}`

    handleUnSubscribe = (a: Action) => {
        const isRemoved = this.removeFromSubscriptions(a)
        if (isRemoved) {
            const id = this.getId(a)
            if (this.metaOptions.isGraphql) {
                this.ws.send(JSON.stringify({
                    type: GraphqlMessages.STOP,
                    id
                }))
            }
        }

        //TODO check if this sends an complete event 
    }

    private handleGlobalAction = (action: WebSocketGlobalAction) => {
        if (action.name === "close") {
            this.isForceClose = true
            this.ws.close()
        }
    }

    handleAction = (action: WebSocketAction | WebSocketGlobalAction) => {
        if (isWebSocketGlobalAction(action)) {
            this.handleGlobalAction(action)
        } else {
            if (action.ws.unsubscribe) {
                this.handleUnSubscribe(action)
                return
            }
            this.dispatchActionToStore({ name: action.name, group: action.group }, { loading: true })
            if (!this.isReady) {
                this.queue.push(action)
                return
            }
            const id = this.getId(action)
            const sa = this.getActionFromId(id)
            if (sa) { // if already existing unsubscribe and re subscribe 
                this.handleUnSubscribe(action)
            }
            if (this.metaOptions.isGraphql) {
                this.ws.send(JSON.stringify({
                    type: GraphqlMessages.START,
                    id,
                    payload: action.ws.message // {query,variables}
                }))
            } else {
                if (!this.options.createMessage) {
                    throw new Error("You should provide a createMessage function which taken an unique id for action and send it back in response from server")
                }
                this.ws.send(this.options.createMessage(action.ws.message, id))
            }
            this.subscriptions.push({ name: action.name, group: action.group })
        }
    }
}

const isWebSocketGlobalAction = (action: Action): action is WebSocketGlobalAction => {
    return action.group === TS_WEBSOCKET_GLOBAL_GROUP
}

const handleWebSocketAction = ({ action, clients, rg, store, options }: { clients: ClientsType, action: WebSocketAction | WebSocketGlobalAction, store: TypeSafeStore<any>, rg: GenericReducerGroup, options: CreateWebSocketMiddlewareOptions }) => {
    let url = ""
    let isGlobal = false
    if (isWebSocketGlobalAction(action)) {
        url = action.payload
        isGlobal = true
    } else {
        url = action.ws.url
    }
    let client: TSWebSocket = clients[url] as any
    if (!client && isGlobal && action.name === "close") {
        console.log("do nothig or throw error ? ");
        return
    }
    let metaOptions: TSWebSocketMetaOptions = {}
    if (!isGlobal) {
        const actionMeta = rg.m.a[action.name].ws!
        if (actionMeta.isGraphql) {
            metaOptions.isGraphql = true;
        }
    }
    const uoptions = options.urlOptions[url]
    if (!client) {
        client = new TSWebSocket(url, uoptions, metaOptions, store)
        clients[url] = client
    }
    client.handleAction(action)

}

export function createWebSocketMiddleware<R extends Record<string, ReducerGroup<any, any, any, any>>>(options: CreateWebSocketMiddlewareOptions): MiddleWare<R> {
    const clients: ClientsType = {}
    return (store: TypeSafeStore<R>) => (next: Dispatch<GetActionFromReducers<R>>) => (action: GetActionFromReducers<R>) => {
        if (action._internal && action._internal.processed) { // if already processed by other middlewares just pass through
            return next(action)
        }
        const rg = store.getReducerGroup(action.group)
        if (isWebSocketAction(action, rg)) {
            handleWebSocketAction({ clients, options, action: action as any, rg, store })
        } else {
            next(action)
        }
    }
}