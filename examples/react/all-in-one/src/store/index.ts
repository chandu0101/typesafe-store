import { TypeSafeStore, GetStateFromReducers, GetActionFromReducers } from "@typesafe-store/store";
import createFetchMiddleware from "@typesafe-store/middleware-fetch";
import createOffloadMiddleware from "@typesafe-store/middleware-offload";
import { GITHUB_REST_API_URL, githubApiUrlOptions } from "./apis/rest/github";
// import { createDevToolsMiddleware } from "@typesafe-store/middleware-devtools"
import { SyncReducerGroup } from "./reducers/generated/sync-gen";
import { RestReducerGroup } from "./reducers/generated/rest-gen";
import { WebNetworkStatus } from "@typesafe-store/network-status-web"

const reducers = { sync: SyncReducerGroup, rest: RestReducerGroup }

const fm = createFetchMiddleware<typeof reducers>({
    urlOptions: {
        [GITHUB_REST_API_URL]: githubApiUrlOptions
    }
})

const offloadMiddleware = createOffloadMiddleware<typeof reducers>({ workerUrl: "./dist/worker.bundle.js" })

// const devToolsMiddleware = createDevToolsMiddleware<typeof reducers>({ appName: () => "REACT_REAL_WORLD" })


export const store = new TypeSafeStore({
    reducers,
    middleWares: [offloadMiddleware, fm],
    networkOfflne: { statusListener: new WebNetworkStatus() }
})

export type AppState = GetStateFromReducers<typeof reducers>

export type AppAction = GetActionFromReducers<typeof reducers>

