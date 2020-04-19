
         // this file is auto generated on 2020-04-19T12:45:34.001Z, don't modify it 
         import {FUrl,Fetch,FetchPost,FetchDelete,Transform}  from "@typesafe-store/store"

          namespace petstore_extend {
              export type Pet = NewPet & {
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

             
             
             export type FindPets<T extends Transform<Pet[], any> | null = null> = Fetch<{path:"http://petstore.swagger.io/api/pets", queryParams:{ 
                       /**
   * tags to filter by
   */
  tags:string[]  | undefined, /**
   * maximum number of results to return
   */
  limit:number  | undefined
                   }},Pet[],Error,T>

export type AddPet<T extends Transform<Pet, any> | null = null> = FetchPost<{path:"http://petstore.swagger.io/api/pets"},NewPet,Pet,Error,T>

export type FindPetById<T extends Transform<Pet, any> | null = null> = Fetch<{path:"http://petstore.swagger.io/api/pets/{id}",params:{ id :number }},Pet,Error,T>

export type DeletePet<T extends Transform<void, any> | null = null> = FetchDelete<{path:"http://petstore.swagger.io/api/pets/{id}",params:{ id :number }},null,void,Error,T>


         }

         export default petstore_extend
        