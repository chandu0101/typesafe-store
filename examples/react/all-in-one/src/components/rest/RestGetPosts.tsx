import React, { useEffect } from 'react'
import { useSelector } from '@typesafe-store/react';
import { postsSelector } from '../../store/selectors/generated/rest-gen';
import useAppDispatch from '../../hooks/app-dispatch';
import BlogRequests from '../../store/apis/rest/test-api/requests';
import { FetchRejectionError } from '@typesafe-store/store';

type RestGetPostsProps = {};

const RestGetPosts: React.FC<RestGetPostsProps> = ({ }) => {

    const posts = useSelector(postsSelector)
    const dispatch = useAppDispatch()

    useEffect(() => {
        const req = BlogRequests.getPostsRequest()
        dispatch({ group: "RestReducer", name: "posts", fetch: req })
    }, [])

    if (posts.loading) {
        return <h4>Loading posts ....</h4>
    }
    if (posts.error) {
        if (posts.error instanceof FetchRejectionError) {
            return <h4>Looks like service went hibernate mode , plase  open this link :
               "https://xpphx.sse.codesandbox.io/" manually in browser and then refresh this page</h4>
        } else {
            return <h4>Error while getting posts {JSON.stringify(posts.error)}</h4>
        }

    }
    if (posts.data) {
        console.log("RestGetPosts", posts.data.length);
        return (
            <div>
                <h3>Get Posts</h3>
                <ul className="rest-posts">
                    {posts.data!.map(p => <li key={p.id}>
                        <h4>{p.title}</h4>
                        <p>{p.body}</p>
                    </li>)}
                </ul>
            </div>
        );
    }

    return null

}

export default RestGetPosts;

