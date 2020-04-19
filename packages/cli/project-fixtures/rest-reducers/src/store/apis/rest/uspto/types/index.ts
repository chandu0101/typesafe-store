
// this file is auto generated on 2020-04-19T20:28:33.927Z, don't modify it 
import { FUrl, Fetch, FetchPost, Transform } from "@typesafe-store/store"

namespace uspto {
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
    export type ListDataSets<T extends Transform<{
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
    }, any> | null = null> = Fetch<{ path: "{scheme}://developer.uspto.gov/ds-api/" }, {
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
    }, unknown, T>
    export type ListSearchableFields<T extends Transform<string, any> | null = null> = Fetch<{ path: "{scheme}://developer.uspto.gov/ds-api/{dataset}/{version}/fields", params: { dataset: string, version: string } }, string, string, T>
    export type PerformSearch<T extends Transform<{
      [key: string]: { [key: string]: any }
    }[], any> | null = null> = FetchPost<{ path: "{scheme}://developer.uspto.gov/ds-api/{dataset}/{version}/records", params: { dataset: string, version: string } }, null, {
      [key: string]: { [key: string]: any }
    }[], void, T>
  }

}

export default uspto
