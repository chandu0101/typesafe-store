
import React from "react"
import { ReducerGroup, TypeSafeStore } from "@typesafe-store/store"

export type TypeSafeStoreContextType<R extends Record<string, ReducerGroup<any, any, any, any>>> = MutableSource<TypeSafeStore<R>>

export const TypeSafeStoreContext = React.createContext<TypeSafeStoreContextType<any>>(null as any)
