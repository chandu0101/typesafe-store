
import React from 'react'
import { useField } from '../hooks/use-field';


type FieldIProps<T> = Omit<React.InputHTMLAttributes<HTMLInputElement>, "name" | "onChange" | "onBlur" | "value"> & { name: keyof T, innerRef?: React.Ref<HTMLInputElement> }

/**
 * 
 *  Standard web input element 
 */
export default function FieldI<T>({ name, innerRef, ...other }: FieldIProps<T>) {
    const { field } = useField<any>(name)
    return React.createElement("input", { ...other, ref: innerRef, ...field })
}




