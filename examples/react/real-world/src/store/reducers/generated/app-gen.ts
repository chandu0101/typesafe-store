
           // this file is auto generated on 2020-04-23T05:25:25.303Z, don't modify it
           import { ReducerGroup,FetchVariants,PromiseData,FetchRequest } from "@typesafe-store/store"
           import githubRestApiTypes from "../../apis/rest/github/types"
import { GithubApiResponseTransformers as transformers, githubApiTransformerTypes as tTypes } from "../../apis/rest/github/transformers"
import { PaginateAppend } from "@typesafe-store/store"
type SF2 = {
    data: {
        page: number;
        repos: githubRestApiTypes.Repo[];
    };
};

           export type AppReducerState = {repo:githubRestApiTypes.requests.GetRepo,user:githubRestApiTypes.requests.GetUSer,starred:githubRestApiTypes.requests.GetStarred<typeof transformers.getStarredTransformer>
        & PaginateAppend<tTypes.GetStarred["repos"]>,stargazers:githubRestApiTypes.requests.GetStargazers<typeof transformers.getStargazersTransformer>
        & PaginateAppend<tTypes.GetStargazers["users"]>}
           
           export type AppReducerAction = {name:"no_sync_reducers",group:"AppReducer"}
  
           export type AppReducerAsyncAction = {name:"repo",group:"AppReducer", fetch: NonNullable<githubRestApiTypes.requests.GetRepo["_fmeta"]>  } | {name:"user",group:"AppReducer", fetch: NonNullable<githubRestApiTypes.requests.GetUSer["_fmeta"]>  } | {name:"starred",group:"AppReducer", fetch: NonNullable<githubRestApiTypes.requests.GetStarred["_fmeta"]>  } | {name:"stargazers",group:"AppReducer", fetch: NonNullable<githubRestApiTypes.requests.GetStargazers["_fmeta"]>  }
  
           export const AppReducerGroup: ReducerGroup<AppReducerState,AppReducerAction,"AppReducer",AppReducerAsyncAction> = { r: 
     (_trg_satate:AppReducerState,action:AppReducerAction) => {
       return _trg_satate;
      }
     ,g:"AppReducer",ds:{repo:{},user:{},starred:{},stargazers:{}},m:{async:undefined,a:{repo:{f: {response:"json"} },user:{f: {response:"json"} },starred:{f: {response:"json",tf: transformers.getStarredTransformer,typeOps: { name:"PaginateAppend", obj:{"AppReducer":"repos"} }} },stargazers:{f: {response:"json",tf: transformers.getStargazersTransformer,typeOps: { name:"PaginateAppend", obj:{"AppReducer":"users"} }} }}}}
  
          
export const s = "AppReducer";

          