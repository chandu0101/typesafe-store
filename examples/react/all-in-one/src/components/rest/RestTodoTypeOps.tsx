import React, { useEffect, useState } from 'react'
import { useSelector } from '@typesafe-store/react';
import { todosSelector, createTodoSelector, updateTodoelector, deleteTodoSelector } from '../../store/selectors/generated/rest-gen';
import useAppDispatch from '../../hooks/app-dispatch';
import TestApiRequests from '../../store/apis/rest/test-api/requests';
import testApiTypes from '../../store/apis/rest/test-api/types';
import Modal from "react-modal";

type RestTodoTypeOpsProps = {};

const RestTodoTypeOps: React.FC<RestTodoTypeOpsProps> = ({ }) => {

    const todos = useSelector(todosSelector)
    const createTodo = useSelector(createTodoSelector)
    const updateTodo = useSelector(updateTodoelector)
    const deleteTodo = useSelector(deleteTodoSelector)
    const dispatch = useAppDispatch()
    const [newTodoText, setNewTodoText] = useState("")
    const [updateTodoId, setUpdateTodoId] = useState(0)
    const [updateTodoText, setUpdateTodoText] = useState("")
    const [updateTodoCompleted, setUpdateTodoComplted] = useState(false)

    const handleNewTodoTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewTodoText(e.target.value)
    }

    const handleUpdateTodoTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUpdateTodoText(e.target.value)
    }

    const handleUpdateTodoCompletedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUpdateTodoComplted(e.target.checked)
    }

    const handleAddTodo = () => {
        if (newTodoText.length > 0) {
            const req = TestApiRequests.createTodoRequest({ text: newTodoText, completed: false })
            dispatch({ group: "RestReducer", name: "createTodo", fetch: req })
            setNewTodoText("")
        }
    }

    const handleUpdateTodo = () => {
        const req = TestApiRequests.updateTodoRequest({
            id: updateTodoId,
            text: updateTodoText, completed: updateTodoCompleted
        })
        dispatch({ group: "RestReducer", name: "updateTodo", fetch: req })
        setUpdateTodoId(0)
        setUpdateTodoText("")
        setUpdateTodoComplted(false)

    }

    const handleDeleteTodo = (id: number) => {
        const req = TestApiRequests.deleteTodoRequest(id)
        dispatch({ group: "RestReducer", name: "deleteTodo", fetch: req })
    }

    useEffect(() => {
        const req = TestApiRequests.getTodosRequest()
        dispatch({ group: "RestReducer", name: "todos", fetch: req })
    }, [])

    const renderTodos = () => {
        if (todos.loading) {
            return <h4>Loading todos ..</h4>
        } else if (todos.error) {
            return <h4>Error while getting todos : ${todos.error.toString()}</h4>
        } else if (todos.data) {
            return <ul className="todos-list">
                {todos.data.map(t => <li key={t.id}>
                    <h4>{t.text}</h4>
                    {t.completed && <input type="checkbox" checked={t.completed} />}
                    <div>
                        <button onClick={() => {
                            setUpdateTodoId(t.id)
                            setUpdateTodoText(t.text)
                            setUpdateTodoComplted(t.completed)
                        }}>Update Todo</button>,
                        <button onClick={() => handleDeleteTodo(t.id)}>Delete Todo</button>
                    </div>
                </li>)}
            </ul>
        } else {
            return null
        }
    }

    const renderCreateTodo = () => {
        if (createTodo.loading) {
            return <h4>Creating todo ...</h4>
        } else if (createTodo.error) {
            return <h4>Error while creating todo..{createTodo.error.toString()}</h4>
        } else {
            return null
        }
    }


    const renderUpdateTodo = () => {
        if (updateTodo.loading) {
            return <h4>Updating todo ...</h4>
        } else if (updateTodo.error) {
            return <h4>Error while updating todo..{updateTodo.error.toString()}</h4>
        } else {
            return null;
        }
    }

    const renderDeleteTodo = () => {
        if (deleteTodo.loading) {
            return <h4>Deleting todo ...</h4>
        } else if (deleteTodo.error) {
            return <h4>Error while deleting todo..{deleteTodo.error.toString()}</h4>
        } else {
            return null;
        }
    }

    return (
        <div className="rest-typeops">
            <h3>Type Ops :</h3>
            <p> Create/Update/Deelte Todo and see list gets updated accordingly when server response ok.</p>
            {renderTodos()}
            <div>
                <div>
                    <label htmlFor="">New Todo: </label>
                    <input value={newTodoText} onChange={handleNewTodoTextChange} />
                </div>
                <div>
                    <button onClick={handleAddTodo}>Add Todo</button>
                </div>
            </div>
            {(updateTodoText.length > 0) && <Modal

                isOpen={true}>
                <div>
                    <div>
                        Text:
                      <input value={updateTodoText} onChange={handleUpdateTodoTextChange} />
                    </div>
                    <div>
                        Completed:
                        <input type="checkbox"
                            checked={updateTodoCompleted} onChange={handleUpdateTodoCompletedChange} />

                    </div>
                    <div>
                        <button onClick={handleUpdateTodo}>Update Todo</button>
                    </div>
                </div>
            </Modal>}
            {renderCreateTodo()}
            {renderUpdateTodo()}
            {renderDeleteTodo()}
        </div>);
}

export default RestTodoTypeOps;