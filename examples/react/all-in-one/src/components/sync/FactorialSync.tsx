import React, { useState } from 'react'
import { useSelector } from '@typesafe-store/react';
import { factorialSelector } from '../../store/selectors/generated/sync-gen';
import useAppDispatch from '../../hooks/app-dispatch';


type FactorialSyncProps = {};

const FactorialSync: React.FC<FactorialSyncProps> = ({ }) => {

    const [number, setNumber] = useState(0)
    const [showFactorial, setShowFactorial] = useState(true)
    const factorial = useSelector(factorialSelector)
    const dispatch = useAppDispatch()

    const handleButtonClick = () => {
        setShowFactorial(true)
        dispatch({ group: "SyncReducer", name: "calculateFactorial", payload: number })
    }

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const n = parseInt(e.target.value, 10)
        setShowFactorial(false)
        setNumber(n)
    }

    return (
        <div>
            <h3>Factorial Sync</h3>
            <input value={number} type="number" onChange={handleNumberChange} />
            <button onClick={handleButtonClick}>Calculate Factorial</button>
            {showFactorial && <h4>Factorial of {number} is : {factorial}</h4>}
        </div>);
}

export default FactorialSync;

