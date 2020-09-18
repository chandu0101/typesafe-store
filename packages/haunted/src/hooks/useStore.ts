
import { useContext } from "haunted"
import { TypeSafeStoreContext } from "../context";



export default function useStore() {
    const context = useContext(TypeSafeStoreContext)
    return context;
}