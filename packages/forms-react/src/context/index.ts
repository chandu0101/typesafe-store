import React from 'react'
//@ts-ignore
import { TSFormOps } from "@typesafe-store/middleware-form"
import { TSForm } from "@typesafe-store/store"

export type TSFormContextType<T> = TSFormOps<T> & TSForm<T> & {
    handleBlur: (eOrFieldName: React.ChangeEvent<HTMLElement> | string) => void,
    onBlur: (eOrFieldName: React.FocusEvent<HTMLElement> | string) => void,
    handleSubmit: (e: React.FormEvent<HTMLElement>) => Promise<void>
}


export const TSFormContext = React.createContext<TSFormContextType<any>>(null as any)