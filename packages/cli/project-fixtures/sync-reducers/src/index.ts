import { store } from "./store";
import { AssertionError, strictEqual, equal, notStrictEqual, } from "assert";
import { watchMain } from "@typesafe-store/cli"



// watchMain()

console.log("Hello");

// const appStore = store

const unsubscribe = store.subscribe(["todos"], () => {
    console.log("Todos Changed");
    console.log("Todos : ", store.state.todos.list);
})

store.dipatch({ name: "createTodo", group: "TodosReducer", payload: "First Todo" })


console.log("AppStore : ", store);

const sleep = (seconds: number) => {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, (seconds * 1000));
    });
};


sleep(60 * 1000)