import { store } from "./store";
import { AssertionError, strictEqual, equal, notStrictEqual, } from "assert";




const appStore = store


notStrictEqual(appStore.state.todos.list, [])
