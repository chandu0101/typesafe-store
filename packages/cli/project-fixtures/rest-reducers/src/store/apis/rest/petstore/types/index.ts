
         // this file is auto generated on 2020-04-19T20:28:33.961Z, don't modify it 
         import {FUrl,Fetch,FetchPost,Transform}  from "@typesafe-store/store"

          namespace petstore {
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
          export type ListPets<T extends Transform<{
  readonly id: number
  readonly name: string
  readonly tag?: string
}[], any> | null = null> = Fetch<{path:"http://petstore.swagger.io/v1/pets", queryParams:{ 
                       /**
   * How many items to return at one time (max 100)
   */
  limit:number  | undefined
                   }},{
  readonly id: number
  readonly name: string
  readonly tag?: string
}[],{
  readonly code: number
  readonly message: string
},T>
export type CreatePets<T extends Transform<void, any> | null = null> = FetchPost<{path:"http://petstore.swagger.io/v1/pets"},null,void,{
  readonly code: number
  readonly message: string
},T>
export type ShowPetById<T extends Transform<{
  readonly id: number
  readonly name: string
  readonly tag?: string
}, any> | null = null> = Fetch<{path:"http://petstore.swagger.io/v1/pets/{petId}",params:{ petId :string }},{
  readonly id: number
  readonly name: string
  readonly tag?: string
},{
  readonly code: number
  readonly message: string
},T>
       }
    
         }

         export default petstore
        