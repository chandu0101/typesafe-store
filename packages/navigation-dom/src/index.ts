

import { Navigation, Location } from "@typesafe-store/store"

// TODO implement state ,probably history.state
export default class DomNavigation implements Navigation {

    private listener!: (loc: Location) => void

    constructor() {
        window.addEventListener("popstate", this.listenForHistoryChange)
    }

    private listenForHistoryChange = () => {

        const path = window.location.pathname
        const search = window.location.search
        let queryParams: Record<string, string | number> | undefined = undefined
        if (search.length) {
            queryParams = {}
            search.replace(/([^?&=]+)=([^&]+)/g, (_, k, v) => queryParams![k] = v)
        }
        const loc: Location = { path, queryParams }
        this.listener(loc)
    }
    private dispatchPopEvent() {
        window.dispatchEvent(new Event('popstate'));
    }

    listen(listener: (loc: Location) => void): () => void {
        this.listener = listener
        return () => {
            window.removeEventListener("popstate", this.listenForHistoryChange)
        }
    }
    private convertQueryParamsToStr(queryParams: Record<string, string | number>) {
        return Object.entries(queryParams)
            .map(([key, value]) => `${key}=${value}`).join("&")
    }
    replace(loc: Location): void {
        let path = loc.path
        if (loc.queryParams) {
            const query = this.convertQueryParamsToStr(loc.queryParams)
            if (query !== "") {
                path = `${path}?${query}`
            }
        }
        window.history.replaceState(loc.state, "", path)
        this.dispatchPopEvent()
    }
    push(loc: Location): void {
        let path = loc.path
        if (loc.queryParams) {
            const query = this.convertQueryParamsToStr(loc.queryParams)
            if (query !== "") {
                path = `${path}?${query}`
            }
        }
        window.history.pushState(loc.state, "", path)
        this.dispatchPopEvent()
    }
    goBack(): void {
        window.history.back()
        this.dispatchPopEvent()
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
        window.history.go(n)
        this.dispatchPopEvent()
    }

}