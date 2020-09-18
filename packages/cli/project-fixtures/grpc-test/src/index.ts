
import * as protoParser from "proto-parser";
import * as fs from "fs"

const source = fs.readFileSync("./address.proto", { encoding: "utf-8" })
const ast = protoParser.parse(source)

fs.writeFileSync("./ast2.json", JSON.stringify(ast, null, 2))