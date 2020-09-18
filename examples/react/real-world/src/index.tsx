import React, { useContext, useCallback } from 'react';
import ReactDOM from 'react-dom';
// import './index.css';
import { store } from "./store"
import { Provider } from "@typesafe-store/react"
import { BrowserRouter as Router, Route, Switch } from "react-router-dom"
import App from './pages/App';
import UserPage from './pages/UserPage';
import ReposPage from './pages/ReposPage';
import Sync from './components/Syn';
import { TypeSafeStore, Selector, UnsubscribeOptions } from '@typesafe-store/store';
import { countSeelctor } from './store/selectors/generated/sync-gen';

type ProvivderCOncurrentProps = { store: TypeSafeStore<any> }

type MutableSource<Source> = { _source: Source }
function getStoreVersion(store: TypeSafeStore<any>) {
    return store.state
}

const TypeSafeStorReactConcurrentContext = React.createContext<MutableSource<TypeSafeStore<any>>>(null as any)

const ProviderConcurrent: React.FC<ProvivderCOncurrentProps> = ({ store, children }) => {
    const mutableSource = React.useMemo(() => {
        return (React as any).createMutableSource(store, getStoreVersion)
    }, [store])
    const props = { value: mutableSource }
    return React.createElement(TypeSafeStorReactConcurrentContext.Provider, props, children)
}

function concurrentSubscribe(store: TypeSafeStore<any>, selector: Selector<any, any>) {
    //    const  mutableSource = useContext(TypeSafeStorReactConcurrentContext)
    //    return 
}

export function useSelectorConcurrent<R>(selector: Selector<any, R>, options?: UnsubscribeOptions): R {
    const mutableSource = useContext(TypeSafeStorReactConcurrentContext)
    const getSnapShot = React.useCallback((store: TypeSafeStore<any>) => {
        return selector.fn(store.state)
    }, [selector])
    const subscribe = useCallback((store: TypeSafeStore<any>, callback: any) => {
        const us = store.subscribeSelector(selector, callback)
        return () => {
            us(options)
        }
    }, [selector])
    return (React as any).useMutableSource(mutableSource, getSnapShot, subscribe)
}

export function useConcurrentDispatch() {
    const mutableSource = useContext(TypeSafeStorReactConcurrentContext)
    return mutableSource._source.dispatch
}

const Counter2 = () => {
    const count = useSelectorConcurrent(countSeelctor)
    console.log("Count : ", count);
    const dipatch = useConcurrentDispatch()
    return (
        <div> Count :{ count}
            <button onClick={() => dipatch({ group: "SyncReducer", name: "increment" })}>Increment </button>
            <button onClick={() => dipatch({ group: "SyncReducer", name: "decrement" })}>Decrement </button>
        </div>);
}

console.log("Hello1 ", ReactDOM,
    React);
ReactDOM.render(
    <React.StrictMode>
        <Router>
            <ProviderConcurrent store={store} >
                <div>
                    <Route path="/" component={App} />
                    {/* <Switch>
                        <Route path="/:login/:name"
                            component={ReposPage} />
                        <Route path="/:login"
                            component={UserPage} />
                    </Switch> */}

                    <Counter2 />
                </div>
            </ProviderConcurrent>
        </Router>,
     </React.StrictMode>,
    document.getElementById('root')
);

