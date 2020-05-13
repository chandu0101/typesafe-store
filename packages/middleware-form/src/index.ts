

import { MiddleWare, TStoreUtils, TSFormError, TypeSafeStore, Dispatch, ReducerGroup, Action, ActionInternalMeta, TSForm, } from "@typesafe-store/store"

type SetFieldValueReq = { kind: "FieldValue", payload: { key: string, value: any, validate?: boolean } }
type SetFieldTouchedReq = { kind: "FieldTouched", payload: { key: string, validate?: boolean } }
type SetFieldErrorReq = { kind: "FieldError", payload: { key: string, value: string | undefined } }
type SetErrorsReq = { kind: "Errors", payload: TSFormError<any> }
type FormSubmittingReq = { kind: "Submitting", payload: boolean }
type FormResetReq = { kind: "Reset" }
type FormValidateReq = { kind: "Validate" }

type FormReq = SetFieldValueReq | SetFieldTouchedReq | SetFieldErrorReq | SetErrorsReq
    | FormSubmittingReq | FormResetReq | FormValidateReq

type FormAction = Action & { form: FormReq }


type TSFormValidReturnType<T> = { status: boolean, errors: TSFormError<T> }



export type TSFormOps<T> = {
    setFieldValue: <K extends keyof T>(k: K, value: T[K], validate?: boolean) => void,
    setFieldTouched: <K extends keyof T>(k: K, validate?: boolean) => void,
    setFieldError: <K extends keyof T>(k: K, value: string) => void,
    setErrors: (errors: TSFormError<T>) => void,
    setSubmitting: (isSubmitting: boolean) => void
    resetForm: () => void,
    validateForm: () => void
}
export class MiddlewareFormUtils {

    static getFormOps<T>({ _aGroup, _aName }: TSForm<T>, dispatch: Dispatch<Action>): TSFormOps<T> {
        return {
            setFieldValue: <K extends keyof T>(key: K, value: T[K], validate?: boolean) => {
                const form: SetFieldValueReq = { kind: "FieldValue", payload: { key: key.toString(), value, validate } }
                const a: FormAction = { name: _aName!, group: _aGroup!, form }
                dispatch(a)
            },
            setFieldTouched: <K extends keyof T>(key: K, validate?: boolean) => {
                const form: SetFieldTouchedReq = { kind: "FieldTouched", payload: { key: key.toString(), validate } }
                const a: FormAction = { name: _aName!, group: _aGroup!, form }
                dispatch(a)
            },
            setFieldError: <K extends keyof T>(key: K, value: string | undefined) => {
                const form: SetFieldErrorReq = { kind: "FieldError", payload: { key: key.toString(), value } }
                const a: FormAction = { name: _aName!, group: _aGroup!, form }
                dispatch(a)
            },
            setErrors: (errors: TSFormError<T>) => {
                const form: SetErrorsReq = { kind: "Errors", payload: errors }
                const a: FormAction = { name: _aName!, group: _aGroup!, form }
                dispatch(a)
            },
            setSubmitting: (isSubmitting: boolean) => {
                const form: FormSubmittingReq = { kind: "Submitting", payload: isSubmitting }
                const a: FormAction = { name: _aName!, group: _aGroup!, form }
                dispatch(a)
            },
            resetForm: () => {
                const form: FormResetReq = { kind: "Reset", }
                const a: FormAction = { name: _aName!, group: _aGroup!, form }
                dispatch(a)
            },
            validateForm: () => {
                const form: FormValidateReq = { kind: "Validate", }
                const a: FormAction = { name: _aName!, group: _aGroup!, form }
                dispatch(a)
            }
        }
    }


    static async isTSFormValid<T>(form: TSForm<T>): Promise<TSFormValidReturnType<T>> {
        const result: TSFormValidReturnType<T> = { status: false, errors: {} }
        const keyValues = await Promise.all(Object.entries(form.values).map(async ([key, value]) => {
            if (form.validators && form.validators[key as keyof T]) {
                const r = await form.validators[key as keyof T]!(value)
                return [key, r]
            }
        }))
        const errors = keyValues.reduce((pv, v) => {
            if (v) {
                const [key, value] = v;
                if (typeof value === "string") {
                    pv[key as keyof T] = value
                }
            }
            return pv;
        }, {} as TSFormError<T>)
        result.errors = errors
        if (TStoreUtils.isEmptyObj(errors)) {
            result.status = true
        }
        return result;
    }
}


function isFormAction(rg: ReducerGroup<any, any, any, any>, action: Action) {
    return rg.m.a[action.name] && rg.m.a[action.name].form
}


async function processFormAction(store: TypeSafeStore<any>, action: FormAction, rg: ReducerGroup<any, any, any, any>) {
    const stateKey = store.getStateKeyForGroup(action.group)
    const formRequest = action.form
    let data = store.state[stateKey][action.name] as TSForm<any>
    const ai: ActionInternalMeta = { kind: "Data", processed: true, data }
    if (formRequest.kind === "FieldValue") {
        const payload = formRequest.payload
        let validate = true
        if (data.hasOwnProperty("validateOnChange")) {
            validate = data.validateOnChange!
        }
        if (payload.validate !== undefined) {
            validate = payload.validate
        }
        const values = { ...data.values, [payload.key]: payload.value }
        if (validate && data.validators[payload.key]) {
            const errors = { ...data.errors }
            const e = await data.validators[payload.key]!(payload.value)
            if (typeof e === "string") {
                errors[payload.key] = e
            }
            data = { ...data, isValid: TStoreUtils.isEmptyObj(errors), errors, values, }
            ai.data = data
            store.dispatch({ ...action, _internal: ai })
        } else {
            data = { ...data, isValid: TStoreUtils.isEmptyObj(data.errors), values }
            ai.data = data
            store.dispatch({ ...action, _internal: ai })
        }

    } else if (formRequest.kind === "FieldTouched") {
        const payload = formRequest.payload
        let validate = true
        if (data.hasOwnProperty("validateOnBlur")) {
            validate = data.validateOnBlur!
        }
        if (payload.validate !== undefined) {
            validate = payload.validate
        }
        const touched = { ...data.touched }
        touched[payload.key] = true
        if (validate && data.validators[payload.key]) {
            const e = await data.validators[payload.key]!(data.values[payload.key])
            const errors = { ...data.errors }
            if (typeof e === "string") {
                errors[payload.key] = e
            }
            data = { ...data, touched, errors, isValid: TStoreUtils.isEmptyObj(errors) }
            ai.data = data
            store.dispatch({ ...action, _internal: ai })
        } else {
            data = { ...data, touched, isValid: TStoreUtils.isEmptyObj(data.errors) }
            ai.data = data
            store.dispatch({ ...action, _internal: ai })
        }
    } else if (formRequest.kind === "FieldError") {
        const payload = formRequest.payload
        const errors = { ...data.errors }
        if (payload.value === undefined) {
            delete errors[payload.key]
        } else {
            errors[payload.key] = payload.value
        }
        data = { ...data, errors, isValid: TStoreUtils.isEmptyObj(errors) }
        ai.data = data
        store.dispatch({ ...action, _internal: ai })
    } else if (formRequest.kind === "Errors") {
        const payload = formRequest.payload
        data = { ...data, errors: payload, isValid: TStoreUtils.isEmptyObj(payload), isSubmitting: false }
        ai.data = data
        store.dispatch({ ...action, _internal: ai })
    } else if (formRequest.kind === "Reset") {
        ai.data = rg.ds[action.name]
        store.dispatch({ ...action, _internal: ai })
    } else if (formRequest.kind === "Submitting") {
        const payload = formRequest.payload
        data = { ...data, isSubmitting: payload, isValidating: payload }
        ai.data = data
        store.dispatch({ ...action, _internal: ai })
    } else if (formRequest.kind === "Validate") {
        data = { ...data, isValidating: true }
        ai.data = data
        store.dispatch({ ...action, _internal: ai })
        const valid = await MiddlewareFormUtils.isTSFormValid(data)
        data = { ...data, isValid: valid.status, errors: valid.errors, isValidating: false }
        ai.data = data
        store.dispatch({ ...action, _internal: ai })
    }

}



export default function createFormMiddleware(): MiddleWare<any> {
    return (store: TypeSafeStore<any>) => (next: Dispatch<Action>) => (action: Action) => {
        if (action._internal && action._internal.processed) { // if already processed by other middlewares just pass through
            return next(action)
        }
        const rg = store.getReducerGroup(action.group)
        if (isFormAction(rg, action)) { //
            return processFormAction(store, action as any, rg)
        } else {
            return next(action)
        }
    }
}
