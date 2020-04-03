
import * as React from "react"
import { TypeSafeStoreContext } from "../context";



export default function useStore() {
    const context = React.useContext(TypeSafeStoreContext)
    return context.store;
}