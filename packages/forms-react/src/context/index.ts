import React from 'react'
//@ts-ignore
import { TSFormOps } from "@typesafe-store/middleware-form"
import { TSForm } from "@typesafe-store/store"

export type TSFormContextType<T> = TSFormOps<T> & TSForm<T> & {
    handleChange: (eOrFieldName: React.ChangeEvent<any> | string) => void | ((eOrFieldName: React.ChangeEvent<any> | string) => void),
    handleBlur: (eOrFieldName: React.FocusEvent<any> | string) => void | ((e: any) => void),
    handleSubmit: (e?: React.FormEvent<any>) => Promise<void>,
    handleReset: (e?: React.FormEvent<any>) => Promise<void>,

}




export const TSFormContext = React.createContext<TSFormContextType<any>>(null as any)