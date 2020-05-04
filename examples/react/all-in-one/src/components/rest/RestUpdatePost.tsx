import React, { useEffect, useState, ReactNode } from 'react'
import { useSelector } from '@typesafe-store/react';
import { postsSelector, createPostSelector, updatePostSelector } from '../../store/selectors/generated/rest-gen';
import useAppDispatch from '../../hooks/app-dispatch';
import BlogRequests from '../../store/apis/rest/test-api/requests';

type RestUpdatePostProps = {};

const RestUpdatePost: React.FC<RestUpdatePostProps> = ({ }) => {

    const [title, setTitle] = useState("")
    const [body, setBody] = useState("")
    const updatePost = useSelector(updatePostSelector)
    const dispatch = useAppDispatch()

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTitle(e.target.value)
    }

    const handleBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setBody(e.target.value)
    }

    const handleUpdatePostClick = () => {
        const req = BlogRequests.updatePostRequest({ title, body, id: 1 })
        dispatch({ group: "RestReducer", name: "updatePost", fetch: req })
    }


    let updatePostResult: ReactNode = null
    if (updatePost.loading) {
        updatePostResult = <h4>Updating Post 1 ...</h4>
    }
    if (updatePost.error) {
        updatePostResult = <h4>Error while updating post: {JSON.stringify(updatePost.error)}</h4>
    }
    if (updatePost.data) {
        updatePostResult = (
            <div>
                <h4>Updated Post: </h4>
                {JSON.stringify(updatePost.data)}
            </div>
        );
    }

    return <div>
        <h3>Update Post</h3>
        <div>
            <label>Post Title:</label>
            <input value={title} onChange={handleTitleChange} />
        </div>
        <div>
            <label>Post Body:</label>
            <textarea value={body} onChange={handleBodyChange} />
        </div>
        <div>
            <button onClick={handleUpdatePostClick}>Update Post 1</button>
        </div>
        <div>
            {updatePostResult}
        </div>
    </div>

}

export default RestUpdatePost;

