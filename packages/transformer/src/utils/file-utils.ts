import { dirname } from "path"
import { existsSync, mkdirSync, writeFileSync } from "fs"



export class FileUtils {

    /**
     *  Writes the content to file(if directory doesn't exist it will create directory) 
     * @param path 
     * @param content 
     */
    static writeFileSync(path: string, content: string) {
        const dir = dirname(path)
        if (!existsSync(dir)) {
            mkdirSync(dir)
        }
        writeFileSync(path, content)
    }
}