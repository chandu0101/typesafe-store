import { PersistanceStorage } from ".."


export class WebStorage<S> implements PersistanceStorage<S> {
    dataChanged(data: string, meta: { group: string; fields: string[] }): Promise<void> {
        this.worker.postMessage()
        throw new Error("Method not implemented.")
    }
    getState(): Promise<S | undefined> {
        throw new Error("Method not implemented.")
    }
    clear(): Promise<void> {
        throw new Error("Method not implemented.")
    }
    private worker: Worker
    constructor(key: string = "t-store") {
        this.worker = new Worker("./WebStorageWorker.js")
    }
}