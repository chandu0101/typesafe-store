import React, { useEffect, useState, ReactNode } from 'react'
import { useSelector } from '@typesafe-store/react';
import { postsSelector, createPostSelector } from '../../store/selectors/generated/rest-gen';
import useAppDispatch from '../../hooks/app-dispatch';
import BlogRequests from '../../store/apis/rest/test-api/requests';

type RestCreatePostsProps = {};

const RestCreatePosts: React.FC<RestCreatePostsProps> = ({ }) => {

    const [title, setTitle] = useState("")
    const [body, setBody] = useState("")
    const createPost = useSelector(createPostSelector)
    const dispatch = useAppDispatch()

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTitle(e.target.value)
    }

    const handleBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setBody(e.target.value)
    }

    const handleCreatePostClick = () => {
        const req = BlogRequests.createPostRequest({ title, body })
        dispatch({ group: "RestReducer", name: "createPost", fetch: req })
    }


    let createPostResult: ReactNode = null
    if (createPost.loading) {
        createPostResult = <h4>Creating Post ...</h4>
    }
    if (createPost.error) {
        createPostResult = <h4>Error while creating post: {JSON.stringify(createPost.error)}</h4>
    }
    if (createPost.data) {
        createPostResult = (
            <div>
                <h4>Created Post: </h4>
                {JSON.stringify(createPost.data)}
            </div>
        );
    }

    return <div>
        <h3>Create Post</h3>
        <div>
            <label>Post Title:</label>
            <input value={title} onChange={handleTitleChange} />
        </div>
        <div>
            <label>Post Body:</label>
            <textarea value={body} onChange={handleBodyChange} />
        </div>
        <div>
            <button onClick={handleCreatePostClick}>Create Post</button>
        </div>
        <div>
            {createPostResult}
        </div>
    </div>

}

export default RestCreatePosts;

