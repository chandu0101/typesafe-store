import React from 'react'
import { UseFieldType, useField } from '../hooks/use-field'


export type FieldProps<T> = { name: keyof T, children: (input: UseFieldType) => React.ReactElement }
export default function Field<T>({ name, children }: FieldProps<T>) {
    const uf = useField<any>(name)
    return children(uf)
}