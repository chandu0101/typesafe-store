import { useContext } from "react";
import { TSFormContext, TSFormContextType } from "../context";



export default function useTSFormContext<T>(): TSFormContextType<T> {
    const context = useContext(TSFormContext)
    return context
}