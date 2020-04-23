import { Fetch, FetchRequest, FUrl, FetchVariants, FetchTransform } from "@typesafe-store/store";
import { GITHUB_REST_API_URL } from "..";



namespace githubRestApiTypes {

    export type User = {
        id: string,
        login: string
        avatar_url: string
        name: string
        html_url: string
    }

    export type Repo = {
        id: string
        name: string
        owner: User
        html_url: string
        description?: string
    }

    export namespace requests {

        export type GetUSer = Fetch<{ path: "https://api.github.com/users/{username}", params: { username: string } }, User, Error>

        export type GetRepo = Fetch<{ path: "https://api.github.com/repos/{reponame}", params: { reponame: string } }, Repo, Error>

        export type GetStarred<T extends FetchTransform<Repo[], any> | null = null> = Fetch<{
            path: "https://api.github.com/users/{username}/starred",
            params: { username: string },
            queryParams: { page: number }
        }, Repo[], Error, T>

        export type GetStargazers<T extends FetchTransform<User[], any> | null = null> = Fetch<{
            path: "https://api.github.com/repos/{reponame}/stargazers", params: {
                reponame: string
            }, queryParams: { page: number }
        }, User[], Error, T>

    }
}


export default githubRestApiTypes;