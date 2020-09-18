import React, { ReactNode } from 'react'
import { useSelector } from '@typesafe-store/react';
import { longTaskSelector, offlineTaskSelector } from '../../store/selectors/generated/rest-gen';
import useAppDispatch from '../../hooks/app-dispatch';
import { FetchRejectionError } from '@typesafe-store/store';
import TestApiRequests from '../../store/apis/rest/test-api/requests';


type RestOfflineTaskProps = {};

const RestOfflineTask: React.FC<RestOfflineTaskProps> = ({ }) => {

    const offlineTask = useSelector(offlineTaskSelector)
    const dispatch = useAppDispatch()

    const handleLongTaskButtonClick = () => {
        const req = TestApiRequests.offlineTaskRequest(true)
        dispatch({ group: "RestReducer", name: "offlineTask", fetch: req })
    }

    let offlineTaskResult: ReactNode = null
    if (offlineTask.loading) {
        offlineTaskResult = <h4>Loadig offlineTask...</h4>
    } else if (offlineTask.error) {
        if (offlineTask.error instanceof FetchRejectionError && offlineTask.error.error.name === "AbortError") {
            offlineTaskResult = <h4>offlineTask Aborted by user</h4>
        } else {
            offlineTaskResult = <h4>Error in longtask : {offlineTask.error.toString()}</h4>
        }
    } else if (offlineTask.offline) {
        offlineTaskResult = <h4>User connection is offline, this action will be called again when user back online</h4>
    }
    else if (offlineTask.data) {
        offlineTaskResult = <h4>OfflineTask Response:  {JSON.stringify(offlineTask.data)}</h4>
    }

    return (
        <div>
            <h3>Testing  OfflineTask</h3>
            <button onClick={handleLongTaskButtonClick} >Go Offline and Then Click</button>
            {offlineTaskResult}
        </div>);
}

export default RestOfflineTask;

