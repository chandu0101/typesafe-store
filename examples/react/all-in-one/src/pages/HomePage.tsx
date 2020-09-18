import React from 'react'
import AppLayout from '../components/AppLayout';


type HomePageProps = {};

const HomePage: React.FC<HomePageProps> = ({ }) => {
    return (
        <AppLayout>
            Welcome to Typesafe store
        </AppLayout>);
}

export default HomePage;