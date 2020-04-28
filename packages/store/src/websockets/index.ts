import { Action } from "../reducer"



export type WebSocketActionMeta = { isGraphql?: boolean, dtf?: (data: any) => any }

export type WebSocketAction = Action & { ws: WebSocketRequest<string, WebSocketMessage> }

export type WebSocketMessage = string | ArrayBufferLike | Blob | ArrayBufferView

export type WebSocketRequest<U extends string, M extends WebSocketMessage> = { url: U, message: M, unsubscribe?: boolean }

export type WebSocketMessageTransformer<R> = (data: any) => [R, string]

export type WebSocketResponse<R> = R | WebSocketMessageTransformer<R>

export type WebSocketFieldValue<U extends string, M extends WebSocketMessage, R, E> = {
    data?: R, error?: E,
    loading?: boolean, completed?: boolean, _wsmeta?: WebSocketRequest<U, M>
}

export type TSWebSocket<U extends string, M extends WebSocketMessage, R, E> = WebSocketFieldValue<U, M, R, E>

type url = ""

// const w: TSWebSocket<url, string, any, any> = null