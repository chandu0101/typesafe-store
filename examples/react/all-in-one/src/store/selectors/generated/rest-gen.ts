
           // this file is auto generated on 2020-05-04T11:49:09.964Z, don't modify it
           import {Selector,SelectorE} from "@typesafe-store/store"
           import { createSelector } from "@typesafe-store/store";
import { AppState } from "../..";
import testApiTypes from "../../apis/rest/test-api/types";
export const postsSelector:Selector<AppState,testApiTypes.requests.GetPosts> = {fn:(state: AppState): testApiTypes.requests.GetPosts => state.rest.posts,dependencies:{"rest":["posts"]}}
export const createPostSelector:Selector<AppState,testApiTypes.requests.CreatePost> = {fn:(state: AppState): testApiTypes.requests.CreatePost =>
    state.rest.createPost,dependencies:{"rest":["createPost"]}}
export const updatePostSelector:Selector<AppState,testApiTypes.requests.UpdatePost> = {fn:(state: AppState): testApiTypes.requests.UpdatePost => state.rest.updatePost,dependencies:{"rest":["updatePost"]}}
export const deletePostSelector:Selector<AppState,testApiTypes.requests.DeletePost> = {fn:(state: AppState): testApiTypes.requests.DeletePost => state.rest.deletePost,dependencies:{"rest":["deletePost"]}}
export const longTaskSelector:Selector<AppState,testApiTypes.requests.LongTask> = {fn:(state: AppState): testApiTypes.requests.LongTask => state.rest.longTask,dependencies:{"rest":["longTask"]}}
export const offlineTaskSelector:Selector<AppState,testApiTypes.requests.OfflineTask> = {fn:(state: AppState): testApiTypes.requests.OfflineTask => state.rest.offlineTask,dependencies:{"rest":["offlineTask"]}}
export const todosSelector:Selector<AppState,testApiTypes.requests.GetTodos> = {fn:(state: AppState): testApiTypes.requests.GetTodos => state.rest.todos,dependencies:{"rest":["todos"]}}
export const createTodoSelector:Selector<AppState,testApiTypes.requests.CreateTodo> = {fn:(state: AppState): testApiTypes.requests.CreateTodo =>
    state.rest.createTodo,dependencies:{"rest":["createTodo"]}}
export const updateTodoelector:Selector<AppState,testApiTypes.requests.UpdateTodo> = {fn:(state: AppState): testApiTypes.requests.UpdateTodo => state.rest.updateTodo,dependencies:{"rest":["updateTodo"]}}
export const deleteTodoSelector:Selector<AppState,testApiTypes.requests.DeleteTodo> = {fn:(state: AppState): testApiTypes.requests.DeleteTodo => state.rest.deleteTodo,dependencies:{"rest":["deleteTodo"]}}

          