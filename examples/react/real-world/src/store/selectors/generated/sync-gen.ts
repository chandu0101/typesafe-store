
           // this file is auto generated on 2020-04-25T13:05:45.528Z, don't modify it
           import {Selector,SelectorE} from "@typesafe-store/store"
           import { createSelector } from "@typesafe-store/store"
import { AppState } from "../.."
export const countSeelctor:Selector<AppState,number> = {fn:(state: AppState): number => state.sync.count,dependencies:{"sync":["count"]}}
export const dummy = "";

          