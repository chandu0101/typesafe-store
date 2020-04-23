import React, { useEffect } from 'react'
import Repo from '../components/Repo';
import { useSelector } from '@typesafe-store/react';
import { reposPageSelector } from "../store/selectors/generated/app-gen"
import { useRouteMatch } from 'react-router-dom';
import useAppDispatch from '../hooks/app-dispatch';
import GithubRestApiRequestsCreator from '../store/apis/rest/github/requests';
import githubRestApiTypes from '../store/apis/rest/github/types';
import User from '../components/User';
import List from '../components/List';

type ReposPageProps = {};

const ReposPage: React.FC<ReposPageProps> = ({ }) => {

    const { repo, isLoading, users, error, nextPage } = useSelector(reposPageSelector)
    console.log("user: ", repo, error, nextPage);
    const match = useRouteMatch()
    const login = match.params["login"]
    const name = match.params["name"]
    const repoName = `${login}/${name}`
    console.log("login", login);
    const dispatch = useAppDispatch()
    useEffect(() => {
        const req = GithubRestApiRequestsCreator.createGeRepoRequest(repoName)
        console.log("req:", req);
        dispatch({ group: "AppReducer", name: "repo", fetch: req })
    }, [])
    const handleLoadMoreClick = () => {
        const req = GithubRestApiRequestsCreator.createStarGazedRequest(repoName, nextPage!)
        dispatch({ group: "AppReducer", name: "stargazers", fetch: req })
    }

    const renderUser = (user: githubRestApiTypes.User) => {
        return <User user={user} key={user.html_url} ></User>
    }

    if (!repo || !repo && isLoading) {
        return (<h1>{`loading : ${repo} repo...`}</h1>)
    } else if (!repo || error) {
        return <h3> Error loading repo: {error} </h3>
    }
    if (nextPage === 1 && !isLoading) {
        console.log("************ caling", nextPage, isLoading);
        handleLoadMoreClick()
    }
    return (
        <div>
            <Repo repo={repo!} />
            <List renderItem={renderUser} items={users}
                isFetching={isLoading}
                nextPage={nextPage}
                onLoadMoreClick={handleLoadMoreClick}
                loadingLabel={`loading more for ${login}`}
            />
        </div>);
}

export default ReposPage;