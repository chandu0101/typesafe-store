

import { Todo, TodoVisibilityFilter } from "../types/index"
import { Todos2 } from "./type2"
import { v1 as uuid } from "uuid"

const s: Todos2 = "25"
class TodosReducer {

    list: Todo[] = []

    visibility_filter: TodoVisibilityFilter = TodoVisibilityFilter.SHOW_ALL

    createTodo(text: string) {
        this.list.push({ title: text, completed: false, id: uuid() })
    }
    deleteTodo(id: string) {
        this.list = this.list.filter(t => t.id !== id)
    }
    editTodo(id: string, text: string) {
        this.list = this.list.map(t => t.id === id ? { ...t, title: text } : t)
    }
    completeTodo(id: string) {
        this.list = this.list.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
    }
    completeAllTodos() {
        const areAllmarked = this.list.every(t => t.completed)
        this.list = this.list.map(t => ({ ...t, completed: !areAllmarked }))
    }

    clearCompleted() {
        this.list = this.list.filter(t => t.completed === false)
    }

    showTodos(filter: TodoVisibilityFilter) {
        this.visibility_filter = filter
    }

}