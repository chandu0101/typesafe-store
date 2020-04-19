import { Fetch, FetchPost, FetchBody, Transform } from "../fetch";




export type GRPCSerializer<I> = (input: I) => Uint8Array

export type GRPCDeSerializer<O> = (input: Uint8Array) => O

export type GRPCUnary<U extends string, I extends FetchBody, O,
    S extends GRPCSerializer<I>,
    DS extends GRPCDeSerializer<O>, T extends Transform<O, any>> = FetchPost<{ path: U }, I, O, Error, T>

export type GRPCResponseStream<U extends string, I extends FetchBody, O,
    S extends GRPCSerializer<I>,
    DS extends GRPCDeSerializer<O>, T extends Transform<O, any>> = FetchPost<{ path: U }, I, O, Error, T>