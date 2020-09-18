import React, { ReactNode } from 'react'
import { useSelector } from '@typesafe-store/react';
import { longTaskSelector } from '../../store/selectors/generated/rest-gen';
import useAppDispatch from '../../hooks/app-dispatch';
import { FetchRejectionError } from '@typesafe-store/store';
import TestApiRequests from '../../store/apis/rest/test-api/requests';


type RestLongTaskProps = {};

const RestLongTask: React.FC<RestLongTaskProps> = ({ }) => {

    const longTask = useSelector(longTaskSelector)
    const dispatch = useAppDispatch()

    const handleLongTaskButtonClick = () => {
        const req = TestApiRequests.longTaskRequest(true)
        dispatch({ group: "RestReducer", name: "longTask", fetch: req })
    }

    let longTaskResult: ReactNode = null
    if (longTask.loading && longTask.abortController) {
        longTaskResult = <div>
            <h4>Loading Long Task</h4>
            <button onClick={() => longTask.abortController?.abort()}>Abort</button>
        </div>
    } else if (longTask.loading) {
        longTaskResult = <h4>Loadig long task...</h4>
    } else if (longTask.error) {
        if (longTask.error instanceof FetchRejectionError && longTask.error.error.name === "AbortError") {
            longTaskResult = <h4>longTask Aborted by user</h4>
        } else {
            longTaskResult = <h4>Error in longtask : {longTask.error.toString()}</h4>
        }
    } else if (longTask.data) {
        longTaskResult = <h4>LongTask completed successfully  {longTask.data}</h4>
    }

    return (
        <div>
            <h3>Long Running Task</h3>
            <button onClick={handleLongTaskButtonClick} >Fire LongTask</button>
            {longTaskResult}
        </div>);
}

export default RestLongTask;

