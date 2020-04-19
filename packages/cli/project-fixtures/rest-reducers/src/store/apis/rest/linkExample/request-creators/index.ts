
         import linkExample_types from "../types"
import {FetchVariants} from "@typesafe-store/store"

         class LinkExampleRequestCreators {
            
                   static  getUserByNameRequest(input: {pathParams: { username :string }, optimisticResponse ?: linkExample_types.User}) {
                         return {
                           type:FetchVariants.GET , url : {path:"/2.0/users/{username}",params:input.pathParams}
                              ,optimisticResponse:input.optimisticResponse
                         }
                     }
                

                   static  getRepositoriesByOwnerRequest(input: {pathParams: { username :string }, optimisticResponse ?: linkExample_types.Repository[]}) {
                         return {
                           type:FetchVariants.GET , url : {path:"/2.0/repositories/{username}",params:input.pathParams}
                              ,optimisticResponse:input.optimisticResponse
                         }
                     }
                

                   static  getRepositoryRequest(input: {pathParams: { username :string, slug :string }, optimisticResponse ?: linkExample_types.Repository}) {
                         return {
                           type:FetchVariants.GET , url : {path:"/2.0/repositories/{username}/{slug}",params:input.pathParams}
                              ,optimisticResponse:input.optimisticResponse
                         }
                     }
                

                   static  getPullRequestsByRepositoryRequest(input: {pathParams: { username :string, slug :string }, queryParams: { 
                       state:"open" | "merged" | "declined"  | undefined
                   }, optimisticResponse ?: linkExample_types.Pullrequest[]}) {
                         return {
                           type:FetchVariants.GET , url : {path:"/2.0/repositories/{username}/{slug}/pullrequests",params:input.pathParams, queryParams: input.queryParams}
                              ,optimisticResponse:input.optimisticResponse
                         }
                     }
                

                   static  getPullRequestsByIdRequest(input: {pathParams: { username :string, slug :string, pid :string }, optimisticResponse ?: linkExample_types.Pullrequest}) {
                         return {
                           type:FetchVariants.GET , url : {path:"/2.0/repositories/{username}/{slug}/pullrequests/{pid}",params:input.pathParams}
                              ,optimisticResponse:input.optimisticResponse
                         }
                     }
                

                   static  mergePullRequestRequest(input: {pathParams: { username :string, slug :string, pid :string }}) {
                         return {
                           type:FetchVariants.POST , url : {path:"/2.0/repositories/{username}/{slug}/pullrequests/{pid}/merge",params:input.pathParams}
                              
                         }
                     }
                
         }
        
         export default LinkExampleRequestCreators
        