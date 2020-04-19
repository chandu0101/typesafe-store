
         import uspto_types from "../types"
import {FetchVariants} from "@typesafe-store/store"

         class UsptoRequestCreators {
            
                   static  listDataSetsRequest(input: {optimisticResponse ?: {
  readonly total?: number
  readonly apis?: {
 /**
   * To be used as a dataset parameter value
   */
   readonly apiKey?: string
 /**
   * To be used as a version parameter value
   */
   readonly apiVersionNumber?: string
 /**
   * The URL describing the dataset's fields
   */
   readonly apiUrl?: string
 /**
   * A URL to the API console for each API
   */
   readonly apiDocumentationUrl?: string
}[]
}}) {
                         return {
                           type:FetchVariants.GET , url : {path:"{scheme}://developer.uspto.gov/ds-api/"}
                              ,optimisticResponse:input.optimisticResponse
                         }
                     }
                

                   static  listSearchableFieldsRequest(input: {pathParams: { dataset :string, version :string }, optimisticResponse ?: string}) {
                         return {
                           type:FetchVariants.GET , url : {path:"{scheme}://developer.uspto.gov/ds-api/{dataset}/{version}/fields",params:input.pathParams}
                              ,optimisticResponse:input.optimisticResponse
                         }
                     }
                

                   static  performSearchRequest(input: {pathParams: { dataset :string, version :string }, optimisticResponse ?: {
 [key: string]: { [key:string]: any}
}[]}) {
                         return {
                           type:FetchVariants.POST , url : {path:"{scheme}://developer.uspto.gov/ds-api/{dataset}/{version}/records",params:input.pathParams}
                              ,optimisticResponse:input.optimisticResponse
                         }
                     }
                
         }
        
         export default UsptoRequestCreators
        