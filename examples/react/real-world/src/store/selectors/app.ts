import { AppState } from ".."
import { createSelector } from "@typesafe-store/store"
import githubRestApiTypes from "../apis/rest/github/types"
import { githubApiTransformerTypes } from "../apis/rest/github/transformers"
import selectorTypes from "./types"



const userPageSelector = createSelector((state: AppState): selectorTypes.UsersPage => {
    let result: selectorTypes.UsersPage = { repos: [] } as any
    const userData = state.app.user
    if (userData.loading) {
        result.isLoading = true
    } else if (userData.error) {
        result.error = userData.error
    } else if (userData.data) {
        result.user = userData.data
        const starredData = state.app.starred
        result.nextPage = 1
        if (starredData.data) {
            result.repos = starredData.data.repos
            result.nextPage = starredData.data.nextPage
        }
        if (starredData.loading) {
            result.isLoading = true
        }
        result.error = starredData.error
    }

    return result
})

const reposPageSelector = createSelector((state: AppState): selectorTypes.ReposPage => {
    let result: selectorTypes.ReposPage = { users: [] } as any
    const repoData = state.app.repo
    if (repoData.loading) {
        result.isLoading = true
    } else if (repoData.error) {
        result.error = repoData.error
    } else if (repoData.data) {
        result.repo = repoData.data
        const starGazersData = state.app.stargazers
        result.nextPage = 1
        if (starGazersData.data) {
            result.users = starGazersData.data.users
            result.nextPage = starGazersData.data.nextPage
        }
        if (starGazersData.loading) {
            result.isLoading = true
        }
        result.error = starGazersData.error
    }

    return result
})

const repoSelector = createSelector((state: AppState): githubRestApiTypes.requests.GetRepo => state.app.repo)

const userSeelctor = createSelector((state: AppState): githubRestApiTypes.requests.GetUSer => state.app.user)


export const dummy = ""