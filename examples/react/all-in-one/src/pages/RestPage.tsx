import React from 'react'
import AppLayout from '../components/AppLayout';
import RestGetPosts from '../components/rest/RestGetPosts';
import RestCreatePosts from '../components/rest/RestCreatePost';
import RestUpdatePost from '../components/rest/RestUpdatePost';
import RestDeletePost from '../components/rest/RestDeletePost';
import RestLongTask from '../components/rest/RestLongTask';
import RestOfflineTask from '../components/rest/RestOfflineTask';
import RestTodoTypeOps from '../components/rest/RestTodoTypeOps';
import RestTodoTypeOpsOptimistic from '../components/rest/RestTodoTypeOpsOptimistic';




type RestPageProps = {};

const RestPage: React.FC<RestPageProps> = ({ }) => {
    return (
        <AppLayout>
            <div className="sync-page">
                <div className="sync-page__item">
                    <RestGetPosts />
                </div>
                <div className="sync-page__item">
                    <RestCreatePosts />
                </div>
                <div className="sync-page__item">
                    <RestUpdatePost />
                </div>
                <div className="sync-page__item">
                    <RestDeletePost />
                </div>
                <div className="sync-page__item">
                    <RestLongTask />
                </div>

                <div className="sync-page__item">
                    <RestOfflineTask />
                </div>
                <div className="sync-page__item">
                    <RestTodoTypeOps />
                </div>
                <div className="sync-page__item">
                    <RestTodoTypeOpsOptimistic />
                </div>

            </div>
        </AppLayout>);
}

export default RestPage;