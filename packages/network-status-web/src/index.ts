
import { NetworkStatusListener } from "@typesafe-store/store"


export class WebNetworkStatus implements NetworkStatusListener {
    listener?: (status: boolean) => any
    constructor() {
        window.addEventListener("online", this.handleNetworkStatusChange)
        window.addEventListener("offline", this.handleNetworkStatusChange)
    }

    private handleNetworkStatusChange = () => {
        if (this.listener) {
            this.listener(navigator.onLine)
        }
    }

    listen = (cb: (status: boolean) => any): () => any => {
        this.listener = cb
        return () => {
            window.removeEventListener("online", this.handleNetworkStatusChange)
            window.removeEventListener("offline", this.handleNetworkStatusChange)
        }
    }
} 