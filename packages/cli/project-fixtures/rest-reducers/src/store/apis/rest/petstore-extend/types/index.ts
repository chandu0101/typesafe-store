
// this file is auto generated on 2020-04-19T20:28:33.943Z, don't modify it 
import { FUrl, Fetch, FetchPost, FetchDelete, FetchTransform } from "@typesafe-store/store"

namespace petstore_extend {
  export type Pet = {
    readonly name: string
    readonly tag?: string
  } & {
    readonly id: number
  }
  export interface NewPet {
    readonly name: string
    readonly tag?: string
  }

  export interface Error {
    readonly code: number
    readonly message: string
  }




  export namespace requests {
    export type FindPets<T extends FetchTransform<{
      readonly name: string
      readonly tag?: string
    } & {
      readonly id: number
    }[], any> | null = null> = Fetch<{
      path: "http://petstore.swagger.io/api/pets", queryParams: {
        /**
* tags to filter by
*/
        tags: string[] | undefined, /**
   * maximum number of results to return
   */
        limit: number | undefined
      }
    }, {
      readonly name: string
      readonly tag?: string
    } & {
      readonly id: number
    }[], {
      readonly code: number
      readonly message: string
    }, T>
    export type AddPet<T extends FetchTransform<{
      readonly name: string
      readonly tag?: string
    } & {
      readonly id: number
    }, any> | null = null> = FetchPost<{ path: "http://petstore.swagger.io/api/pets" }, {
      readonly name: string
      readonly tag?: string
    }, {
      readonly name: string
      readonly tag?: string
    } & {
      readonly id: number
    }, {
      readonly code: number
      readonly message: string
    }, T>
    export type FindPetById<T extends FetchTransform<{
      readonly name: string
      readonly tag?: string
    } & {
      readonly id: number
    }, any> | null = null> = Fetch<{ path: "http://petstore.swagger.io/api/pets/{id}", params: { id: number } }, {
      readonly name: string
      readonly tag?: string
    } & {
      readonly id: number
    }, {
      readonly code: number
      readonly message: string
    }, T>
    export type DeletePet<T extends FetchTransform<void, any> | null = null> = FetchDelete<{ path: "http://petstore.swagger.io/api/pets/{id}", params: { id: number } }, null, void, {
      readonly code: number
      readonly message: string
    }, T>
  }

}

export default petstore_extend
