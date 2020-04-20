

export class TStoreUtils {

    static removeDuplicatesInArray<T>(arr: T[]): T[] {
        return arr.filter((o, i) => arr.indexOf(o) === i)
    }
    static setNestedKey(obj: any, path: string[], value: any): any {
        if (path.length === 1) {
            obj[path[0]] = value
            return
        }
        return this.setNestedKey(obj[path[0]], path.slice(1), value)
    }



    // static setPropAccess

}