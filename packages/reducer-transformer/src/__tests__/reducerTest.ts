import { getReducer } from "../index"

class Sample {
    name = "First"
    count = 0;
    person = { name: "P1", age: 10 }

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
}

const shallowCompareExcept = (obj1: any, obj2: any, exceptFields: string[]): boolean => {
    if (obj1 === obj2) {
        return false;
    }
    for (const key in obj1) {
        const excluded = exceptFields.includes(key)
        if (!excluded && obj1[key] !== obj2[key]) {
            return false;
        } else if (excluded && obj1[key] === obj2[key]) {
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
        expect(state).toStrictEqual({
            name: "First", count: 0,
            person: { name: "P1", age: 10 }
        })
    })

    const NEW_NAME = "New Name"

    test('should change name', () => {
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

    test('should modify person', () => {
        const prevState = state
        state = reducer(state, { name: "chnagePersonName", group: "Sample", payload: "P1C" })
        expect(shallowCompareExcept(prevState, state, ["person"])).toBeTruthy()
        expect(state.person.name).toBe("P1C")
        state = reducer(state, { name: "changePersonAge", group: "Sample", payload: 20 })
        expect(shallowCompareExcept(prevState, state, ["person"])).toBeTruthy()
        expect(state.person.name).toBe("P1C")
        expect(state.person.age).toBe(20)
    })




})

