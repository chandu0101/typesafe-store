import { AppReducerGroup } from "./reducers/generated/app-gen";
import { TypeSafeStore, GetStateFromReducers, GetActionFromReducers } from "@typesafe-store/store";
import createFetchMiddleware from "@typesafe-store/middleware-fetch";
import { GITHUB_REST_API_URL, githubApiUrlOptions } from "./apis/rest/github";
import { createDevToolsMiddleware } from "@typesafe-store/middleware-devtools"
import { SyncReducerGroup } from "./reducers/generated/sync-gen";

const reducers = { app: AppReducerGroup, sync: SyncReducerGroup }

const fm = createFetchMiddleware({
    urlOptions: {
        [GITHUB_REST_API_URL]: githubApiUrlOptions
    }
})

const devToolsMiddleware = createDevToolsMiddleware({ appName: () => "REACT_REAL_WORLD" })

export const store = new TypeSafeStore({ reducers, middleWares: [devToolsMiddleware, fm] })

export type AppState = GetStateFromReducers<typeof reducers>

export type AppAction = GetActionFromReducers<typeof reducers>

