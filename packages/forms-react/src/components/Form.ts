import React from 'react'
import { TSForm } from "@typesafe-store/store"
import { useDispatch } from "@typesafe-store/react"
import { MiddlewareFormUtils } from "@typesafe-store/middleware-form"
import { TSFormContextType } from '../context';

type FormProps<T> = { form: TSForm<T>, onSubmit: (values: T) => void | Promise<void> }


export default function Form<T>({ form, onSubmit }: FormProps<T>) {

    const dispatch = useDispatch()
    const ops = MiddlewareFormUtils.getFormOps(form, dispatch)

    const handleSubmit = async (e: React.FormEvent<HTMLElement>) => {
        e.preventDefault()
        ops.setSubmitting(true)
        const valid = await MiddlewareFormUtils.isTSFormValid(form)
        if (valid.status) {
            await onSubmit(form.values)
            ops.setSubmitting(false)
        } else {
            ops.setErrors(valid.errors)
        }
    }

    const handleChange = (eOrFieldName: React.ChangeEvent<HTMLElement> | string) => {
        if (typeof eOrFieldName === "string") {

        } else {
            const e = eOrFieldName
            // const name =  
        }
    }

    const contextValue: TSFormContextType<T> = { ...form, ...ops, handleSubmit, }

    return null;
}
