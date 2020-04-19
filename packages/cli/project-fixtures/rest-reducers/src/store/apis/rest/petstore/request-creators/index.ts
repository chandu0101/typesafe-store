
         import petstore_types from "../types"
import {FetchVariants} from "@typesafe-store/store"

         class PetstoreRequestCreators {
            
                   static  listPetsRequest(input: {queryParams: { 
                       /**
   * How many items to return at one time (max 100)
   */
  limit:number  | undefined
                   }, optimisticResponse ?: petstore_types.Pets}) {
                         return {
                           type:FetchVariants.GET , url : {path:"http://petstore.swagger.io/v1/pets", queryParams: input.queryParams}
                              ,optimisticResponse:input.optimisticResponse
                         }
                     }
                

                   static  createPetsRequest() {
                         return {
                           type:FetchVariants.POST , url : {path:"http://petstore.swagger.io/v1/pets"}
                              
                         }
                     }
                

                   static  showPetByIdRequest(input: {pathParams: { petId :string }, optimisticResponse ?: petstore_types.Pet}) {
                         return {
                           type:FetchVariants.GET , url : {path:"http://petstore.swagger.io/v1/pets/{petId}",params:input.pathParams}
                              ,optimisticResponse:input.optimisticResponse
                         }
                     }
                
         }
        
         export default PetstoreRequestCreators
        