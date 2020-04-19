
         import petstore_extend_types from "../types"
import {FetchVariants} from "@typesafe-store/store"

         class PetstoreExtendRequestCreators {
            
                   static  findPetsRequest(input: {queryParams: { 
                       /**
   * tags to filter by
   */
  tags:string[]  | undefined, /**
   * maximum number of results to return
   */
  limit:number  | undefined
                   }, optimisticResponse ?: {
  readonly name: string
  readonly tag?: string
} & {
  readonly id: number
}[]}) {
                         return {
                           type:FetchVariants.GET , url : {path:"http://petstore.swagger.io/api/pets", queryParams: input.queryParams}
                              ,optimisticResponse:input.optimisticResponse
                         }
                     }
                

                   static  addPetRequest(input: {body: {
  readonly name: string
  readonly tag?: string
}, optimisticResponse ?: {
  readonly name: string
  readonly tag?: string
} & {
  readonly id: number
}}) {
                         return {
                           type:FetchVariants.POST , url : {path:"http://petstore.swagger.io/api/pets"}
                             , body: input.body ,optimisticResponse:input.optimisticResponse
                         }
                     }
                

                   static  findPetByIdRequest(input: {pathParams: { id :number }, optimisticResponse ?: {
  readonly name: string
  readonly tag?: string
} & {
  readonly id: number
}}) {
                         return {
                           type:FetchVariants.GET , url : {path:"http://petstore.swagger.io/api/pets/{id}",params:input.pathParams}
                              ,optimisticResponse:input.optimisticResponse
                         }
                     }
                

                   static  deletePetRequest(input: {pathParams: { id :number }}) {
                         return {
                           type:FetchVariants.DELETE , url : {path:"http://petstore.swagger.io/api/pets/{id}",params:input.pathParams}
                              
                         }
                     }
                
         }
        
         export default PetstoreExtendRequestCreators
        