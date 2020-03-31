

import { v1 as uuid } from "uuid"

type Todo = { text: string, id: string, completed: boolean }


class TodosReducer {

    list: Todo[] = []

    createTodo(text1: string) {
        this.list.push({ id: uuid(), text: text1, completed: false })
    }

    markFirstTodoComplete() {
        this.list[0].completed = true
    }

    deleteTodoAtIndex(index: number) {
        this.list.splice(index, 1)
    }

    chnageSecondTodoOnly(index: number) {
        if (index === 1) {
            this.list[index].completed = true
        }
    }


    markAllOfThemAsCompleted(indexes: number[]) {
        indexes.forEach(i => {
            this.list[i].completed = true
        })
    }
}