
import React from 'react'
import { Link } from 'react-router-dom';


type HeaderProps = {};

const Header: React.FC<HeaderProps> = ({ }) => {
    return (
        <div className="app-header">
            <Link to="/" className="app-header__item">
                TypeSafe Store
            </Link>
            <Link to="/sync" className="app-header__item">Sync</Link>
            <Link to="/rest-api" className="app-header__item">Rest API</Link>
        </div>);
}


type AppLayoutProps = {};

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
    return (
        <div className="app-container">
            <Header />
            <div className="app-content">
                {children}
            </div>
        </div>);
}

export default AppLayout;