import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { store } from "./store"
import { Provider } from "@typesafe-store/react"
import { BrowserRouter as Router, Route, Switch } from "react-router-dom"
import HomePage from './pages/HomePage';
import SyncPage from './pages/SyncPage';
import RestPage from './pages/RestPage';

ReactDOM.render(
    <Router>
        <Provider store={store} >
            <Switch>
                <Route path="/sync">
                    <SyncPage />
                </Route>
                <Route path="/rest-api">
                    <RestPage />
                </Route>
                <Route path="/">
                    <HomePage />
                </Route>

            </Switch>
        </Provider>
    </Router>
    ,
    document.getElementById('root')
);

