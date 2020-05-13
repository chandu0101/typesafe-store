

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

    static setPropAccessImmutable(obj: any, propAccess: string[], value: (prev: any) => any, traversed?: boolean): any | undefined {

        let newO = { ...obj }
        propAccess.some((key, i) => {
            if (!traversed && i === propAccess.length - 1 && i === 0) {
                console.log("Entered here : ", i);
                const newValue = value(obj[key])
                newO = { ...obj, [key]: newValue }
                return true
            }
            else if (i === propAccess.length - 1) {
                const newValue = value(obj[key])
                console.log("*** setPropAccessImmutablenewValue2 ...........", newValue);
                obj[key] = newValue
                return true;
            } else {
                const v = newO[key]
                if (!v) {
                    newO = undefined
                    return true
                }
                newO[key] = { ...obj[key] }
                this.setPropAccessImmutable(newO[key], propAccess.slice(1), value, true)
            }
        })
        return newO
    }
    static getPropAccess(obj: any, propAccess: string[]): any | undefined {
        if (propAccess.length === 1) {
            return obj[propAccess[0]]
        } else {
            const v = obj[propAccess[0]]
            if (v === undefined || v === null) {
                return undefined
            }
            return this.getPropAccess(v, propAccess.slice(1))
        }
    }

    static pickKeys(obj: any, keys: string[]): any {
        return keys.reduce((pkr, pk) => {
            pkr[pk] = obj[pk]
            return pkr;
        }, {} as Record<string, any>)
    }

    static excludeKeys(obj: any, keys: string[]): any {
        return Object.keys(obj).reduce((pkr, pk) => {
            if (!keys.includes(pk)) {
                pkr[pk] = obj[pk]
            }
            return pkr;
        }, {} as Record<string, any>)
    }

    static isEmptyObj(obj: object): boolean {
        return Object.keys(obj).length === 0
    }

}
