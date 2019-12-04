
type Book = { name: string, year: number }

class Sample {
    name = "First"
    count = 1;
    person = { name: "P12", age: 10 }
    books: Book[] = []

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
    chnageNameAndCount(name: string, count: number) {
        this.person.name = name
        this.count = count
    }

}