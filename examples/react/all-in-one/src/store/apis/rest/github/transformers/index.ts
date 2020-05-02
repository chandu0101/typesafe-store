import types from "../types";


export class GithubApiResponseTransformers {

    static getUserTransformer(user: types.User): types.User {
        return { login: user.login, id: user.id, avatar_url: user.avatar_url, html_url: user.html_url, name: user.name }
    }

    static getRepoTransformer(repo: types.Repo): types.Repo {
        return { html_url: repo.html_url, id: repo.id, name: repo.name, description: repo.description, owner: this.getUserTransformer(repo.owner) }
    }

    static getStarredTransformer(response: types.Repo[], req?: types.requests.GetStarred["_fmeta"]): githubApiTransformerTypes.GetStarred {
        req = req!
        console.log("***** getStarredTransformerreq : ", req, response);
        const repos = response.map(r => GithubApiResponseTransformers.getRepoTransformer(r))
        console.log("repos : *** ", repos);
        if (response.length === 0) {
            return { nextPage: undefined, repos }
        } else {
            return { nextPage: req.url.queryParams.page + 1, repos }
        }
    }

    static getStargazersTransformer(response: types.User[], req?: types.requests.GetStargazers["_fmeta"]): githubApiTransformerTypes.GetStargazers {
        req = req!
        const users = response.map(u => GithubApiResponseTransformers.getUserTransformer(u))
        if (response.length === 0) {
            return { nextPage: undefined, users }
        } else {
            return { nextPage: req.url.queryParams.page + 1, users }
        }
    }

}

export namespace githubApiTransformerTypes {
    export type GetStarred = { nextPage?: number, repos: types.Repo[] }
    export type GetStargazers = { nextPage?: number, users: types.User[] }
}

