
import React from "react"
//@ts-ignore
import { ReducerGroup, TypeSafeStore } from "@typesafe-store/store"
import { Subscription } from "../subscription"

export type TypeSafeStoreContextType<R extends Record<string, ReducerGroup<any, any, any, any>>> = { store: TypeSafeStore<R>, subscription: Subscription<R> }

export const TypeSafeStoreContext = React.createContext<TypeSafeStoreContextType<any>>(null as any)
