



export type Selector<S, R> = { fn: (state: S) => R, dependencies: Record<string, string[]> }


export const createSelector = <S, R>(fn: (state: S) => R): Selector<S, R> => {
    throw new Error("I am a compile time function ")
}