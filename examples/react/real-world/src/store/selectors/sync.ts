import { createSelector } from "@typesafe-store/store"
import { AppState } from ".."



const countSeelctor = createSelector((state: AppState): number => state.sync.count)

export const dummy = ""