import { HttpPost, HttpBody, HttpTransform } from "../http";

export type GRPCSerializer<I> = (input: I) => Uint8Array;

export type GRPCDeSerializer<O> = (input: Uint8Array) => O;

export type GRPCUnary<
  U extends string,
  I extends HttpBody,
  O,
  S extends GRPCSerializer<I>,
  DS extends GRPCDeSerializer<O>,
  T extends HttpTransform<O, any> | null
> = HttpPost<{ path: U }, I, O, Error, T>;

export type GRPCResponseStream<
  U extends string,
  I extends HttpBody,
  O,
  S extends GRPCSerializer<I>,
  DS extends GRPCDeSerializer<O>,
  T extends HttpTransform<O, any> | null
> = HttpPost<{ path: U }, I, O, Error, T>;
