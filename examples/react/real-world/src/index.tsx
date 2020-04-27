import React from 'react';
import ReactDOM from 'react-dom';
// import './index.css';
import { store } from "./store"
import { Provider } from "@typesafe-store/react"
import { BrowserRouter as Router, Route, Switch } from "react-router-dom"
import App from './pages/App';
import UserPage from './pages/UserPage';
import ReposPage from './pages/ReposPage';
import Sync from './components/Syn';

console.log("Hello1 ");
ReactDOM.render(
    <React.StrictMode>
        <Router>
            <Provider store={store} >
                <div>
                    <Route path="/" component={App} />
                    {/* <Switch>
                        <Route path="/:login/:name"
                            component={ReposPage} />
                        <Route path="/:login"
                            component={UserPage} />
                    </Switch> */}
                    <Sync />

                </div>
            </Provider>
        </Router>
    </React.StrictMode>,
    document.getElementById('root')
);

