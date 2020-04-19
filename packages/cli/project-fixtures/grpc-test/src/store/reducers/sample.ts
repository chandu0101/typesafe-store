import { Transform, Fetch, PrependToList, FetchVariants } from "@typesafe-store/store";
import { Many } from "lodash";
import myAPi from "../types/myApi";
import { Sample2 } from "./f1/sample2";


const bookT = (bks: myAPi.Book[]): string[] => {
    return bks.map(b => b.name)
}

const bt = (b: myAPi.Book): myAPi.Book => {
    return { ...b }
}

const s = "22"
class SampleReducer {

    books: myAPi.GetBooks = {}
    updateBook: myAPi.UpdateBook<typeof bt> & PrependToList<SampleReducer2["books"]> = {}
    updateBook2: myAPi.UpdateBook<typeof bt> & PrependToList<Sample2["list2"]> = {}
    books2: myAPi.GetBooks<typeof bookT> = {}
}

class SampleReducer2 {
    books: myAPi.Book[] = []
}

function name(input: NonNullable<myAPi.GetBooks["_fmeta"]>["url"]) {

}
