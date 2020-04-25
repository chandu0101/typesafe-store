
import React from 'react'
import { useSelector, useDispatch } from '@typesafe-store/react';
import { routeSelector } from '../store/selectors/generated/app-gen';
import { useAppDispatch } from '../hooks/app-dispatch';
import reducerTypes from '../store/reducers/types';
import { FaTasks, FaInfoCircle } from "react-icons/fa"

type NavBarProps = {};

export const NavBar: React.FC<NavBarProps> = ({ }) => {
    const route = useSelector(routeSelector)
    const dispatch = useAppDispatch()
    const handleClick = (r: reducerTypes.app.Route) => {
        console.log("hcl", r);
        dispatch({ name: "setRoute", group: "AppReducer", payload: r })
    }
    return (
        <div className="nav-bar">
            <div className={`${route === "actions" ? "nav-bar__item nav-bar__item-selected" : "nav-bar__item"}`}
                onClick={() => handleClick("actions")}>
                <FaTasks />
                Actions
                </div>
            <div className={`${route === "about" ? "nav-bar__item nav-bar__item-selected" : "nav-bar__item"}`}
                onClick={() => handleClick("about")} >
                <FaInfoCircle />
                    About
                    </div>
        </div>);
}
