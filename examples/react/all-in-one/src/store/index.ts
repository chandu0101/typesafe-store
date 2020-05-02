import { TypeSafeStore, GetStateFromReducers, GetActionFromReducers } from "@typesafe-store/store";
import createFetchMiddleware from "@typesafe-store/middleware-fetch";
import createOffloadMiddleware from "@typesafe-store/middleware-offload";
import { GITHUB_REST_API_URL, githubApiUrlOptions } from "./apis/rest/github";
// import { createDevToolsMiddleware } from "@typesafe-store/middleware-devtools"
import { SyncReducerGroup } from "./reducers/generated/sync-gen";

const reducers = { sync: SyncReducerGroup }

const fm = createFetchMiddleware<typeof reducers>({
    urlOptions: {
        [GITHUB_REST_API_URL]: githubApiUrlOptions
    }
})

const offloadMiddleware = createOffloadMiddleware<typeof reducers>({ workerUrl: "./dist/worker.bundle.js" })

// const devToolsMiddleware = createDevToolsMiddleware<typeof reducers>({ appName: () => "REACT_REAL_WORLD" })

export const store = new TypeSafeStore({ reducers, middleWares: [offloadMiddleware, fm] })

export type AppState = GetStateFromReducers<typeof reducers>

export type AppAction = GetActionFromReducers<typeof reducers>

