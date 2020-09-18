
import githubRestApiTypes from "../../apis/rest/github/types"

namespace selectorTypes {

    export type UsersPage = {
        error?: any,
        isLoading: boolean,
        user?: githubRestApiTypes.User,
        repos: githubRestApiTypes.Repo[]
        nextPage?: number
    }

    export type ReposPage = {
        error?: any,
        isLoading: boolean,
        repo?: githubRestApiTypes.Repo,
        users: githubRestApiTypes.User[]
        nextPage?: number
    }
}


export default selectorTypes