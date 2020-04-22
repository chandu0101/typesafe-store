
import React from "react";
import { NavBar } from "../components/NavBar";
import AppBar from "../components/AppBar";

type AppLayoutProps = {}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {

    return <div className="app-layout">
        <AppBar />
        <div className="app-main">
            <NavBar />
            {children}
        </div>

    </div>
}

export default AppLayout