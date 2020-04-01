import { AppReducers } from "./store";
import { TypeSafeStore, Action } from "@typesafe-store/store"
import { View } from "./view";
import { TodosReducerAction } from "./store/reducers/generated/todos-reducer-gen";
import { TodoVisibilityFilter } from "./store/types";



export class AppController {

    todosSubscriber = (action: Action) => {
        this.handleTodosStateChange(action as any)
    }

    private todosUnsubscriber: () => any


    private lastActiveRoute: TodoVisibilityFilter | null = null

    private activeRoute = ""

    constructor(private readonly store: TypeSafeStore<AppReducers>, private readonly view: View) {

        this.todosUnsubscriber = store.subscribe(["todos"], this.todosSubscriber)
        view.bindAddItem(this.addItem)
        view.bindEditItemSave(this.editItemSave)
        view.bindEditItemCancel(this.editItemCancel)
        view.bindRemoveItem(this.removeItem)
        view.bindToggleItem(this.toggleCompleted)
        view.bindRemoveCompleted(this.removeCompletedItems)
        view.bindToggleAll(this.toggleAll)

    }

    private handleTodosStateChange(action: TodosReducerAction) {
        if (action.name === "createTodo") {
            // this.view.render("clearNewTodo")
            this.view.clearNewTodo()
            this.filter(true)
        } else if (action.name === "editTodo") {
            this.view.editItemDone(action.payload.id, action.payload.text)
        } else if (action.name === "deleteTodo") {
            this.filter()
            this.view.removeItem(action.payload)
        } else if (action.name === "clearCompleted") {
            this.filter()
        } else if (action.name === "completeTodo") {
            const t = this.store.state.todos.list.find(t => t.id === action.payload)!
            this.view.setItemComplete(t.id, t.completed)
            this.filter()
        } else if (action.name === "completeAllTodos") {
            this.filter()
        } else if (action.name === "showTodos") {
            this.view.updateFilterButtons(this.activeRoute)
            this.filter()
        }
    }

    private getTodosBasedOnFilter = () => {
        const filter = this.store.state.todos.visibility_filter
        let todos = this.store.state.todos.list
        if (filter === TodoVisibilityFilter.SHOW_ACTIVE) {
            todos = todos.filter(t => !t.completed)
        } else if (filter === TodoVisibilityFilter.SHOW_COMPLETED) {
            todos = todos.filter(t => t.completed)
        }
        return todos
    }

    private filter = (force?: boolean) => {
        if (force || this.lastActiveRoute !== this.store.state.todos.visibility_filter) {
            const todos = this.getTodosBasedOnFilter()
            this.view.showItems(todos)
        }
    }


    private addItem = (title: string) => {
        if (title.trim() === "") {
            return;
        }
        this.store.dispatch({ group: "TodosReducer", name: "createTodo", payload: title })
    }

    private editItemSave = (id: string, title: string) => {
        if (title.length) {
            this.store.dispatch({ group: "TodosReducer", name: "editTodo", payload: { id, text: title } })
        } else {
            this.removeItem(id)
        }
    }

    private editItemCancel = (id: string) => {
        const todo = this.store.state.todos.list.find(t => t.id === id)!
        this.view.editItemDone(id, todo.title)
    }

    private removeItem = (id: string) => {
        this.store.dispatch({ group: "TodosReducer", name: "deleteTodo", payload: id })
    }

    private removeCompletedItems = () => {
        this.store.dispatch({ group: "TodosReducer", name: "clearCompleted" })
    }

    private toggleCompleted = (id: string) => {
        this.store.dispatch({ group: "TodosReducer", name: "completeTodo", payload: id })
    }

    private toggleAll = (completed: boolean) => {
        this.store.dispatch({ group: "TodosReducer", name: "completeAllTodos" })
    }

    setRoute = (raw: string) => {
        const route = raw.replace(/^#\//, "")
        this.activeRoute = route
        let filter: TodoVisibilityFilter = TodoVisibilityFilter.SHOW_ALL
        if (route === "all") {
            filter = TodoVisibilityFilter.SHOW_ALL
        } else if (route === "active") {
            filter = TodoVisibilityFilter.SHOW_ACTIVE
        } else if (route === "completed") {
            filter = TodoVisibilityFilter.SHOW_COMPLETED
        }
        this.store.dispatch({ name: "showTodos", group: "TodosReducer", payload: filter })
    }


}