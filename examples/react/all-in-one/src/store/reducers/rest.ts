import testApiTypes from "../apis/rest/test-api/types";
import {
  AppendToList,
  UpdateList,
  DeleteFromList,
} from "@typesafe-store/store";

class RestReducer {
  posts: testApiTypes.requests.GetPosts = {};

  createPost: testApiTypes.requests.CreatePost = {};

  updatePost: testApiTypes.requests.UpdatePost = {};

  deletePost: testApiTypes.requests.DeletePost = {};

  longTask: testApiTypes.requests.LongTask = {};

  offlineTask: testApiTypes.requests.OfflineTask = {};

  todos: testApiTypes.requests.GetTodos = {};

  createTodo: testApiTypes.requests.CreateTodo &
    AppendToList<RestReducer["todos"]["data"]> = {};

  updateTodo: testApiTypes.requests.UpdateTodo &
    UpdateList<RestReducer["todos"]["data"]> = {};

  deleteTodo: testApiTypes.requests.DeleteTodo &
    DeleteFromList<RestReducer["todos"]["data"]> = {};

  todosOptimistic: testApiTypes.requests.GetTodosOptimistic = {};

  createTodoOpimistic: testApiTypes.requests.CreateTodoOptimistic &
    AppendToList<RestReducer["todosOptimistic"]["data"]> = {};

  updateTodoOptimistic: testApiTypes.requests.UpdateTodoOptimistic &
    UpdateList<RestReducer["todosOptimistic"]["data"]> = {};

  deleteTodoOptimistic: testApiTypes.requests.DeleteTodoOptimistic &
    DeleteFromList<RestReducer["todosOptimistic"]["data"]> = {};
}
