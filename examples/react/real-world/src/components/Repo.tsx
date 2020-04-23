import React from 'react'
import githubRestApiTypes from '../store/apis/rest/github/types';
import { Link } from 'react-router-dom';


type RepoProps = { repo: githubRestApiTypes.Repo };

const Repo: React.FC<RepoProps> = ({ repo }) => {

    return (
        <div className="Repo">
            <h3>
                <Link to={`/${repo.owner.login}/${repo.name}`}>
                    {repo.name}
                </Link>
                {' by '}
                <Link to={`${repo.owner.login}`}>
                    {repo.owner.login}
                </Link>
            </h3>
            {repo.description && <p>{repo.description}</p>}
        </div>);
}

export default Repo;