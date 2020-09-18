
import { TypeSafeStore } from '@typesafe-store/store'
import { withContext } from 'wc-context/lit-element'


export class TStoreProvider extends withContext(HTMLElement) {
    static get providedContexts() {
        return {
            store: { property: "value" }
        }
    }
    __value!: TypeSafeStore<any>

    constructor() {
        super()
        const slot = document.createElement("slot")
        this.appendChild(slot)
    }

    set value(val) {
        console.log("TStore proivder value :", val)
        this.__value = val
        this.updateProvidedContext("store", val)
    }

    get value() {
        return this.__value
    }
}
