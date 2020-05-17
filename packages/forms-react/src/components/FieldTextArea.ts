
import React from 'react'
import { useField } from '../hooks/use-field';


type FieldTextAreaProps<T> = Omit<React.InputHTMLAttributes<HTMLTextAreaElement>, "name" | "onChange" | "onBlur" | "value"> & { name: keyof T, innerRef?: React.Ref<HTMLTextAreaElement> }

/**
 * 
 *  Standard web input element 
 */
export default function FieldTextArea<T>({ name, innerRef, ...other }: FieldTextAreaProps<T>) {
    const { field } = useField<any>(name)
    return React.createElement("textarea", { ...other, ref: innerRef, ...field })
}
