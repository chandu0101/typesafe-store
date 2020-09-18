
           // this file is auto generated on 2020-06-10T00:17:04.424Z, don't modify it
           import {Selector} from "@typesafe-store/store"
           import { createSelector } from "@typesafe-store/store";
import { AppState } from "../..";
import testApiTypes from "../../apis/rest/test-api/types";
export const postsSelector:Selector<AppState,testApiTypes.requests.GetPosts> = {fn:(state: AppState): testApiTypes.requests.GetPosts => state.rest.posts,dependencies:{"rest":["posts"]}}
export const createPostSelector:Selector<AppState,testApiTypes.requests.CreatePost> = {fn:(state: AppState): testApiTypes.requests.CreatePost => state.rest.createPost,dependencies:{"rest":["createPost"]}}
export const updatePostSelector:Selector<AppState,testApiTypes.requests.UpdatePost> = {fn:(state: AppState): testApiTypes.requests.UpdatePost => state.rest.updatePost,dependencies:{"rest":["updatePost"]}}
export const deletePostSelector:Selector<AppState,testApiTypes.requests.DeletePost> = {fn:(state: AppState): testApiTypes.requests.DeletePost => state.rest.deletePost,dependencies:{"rest":["deletePost"]}}
export const longTaskSelector:Selector<AppState,testApiTypes.requests.LongTask> = {fn:(state: AppState): testApiTypes.requests.LongTask => state.rest.longTask,dependencies:{"rest":["longTask"]}}
export const offlineTaskSelector:Selector<AppState,testApiTypes.requests.OfflineTask> = {fn:(state: AppState): testApiTypes.requests.OfflineTask => state.rest.offlineTask,dependencies:{"rest":["offlineTask"]}}
export const todosSelector:Selector<AppState,testApiTypes.requests.GetTodos> = {fn:(state: AppState): testApiTypes.requests.GetTodos => state.rest.todos,dependencies:{"rest":["todos"]}}
export const createTodoSelector:Selector<AppState,testApiTypes.requests.CreateTodo> = {fn:(state: AppState): testApiTypes.requests.CreateTodo => state.rest.createTodo,dependencies:{"rest":["createTodo"]}}
export const updateTodoelector:Selector<AppState,testApiTypes.requests.UpdateTodo> = {fn:(state: AppState): testApiTypes.requests.UpdateTodo => state.rest.updateTodo,dependencies:{"rest":["updateTodo"]}}
export const deleteTodoSelector:Selector<AppState,testApiTypes.requests.DeleteTodo> = {fn:(state: AppState): testApiTypes.requests.DeleteTodo => state.rest.deleteTodo,dependencies:{"rest":["deleteTodo"]}}
export const todosOptimisticSelector:Selector<AppState,testApiTypes.requests.GetTodosOptimistic> = {fn:(state: AppState): testApiTypes.requests.GetTodosOptimistic =>
    state.rest.todosOptimistic,dependencies:{"rest":["todosOptimistic"]}}
export const createTodoOptimisticSelector:Selector<AppState,testApiTypes.requests.CreateTodoOptimistic> = {fn:(state: AppState): testApiTypes.requests.CreateTodoOptimistic =>
    state.rest.createTodoOpimistic,dependencies:{"rest":["createTodoOpimistic"]}}
export const updateTodoOptimisticelector:Selector<AppState,testApiTypes.requests.UpdateTodoOptimistic> = {fn:(state: AppState): testApiTypes.requests.UpdateTodoOptimistic =>
    state.rest.updateTodoOptimistic,dependencies:{"rest":["updateTodoOptimistic"]}}
export const deleteTodoOptimisticSelector:Selector<AppState,testApiTypes.requests.DeleteTodoOptimistic> = {fn:(state: AppState): testApiTypes.requests.DeleteTodoOptimistic =>
    state.rest.deleteTodoOptimistic,dependencies:{"rest":["deleteTodoOptimistic"]}}

          