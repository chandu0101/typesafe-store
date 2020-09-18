
           // this file is auto generated on 2020-06-09T23:57:00.508Z, don't modify it
           import { ReducerGroup,FetchVariants,FetchRequest,SyncActionOffloadStatus} from "@typesafe-store/store"
           import testApiTypes from "../../apis/rest/test-api/types";
import {
  AppendToList,
  UpdateList,
  DeleteFromList,
} from "@typesafe-store/store";

           export type RestReducerState = {posts:testApiTypes.requests.GetPosts,createPost:testApiTypes.requests.CreatePost,updatePost:testApiTypes.requests.UpdatePost,deletePost:testApiTypes.requests.DeletePost,longTask:testApiTypes.requests.LongTask,offlineTask:testApiTypes.requests.OfflineTask,todos:testApiTypes.requests.GetTodos,createTodo:testApiTypes.requests.CreateTodo,updateTodo:testApiTypes.requests.UpdateTodo,deleteTodo:testApiTypes.requests.DeleteTodo,todosOptimistic:testApiTypes.requests.GetTodosOptimistic,createTodoOpimistic:testApiTypes.requests.CreateTodoOptimistic,updateTodoOptimistic:testApiTypes.requests.UpdateTodoOptimistic,deleteTodoOptimistic:testApiTypes.requests.DeleteTodoOptimistic}
           
           export type RestReducerAction = {name:"no_sync_reducers",group:"RestReducer"}
  
           export type RestReducerAsyncAction = {name:"posts",group:"RestReducer", fetch: NonNullable<testApiTypes.requests.GetPosts["_fmeta"]>  } | {name:"createPost",group:"RestReducer", fetch: NonNullable<testApiTypes.requests.CreatePost["_fmeta"]>  } | {name:"updatePost",group:"RestReducer", fetch: NonNullable<testApiTypes.requests.UpdatePost["_fmeta"]>  } | {name:"deletePost",group:"RestReducer", fetch: NonNullable<testApiTypes.requests.DeletePost["_fmeta"]>  } | {name:"longTask",group:"RestReducer", fetch: NonNullable<testApiTypes.requests.LongTask["_fmeta"]>  } | {name:"offlineTask",group:"RestReducer", fetch: NonNullable<testApiTypes.requests.OfflineTask["_fmeta"]>  } | {name:"todos",group:"RestReducer", fetch: NonNullable<testApiTypes.requests.GetTodos["_fmeta"]>  } | {name:"createTodo",group:"RestReducer", fetch: NonNullable<testApiTypes.requests.CreateTodo["_fmeta"]>  } | {name:"updateTodo",group:"RestReducer", fetch: NonNullable<testApiTypes.requests.UpdateTodo["_fmeta"]>  } | {name:"deleteTodo",group:"RestReducer", fetch: NonNullable<testApiTypes.requests.DeleteTodo["_fmeta"]>  } | {name:"todosOptimistic",group:"RestReducer", fetch: NonNullable<testApiTypes.requests.GetTodosOptimistic["_fmeta"]>  } | {name:"createTodoOpimistic",group:"RestReducer", fetch: NonNullable<testApiTypes.requests.CreateTodoOptimistic["_fmeta"]>  } | {name:"updateTodoOptimistic",group:"RestReducer", fetch: NonNullable<testApiTypes.requests.UpdateTodoOptimistic["_fmeta"]>  } | {name:"deleteTodoOptimistic",group:"RestReducer", fetch: NonNullable<testApiTypes.requests.DeleteTodoOptimistic["_fmeta"]>  }

           export type RestReducerGroupType =  ReducerGroup<RestReducerState,RestReducerAction,"RestReducer",RestReducerAsyncAction>
  
           export const RestReducerGroup: RestReducerGroupType  = { r: 
     (_trg_satate:RestReducerState,action:RestReducerAction) => {
       return _trg_satate;
      }
     ,g:"RestReducer",ds:{posts:{}, createPost:{}, updatePost:{}, deletePost:{}, longTask:{}, offlineTask:{}, todos:{}, createTodo:{}, updateTodo:{}, deleteTodo:{}, todosOptimistic:{}, createTodoOpimistic:{}, updateTodoOptimistic:{}, deleteTodoOptimistic:{}},m:{async:undefined,a:{posts:{f: {response:"json"} },createPost:{f: {response:"json",body:"json"} },updatePost:{f: {response:"json",body:"json"} },deletePost:{f: {response:"text",body:"json"} },longTask:{f: {response:"text"} },offlineTask:{f: {response:"json"} },todos:{f: {response:"json"} },createTodo:{f: {response:"json",typeOps: { name:"AppendToList", propAccess:"todos.data" },body:"json"} },updateTodo:{f: {response:"json",typeOps: { name:"UpdateList", propAccess:"todos.data" },body:"json"} },deleteTodo:{f: {response:"json",typeOps: { name:"DeleteFromList", propAccess:"todos.data" },body:"json"} },todosOptimistic:{f: {response:"json"} },createTodoOpimistic:{f: {response:"json",typeOps: { name:"AppendToList", propAccess:"todosOptimistic.data" },body:"json"} },updateTodoOptimistic:{f: {response:"json",typeOps: { name:"UpdateList", propAccess:"todosOptimistic.data" },body:"json"} },deleteTodoOptimistic:{f: {response:"json",typeOps: { name:"DeleteFromList", propAccess:"todosOptimistic.data" },body:"json"} }},dpersistKeys:[]}}
  
          

          