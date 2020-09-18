import React from 'react'
import AppLayout from '../components/AppLayout';
import Counter from '../components/sync/Counter';
import BookName from '../components/sync/BookName';
import FactorialSync from '../components/sync/FactorialSync';
import FactorialOffload from '../components/sync/FactorialOffload';






type SyncPageProps = {};

const SyncPage: React.FC<SyncPageProps> = ({ }) => {
    return (
        <AppLayout>
            <div className="sync-page">
                <div className="sync-page__item">
                    <Counter />
                </div>
                <div className="sync-page__item">
                    <BookName />
                </div>

                <div className="sync-page__item">
                    <FactorialSync />
                </div>

                <div className="sync-page__item">
                    <FactorialOffload />
                </div>
            </div>
        </AppLayout>);
}

export default SyncPage;