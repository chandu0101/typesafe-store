import React, { useEffect, useRef } from 'react'
import { useSelector } from '@typesafe-store/react';
import { useRouteMatch } from 'react-router-dom';
import { userPageSelector } from '../store/selectors/generated/app-gen';
import User from '../components/User';
import List from '../components/List';
import useAppDispatch from '../hooks/app-dispatch';
import GithubRestApiRequestsCreator from '../store/apis/rest/github/requests';
import githubRestApiTypes from '../store/apis/rest/github/types';
import Repo from '../components/Repo';



type UserPageProps = {};

const UserPage: React.FC<UserPageProps> = ({ }) => {

    const { user, isLoading, repos, error, nextPage } = useSelector(userPageSelector)
    console.log("user: ", user, error, nextPage);
    const match = useRouteMatch()
    const login = match.params["login"]
    console.log("login", login);
    const dispatch = useAppDispatch()
    useEffect(() => {
        const req = GithubRestApiRequestsCreator.createGetuserRequest(login)
        console.log("req:", req);
        dispatch({ group: "AppReducer", name: "user", fetch: req })
    }, [])
    const reqSentRef = useRef<boolean>(false)
    const handleLoadMoreClick = () => {
        reqSentRef.current = true
        const req = GithubRestApiRequestsCreator.createStarredRequest(login, nextPage!)
        dispatch({ group: "AppReducer", name: "starred", fetch: req })
    }

    const renderRepo = (repo: githubRestApiTypes.Repo) => {
        return <Repo repo={repo} key={repo.html_url} ></Repo>
    }

    if (!user || !user && isLoading) {
        return (<h1>{`loading : ${login} profile...`}</h1>)
    } else if (!user || error) {
        return <h3> Error loading user: {error} </h3>
    }
    if (nextPage === 1 && !isLoading) {
        console.log("************ caling", nextPage, isLoading);
        if (!reqSentRef.current) {
            handleLoadMoreClick()
        }
    }
    return (
        <div>
            <User user={user!} />
            <List renderItem={renderRepo} items={repos}
                isFetching={isLoading}
                nextPage={nextPage}
                onLoadMoreClick={handleLoadMoreClick}
                loadingLabel={`loading more for ${login}`}
            />
        </div>);
}

export default UserPage;