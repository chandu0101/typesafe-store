



export type Seelctor<S, R> = { fn: (state: S) => R, depencies: Record<string, string[]> }


export const createSelector = <S, R>(fn: (state: S) => R): Seelctor<S, R> => {
    throw new Error("I am a compile time function ")
}