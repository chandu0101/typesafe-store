import { Fetch, FetchPost, FetchPut, FetchDelete } from "@typesafe-store/store"


namespace testApiTypes {

    export type Post = { id: number, title: string, body: string }

    export type Todo = { id: number, text: string, completed: boolean }

    export type TodoDeelteResponse = { id: number }

    export type OfflineTaskResponse = { message: string }

    export type ApiError = Record<string, any>

    export namespace requests {

        export type GetPosts = Fetch<{ path: "https://xpphx.sse.codesandbox.io/posts" }, Post[], ApiError>

        export type CreatePost = FetchPost<{ path: "https://xpphx.sse.codesandbox.io/posts" }, Omit<Post, "id">, Post, ApiError>

        export type UpdatePost = FetchPut<{ path: "https://xpphx.sse.codesandbox.io/posts" }, Post, Post, ApiError>

        export type DeletePost = FetchDelete<{ path: "https://xpphx.sse.codesandbox.io/posts/{id}", params: { id: number } }, {}, string, string>

        export type LongTask = Fetch<{ path: "https://xpphx.sse.codesandbox.io/longtask", }, string, string>

        export type OfflineTask = Fetch<{ path: "https://xpphx.sse.codesandbox.io/offline", }, OfflineTaskResponse, string>

        export type GetTodos = Fetch<{ path: "https://xpphx.sse.codesandbox.io/todos" }, Todo[], ApiError>

        export type CreateTodo = FetchPost<{ path: "https://xpphx.sse.codesandbox.io/todos" }, Omit<Todo, "id">, Todo, ApiError>

        export type UpdateTodo = FetchPut<{ path: "https://xpphx.sse.codesandbox.io/todos" }, Todo, Todo, Record<string, any>>

        export type DeleteTodo = FetchDelete<{ path: "https://xpphx.sse.codesandbox.io/todos/{id}", params: { id: number } }, {}, TodoDeelteResponse, ApiError>
    }
}


export default testApiTypes