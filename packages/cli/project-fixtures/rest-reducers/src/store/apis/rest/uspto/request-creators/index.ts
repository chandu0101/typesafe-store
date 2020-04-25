
         import usptoTypes from "../types"
import {FetchVariants} from "@typesafe-store/store"

         class UsptoRequestCreators {
            
                   static  listDataSetsRequest(input: {optimisticResponse ?: usptoTypes.requests.listDataSets.ListDataSetsResponse}) {
                         return {
                           type:FetchVariants.GET , url : {path:"{scheme}://developer.uspto.gov/ds-api/"}
                              ,optimisticResponse:input.optimisticResponse
                         }
                     }
                

                   static  listSearchableFieldsRequest(input: {pathParams: { dataset :string, version :string }, optimisticResponse ?: usptoTypes.requests.listSearchableFields.ListSearchableFieldsResponse}) {
                         return {
                           type:FetchVariants.GET , url : {path:"{scheme}://developer.uspto.gov/ds-api/{dataset}/{version}/fields",params:input.pathParams}
                              ,optimisticResponse:input.optimisticResponse
                         }
                     }
                

                   static  performSearchRequest(input: {pathParams: { dataset :string, version :string }, optimisticResponse ?: usptoTypes.requests.performSearch.PerformSearchResponse}) {
                         return {
                           type:FetchVariants.POST , url : {path:"{scheme}://developer.uspto.gov/ds-api/{dataset}/{version}/records",params:input.pathParams}
                              ,optimisticResponse:input.optimisticResponse
                         }
                     }
                
         }
        
         export default UsptoRequestCreators
        