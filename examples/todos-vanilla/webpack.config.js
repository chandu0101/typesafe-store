const path = require("path");
const HTMLWebpackPLugin = require("html-webpack-plugin");


module.exports = {

    entry: path.join(__dirname, "src", "index.ts"),
    output: {
        path: path.join(__dirname, "dist"),
        chunkFilename: "[name].js",
        filename: "[name].bundle.js"
    },
    optimization: {
        splitChunks: {
            chunks: "all",
            name: "vendor.bunle"
        }
    },
    resolve: {
        extensions: [".ts", ".js"]
    },
    module: {
        rules: [
            { test: /\.ts$/, loader: "ts-loader", options: { transpileOnly: true } }
        ]
    },
    devtool: "source-map",
    devServer: {
        port: 9000,
        historyApiFallback: true
    },
    plugins: [
        new HTMLWebpackPLugin({
            template: "./index.html",
            filename: "index.html"
        })
    ],

}