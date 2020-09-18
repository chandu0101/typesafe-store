import { createSelector } from "@typesafe-store/store"
import { AppState } from ".."
import selectorTypes from "./types"



const countSeelctor = createSelector((state: AppState): number => state.sync.count)

const bookNameSelector = createSelector((state: AppState): string => state.sync.book.name)

const factorialSelector = createSelector((state: AppState): number => state.sync.factorial)


const factorialOffloadSelector = createSelector((state: AppState): selectorTypes.sync.FactorialOffload => {
    const foffload = state.sync.factorialOffload
    const status = state.sync.calculateFactorialOffload
    return { factorial: foffload, ...status }
})