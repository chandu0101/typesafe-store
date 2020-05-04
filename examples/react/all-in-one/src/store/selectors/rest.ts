import { createSelector } from "@typesafe-store/store";
import { AppState } from "..";
import testApiTypes from "../apis/rest/test-api/types";



const postsSelector = createSelector((state: AppState): testApiTypes.requests.GetPosts => state.rest.posts)

const createPostSelector = createSelector((state: AppState): testApiTypes.requests.CreatePost =>
    state.rest.createPost)

const updatePostSelector = createSelector((state: AppState): testApiTypes.requests.UpdatePost => state.rest.updatePost)

const deletePostSelector = createSelector((state: AppState): testApiTypes.requests.DeletePost => state.rest.deletePost)

const longTaskSelector = createSelector((state: AppState): testApiTypes.requests.LongTask => state.rest.longTask)

const offlineTaskSelector = createSelector((state: AppState): testApiTypes.requests.OfflineTask => state.rest.offlineTask)

const todosSelector = createSelector((state: AppState): testApiTypes.requests.GetTodos => state.rest.todos)

const createTodoSelector = createSelector((state: AppState): testApiTypes.requests.CreateTodo =>
    state.rest.createTodo)

const updateTodoelector = createSelector((state: AppState): testApiTypes.requests.UpdateTodo => state.rest.updateTodo)

const deleteTodoSelector = createSelector((state: AppState): testApiTypes.requests.DeleteTodo => state.rest.deleteTodo)