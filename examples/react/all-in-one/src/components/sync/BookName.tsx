import React, { useState } from 'react'
import { useSelector } from '@typesafe-store/react';
import { bookNameSelector } from '../../store/selectors/generated/sync-gen';
import useAppDispatch from '../../hooks/app-dispatch';

type BookNameProps = {};

const BookName: React.FC<BookNameProps> = ({ }) => {
    const bname = useSelector(bookNameSelector)
    const dispatch = useAppDispatch()
    const [name, setName] = useState(bname)
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setName(e.target.value)
    }
    const handleSetBookName = () => {
        if (name.length) {
            dispatch({ group: "SyncReducer", name: "setBookName", payload: name })
        }
    }
    return (
        <div>
            <h3>Book Name : {bname}</h3>
            <div>
                <label>New Name:</label>
                <input value={name} onChange={handleNameChange} />
            </div>

            <button onClick={handleSetBookName}>Set New BookName</button>
        </div>);
}

export default BookName;