# typesafe-store


### Work In Progress

Things to do before initial release : 

- [ ] Navigation (test react-native,nativescript, nextjs)
- [ ] Multi Threading (thread pools, web workers)
- [ ] Frame work glues (react : done, lit-html,angular,vue,haunted,stencil,ionic)
- [ ] Creat TypeSafe Store App (react,lit-html,angular,vue,haunted,stencil,ionic)
- [ ] Brand new Dev tools
- [ ] action creators for async props in selectors.
- [ ] store meta information for sets and maps 
- [ ] webpack plugin
- [ ]

TypeSafe Store is a library which manages all state needs of your application, you define your app state using classes in mutable way `transformer` package converts them into immutable reducers in compile time.

If you're familiar with redux you know what reducer is..., if not reducer is a function which takes two paramaeters a state object and an action and returns a new state object without modifying original state.

### Example 

```ts
  // a simple reducer
  import {v1 as uuid} from "uuid" // random string generator 

  type Todo {id:string,text:string,completed:boolean}
  
  const CREATE_TODO = "CREATE_TODO"
  const UPDATE_TODO = "UPDATE_TODO"
  const DELETE_TODO = "DELETE_TODO"

  type CreateTodoActionType = { type: typeof CREATE_TODO,payload:{text:string} }

  type UpdateTodoActionType = { type: typeof UPDATE_TODO, payload: {id:string,text:string,completed:boolean} }

  type DeleteTodoActionType = { type:typeof UPDATE_TODO,
    payload: {id:string}
  }

  type Action = CreateTodoActionType | UpdateTodoActionType } DleteTodoActionType
 
 function reducer(state:Todo[] = [],action:Action) {
    
    switch(action.type) {
      case "CREATE_TODO": {
         const {text} = action.payload;
         const todo:Todo = { id:uuid(),text,completed:false }
         return state.concat(todo) // see we're not mutating original input
      }
      case "UPDATE_TODO": {
         const {id,text,completed} = action.payload 
         return state.map(todo => todo.id === id ? {...todo,completed,text}: todo)
      }
      case "DELETE_TODO": {
         const {id} = action.payload
         return state.filter(todo => todo.id !== id)
      }

      default:
        return state; 
    }
 }

```

In TypeSafe Store we define the same reducer like below :

```ts
import {v1 as uuid} from "uuid" // random string generator 

  type Todo {id:string,text:string,completed:boolean}
 
 class TodoReducer { 
    
    todos:Todo[] = []

    createTodo(text:string) {
        const todo:Todo = { id:uuid(),text,completed:false };
        this.todos.push(todo) // mutableway
    }

    updateTodo(todo: Todo) {
      this.todos[todo.id] = todo;
    }

    deleteTodo(id:string) {
      delete this.todos[id]
    }

 }

```
`transformer` package converts this class into a immutable reducer like above in compile time without any runtime over head.

>If you're wondering about why we need immutability, if we update our state in immutable way then we can easily check which part of our app state changed and update those parts(DOM) in more efficient way.


# Packages 

### Transformer: 
 
 This is where all magic happens , we define state using classes and it converts classes to reducers in compile time(no runtime cost like redux-toolkit)
 
***Example:***

State :

```ts
type Book = { name: string, year: number }
type Todo = { id: string, completed?: boolean, text: string }
class Sample {
    name = "First"
    count = 1;
    person = { name: "P121", age: 10 }
    books: Book[] = []
    optionalTodos: (Todo | undefined)[] = []
    config: {
        count?: number, status?: string,
        obj1?: { one: number, obj1c?: { value: string } },
        obj2?: { two: number, obj2a?: { name: string, obj2ao?: { value: string } }[] },
        arr1?: string[],
        arr2?: Array<Array<{ name: string }>>,
        arr3?: Array<Array<{ name: string } | undefined> | undefined>
    } = {}
    changeName(name: string) {
        this.name = name
    }
    increment() {
        this.count++
        this.count++
    }
    chnagePersonName(name: string) {
        this.person.name = name
    }
    changePersonAge(age: number) {
        this.person.age = age
    }
    addBooks(books: Book[]) {
        this.books.push(...books)
    }
    removeLastBook() {
        this.books.pop()
    }
    removeFirstBook() {
        this.books.splice(0, 1);
    }
    replaceBooks(books: Book[]) {
        this.books = books;
    }
    fillBookAt0(book: Book) {
        this.books.fill(book, 0)
    }
    modifyBookAt0() {
        this.books[1].name = "modifiedName"
    }
    modifyBookAtIndex(index: number) {
        this.books[index].name = `modified${index}Name`
    }
    chnageNameAndCount(name: string, count: number) {
        this.person.name = name
        this.count = count
    }

    changeConfigCount(count: number) {
        this.config.count = count;
    }

    modifyConfigObj1() {
        this.config.obj1!.one++
    }

    setConfigObj1(ob1: Sample["config"]["obj1"]) {
        this.config.obj1 = ob1
    }

    setConfigObj1C(v: string) {
        this.config.obj1!.obj1c!.value = v
    }

    setConfigObj2(ob2: Sample["config"]["obj2"]) {
        this.config.obj2 = ob2
    }

    setConfigObj2a(v: string) {
        this.config.obj2!.obj2a![0].obj2ao!.value = v
    }
    modifyConfigArr2(v: string) {
        this.config.arr2![0][0].name = v
    }

    setConfigArr2(a: Sample["config"]["arr2"]) {
        this.config.arr2 = a;
    }

    addTodo(todo: Todo) {
        this.optionalTodos.push(todo)
    }

    completeFirstTodo() {
        this.optionalTodos[0]!.completed = true
    }

    completeTodoAtIndex(index: number) {
        this.optionalTodos[index]!.completed = true
    }

    modifyConfigObjectArr2(input: string) {
        this.config.arr2![0][1].name = input
    }

}
```

***Compiletime generated reducer:****

```ts
// this file is auto generated on 2020-02-06T03:49:49.385Z, don't modify it
import { ReducerGroup } from "@typesafe-store/reducer"
import { stat } from "fs"

export type SampleState = { name: string, count: number, person: { name: string; age: number; }, books: Book[], optionalTodos: (Todo | undefined)[], config: { count?: number | undefined; status?: string | undefined; obj1?: { one: number; obj1c?: { value: string; } | undefined; } | undefined; obj2?: { two: number; obj2a?: { name: string; obj2ao?: { value: string; } | undefined; }[] | undefined; } | undefined; arr1?: string[] | undefined; arr2?: { name: string; }[][] | undefined; arr3?: (({ name: string; } | undefined)[] | undefined)[] | undefined; } }

export type SampleAction = { name: "changeName", group: "Sample", payload: string } | { name: "increment", group: "Sample" } | { name: "chnagePersonName", group: "Sample", payload: string } | { name: "changePersonAge", group: "Sample", payload: number } | { name: "addBooks", group: "Sample", payload: Book[] } | { name: "removeLastBook", group: "Sample" } | { name: "removeFirstBook", group: "Sample" } | { name: "replaceBooks", group: "Sample", payload: Book[] } | { name: "fillBookAt0", group: "Sample", payload: Book } | { name: "modifyBookAt0", group: "Sample" } | { name: "modifyBookAtIndex", group: "Sample", payload: number } | { name: "chnageNameAndCount", group: "Sample", payload: { name: string, count: number } } | { name: "changeConfigCount", group: "Sample", payload: number } | { name: "modifyConfigObj1", group: "Sample" } | { name: "setConfigObj1", group: "Sample", payload: { one: number; obj1c?: { value: string; } | undefined; } | undefined } | { name: "setConfigObj1C", group: "Sample", payload: string } | { name: "setConfigObj2", group: "Sample", payload: { two: number; obj2a?: { name: string; obj2ao?: { value: string; } | undefined; }[] | undefined; } | undefined } | { name: "setConfigObj2a", group: "Sample", payload: string } | { name: "modifyConfigArr2", group: "Sample", payload: string } | { name: "setConfigArr2", group: "Sample", payload: { name: string; }[][] | undefined } | { name: "addTodo", group: "Sample", payload: Todo } | { name: "completeFirstTodo", group: "Sample" } | { name: "completeTodoAtIndex", group: "Sample", payload: number } | { name: "modifyConfigObjectArr2", group: "Sample", payload: string }

export const SampleReducerGroup: ReducerGroup<SampleState, SampleAction, "Sample"> = {
    r:
        (state: SampleState, action: SampleAction) => {
            const t = action.name
            switch (t) {
                case "changeName": {
                    const name = (action as any).payload
                    return { ...state, name: name }
                }
                case "increment": {
                    let _tr_count = state.count
                    _tr_count += 1
                    _tr_count += 1
                    return { ...state, count: _tr_count }
                }
                case "chnagePersonName": {
                    const name = (action as any).payload
                    return { ...state, person: { ...state.person, name: name } }
                }
                case "changePersonAge": {
                    const age = (action as any).payload
                    return { ...state, person: { ...state.person, age: age } }
                }
                case "addBooks": {
                    const books = (action as any).payload
                    return { ...state, books: state.books.concat(...books) }
                }
                case "removeLastBook": {

                    return { ...state, books: state.books.slice(0, -1) }
                }
                case "removeFirstBook": {

                    return { ...state, books: [...state.books.slice(0, 0), ...state.books.slice(1)] }
                }
                case "replaceBooks": {
                    const books = (action as any).payload
                    return { ...state, books: books }
                }
                case "fillBookAt0": {
                    const book = (action as any).payload
                    return { ...state, books: [...state.books].fill(book, 0) }
                }
                case "modifyBookAt0": {

                    return { ...state, books: [...state.books.map((v, _i) => _i === 1 ? { ...v, name: "modifiedName" } : v)] }
                }
                case "modifyBookAtIndex": {
                    const index = (action as any).payload
                    return { ...state, books: [...state.books.map((v, _i) => _i === index ? { ...v, name: `modified${index}Name` } : v)] }
                }
                case "chnageNameAndCount": {
                    const { name, count } = (action as any).payload
                    return { ...state, person: { ...state.person, name: name }, count: count }
                }
                case "changeConfigCount": {
                    const count = (action as any).payload
                    return { ...state, config: { ...state.config, count: count } }
                }
                case "modifyConfigObj1": {

                    return { ...state, config: { ...state.config, obj1: state.config.obj1 ? { ...state.config.obj1, one: state.config.obj1!.one + 1 } : state.config.obj1 } }
                }
                case "setConfigObj1": {
                    const ob1 = (action as any).payload
                    return { ...state, config: { ...state.config, obj1: ob1 } }
                }
                case "setConfigObj1C": {
                    const v = (action as any).payload
                    return { ...state, config: { ...state.config, obj1: state.config.obj1 ? state.config.obj1 ? { ...state.config.obj1, obj1c: state.config.obj1!.obj1c ? { ...state.config.obj1!.obj1c, value: v } : state.config.obj1!.obj1c } : state.config.obj1 : state.config.obj1 } }
                }
                case "setConfigObj2": {
                    const ob2 = (action as any).payload
                    return { ...state, config: { ...state.config, obj2: ob2 } }
                }
                case "setConfigObj2a": {
                    const v = (action as any).payload
                    return state;
                }
                case "modifyConfigArr2": {
                    const v = (action as any).payload
                    return state
                }
                case "setConfigArr2": {
                    const a = (action as any).payload
                    return { ...state, config: { ...state.config, arr2: a } }
                }
                case "addTodo": {
                    const todo = (action as any).payload
                    return { ...state, optionalTodos: state.optionalTodos.concat(todo) }
                }
                case "completeFirstTodo": {

                    return { ...state, optionalTodos: [...state.optionalTodos.map((v, _i) => _i === 0 ? v ? { ...v, completed: true } : v : v)] }
                }
                case "completeTodoAtIndex": {
                    const index = (action as any).payload
                    return { ...state, optionalTodos: [...state.optionalTodos.map((v, _i) => _i === index ? v ? { ...v, completed: true } : v : v)] }
                }
                case "modifyConfigObjectArr2": {
                    const input = (action as any).payload
                    return state
                }
            }
        }
    , g: "Sample", ds: { name: "First", count: 1, person: { name: "P121", age: 10 }, books: [], optionalTodos: [], config: {} }, m: {}
}

```
 
              
### Store :               
TODO
