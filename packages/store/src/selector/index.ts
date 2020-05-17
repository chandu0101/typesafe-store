


// export type SelectorDepenacyValue = (string | Record<string, Record<string, SelectorDepenacyValue>>)[]

export type Selector<S, R> = {
    fn: (state: S) => R,
    dependencies: Record<string, string[]>
}


export function createSelector<S, R>(fn: (state: S) => R): Selector<S, R> {
    throw new Error("I am a compile time function")
}

