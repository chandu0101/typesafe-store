import { Fetch, Transform } from "@typesafe-store/store";


export namespace myApi {
    type Response = { name: string }
    export type GetBooks<T extends Transform<Response, any> | null = null> = Fetch<{ path: "" }, Response, Error, T>
    export type GetBooks2 = Fetch<{ path: "" }, Response, Error>
}

export type GetBooks3 = Fetch<{ path: "" }, Response, Error>