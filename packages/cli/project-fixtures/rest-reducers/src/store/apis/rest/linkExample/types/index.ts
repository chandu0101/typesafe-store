
// this file is auto generated on 2020-04-19T20:28:33.955Z, don't modify it 
import { FUrl, Fetch, FetchPost, FetchTransform } from "@typesafe-store/store"

namespace linkExample {
  export interface User {
    readonly username?: string
    readonly uuid?: string
  }

  export interface Repository {
    readonly slug?: string
    readonly owner?: {
      readonly username?: string
      readonly uuid?: string
    }
  }

  export interface Pullrequest {
    readonly id?: number
    readonly title?: string
    readonly repository?: {
      readonly slug?: string
      readonly owner?: {
        readonly username?: string
        readonly uuid?: string
      }
    }
    readonly author?: {
      readonly username?: string
      readonly uuid?: string
    }
  }




  export namespace requests {
    export type GetUserByName<T extends FetchTransform<{
      readonly username?: string
      readonly uuid?: string
    }, any> | null = null> = Fetch<{ path: "/2.0/users/{username}", params: { username: string } }, {
      readonly username?: string
      readonly uuid?: string
    }, unknown, T>
    export type GetRepositoriesByOwner<T extends FetchTransform<{
      readonly slug?: string
      readonly owner?: {
        readonly username?: string
        readonly uuid?: string
      }
    }[], any> | null = null> = Fetch<{ path: "/2.0/repositories/{username}", params: { username: string } }, {
      readonly slug?: string
      readonly owner?: {
        readonly username?: string
        readonly uuid?: string
      }
    }[], unknown, T>
    export type GetRepository<T extends FetchTransform<{
      readonly slug?: string
      readonly owner?: {
        readonly username?: string
        readonly uuid?: string
      }
    }, any> | null = null> = Fetch<{ path: "/2.0/repositories/{username}/{slug}", params: { username: string, slug: string } }, {
      readonly slug?: string
      readonly owner?: {
        readonly username?: string
        readonly uuid?: string
      }
    }, unknown, T>
    export type GetPullRequestsByRepository<T extends FetchTransform<{
      readonly id?: number
      readonly title?: string
      readonly repository?: {
        readonly slug?: string
        readonly owner?: {
          readonly username?: string
          readonly uuid?: string
        }
      }
      readonly author?: {
        readonly username?: string
        readonly uuid?: string
      }
    }[], any> | null = null> = Fetch<{
      path: "/2.0/repositories/{username}/{slug}/pullrequests", params: { username: string, slug: string }, queryParams: {
        state: "open" | "merged" | "declined" | undefined
      }
    }, {
      readonly id?: number
      readonly title?: string
      readonly repository?: {
        readonly slug?: string
        readonly owner?: {
          readonly username?: string
          readonly uuid?: string
        }
      }
      readonly author?: {
        readonly username?: string
        readonly uuid?: string
      }
    }[], unknown, T>
    export type GetPullRequestsById<T extends FetchTransform<{
      readonly id?: number
      readonly title?: string
      readonly repository?: {
        readonly slug?: string
        readonly owner?: {
          readonly username?: string
          readonly uuid?: string
        }
      }
      readonly author?: {
        readonly username?: string
        readonly uuid?: string
      }
    }, any> | null = null> = Fetch<{ path: "/2.0/repositories/{username}/{slug}/pullrequests/{pid}", params: { username: string, slug: string, pid: string } }, {
      readonly id?: number
      readonly title?: string
      readonly repository?: {
        readonly slug?: string
        readonly owner?: {
          readonly username?: string
          readonly uuid?: string
        }
      }
      readonly author?: {
        readonly username?: string
        readonly uuid?: string
      }
    }, unknown, T>
    export type MergePullRequest<T extends FetchTransform<void, any> | null = null> = FetchPost<{ path: "/2.0/repositories/{username}/{slug}/pullrequests/{pid}/merge", params: { username: string, slug: string, pid: string } }, null, void, unknown, T>
  }

}

export default linkExample
