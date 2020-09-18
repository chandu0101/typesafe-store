

import { createSelector } from "@typesafe-store/store"
import { AppState } from ".."



const s1 = createSelector((state: AppState) => {
    const todos = state.todos
    const vf = todos.list
    return state.todos.visibility_filter
})