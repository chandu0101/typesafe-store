import React from 'react'
import { useField } from '../hooks/use-field'

type ErrorMessageProps<T> = { name: keyof T, component: any }

export default function ErrorMessage<T>({ name, component }: ErrorMessageProps<T>) {
    const { meta } = useField<any>(name)
    return meta.touched && meta.error ? React.createElement(component, {}, meta.error) : null
}

