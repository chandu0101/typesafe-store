import githubRestApiTypes from "../types";
import { FetchVariants } from "@typesafe-store/store";


class GithubRestApiRequestsCreator {

    static createGetuserRequest(username: string): NonNullable<githubRestApiTypes.requests.GetUSer["_fmeta"]> {
        return {
            type: FetchVariants.GET,
            url: {
                path: "https://api.github.com/users/{username}",
                params: { username }
            }
        }
    }

    static createGeRepoRequest(repoName: string): NonNullable<githubRestApiTypes.requests.GetRepo["_fmeta"]> {
        return {
            type: FetchVariants.GET,
            url: {
                path: "https://api.github.com/repos/{reponame}",
                params: { reponame: repoName }
            },
        }
    }

    static createStarredRequest(username: string, page: number): NonNullable<githubRestApiTypes.requests.GetStarred["_fmeta"]> {
        return {
            type: FetchVariants.GET,
            url: {
                path: "https://api.github.com/users/{username}/starred",
                params: { username },
                queryParams: { page }
            },
        }
    }

    static createStarGazedRequest(reponame: string, page: number): NonNullable<githubRestApiTypes.requests.GetStargazers["_fmeta"]> {
        return {
            type: FetchVariants.GET,
            url: {
                path: "https://api.github.com/repos/{reponame}/stargazers",
                params: { reponame },
                queryParams: { page }
            },
        }
    }

}

export default GithubRestApiRequestsCreator;