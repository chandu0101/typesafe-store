import { getReducer } from "../index"
import { GetActionTypes, NonFunctionProperties } from "@typesafe-store/reducer";
import { processThisStatement } from "../helpers";
import * as ts from "typescript";

class Sample {
    name = "First"
    count = 0;
    person = { name: "P1", age: 10 }

    books: { name: string, year: number }[] = []

    changeName(name: string) {
        this.name = name
    }
    increment() {
        this.count++
        this.count++
    }
    chnagePersonName(name: string) {
        this.person.name = name
    }
    changePersonAge(age: number) {
        this.person.age = age
    }
    //     addBook(book: Sample["books"][0]) {
    //         this.books.push(book)
    //     }

}


const shallowCompareExcept = (obj1: any, obj2: any, exceptFields: string[]): boolean => {
    if (obj1 === obj2) {
        console.log("Shallow COmapre objst");
        return false;
    }
    for (const key in obj1) {
        const excluded = exceptFields.includes(key)
        if (!excluded && obj1[key] !== obj2[key]) {
            console.log("Shallow COmapre failing on : ", excluded, obj1[key], obj2[key]);
            return false;
        } else if (excluded && obj1[key] === obj2[key]) {
            console.log("Shallow COmapre failing on : ", excluded, obj1[key], obj2[key]);
            return false
        }
    }

    return true
}

describe("shallowCompareExcept", () => {

    test('should return false on same objects', () => {
        const a = { name: "hello" }
        const b = a;
        expect(shallowCompareExcept(a, b, [])).toBeFalsy()
    })

    test("should return true", () => {
        const a = { name: "hello", p: { 1: 2 }, p2: { 3: 1 } }
        const b = { ...a, p: { 2: 3 } };
        expect(shallowCompareExcept(a, b, ["p"])).toBeTruthy()
        const c = { ...a }
        expect(shallowCompareExcept(a, c, [])).toBeTruthy()
    })

    test('should false', () => {
        const a = { name: "hello", p: { 1: 2 }, p2: { 3: 1 } }
        const b = { ...a, p: a.p };
        expect(shallowCompareExcept(a, b, ["p"])).toBeFalsy()
        const c = { ...a, p: {} }
        expect(shallowCompareExcept(a, c, [])).toBeFalsy()
    })


})

describe("Reducer ", () => {
    const reducer = getReducer<Sample, "Sample">()

    test('should generate reducer function', () => {
        expect(reducer).not.toBeNull()
    })
    let state = reducer(undefined, {} as any)
    test('should return default state', () => {
        expect(state).toEqual(new Sample)
    })


    test('should change name', () => {
        const NEW_NAME = "New Name"

        const prevState = state
        state = reducer(state, {
            name: "changeName",
            group: "Sample", payload: NEW_NAME
        })
        expect(shallowCompareExcept(prevState, state, ["name"])).toBeTruthy()
        expect(state.name).toBe(NEW_NAME)

    })

    test('should increment count', () => {
        const prevState = state
        state = reducer(state, {
            name: "increment",
            group: "Sample"
        })
        expect(shallowCompareExcept(prevState, state, ["count"])).toBeTruthy()
        expect(state.count).toBe(2)

    })

    test.only('should modify person', () => {
        let prevState = state
        console.log("Prev state2 : ", prevState);

        state = reducer(state, { name: "chnagePersonName", group: "Sample", payload: "P12C" })
        console.log("State: ", state);
        expect(shallowCompareExcept(prevState, state, ["person"])).toBeTruthy()
        expect(state.person.name).toBe("P1C")
        prevState = state
        state = reducer(state, { name: "changePersonAge", group: "Sample", payload: 20 })
        expect(shallowCompareExcept(prevState, state, ["person"])).toBeTruthy()
        expect(state.person.name).toBe("P1C")
        expect(state.person.age).toBe(20)
    })

    // test("should push to array", () => {
    //     let prevState = state
    //     state = reducer(state, {
    //         name: "addBook", group: "Sample",
    //         payload: { name: "", year: 3 }
    //     })
    //     console.log("Books", state.books);
    //     expect(shallowCompareExcept(prevState, state, ["books"])).toBeTruthy()
    // })


})


describe("play", () => {


    test('should Generate Prop Access', () => {
        const s = processThisStatement(ts.createPropertyAccessChain(
            ts.createPropertyAccessChain(
                ts.createPropertyAccessChain(
                    ts.createPropertyAccess(
                        ts.createThis(),
                        ts.createIdentifier("x")
                    ),
                    ts.createToken(ts.SyntaxKind.QuestionDotToken),
                    ts.createIdentifier("b")
                ),
                undefined,
                ts.createIdentifier("c")
            ),
            undefined,
            ts.createIdentifier("d")
        ))
        // const s = processThisStatement(ts.createPropertyAccess(
        //     ts.createPropertyAccess(
        //         ts.createPropertyAccess(
        //             ts.createPropertyAccess(
        //                 ts.createThis(),
        //                 ts.createIdentifier("x")
        //             ),
        //             ts.createIdentifier("b")
        //         ),
        //         ts.createIdentifier("c")
        //     ),
        //     ts.createIdentifier("d")
        // ))
        console.log("s : ", s);
        // expect(JSON.stringify(s)).toBe("")

    })

})