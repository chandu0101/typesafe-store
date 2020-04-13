
// this file is auto generated on 2020-04-11T12:58:18.141Z, don't modify it
import { ReducerGroup, FetchVariants, PromiseData, FetchRequest } from "@typesafe-store/store"
import { Fetch } from "@typesafe-store/store";
type Response = {
  name: string;
};
const tf = (inp: Response) => {
  return inp.name;
};

export type SampleReducerState = { d: Fetch<{ path: "w" }, Response, Error, typeof tf> }

export type SampleReducerAction = { name: "no_sync_reducers", group: "SampleReducer" }

export type SampleReducerAsyncAction = { name: "d", group: "SampleReducer", fetch: FetchRequest<FetchVariants.GET, { path: "w"; }, null> }

export const SampleReducerGroup: ReducerGroup<SampleReducerState, SampleReducerAction, "SampleReducer", SampleReducerAsyncAction> = {
  r:
    (_trg_satate: SampleReducerState, action: SampleReducerAction) => {
      return _trg_satate;
    }
  , g: "SampleReducer", ds: { d: {} }, m: {
    async: undefined,
    f: { d: { response: "text", fn: tf } },
    p: undefined
  }
}



