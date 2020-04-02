
import { createSelector } from "@typesafe-store/store"

export type State = {
    obj1: { name: string, values: string[] },
    obj2: {
        text: {
            l: number, l1: {
                one: { s: string },
            }, l2: { name: string }
        }
    }
}

const s = "36"

const s1 = createSelector((s: State) => {
    const o1 = s.obj1
    const o2 = s.obj2.text.l
    const o3 = s.obj2.text.l1.one
    const o4l2 = s.obj2.text.l2
    const l2n = o4l2.name
    const n = o1.name
    const n1 = n.length
    return "hello"
})

const s2 = createSelector(({ obj1, obj2 }: State) => {

})