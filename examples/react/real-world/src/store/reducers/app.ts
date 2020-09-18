import githubRestApiTypes from "../apis/rest/github/types"
import { GithubApiResponseTransformers as transformers, githubApiTransformerTypes as tTypes } from "../apis/rest/github/transformers"
import { PaginateAppend } from "@typesafe-store/store"


type SF2 = { data: { page: number, repos: githubRestApiTypes.Repo[] } }


class AppReducer {

    repo: githubRestApiTypes.requests.GetRepo = {}

    user: githubRestApiTypes.requests.GetUSer = {}

    starred: githubRestApiTypes.requests.GetStarred<typeof transformers.getStarredTransformer>
        & PaginateAppend<tTypes.GetStarred["repos"]> = {}

    stargazers: githubRestApiTypes.requests.GetStargazers<typeof transformers.getStargazersTransformer>
        & PaginateAppend<tTypes.GetStargazers["users"]> = {}


}


export const s = "AppReducer"