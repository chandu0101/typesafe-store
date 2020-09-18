
import { NetworkStatusListener } from "@typesafe-store/store"
import NetInfo, { NetInfoChangeHandler } from "@react-native-community/netinfo";


export class ReactNativeNetworkStatus implements NetworkStatusListener {
    private listener?: (status: boolean) => any
    private unsub: () => any
    constructor() {
        this.unsub = NetInfo.addEventListener(this.handleNetInfoChange)
    }

    private handleNetInfoChange: NetInfoChangeHandler = (state) => {
        if (this.listener) {
            this.listener(state.isConnected)
        }
    }

    listen = (cb: (status: boolean) => any): () => any => {
        this.listener = cb
        return this.unsub
    }
} 