
         // this file is auto generated on 2020-04-23T21:57:01.992Z, don't modify it 
         import {FUrl,Fetch,FetchPost,FetchDelete,FetchTransform}  from "@typesafe-store/store"

          namespace petstore_extendTypes {
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
          
                  export namespace findPets {
                     export type FindPetsBody = null
                     export type FindPetsResponse = {
  readonly name: string
  readonly tag?: string
} & {
  readonly id: number
}[]
                     export type FindPetsError = {
  readonly code: number
  readonly message: string
}
                     export type Request<T extends FetchTransform<FindPetsResponse, any> | null = null> = Fetch<{path:"http://petstore.swagger.io/api/pets", queryParams:{ 
                       /**
   * tags to filter by
   */
  tags:string[]  | undefined, /**
   * maximum number of results to return
   */
  limit:number  | undefined
                   }},FindPetsResponse,FindPetsError,T>
                  }
                

                  export namespace addPet {
                     export type AddPetBody = {
  readonly name: string
  readonly tag?: string
}
                     export type AddPetResponse = {
  readonly name: string
  readonly tag?: string
} & {
  readonly id: number
}
                     export type AddPetError = {
  readonly code: number
  readonly message: string
}
                     export type Request<T extends FetchTransform<AddPetResponse, any> | null = null> = FetchPost<{path:"http://petstore.swagger.io/api/pets"},AddPetBody,AddPetResponse,AddPetError,T>
                  }
                

                  export namespace findPetById {
                     export type FindPetByIdBody = null
                     export type FindPetByIdResponse = {
  readonly name: string
  readonly tag?: string
} & {
  readonly id: number
}
                     export type FindPetByIdError = {
  readonly code: number
  readonly message: string
}
                     export type Request<T extends FetchTransform<FindPetByIdResponse, any> | null = null> = Fetch<{path:"http://petstore.swagger.io/api/pets/{id}",params:{ id :number }},FindPetByIdResponse,FindPetByIdError,T>
                  }
                

                  export namespace deletePet {
                     export type DeletePetBody = null
                     export type DeletePetResponse = void
                     export type DeletePetError = {
  readonly code: number
  readonly message: string
}
                     export type Request<T extends FetchTransform<DeletePetResponse, any> | null = null> = FetchDelete<{path:"http://petstore.swagger.io/api/pets/{id}",params:{ id :number }},DeletePetBody,DeletePetResponse,DeletePetError,T>
                  }
                
       }
    
         }

         export default petstore_extendTypes
        