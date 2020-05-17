import { Injectable } from "@angular/core"
import { TypeSafeStore } from "@typesafe-store/store"

@Injectable({
    providedIn: "root"
})
export default class NgTStore {
    store!: TypeSafeStore<any>
    conifigureStore(store: TypeSafeStore<any>) {
        this.store = store
    }
}