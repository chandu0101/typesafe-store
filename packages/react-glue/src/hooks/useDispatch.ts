
import React from "react"

import { TypeSafeStoreContext } from "../context"

export default function useDispatch() {
    const context = React.useContext(TypeSafeStoreContext)
    return context.store.dispatch
}