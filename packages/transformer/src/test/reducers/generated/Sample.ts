
export type SampleState = { name: string, count: number, person: { name: string; age: number; }, books: Book[] }

export type SampleAction = { name: "changeName", group: "Sample", payload: string } | { name: "increment", group: "Sample" } | { name: "chnagePersonName", group: "Sample", payload: string } | { name: "changePersonAge", group: "Sample", payload: number } | { name: "addBooks", group: "Sample", payload: Book[] } | { name: "removeLastBook", group: "Sample" } | { name: "removeFirstBook", group: "Sample" } | { name: "replaceBooks", group: "Sample", payload: Book[] } | { name: "fillBookAt0", group: "Sample", payload: Book } | { name: "chnageNameAndCount", group: "Sample", payload: { name: string, count: number } }

export const SampleReducerGroup = {
    r:
        (state: SampleState, action: SampleAction) => {
            const t = action.name
            switch (t) {
                case "changeName": {
                    const name = (action as any).payload
                    let _tr_name = state.name
                    _tr_name = name
                    return { ...state, name: _tr_name }
                }
                case "increment": {
                    let _tr_count = state.count
                    _tr_count += 1
                    _tr_count += 1
                    return { ...state, count: _tr_count }
                }
                case "chnagePersonName": {
                    const name = (action as any).payload
                    let _tr_person = { ...state.person }
                    _tr_person.name = name
                    return { ...state, person: _tr_person }
                }
                case "changePersonAge": {
                    const age = (action as any).payload
                    let _tr_person = { ...state.person }
                    _tr_person.age = age
                    return { ...state, person: _tr_person }
                }
                case "addBooks": {
                    const books = (action as any).payload
                    let _tr_books = [...state.books]
                    _tr_books.push(...books)
                    return { ...state, books: _tr_books }
                }
                case "removeLastBook": {
                    let _tr_books = [...state.books]
                    _tr_books.pop()
                    return { ...state, books: _tr_books }
                }
                case "removeFirstBook": {
                    let _tr_books = [...state.books]
                    _tr_books.splice(0, 1)
                    return { ...state, books: _tr_books }
                }
                case "replaceBooks": {
                    const books = (action as any).payload
                    let _tr_books = state.books
                    _tr_books = books
                    return { ...state, books: _tr_books }
                }
                case "fillBookAt0": {
                    const book = (action as any).payload
                    let _tr_books = [...state.books]
                    _tr_books.fill(book, 0)
                    return { ...state, books: _tr_books }
                }
                case "chnageNameAndCount": {
                    const { name, count } = (action as any).payload
                    let _tr_person = { ...state.person }
                    let _tr_count = state.count
                    _tr_person.name = name
                    _tr_count = count
                    return { ...state, person: _tr_person, count: _tr_count }
                }
                default: return state;
            }
        }
    , g: "Sample", ds: { name: "First", count: 1, person: { name: "P12", age: 10 }, books: [] }
}


