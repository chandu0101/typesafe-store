import { AppReducerGroup } from "./reducers/generated/app-gen";
import { TypeSafeStore, GetStateFromReducers, GetActionFromReducers } from "@typesafe-store/store";
import createFetchMiddleware from "@typesafe-store/middleware-fetch";
import { GITHUB_REST_API_URL, githubApiUrlOptions } from "./apis/rest/github";


const reducers = { app: AppReducerGroup }

const fm = createFetchMiddleware<typeof reducers>({
    urlOptions: {
        [GITHUB_REST_API_URL]: githubApiUrlOptions
    }
})

export const store = new TypeSafeStore({ reducers, middleWares: [fm] })

export type AppState = GetStateFromReducers<typeof reducers>

export type AppAction = GetActionFromReducers<typeof reducers>

