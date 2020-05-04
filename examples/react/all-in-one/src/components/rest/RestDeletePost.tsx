import React, { ReactNode } from 'react'
import { useSelector } from '@typesafe-store/react';
import { deletePostSelector } from '../../store/selectors/generated/rest-gen';
import useAppDispatch from '../../hooks/app-dispatch';
import BlogRequests from '../../store/apis/rest/test-api/requests';

type RestDeletePostProps = {};

const RestDeletePost: React.FC<RestDeletePostProps> = ({ }) => {


    const deletePost = useSelector(deletePostSelector)
    const dispatch = useAppDispatch()



    const handleDeleteButtonClick = () => {
        const req = BlogRequests.deletePostRequest(2)
        dispatch({ group: "RestReducer", name: "deletePost", fetch: req })
    }


    let deletePostResult: ReactNode = null
    if (deletePost.loading) {
        deletePostResult = <h4>Deelting Post 2 ...</h4>
    }
    if (deletePost.error) {
        deletePostResult = <h4>Error while deleting post: {deletePost.error.toString()}</h4>
    }
    if (deletePost.data) {
        deletePostResult = (
            <div>
                <h4>Deleted Post2: </h4>
                {JSON.stringify(deletePost.data)}
            </div>
        );
    }

    return <div>
        <h3>Delete Post</h3>
        <div>
            <button onClick={handleDeleteButtonClick}>Deelte Post 2</button>
        </div>
        <div>
            {deletePostResult}
        </div>
    </div>

}

export default RestDeletePost;

