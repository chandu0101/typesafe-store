

export type Todo = { title: string, completed: boolean, id: string }


export const enum TodoVisibilityFilter {
    SHOW_ALL = "SHOW_ALL",
    SHOW_ACTIVE = "SHOW_ACTIVE",
    SHOW_COMPLETED = "SHOW_COMPLETED"
}