
import { NetworkStatusListener } from "@typesafe-store/store"
import { connectionType, startMonitoring, stopMonitoring } from "tns-core-modules/connectivity";

export class NativeScriptNetworkStatus implements NetworkStatusListener {

    private listener?: (status: boolean) => any
    constructor() {
        startMonitoring(this.handleConnectiviyChange)
    }

    private handleConnectiviyChange = (nt: number) => {
        let result = false
        switch (nt) {
            case connectionType.none:
                result = false
                break;
            case connectionType.wifi:
                result = true
                break;
            case connectionType.mobile:
                result = true
                break;
            case connectionType.ethernet:
                result = true
                break;
            case connectionType.bluetooth:
                result = false
                break;
            default:
                result = false
                break;
        }
        if (this.listener) {
            this.listener(result)
        }
    }

    listen = (cb: (status: boolean) => any): () => any => {
        this.listener = cb
        return () => {
            stopMonitoring()
        }
    }
} 