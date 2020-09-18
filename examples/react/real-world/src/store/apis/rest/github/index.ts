import { FetchGlobalUrlOptions } from "@typesafe-store/middleware-fetch"


export const GITHUB_REST_API_URL = "https://api.github.com"

export const githubApiUrlOptions = (): FetchGlobalUrlOptions => {
    return { headers: { "Authorization": "token 54d0f3b34d136f5c4611a1d86ab235b63d0302a8" } }
}