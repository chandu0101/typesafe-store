import { dirname, join } from "path"
import { existsSync, mkdirSync, writeFileSync, readFileSync, promises as fsp, lstatSync } from "fs"



export class FileUtils {

    /**
     *  Writes the content to file(if directory doesn't exist it will create directory) 
     * @param path 
     * @param content 
     */
    static writeFileSync(path: string, content: string) {
        const dir = dirname(path)
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true })
        }
        writeFileSync(path, content)
    }

    static readFileSync(path: string) {
        return readFileSync(path, { encoding: "utf-8" })
    }

    static async readFile(path: string) {
        return fsp.readFile(path, { encoding: "utf-8" })
    }

    static isDirectory(path: string): boolean {
        let result = false
        try {
            result = lstatSync(path).isDirectory()
        } catch { // 
            result = false
        }
        return result
    }

    static createDirectory(path: string) {
        mkdirSync(path, { recursive: true })
    }

}