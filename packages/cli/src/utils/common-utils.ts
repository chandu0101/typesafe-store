


export class CommonUtils {

    /**
       *  header message for generated files
    */
    static dontModifyMessage() {
        return `// this file is auto generated on ${new Date().toISOString()}, don't modify it`
    }

    static lastElementOfArray<T>(arr: T[]) {
        return arr[arr.length - 1]
    }
}