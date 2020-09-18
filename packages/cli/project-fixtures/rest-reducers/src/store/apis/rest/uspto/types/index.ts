
         // this file is auto generated on 2020-04-23T21:57:01.999Z, don't modify it 
         import {FUrl,Fetch,FetchPost,FetchTransform}  from "@typesafe-store/store"

          namespace usptoTypes {
             export interface DataSetList {
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
}

             
             
             
       export namespace requests {
          
                  export namespace listDataSets {
                     export type ListDataSetsBody = null
                     export type ListDataSetsResponse = {
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
}
                     export type ListDataSetsError = unknown
                     export type Request<T extends FetchTransform<ListDataSetsResponse, any> | null = null> = Fetch<{path:"{scheme}://developer.uspto.gov/ds-api/"},ListDataSetsResponse,ListDataSetsError,T>
                  }
                

                  export namespace listSearchableFields {
                     export type ListSearchableFieldsBody = null
                     export type ListSearchableFieldsResponse = string
                     export type ListSearchableFieldsError = string
                     export type Request<T extends FetchTransform<ListSearchableFieldsResponse, any> | null = null> = Fetch<{path:"{scheme}://developer.uspto.gov/ds-api/{dataset}/{version}/fields",params:{ dataset :string, version :string }},ListSearchableFieldsResponse,ListSearchableFieldsError,T>
                  }
                

                  export namespace performSearch {
                     export type PerformSearchBody = null
                     export type PerformSearchResponse = {
 [key: string]: { [key:string]: any}
}[]
                     export type PerformSearchError = void
                     export type Request<T extends FetchTransform<PerformSearchResponse, any> | null = null> = FetchPost<{path:"{scheme}://developer.uspto.gov/ds-api/{dataset}/{version}/records",params:{ dataset :string, version :string }},PerformSearchBody,PerformSearchResponse,PerformSearchError,T>
                  }
                
       }
    
         }

         export default usptoTypes
        