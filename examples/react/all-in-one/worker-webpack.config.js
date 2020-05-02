const path = require("path");


module.exports = {

    entry: {
        "worker": path.join(__dirname, "workers", "worker.ts"),
    },
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
        extensions: [".ts", ".js", ".tsx"]
    },
    module: {
        rules: [
            {
                test: /\.ts(x?)$/,
                exclude: /node_modules/,
                loader: "ts-loader",
                options: {
                    transpileOnly: true
                }
            },
        ]
    },
    devtool: "source-map",


}