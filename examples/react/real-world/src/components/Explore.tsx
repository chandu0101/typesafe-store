import React, { useState } from 'react'


type ExploreProps = { value: string, onChange: (v: string) => any };

const Explore: React.FC<ExploreProps> = ({ value, onChange }) => {
    const [ivalue, setIValue] = useState(value)

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIValue(e.target.value)
    }

    const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.keyCode === 13) {
            onChange(ivalue)
        }
    }

    const handleButtonClick = () => {
        onChange(ivalue)
    }

    return (
        <div>
            <p>Type a username or repo full name and hit 'Go':</p>
            <input value={ivalue} onChange={handleInputChange} onKeyUp={handleKeyUp} />
            <button onClick={handleButtonClick}>Go</button>
        </div>);
}

export default Explore 