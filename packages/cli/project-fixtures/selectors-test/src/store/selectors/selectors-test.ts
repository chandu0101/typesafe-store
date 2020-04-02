
import { createSelector } from "@typesafe-store/store"

export type State = { obj1: { name: string, values: string[] }, obj2: { text: { l: number } } }

const s = "35"

const s1 = createSelector((s: State) => {
    const o1 = s.obj1
    const o2 = s.obj2.text.l
    const n = o1.name
    const n1 = n.length
})

const s2 = createSelector(({ obj1, obj2 }: State) => {

})