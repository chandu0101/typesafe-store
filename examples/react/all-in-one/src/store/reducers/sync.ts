import reducersTypes from "./types";
import { Offload } from "@typesafe-store/store";


class SyncReducer {

    count = 0;
    book: reducersTypes.sync.Book = { name: "React" }
    factorial = 1;
    factorialOffload = 1;

    increment() {
        this.count++
    }

    decrement() {
        this.count--
    }

    setBookName(name: string) {
        this.book.name = name
    }

    calculateFactorial(n: number) {
        let ans = 1;
        for (let i = 2; i <= n; i++) {
            ans = ans * i
        }
        this.factorial = ans;
    }

    calculateFactorialOffload(n: number): Offload {
        let ans = 1;
        for (let i = 2; i <= n; i++) {
            ans = ans * i
        }
        this.factorialOffload = ans;
    }


}
