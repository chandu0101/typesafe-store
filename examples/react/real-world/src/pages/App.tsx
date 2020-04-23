import React from 'react'
import Explore from '../components/Explore';
import { useLocation, useHistory } from 'react-router-dom';


type AppProps = {};

const App: React.FC<AppProps> = ({ }) => {

    const location = useLocation()
    const history = useHistory()

    const handleOnChange = (value: string) => {
        history.push(`/${value}`)
    }

    return (
        <div>
            <Explore value={location.pathname.substring(1)}
                onChange={handleOnChange} />
        </div>);
}

export default App;


