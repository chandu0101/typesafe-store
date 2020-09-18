import testApiTypes from "../types";
import { FetchVariants } from "@typesafe-store/store";




class TestApiRequests {

    static getPostsRequest(): NonNullable<testApiTypes.requests.GetPosts["_fmeta"]> {
        return {
            type: FetchVariants.GET, url: { path: "https://xpphx.sse.codesandbox.io/posts" },
        }
    }

    static createPostRequest(body: Omit<testApiTypes.Post, "id">): NonNullable<testApiTypes.requests.CreatePost["_fmeta"]> {
        return {
            type: FetchVariants.POST,
            body,
            url: { path: "https://xpphx.sse.codesandbox.io/posts" }
        }
    }

    static updatePostRequest(body: testApiTypes.Post): NonNullable<testApiTypes.requests.UpdatePost["_fmeta"]> {
        return {
            type: FetchVariants.PUT,
            body,
            url: { path: "https://xpphx.sse.codesandbox.io/posts" }
        }
    }

    static deletePostRequest(id: number): NonNullable<testApiTypes.requests.DeletePost["_fmeta"]> {
        return {
            type: FetchVariants.DELETE,
            body: {},
            url: { path: "https://xpphx.sse.codesandbox.io/posts/{id}", params: { id } }
        }
    }

    static longTaskRequest(abortable: boolean): NonNullable<testApiTypes.requests.LongTask["_fmeta"]> {
        return {
            type: FetchVariants.GET, url: { path: "https://xpphx.sse.codesandbox.io/longtask" },
            abortable
        }
    }

    static offlineTaskRequest(offline: boolean): NonNullable<testApiTypes.requests.OfflineTask["_fmeta"]> {
        return {
            type: FetchVariants.GET, url: { path: "https://xpphx.sse.codesandbox.io/offline" },
            offline
        }
    }

    static getTodosRequest(): NonNullable<testApiTypes.requests.GetTodos["_fmeta"]> {
        return {
            type: FetchVariants.GET, url: { path: "https://xpphx.sse.codesandbox.io/todos" },
        }
    }

    static createTodoRequest(body: Omit<testApiTypes.Todo, "id">): NonNullable<testApiTypes.requests.CreateTodo["_fmeta"]> {
        return {
            type: FetchVariants.POST,
            body,
            url: { path: "https://xpphx.sse.codesandbox.io/todos" }
        }
    }

    static updateTodoRequest(body: testApiTypes.Todo): NonNullable<testApiTypes.requests.UpdateTodo["_fmeta"]> {
        return {
            type: FetchVariants.PUT,
            body,
            url: { path: "https://xpphx.sse.codesandbox.io/todos" }
        }
    }

    static deleteTodoRequest(id: number): NonNullable<testApiTypes.requests.DeleteTodo["_fmeta"]> {
        return {
            type: FetchVariants.DELETE,
            body: {},
            url: { path: "https://xpphx.sse.codesandbox.io/todos/{id}", params: { id } }
        }
    }

    static getTodosOptimisticRequest(): NonNullable<testApiTypes.requests.GetTodosOptimistic["_fmeta"]> {
        return {
            type: FetchVariants.GET, url: { path: "https://xpphx.sse.codesandbox.io/todos-optimistic" },
        }
    }

    static createTodoOptimisticRequest(body: Omit<testApiTypes.Todo, "id">, optimisticResponse: testApiTypes.Todo): NonNullable<testApiTypes.requests.CreateTodoOptimistic["_fmeta"]> {
        return {
            type: FetchVariants.POST,
            body,
            url: { path: "https://xpphx.sse.codesandbox.io/todos-optimistic" },
            optimisticResponse
        }
    }

    static updateTodoOptimisticRequest(body: testApiTypes.Todo, optimisticResponse: testApiTypes.Todo): NonNullable<testApiTypes.requests.UpdateTodoOptimistic["_fmeta"]> {
        return {
            type: FetchVariants.PUT,
            body,
            url: { path: "https://xpphx.sse.codesandbox.io/todos-optimistic" },
            optimisticResponse
        }
    }

    static deleteTodoOptimisticRequest(id: number, optimisticResponse: testApiTypes.TodoDeelteResponse): NonNullable<testApiTypes.requests.DeleteTodoOptimistic["_fmeta"]> {
        return {
            type: FetchVariants.DELETE,
            body: {},
            url: { path: "https://xpphx.sse.codesandbox.io/todos-optimistic/{id}", params: { id } },
            optimisticResponse
        }
    }




}

export default TestApiRequests;