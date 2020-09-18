import React from 'react'
import { useSelector, useDispatch } from '@typesafe-store/react';
import { countSeelctor } from '../../store/selectors/generated/sync-gen';
import useAppDispatch from '../../hooks/app-dispatch';


type CounterProps = {};

const Counter: React.FC<CounterProps> = ({ }) => {
    const count = useSelector(countSeelctor)
    const dispatch = useAppDispatch()
    const handleDecrement = () => {
        dispatch({ group: "SyncReducer", name: "decrement" })
    }
    const handleIncrement = () => {
        dispatch({ group: "SyncReducer", name: "increment" })
    }
    return (
        <div>
            <h3>Counter</h3>
            <button onClick={handleDecrement}>Decrement</button>
            {count}
            <button onClick={handleIncrement}>Increment</button>

        </div>);
}

export default Counter;