import { AppReducerGroup } from "./reducers/generated/app-gen";
import { TypeSafeStore, GetActionFromReducers } from "@typesafe-store/store";

import { createWebSocketMiddleware } from "@typesafe-store/middleware-websockets";
import DevToolServerRequestCreator from "./apis/websockets/devtools-server/requests";
import devToolsServerOptions from "./apis/websockets/devtools-server";


const reducers = { app: AppReducerGroup }

const webSocketMiddleware = createWebSocketMiddleware({
    urlOptions: {
        [DevToolServerRequestCreator.url]: devToolsServerOptions
    }
})

export const store = new TypeSafeStore({ reducers, middleWares: [webSocketMiddleware] })


export type AppState = typeof store.state

export type AppAction = GetActionFromReducers<typeof reducers>