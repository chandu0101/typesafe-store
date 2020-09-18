// this file is auto generated on 2020-05-02T07:23:46.654Z, don't modify it
import { Selector } from "@typesafe-store/store";
import { createSelector } from "@typesafe-store/store";
import { AppState } from "../..";
import selectorTypes from "../types";
export const countSeelctor: Selector<AppState, number> = {
  fn: (state: AppState): number => state.sync.count,
  dependencies: { sync: ["count"] },
};
export const bookNameSelector: Selector<AppState, string> = {
  fn: (state: AppState): string => state.sync.book.name,
  dependencies: { sync: ["book.name"] },
};
export const factorialSelector: Selector<AppState, number> = {
  fn: (state: AppState): number => state.sync.factorial,
  dependencies: { sync: ["factorial"] },
};
export const factorialOffloadSelector: Selector<
  AppState,
  selectorTypes.sync.FactorialOffload
> = {
  fn: (state: AppState): selectorTypes.sync.FactorialOffload => {
    const foffload = state.sync.factorialOffload;
    const status = state.sync.calculateFactorialOffload;
    return { factorial: foffload, ...status };
  },
  dependencies: { sync: ["factorialOffload", "calculateFactorialOffload"] },
};
