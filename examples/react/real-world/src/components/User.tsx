import React from 'react'
import githubRestApiTypes from "../store/apis/rest/github/types"
import { Link } from "react-router-dom"
type UserProps = { user: githubRestApiTypes.User };

const User: React.FC<UserProps> = ({ user }) => {
    const { login, avatar_url, name } = user
    return (
        <div className="User">
            <Link to={`/${login}`}>
                <img src={avatar_url} alt={login} width="72" height="72" />
                <h3>
                    {login} {name && <span>({name})</span>}
                </h3>
            </Link>
        </div>);
}

export default User;