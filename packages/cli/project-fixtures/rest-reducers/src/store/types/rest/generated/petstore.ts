
         // this file is auto generated on 2020-04-11T12:58:03.126Z, don't modify it 
         import {FUrl,Fetch,FetchPost}  from "@typesafe-store/store"

         export namespace petstore {
             export interface Pet {
  readonly id: number
  readonly name: string
  readonly tag?: string
}

 export type Pets = Pet[]

export interface Error {
  readonly code: number
  readonly message: string
}

             
             
             export type ListPets = Fetch<{path:"http://petstore.swagger.io/v1/pets", queryParams:{ 
                       /**
   * How many items to return at one time (max 100)
   */
  limit:number  | undefined
                   }},Pets,Error>

export type CreatePets = FetchPost<{path:"http://petstore.swagger.io/v1/pets"},null,void,Error>

export type ShowPetById = Fetch<{path:"http://petstore.swagger.io/v1/pets/{petId}",params:{ petId :string }},Pet,Error>


         }
        