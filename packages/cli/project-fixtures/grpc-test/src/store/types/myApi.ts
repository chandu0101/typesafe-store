import { Transform, Fetch, FetchPut } from "@typesafe-store/store"



namespace myAPi {
    export type Book = { name: string, id: string, n1?: string, n2: string | undefined, n3: string | null }
    export type GetBooks<T extends Transform<Book[], any> | null = null> = Fetch<{ path: "" }, Book[], Error, T>
    export type UpdateBook<T extends Transform<Book, any> | null = null> = FetchPut<{ path: "" }, null, Book, Error, T>
}

export default myAPi