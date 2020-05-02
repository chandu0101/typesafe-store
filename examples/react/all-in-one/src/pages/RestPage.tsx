import React from 'react'
import AppLayout from '../components/AppLayout';




type RestPageProps = {};

const RestPage: React.FC<RestPageProps> = ({ }) => {
    return (
        <AppLayout>
            <div className="sync-page">
                <div className="sync-page__item">
                    Rest API
                </div>

            </div>
        </AppLayout>);
}

export default RestPage;