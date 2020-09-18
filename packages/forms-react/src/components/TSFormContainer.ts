import React, { ReactNode } from 'react'
import { TSForm } from "@typesafe-store/store"
import { useDispatch, useIsomorphicLayoutEffect } from "@typesafe-store/react"
import { MiddlewareFormUtils } from "@typesafe-store/middleware-form"
import { TSFormContextType, TSFormContext } from '../context';
//credits formik https://github.com/jaredpalmer/formik/blob/master/packages/formik/src/Formik.tsx

type TSFormContainerProps<T> = {
    form: TSForm<T>, onSubmit: (values: T) => void | Promise<void>
    children: (input: TSFormContextType<T>) => React.ReactElement
}


export default function TSFormContainer<T>({ form, onSubmit, children }: TSFormContainerProps<T>) {

    const dispatch = useDispatch()

    const ops = React.useMemo(() => MiddlewareFormUtils.getFormOps(form, dispatch),
        [form._aName, form._aGroup, dispatch])

    const executeChange = React.useCallback((eOrFieldValue: string | React.ChangeEvent<any>, fieldName?: string) => {
        // By default, assume that the first argument is a string. This allows us to use
        // handleChange with React Native and React Native Web's onChangeText prop which
        // provides just the value of the input.
        let field = fieldName;
        let val: any = eOrFieldValue;
        let parsed;
        // If the first argument is not a string though, it has to be a synthetic React Event (or a fake one),
        // so we handle like we would a normal HTML change event.
        if (typeof eOrFieldValue !== "string") {
            const event = eOrFieldValue
            // If we can, persist the event
            // @see https://reactjs.org/docs/events.html#event-pooling
            if (event.persist) {
                event.persist();
            }
            const target = event.target
                ? event.target
                : event.currentTarget;

            const {
                type,
                name,
                id,
                value,
                checked,
                outerHTML,
                options,
                multiple,
            } = target;

            field = fieldName ? fieldName : name ? name : id;

            val = /number|range/.test(type)
                ? ((parsed = parseFloat(value)), isNaN(parsed) ? '' : parsed)
                : /checkbox/.test(type) // checkboxes
                    ? getValueForCheckbox((form.values as any)[field!], checked, value) // TODO  more detailed on checkbox array 
                    : !!multiple // <select multiple>
                        ? getSelectedValues(options)
                        : value;
        }

        if (field) {
            // Set form fields by name
            ops.setFieldValue(field as any, val);
        }

    }, [form.values, ops.setFieldValue])

    const handleSubmit = useEventCallback(async (e?: React.FormEvent<any>) => {
        if (e && e.preventDefault && typeof e.preventDefault === "function") {
            e.preventDefault();
        }

        if (e && e.stopPropagation && typeof e.stopPropagation === "function") {
            e.stopPropagation();
        }
        ops.setSubmitting(true)
        const valid = await MiddlewareFormUtils.isTSFormValid(form)
        if (valid.status) {
            await onSubmit(form.values)
            ops.setSubmitting(false)
        } else {
            ops.setErrors(valid.errors)
        }
    }
    )

    const handleReset = useEventCallback(async (e?: React.FormEvent<any>) => {
        if (e && e.preventDefault && typeof e.preventDefault === "function") {
            e.preventDefault();
        }

        if (e && e.stopPropagation && typeof e.stopPropagation === "function") {
            e.stopPropagation();
        }
        ops.resetForm()
    }
    )

    const handleChange = useEventCallback((eOrFieldName: React.ChangeEvent<any> | string) => {
        if (typeof eOrFieldName === "string") { // react-native ,react-native-web
            return (event: string | React.ChangeEvent<any>) => executeChange(event, eOrFieldName)
        } else {
            executeChange(eOrFieldName)
        }
    })

    const executeBlur = React.useCallback((eOrFieldName: React.FocusEvent<any> | string, fieldName?: string) => {
        let field: string = ""
        if (fieldName) {
            field = fieldName
        } else {
            const e = eOrFieldName as any
            const { name, id } = e.target;
            field = name ? name : id;
        }
        ops.setFieldTouched(field as any)
    }, [ops.setFieldTouched])


    const handleBlur = useEventCallback((eOrFieldName: React.FocusEvent<any> | string) => {
        if (typeof eOrFieldName === "string") { // react-native ,react-native-web
            return (event: any) => executeBlur(event, eOrFieldName)
        } else {
            executeBlur(eOrFieldName)
        }
    })

    const contextValue: TSFormContextType<T> = {
        ...form, ...ops, handleSubmit,
        handleChange, handleBlur, handleReset
    }

    return React.createElement(TSFormContext.Provider, { value: contextValue }, children(contextValue));
}

/** Return multi select values based on an array of options */
function getSelectedValues(options: any[]) {
    return Array.from(options)
        .filter(el => el.selected)
        .map(el => el.value);
}

/** Return the next value for a checkbox */
function getValueForCheckbox(
    currentValue: string | any[],
    checked: boolean,
    valueProp: any
) {
    // If the current value was a boolean, return a boolean
    if (typeof currentValue === 'boolean') {
        return Boolean(checked);
    }

    // If the currentValue was not a boolean we want to return an array
    let currentArrayOfValues = [];
    let isValueInArray = false;
    let index = -1;

    if (!Array.isArray(currentValue)) {
        // eslint-disable-next-line eqeqeq
        if (!valueProp || valueProp == 'true' || valueProp == 'false') {
            return Boolean(checked);
        }
    } else {
        // If the current value is already an array, use it
        currentArrayOfValues = currentValue;
        index = currentValue.indexOf(valueProp);
        isValueInArray = index >= 0;
    }

    // If the checkbox was checked and the value is not already present in the aray we want to add the new value to the array of values
    if (checked && valueProp && !isValueInArray) {
        return currentArrayOfValues.concat(valueProp);
    }

    // If the checkbox was unchecked and the value is not in the array, simply return the already existing array of values
    if (!isValueInArray) {
        return currentArrayOfValues;
    }

    // If the checkbox was unchecked and the value is in the array, remove the value and return the array
    return currentArrayOfValues
        .slice(0, index)
        .concat(currentArrayOfValues.slice(index + 1));
}


function useEventCallback<T extends (...args: any[]) => any>(fn: T): T {
    const ref: any = React.useRef(fn);

    // we copy a ref to the callback scoped to the current state/props on each render
    useIsomorphicLayoutEffect(() => {
        ref.current = fn;
    });

    return React.useCallback(
        (...args: any[]) => ref.current.apply(void 0, args),
        []
    ) as T;
}
