import reducerTypes from "./store/reducers/types"


export class AppUtils {

    static getStateFromAction(appData: reducerTypes.app.AppData, index: number) {
        const initialState = appData.actions[0].state
        console.log("initital state : ", initialState);
        if (index === 0) {
            return initialState
        }
        const temp: Record<string, Record<string, any>> = {}
        appData.actions.slice(1).reverse().forEach(a => {
            Object.entries(a.state).forEach(([key, value]) => {
                value = value as Record<string, any>
                Object.entries(value).forEach(([keyI, v]) => {
                    if (!this.isObjectExistInTemp(key, keyI, temp)) {
                        if (!temp[key]) {
                            temp[key] = {}
                        }
                        temp[key][keyI] = v
                    }
                })
            })
        })

        Object.entries(initialState).forEach(([key, value]) => {
            console.log("****** initialState key", key, value);
            initialState[key] = { ...initialState[key], ...temp[key] }
        })

        return initialState
    }


    static isObjectExistInTemp(key1: string, key2: string, temp: Record<string, Record<string, any>>): boolean {
        let result = false
        return Object.entries(temp).some(([key, value]) => {
            if (key === key1) {
                const result = Object.entries(temp[key]).some(([keyI, value]) => {
                    if (keyI === key2) {
                        return true
                    }
                })
                return result;
            }
        })
    }
}