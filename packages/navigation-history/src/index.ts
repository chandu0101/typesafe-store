
import { History } from "history"
import { Navigation, Location as TSLocation } from "@typesafe-store/store"

export default class HistoryNavigation implements Navigation {
    private listener!: (loc: TSLocation) => void
    private unsubscribe: () => void
    constructor(private readonly history: History) {
        this.unsubscribe = history.listen((loc, action) => {
            const path = loc.pathname
            const search = loc.search
            let queryParams: Record<string, string | number> | undefined = undefined
            if (search.length) {
                queryParams = {}
                search.replace(/([^?&=]+)=([^&]+)/g, (_, k, v) => queryParams![k] = v)
            }
            const tloc: TSLocation = { path, queryParams, state: loc.state }
            this.listener(tloc)
        })
    }

    listen(listener: (loc: TSLocation) => void): () => void {
        this.listener = listener
        return () => {
            this.unsubscribe()
        }
    }
    private convertQueryParamsToStr(queryParams: Record<string, string | number>) {
        return Object.entries(queryParams)
            .map(([key, value]) => `${key}=${value}`).join("&")
    }
    replace(loc: TSLocation): void {
        let path = loc.path
        if (loc.queryParams) {
            const query = this.convertQueryParamsToStr(loc.queryParams)
            if (query !== "") {
                path = `${path}?${query}`
            }
        }
        this.history.push(path, loc.state)
    }
    push(loc: TSLocation): void {
        let path = loc.path
        if (loc.queryParams) {
            const query = this.convertQueryParamsToStr(loc.queryParams)
            if (query !== "") {
                path = `${path}?${query}`
            }
        }
        this.history.push(path, loc.state)
    }
    goBack(): void {
        this.history.goBack()
    }
    goTo(i: string | number): void {
        let n: number = null as any
        if (typeof i === "string") {
            const pi = parseInt(i, 10)
            if (isNaN(pi)) {
                throw new Error(`You should provide a number`)
            }
            n = pi
        } else {
            n = i
        }
        this.history.go(n)
    }

}