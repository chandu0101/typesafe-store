# typesafe-store

go with tstore standlone for now

### Work In Progress

Things to do before initial release :

- [x] Navigation (test react-native,nativescript, nextjs)
- [ ] Navigation Feature parity with dstore navigation
- [x] Multi Threading (thread pools, web workers)
- [ ] Frame work glues (react : done, lit-html,angular,haunted)
- [ ] Creat TypeSafe Store App (react,lit-html,angular,haunted,ionic)
- [x] Brand new Dev tools
- [x] action creators for async props in selectors.
- [ ] store meta information for sets and maps
- [x] nativescript/react-native networkinfo.
- [x] forms
- [x] storage indexdb, react-native,native script
- [ ] nativescript ui context
- [ ] devtools , when seelctor unsubscribed with reset default ,notify devtools with changed state.
- [ ] graphql query/mutation generation, graphql file uploads , general file uploads,cloudinary plugin.
- [ ] firestore middleware
- [ ] test react useSelector listener
- [x] angular HOC Provider for store
- [ ] publish proto-parser fork
- [ ] consistent naming of provider and selctors/connect, all providers should handle loading in case of storage
- [ ] SSR
- [ ]  REDO UNDO State
- [ ]  Flat Buffers Storage
- [ ]  GRPC module
- [ ]  upload download progress in http modules


# MonoRepo

https://nx.dev/getting-started/tutorials/npm-workspaces-tutorial?utm_medium=website&utm_campaign=homepage_links&utm_content=cta_smarter_tools_techlink


https://github.com/wixplosives/sample-monorepo


# feature parity with other libs
https://zustand-demo.pmnd.rs/


# Realworld Examples:

https://github.com/chandu0101/typesafe-store/tree/master/examples/react/real-world

https://github.com/chandu0101/typesafe-store/tree/master/packages/devtools-app

TypeSafe Store is a library which manages all state needs of your application, you define your app state using classes in mutable way `cli` package converts them into immutable reducers, type safe action in compile time. In Redux you have to write more boilerplate for deifining actions, action creators, immutable state updates etc.. ,all those are generated compile time. In redux when you dispatch an action it blindly goes all reducers of your app example : if you have 40 reducers each with 10 switch statements action is passed to all those , if number of reducers goes it has to do more work(you do the math ..).In TypeSafe store each action is tied to specific group(reducer) meaning when you dispatch an action it will hit only one reducer, if app has 400 reducers, an action will only hit one reducer , typesafe store just scales :) . In redux for async action you have to handle all scenarios fail/loading/success and that to in callback hell, but typesafe store it all handled transparently, this is how you define as an async action https://github.com/chandu0101/typesafe-store/blob/master/examples/react/real-world/src/store/reducers/app.ts#L15 .

# Packages

### CLI:

This is where all magic happens , we define state using classes and it converts classes to reducers in compile time(no runtime cost like redux-toolkit)

**_Example:_**

State :

```ts
type Book = { name: string; year: number };
type Todo = { id: string; completed?: boolean; text: string };
class Sample {
  name = "First";
  count = 1;
  person = { name: "P121", age: 10 };
  books: Book[] = [];
  optionalTodos: (Todo | undefined)[] = [];
  config: {
    count?: number;
    status?: string;
    obj1?: { one: number; obj1c?: { value: string } };
    obj2?: {
      two: number;
      obj2a?: { name: string; obj2ao?: { value: string } }[];
    };
    arr1?: string[];
    arr2?: Array<Array<{ name: string }>>;
    arr3?: Array<Array<{ name: string } | undefined> | undefined>;
  } = {};
  changeName(name: string) {
    this.name = name;
  }
  increment() {
    this.count++;
    this.count++;
  }
  chnagePersonName(name: string) {
    this.person.name = name;
  }
  changePersonAge(age: number) {
    this.person.age = age;
  }
  addBooks(books: Book[]) {
    this.books.push(...books);
  }
  removeLastBook() {
    this.books.pop();
  }
  removeFirstBook() {
    this.books.splice(0, 1);
  }
  replaceBooks(books: Book[]) {
    this.books = books;
  }
  fillBookAt0(book: Book) {
    this.books.fill(book, 0);
  }
  modifyBookAt0() {
    this.books[1].name = "modifiedName";
  }
  modifyBookAtIndex(index: number) {
    this.books[index].name = `modified${index}Name`;
  }
  chnageNameAndCount(name: string, count: number) {
    this.person.name = name;
    this.count = count;
  }

  changeConfigCount(count: number) {
    this.config.count = count;
  }

  modifyConfigObj1() {
    this.config.obj1!.one++;
  }

  setConfigObj1(ob1: Sample["config"]["obj1"]) {
    this.config.obj1 = ob1;
  }

  setConfigObj1C(v: string) {
    this.config.obj1!.obj1c!.value = v;
  }

  setConfigObj2(ob2: Sample["config"]["obj2"]) {
    this.config.obj2 = ob2;
  }

  setConfigObj2a(v: string) {
    this.config.obj2!.obj2a![0].obj2ao!.value = v;
  }
  modifyConfigArr2(v: string) {
    this.config.arr2![0][0].name = v;
  }

  setConfigArr2(a: Sample["config"]["arr2"]) {
    this.config.arr2 = a;
  }

  addTodo(todo: Todo) {
    this.optionalTodos.push(todo);
  }

  completeFirstTodo() {
    this.optionalTodos[0]!.completed = true;
  }

  completeTodoAtIndex(index: number) {
    this.optionalTodos[index]!.completed = true;
  }

  modifyConfigObjectArr2(input: string) {
    this.config.arr2![0][1].name = input;
  }
}
```

**\*Compiletime generated reducer:\*\***

```ts
// this file is auto generated on 2020-02-06T03:49:49.385Z, don't modify it
import { ReducerGroup } from "@typesafe-store/reducer";
import { stat } from "fs";

export type SampleState = {
  name: string;
  count: number;
  person: { name: string; age: number };
  books: Book[];
  optionalTodos: (Todo | undefined)[];
  config: {
    count?: number | undefined;
    status?: string | undefined;
    obj1?: { one: number; obj1c?: { value: string } | undefined } | undefined;
    obj2?:
      | {
          two: number;
          obj2a?:
            | { name: string; obj2ao?: { value: string } | undefined }[]
            | undefined;
        }
      | undefined;
    arr1?: string[] | undefined;
    arr2?: { name: string }[][] | undefined;
    arr3?: (({ name: string } | undefined)[] | undefined)[] | undefined;
  };
};

export type SampleAction =
  | { name: "changeName"; group: "Sample"; payload: string }
  | { name: "increment"; group: "Sample" }
  | { name: "chnagePersonName"; group: "Sample"; payload: string }
  | { name: "changePersonAge"; group: "Sample"; payload: number }
  | { name: "addBooks"; group: "Sample"; payload: Book[] }
  | { name: "removeLastBook"; group: "Sample" }
  | { name: "removeFirstBook"; group: "Sample" }
  | { name: "replaceBooks"; group: "Sample"; payload: Book[] }
  | { name: "fillBookAt0"; group: "Sample"; payload: Book }
  | { name: "modifyBookAt0"; group: "Sample" }
  | { name: "modifyBookAtIndex"; group: "Sample"; payload: number }
  | {
      name: "chnageNameAndCount";
      group: "Sample";
      payload: { name: string; count: number };
    }
  | { name: "changeConfigCount"; group: "Sample"; payload: number }
  | { name: "modifyConfigObj1"; group: "Sample" }
  | {
      name: "setConfigObj1";
      group: "Sample";
      payload:
        | { one: number; obj1c?: { value: string } | undefined }
        | undefined;
    }
  | { name: "setConfigObj1C"; group: "Sample"; payload: string }
  | {
      name: "setConfigObj2";
      group: "Sample";
      payload:
        | {
            two: number;
            obj2a?:
              | { name: string; obj2ao?: { value: string } | undefined }[]
              | undefined;
          }
        | undefined;
    }
  | { name: "setConfigObj2a"; group: "Sample"; payload: string }
  | { name: "modifyConfigArr2"; group: "Sample"; payload: string }
  | {
      name: "setConfigArr2";
      group: "Sample";
      payload: { name: string }[][] | undefined;
    }
  | { name: "addTodo"; group: "Sample"; payload: Todo }
  | { name: "completeFirstTodo"; group: "Sample" }
  | { name: "completeTodoAtIndex"; group: "Sample"; payload: number }
  | { name: "modifyConfigObjectArr2"; group: "Sample"; payload: string };

export const SampleReducerGroup: ReducerGroup<
  SampleState,
  SampleAction,
  "Sample"
> = {
  r: (state: SampleState, action: SampleAction) => {
    const t = action.name;
    switch (t) {
      case "changeName": {
        const name = (action as any).payload;
        return { ...state, name: name };
      }
      case "increment": {
        let _tr_count = state.count;
        _tr_count += 1;
        _tr_count += 1;
        return { ...state, count: _tr_count };
      }
      case "chnagePersonName": {
        const name = (action as any).payload;
        return { ...state, person: { ...state.person, name: name } };
      }
      case "changePersonAge": {
        const age = (action as any).payload;
        return { ...state, person: { ...state.person, age: age } };
      }
      case "addBooks": {
        const books = (action as any).payload;
        return { ...state, books: state.books.concat(...books) };
      }
      case "removeLastBook": {
        return { ...state, books: state.books.slice(0, -1) };
      }
      case "removeFirstBook": {
        return {
          ...state,
          books: [...state.books.slice(0, 0), ...state.books.slice(1)],
        };
      }
      case "replaceBooks": {
        const books = (action as any).payload;
        return { ...state, books: books };
      }
      case "fillBookAt0": {
        const book = (action as any).payload;
        return { ...state, books: [...state.books].fill(book, 0) };
      }
      case "modifyBookAt0": {
        return {
          ...state,
          books: [
            ...state.books.map((v, _i) =>
              _i === 1 ? { ...v, name: "modifiedName" } : v
            ),
          ],
        };
      }
      case "modifyBookAtIndex": {
        const index = (action as any).payload;
        return {
          ...state,
          books: [
            ...state.books.map((v, _i) =>
              _i === index ? { ...v, name: `modified${index}Name` } : v
            ),
          ],
        };
      }
      case "chnageNameAndCount": {
        const { name, count } = (action as any).payload;
        return {
          ...state,
          person: { ...state.person, name: name },
          count: count,
        };
      }
      case "changeConfigCount": {
        const count = (action as any).payload;
        return { ...state, config: { ...state.config, count: count } };
      }
      case "modifyConfigObj1": {
        return {
          ...state,
          config: {
            ...state.config,
            obj1: state.config.obj1
              ? { ...state.config.obj1, one: state.config.obj1!.one + 1 }
              : state.config.obj1,
          },
        };
      }
      case "setConfigObj1": {
        const ob1 = (action as any).payload;
        return { ...state, config: { ...state.config, obj1: ob1 } };
      }
      case "setConfigObj1C": {
        const v = (action as any).payload;
        return {
          ...state,
          config: {
            ...state.config,
            obj1: state.config.obj1
              ? state.config.obj1
                ? {
                    ...state.config.obj1,
                    obj1c: state.config.obj1!.obj1c
                      ? { ...state.config.obj1!.obj1c, value: v }
                      : state.config.obj1!.obj1c,
                  }
                : state.config.obj1
              : state.config.obj1,
          },
        };
      }
      case "setConfigObj2": {
        const ob2 = (action as any).payload;
        return { ...state, config: { ...state.config, obj2: ob2 } };
      }
      case "setConfigObj2a": {
        const v = (action as any).payload;
        return state;
      }
      case "modifyConfigArr2": {
        const v = (action as any).payload;
        return state;
      }
      case "setConfigArr2": {
        const a = (action as any).payload;
        return { ...state, config: { ...state.config, arr2: a } };
      }
      case "addTodo": {
        const todo = (action as any).payload;
        return { ...state, optionalTodos: state.optionalTodos.concat(todo) };
      }
      case "completeFirstTodo": {
        return {
          ...state,
          optionalTodos: [
            ...state.optionalTodos.map((v, _i) =>
              _i === 0 ? (v ? { ...v, completed: true } : v) : v
            ),
          ],
        };
      }
      case "completeTodoAtIndex": {
        const index = (action as any).payload;
        return {
          ...state,
          optionalTodos: [
            ...state.optionalTodos.map((v, _i) =>
              _i === index ? (v ? { ...v, completed: true } : v) : v
            ),
          ],
        };
      }
      case "modifyConfigObjectArr2": {
        const input = (action as any).payload;
        return state;
      }
    }
  },
  g: "Sample",
  ds: {
    name: "First",
    count: 1,
    person: { name: "P121", age: 10 },
    books: [],
    optionalTodos: [],
    config: {},
  },
  m: {},
};
```

### Store :

TODO
