



export type Selector<S, E, R> = { fn: (state: S, ext?: E) => R, dependencies: Record<string, string[]> }


export const createSelector = <S, E, R>(fn: (state: S, ext?: E) => R): Selector<S, E, R> => {
    throw new Error("I am a compile time function ")
}