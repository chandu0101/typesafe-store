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
        expect(prevState).not.toBe(state)
        expect(state.count).toBe(0)
        expect(state.name).toBe(NEW_NAME)
        expect(prevState.person).toBe(state.person)
    })

    test('should increment count', () => {
        const prevState = state
        state = reducer(state, {
            name: "increment",
            group: "Sample"
        })
        expect(prevState).not.toBe(state)
        expect(state.count).toBe(2)
        expect(prevState.person).toBe(state.person)
        expect(state.name).toBe(NEW_NAME)
    })

    test('should modify person', () => {
        const prevState = state
        state = reducer(state, { name: "chnagePersonName", group: "Sample", payload: "P1C" })
        expect(prevState).not.toBe(state)
        expect(state.count).toBe(2)
        expect(state.name).toBe(NEW_NAME)
        expect(state.person).not.toBe(prevState.person)
        expect(state.person.name).toBe("P1C")
        expect(state.person.age).toBe(10)
        state = reducer(state, { name: "changePersonAge", group: "Sample", payload: 20 })
        expect(state.person.name).toBe("P1C")
        expect(state.person.age).toBe(20)
    })




})

