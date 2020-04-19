
         // this file is auto generated on 2020-04-19T12:45:34.002Z, don't modify it 
         import {FUrl,Fetch,FetchPost,Transform}  from "@typesafe-store/store"

          namespace linkExample {
             export interface User {
  readonly username?: string
  readonly uuid?: string
}

export interface Repository {
  readonly slug?: string
  readonly owner?: User
}

export interface Pullrequest {
  readonly id?: number
  readonly title?: string
  readonly repository?: Repository
  readonly author?: User
}

             
             
             export type GetUserByName<T extends Transform<User, any> | null = null> = Fetch<{path:"/2.0/users/{username}",params:{ username :string }},User,unknown,T>

export type GetRepositoriesByOwner<T extends Transform<Repository[], any> | null = null> = Fetch<{path:"/2.0/repositories/{username}",params:{ username :string }},Repository[],unknown,T>

export type GetRepository<T extends Transform<Repository, any> | null = null> = Fetch<{path:"/2.0/repositories/{username}/{slug}",params:{ username :string, slug :string }},Repository,unknown,T>

export type GetPullRequestsByRepository<T extends Transform<Pullrequest[], any> | null = null> = Fetch<{path:"/2.0/repositories/{username}/{slug}/pullrequests",params:{ username :string, slug :string }, queryParams:{ 
                       state:"open" | "merged" | "declined"  | undefined
                   }},Pullrequest[],unknown,T>

export type GetPullRequestsById<T extends Transform<Pullrequest, any> | null = null> = Fetch<{path:"/2.0/repositories/{username}/{slug}/pullrequests/{pid}",params:{ username :string, slug :string, pid :string }},Pullrequest,unknown,T>

export type MergePullRequest<T extends Transform<void, any> | null = null> = FetchPost<{path:"/2.0/repositories/{username}/{slug}/pullrequests/{pid}/merge",params:{ username :string, slug :string, pid :string }},null,void,unknown,T>


         }

         export default linkExample
        