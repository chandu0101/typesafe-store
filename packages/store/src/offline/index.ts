export const OFFLINE_ACTIONS_STORAGE_KEY = "__TSTORE_NETWORK_OFFLINE_KEY";

export type NetWorkOfflineOptions = {
  statusListener: NetworkStatusListener;
};

export interface NetworkStatusListener {
  listen(cb: (status: boolean) => any): () => any;
}
