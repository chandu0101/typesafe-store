import { AppReducerGroup } from "./reducers/generated/app-gen";
import { TypeSafeStore, GetActionFromReducers, GetStateFromReducers } from "@typesafe-store/store";

import { createWebSocketMiddleware } from "@typesafe-store/middleware-websockets";
import DevToolServerRequestCreator from "./apis/websockets/devtools-server/requests";
import devToolsServerOptions from "./apis/websockets/devtools-server";
import { createDevToolsMiddleware } from "@typesafe-store/middleware-devtools"

const reducers = { app: AppReducerGroup }

const webSocketMiddleware = createWebSocketMiddleware({
    urlOptions: {
        [DevToolServerRequestCreator.url]: devToolsServerOptions
    }
})

const devToolsMiddleware = createDevToolsMiddleware({ appName: () => "TS_DEVTOOLS" })

export const store = new TypeSafeStore({ reducers, middleWares: [devToolsMiddleware, webSocketMiddleware] })


export type AppState = GetStateFromReducers<typeof reducers>

export type AppAction = GetActionFromReducers<typeof reducers>