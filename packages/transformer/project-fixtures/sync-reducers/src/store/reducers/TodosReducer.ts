

import { v1 as uuid } from "uuid"

type Todo = { text: string, id: string, completed: boolean }

class TodosReducer {

    list: Todo[] = []

    createTodo(text: string) {
        this.list.push({ id: uuid(), text, completed: false })
    }

    markFirstTodoComplete() {
        this.list[0].completed = true
    }

    deleteTodoAtIndex(index: number) {
        this.list.splice(index, 1)
    }

}