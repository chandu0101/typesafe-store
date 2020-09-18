

import React from 'react'
import { useSelector } from '@typesafe-store/react';
import { countSeelctor } from '../store/selectors/generated/sync-gen';
import useAppDispatch from '../hooks/app-dispatch';


type SyncProps = {};

const Sync: React.FC<SyncProps> = ({ }) => {

    const count = useSelector(countSeelctor)
    const dipatch = useAppDispatch()
    return (
        <div> Count :{ count}
            <button onClick={() => dipatch({ group: "SyncReducer", name: "increment" })}>Increment </button>
            <button onClick={() => dipatch({ group: "SyncReducer", name: "decrement" })}>Decrement </button>
        </div>);
}

export default Sync;