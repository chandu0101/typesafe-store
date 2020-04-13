import { Fetch } from "@typesafe-store/store";


type Response = { name: string }

const tf = (inp: Response) => {
    return inp.name
}


class SampleReducer {

    d: Fetch<{ path: "w" }, Response, Error, typeof tf> = {}

}