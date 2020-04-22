import React from 'react'
import { useSelector } from '@typesafe-store/react';
// import { actionsSelector } from '../store/selectors/generated/app-gen';



type ActionsListProps = {};

export const ActionsList: React.FC<ActionsListProps> = ({ }) => {

    // const actions = useSelector(actionsSelector)
    const actions = []
    return (
        <div>
            Actions :
            <ul>
                {actions.map((a, i) => <li key={`${a.name}-${a.group}-i`}>
                    Name : {a.name}
                  Group : {a.group}
                </li>)}
            </ul>
        </div>);
}
