

import { v1 as uuid } from "uuid"

type Todo = { text: string, id: string, completed: boolean }

class TodosReducer {

    todos: Todo[] = []

    createTodo(text: string) {
        this.todos.push({ id: uuid(), text, completed: false })
    }

    markFirstTodoComplete() {
        this.todos[0].completed = true
    }

    deleteTodoAtIndex(index: number) {
        this.todos.splice(index, 1)
    }

}