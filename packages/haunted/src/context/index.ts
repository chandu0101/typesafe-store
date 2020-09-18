
import { ReducerGroup, TypeSafeStore } from "@typesafe-store/store"
import { createContext } from "haunted"
export type TypeSafeStoreContextType<R extends Record<string, ReducerGroup<any, any, any, any>>> = TypeSafeStore<R>

export const TypeSafeStoreContext = createContext<TypeSafeStoreContextType<any>>(null as any)
