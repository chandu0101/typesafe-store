
import React from "react"

import { TypeSafeStoreContext, } from "../context"
import { Dispatch, Action } from "@typesafe-store/store"

export default function useDispatch<A extends Action>(): Dispatch<A> {
    const context = React.useContext(TypeSafeStoreContext)
    return context.store.dispatch
}