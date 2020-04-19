
         // this file is auto generated on 2020-04-19T12:45:33.998Z, don't modify it 
         import {FUrl,Fetch,FetchPost,Transform}  from "@typesafe-store/store"

          namespace petstore {
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

             
             
             export type ListPets<T extends Transform<Pets, any> | null = null> = Fetch<{path:"http://petstore.swagger.io/v1/pets", queryParams:{ 
                       /**
   * How many items to return at one time (max 100)
   */
  limit:number  | undefined
                   }},Pets,Error,T>

export type CreatePets<T extends Transform<void, any> | null = null> = FetchPost<{path:"http://petstore.swagger.io/v1/pets"},null,void,Error,T>

export type ShowPetById<T extends Transform<Pet, any> | null = null> = Fetch<{path:"http://petstore.swagger.io/v1/pets/{petId}",params:{ petId :string }},Pet,Error,T>


         }

         export default petstore
        