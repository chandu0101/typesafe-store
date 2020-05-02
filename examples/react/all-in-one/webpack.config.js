const path = require("path");
const HTMLWebpackPLugin = require("html-webpack-plugin");


module.exports = {

    entry: path.join(__dirname, "src", "index.tsx"),
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
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            },
        ]
    },
    devtool: "source-map",
    devServer: {
        port: 9000,
        // contentBase: path.join(__dirname, "public"),
        // publicPath: path.join(__dirname, "public"),
        historyApiFallback: true,
        hot: true,
        publicPath: "/",
    },
    plugins: [
        new HTMLWebpackPLugin({
            template: "./index.html",
            filename: "index.html"
        })
    ],

    // When importing a module whose path matches one of the following, just
    // assume a corresponding global variable exists and use that instead.
    // This is important because it allows us to avoid bundling all of our
    // dependencies, which allows browsers to cache those libraries between builds.


}