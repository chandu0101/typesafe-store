import { TSForm } from "@typesafe-store/store";
import useTSFormContext from "./use-tsform-context";

type FieldU = { name: string, value: any, onChange: (e: React.ChangeEvent<any>) => void, onBlur: (e: React.FocusEvent<any>) => void }
type FieldMeta = { touched?: true, error?: string }
type FieldOps = {
    setValue: (v: any, validate?: boolean) => void, setTouched: (validate?: boolean) => void,
    setError: (value?: string) => void
}

export type UseFieldType = { field: FieldU, meta: FieldMeta, fieldOps: FieldOps }

export function useField<T>(key: keyof T): UseFieldType {
    const { values, touched, errors, handleChange, handleBlur, setFieldTouched, setFieldError, setFieldValue } = useTSFormContext<T>()
    const field: FieldU = { name: key.toString(), value: values[key], onChange: handleChange, onBlur: handleBlur }
    const meta: FieldMeta = { touched: touched[key], error: errors[key] }
    const fieldOps: FieldOps = {
        setTouched: (validate?: boolean) => setFieldTouched(key, validate),
        setValue: (value: T[typeof key], validate?: boolean) => setFieldValue(key, value, validate),
        setError: (value?: string) => setFieldError(key, value)
    }

    return { field, meta, fieldOps }
}