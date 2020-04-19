import { Offload } from "@typesafe-store/store"
import { myApi, GetBooks3 } from "../types"


class SampleReducer {

    book: { name: string, } = { name: "react" }
    config: {
        one: { a: string },
        two: { b: string }
    } = {} as any

    fData: myApi.GetBooks = {}
    fData2: myApi.GetBooks2 = {}
    fData3: GetBooks3 = {}
    book2: { b1: { name: string } } = {} as any

    changeBookName(name: string): Offload {
        new Array(10000000).fill(undefined).forEach((v, i) => {
            if (this.book.name.length > i) {
                const r = Math.random()
            }
        })
        this.book.name = name
        this.config.one.a = "1"
        this.config.two.b = ""
        this.book2.b1.name = "2"
    }
}
