import React, { useState } from 'react'
import { useSelector } from '@typesafe-store/react';
import { factorialOffloadSelector } from '../../store/selectors/generated/sync-gen';
import useAppDispatch from '../../hooks/app-dispatch';


type FactorialOffloadProps = {};

const FactorialOffload: React.FC<FactorialOffloadProps> = ({ }) => {

    const [number, setNumber] = useState(0)
    const [showFactorial, setShowFactorial] = useState(true)
    const factorialOffload = useSelector(factorialOffloadSelector)
    const dispatch = useAppDispatch()

    const handleButtonClick = () => {
        setShowFactorial(true)
        dispatch({ group: "SyncReducer", name: "calculateFactorialOffload", payload: { n: number, _abortable: true } })
    }

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        const n = parseInt(value, 10)
        setShowFactorial(false)
        setNumber(n)
    }

    const renderFactorial = () => {
        if (factorialOffload.loading && factorialOffload.abortController) {
            return <div>
                {`calculating factorial for ${number}`}
                <button onClick={() => factorialOffload.abortController?.abort()}>Abort</button>
            </div>
        }
        else if (factorialOffload.loading) {
            return `calculating factorial for ${number}`
        } else if (showFactorial && factorialOffload.error) {
            return `factorial aborted`
        } else if (showFactorial) {
            return `Factorial of ${number} is : ${factorialOffload.factorial}`
        } else {
            return ""
        }
    }

    return (
        <div>
            <h3>Factorial Offload</h3>
            <input value={number} type="number" onChange={handleNumberChange} />
            <button onClick={handleButtonClick}>Calculate Factorial</button>
            {<h4>{renderFactorial()}</h4>}
        </div>);
}

export default FactorialOffload;

