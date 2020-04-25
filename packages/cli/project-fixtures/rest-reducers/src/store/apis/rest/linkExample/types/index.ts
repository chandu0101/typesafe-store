
         // this file is auto generated on 2020-04-23T21:57:02.012Z, don't modify it 
         import {FUrl,Fetch,FetchPost,FetchTransform}  from "@typesafe-store/store"

          namespace linkExampleTypes {
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
          
                  export namespace getUserByName {
                     export type GetUserByNameBody = null
                     export type GetUserByNameResponse = {
  readonly username?: string
  readonly uuid?: string
}
                     export type GetUserByNameError = unknown
                     export type Request<T extends FetchTransform<GetUserByNameResponse, any> | null = null> = Fetch<{path:"/2.0/users/{username}",params:{ username :string }},GetUserByNameResponse,GetUserByNameError,T>
                  }
                

                  export namespace getRepositoriesByOwner {
                     export type GetRepositoriesByOwnerBody = null
                     export type GetRepositoriesByOwnerResponse = {
  readonly slug?: string
  readonly owner?: {
  readonly username?: string
  readonly uuid?: string
}
}[]
                     export type GetRepositoriesByOwnerError = unknown
                     export type Request<T extends FetchTransform<GetRepositoriesByOwnerResponse, any> | null = null> = Fetch<{path:"/2.0/repositories/{username}",params:{ username :string }},GetRepositoriesByOwnerResponse,GetRepositoriesByOwnerError,T>
                  }
                

                  export namespace getRepository {
                     export type GetRepositoryBody = null
                     export type GetRepositoryResponse = {
  readonly slug?: string
  readonly owner?: {
  readonly username?: string
  readonly uuid?: string
}
}
                     export type GetRepositoryError = unknown
                     export type Request<T extends FetchTransform<GetRepositoryResponse, any> | null = null> = Fetch<{path:"/2.0/repositories/{username}/{slug}",params:{ username :string, slug :string }},GetRepositoryResponse,GetRepositoryError,T>
                  }
                

                  export namespace getPullRequestsByRepository {
                     export type GetPullRequestsByRepositoryBody = null
                     export type GetPullRequestsByRepositoryResponse = {
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
}[]
                     export type GetPullRequestsByRepositoryError = unknown
                     export type Request<T extends FetchTransform<GetPullRequestsByRepositoryResponse, any> | null = null> = Fetch<{path:"/2.0/repositories/{username}/{slug}/pullrequests",params:{ username :string, slug :string }, queryParams:{ 
                       state:"open" | "merged" | "declined"  | undefined
                   }},GetPullRequestsByRepositoryResponse,GetPullRequestsByRepositoryError,T>
                  }
                

                  export namespace getPullRequestsById {
                     export type GetPullRequestsByIdBody = null
                     export type GetPullRequestsByIdResponse = {
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
                     export type GetPullRequestsByIdError = unknown
                     export type Request<T extends FetchTransform<GetPullRequestsByIdResponse, any> | null = null> = Fetch<{path:"/2.0/repositories/{username}/{slug}/pullrequests/{pid}",params:{ username :string, slug :string, pid :string }},GetPullRequestsByIdResponse,GetPullRequestsByIdError,T>
                  }
                

                  export namespace mergePullRequest {
                     export type MergePullRequestBody = null
                     export type MergePullRequestResponse = void
                     export type MergePullRequestError = unknown
                     export type Request<T extends FetchTransform<MergePullRequestResponse, any> | null = null> = FetchPost<{path:"/2.0/repositories/{username}/{slug}/pullrequests/{pid}/merge",params:{ username :string, slug :string, pid :string }},MergePullRequestBody,MergePullRequestResponse,MergePullRequestError,T>
                  }
                
       }
    
         }

         export default linkExampleTypes
        