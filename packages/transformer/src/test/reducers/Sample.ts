
type Book = { name: string, year: number }
type Todo = { id: string, completed?: boolean, text: string }
class Sample {
    name = "First"
    count = 1;
    person = { name: "P12", age: 10 }
    books: Book[] = []
    optionalTodos: (Todo | undefined)[] = []
    config: {
        count?: number, status?: string, obj1?: { one: number, obj1c?: { two: string } },
        arr1?: string[]
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

    modifyConfigObj1(input: string) {
        this.config.obj1!.one++
    }

    setConfigObj1(ob1: Sample["config"]["obj1"]) {
        this.config.obj1 = ob1
    }

    addTodo(todo: Todo) {
        this.optionalTodos.push(todo)
    }

    // completeFirstTodo() {
    //     this.optionalTodos[0]!.completed = true
    // }

    // completeTodoAtIndex(index: number) {
    //     this.optionalTodos[index]!.completed = true
    // }

}