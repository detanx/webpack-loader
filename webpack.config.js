// webpack.config.js
const webpack = require('webpack');
const path = require('path');
const htmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
    entry: './index.js',
    mode: 'development', // 使用development，可以看到打包后的源码，不然会被压缩
    output: {
        publicPath: '.', // 注意这个路劲，根据自己建的文件路劲不同改变，不然会导致找不到引入的js文件
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].[hash:5].js' // 手动引入去掉[hash:5],因为这部分是会变的，不然需要一直手动去改
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                use: ['remove-console-loader']
            }
        ]
    },
    resolveLoader: {
        modules: [ 'node_modules', path.resolve(__dirname, 'loader'),]
    },
    plugins: [
        new CleanWebpackPlugin(),
        new htmlWebpackPlugin({
            template: './index.html',
            inject: "body"
        })
    ]
}
