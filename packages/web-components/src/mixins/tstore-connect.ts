import { withContext } from 'wc-context';
import { Selector, UnsubscribeOptions, TypeSafeStore } from "@typesafe-store/store"

type Constructor<T> = new (...args: any[]) => T;

interface CustomElement {
    connectedCallback?(): void;
    disconnectedCallback?(): void;
    readonly isConnected: boolean;
}

type ConnectProps = Record<string, { selector: Selector<any, any>, options?: UnsubscribeOptions }>

export const connect = (props: ConnectProps) =>
    <T extends Constructor<CustomElement>>(base: T) =>
        class extends withContext(base) {
            _unsubscribers: [(options?: UnsubscribeOptions) => void, UnsubscribeOptions | undefined][] = []

            static get observedContexts() {
                return ['store']
            }

            contextChangedCallback(name: any, oldValue: any, value: any) {
                console.log("Changed value : ", value);
                if (value !== undefined && value !== oldValue) {
                    this._cleanTStoreSubscribers()
                    this._setup(value)
                }
            }

            _setup(store: TypeSafeStore<any>) {
                const stateChange: Record<string, any> = {}
                Object.entries(props).forEach(([key, value]) => {
                    stateChange[key] = value.selector.fn(store.state)
                    const listener = () => {
                        const store: TypeSafeStore<any> = (this as any).context.store
                        const sV = props[key].selector.fn(store.state)
                        this.stateChanged({ [key]: sV })
                    }
                    const us = store.subscribeSelector(value.selector, listener)
                    this._unsubscribers.push([us, value.options])
                });
                (this as any).dispatch = store.dispatch;
                console.log("Setting up dispatch : ", (this as any).dispatch);
                this.stateChanged(stateChange)
            }

            _cleanTStoreSubscribers() {
                this._unsubscribers.forEach(([cb, op]) => {
                    cb(op)
                })
                this._unsubscribers = []
            }

            disconnectedCallback() {
                this._cleanTStoreSubscribers()
                if (super.disconnectedCallback) {
                    super.disconnectedCallback()
                }
            }

            stateChanged<S>(state: Partial<S>) {

            }
        }
