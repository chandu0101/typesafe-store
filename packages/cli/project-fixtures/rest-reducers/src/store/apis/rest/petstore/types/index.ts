
         // this file is auto generated on 2020-04-23T21:57:01.974Z, don't modify it 
         import {FUrl,Fetch,FetchPost,FetchTransform}  from "@typesafe-store/store"

          namespace petstoreTypes {
             export interface Pet {
  readonly id: number
  readonly name: string
  readonly tag?: string
}

 export type Pets = {
  readonly id: number
  readonly name: string
  readonly tag?: string
}[]

export interface Error {
  readonly code: number
  readonly message: string
}

             
             
             
       export namespace requests {
          
                  export namespace listPets {
                     export type ListPetsBody = null
                     export type ListPetsResponse = {
  readonly id: number
  readonly name: string
  readonly tag?: string
}[]
                     export type ListPetsError = {
  readonly code: number
  readonly message: string
}
                     export type Request<T extends FetchTransform<ListPetsResponse, any> | null = null> = Fetch<{path:"http://petstore.swagger.io/v1/pets", queryParams:{ 
                       /**
   * How many items to return at one time (max 100)
   */
  limit:number  | undefined
                   }},ListPetsResponse,ListPetsError,T>
                  }
                

                  export namespace createPets {
                     export type CreatePetsBody = null
                     export type CreatePetsResponse = void
                     export type CreatePetsError = {
  readonly code: number
  readonly message: string
}
                     export type Request<T extends FetchTransform<CreatePetsResponse, any> | null = null> = FetchPost<{path:"http://petstore.swagger.io/v1/pets"},CreatePetsBody,CreatePetsResponse,CreatePetsError,T>
                  }
                

                  export namespace showPetById {
                     export type ShowPetByIdBody = null
                     export type ShowPetByIdResponse = {
  readonly id: number
  readonly name: string
  readonly tag?: string
}
                     export type ShowPetByIdError = {
  readonly code: number
  readonly message: string
}
                     export type Request<T extends FetchTransform<ShowPetByIdResponse, any> | null = null> = Fetch<{path:"http://petstore.swagger.io/v1/pets/{petId}",params:{ petId :string }},ShowPetByIdResponse,ShowPetByIdError,T>
                  }
                
       }
    
         }

         export default petstoreTypes
        