---
# 主题列表：juejin, github, smartblue, cyanosis, channing-cyan, fancy
# 贡献主题：https://github.com/xitu/juejin-markdown-themes
theme: juejin
highlight: juejin
---

### 写在开头

- `10` 月面试的时候，有位面试官在和我谈及 `Webpack` 相关知识的时候提到了 `Loader`，并问及是否有自己实现过一些 `Loader`。从使用 `Webpack` 开始每个项目都会配置很多的 `Loader`，我们都知道 `Loader` 的作用是处理一些资源文件。例如 `sass-loader` 是将 `sass` 文件编译成 `css` 文件，让浏览器能够识别，还有 `file-loader` 是处理不同的文件资源，例如图片、字体等等。
- 这么多不同的 `Loader`，是否写一个 `Loader` 就很难呢？那我们是否也可以实现一个自己的 `Loader` 呢？说搞就搞。

### 了解 `Loader`

#### 单一职责

- 每个 `Loader` 都只做一件事，当需要多种转换就需要多个 `Loader`，例如 `sass` 文件的转换就需要用到 `sass-loader`、`css-loader` 及 `style-loader`；

```
// webpack.config.js module配置
module: {
  rules: [{
    test: /\.sass$/,
    use: [
      'style-loader',{
        loader: 'css-loader',
        options: {...}
      }, {
        loader: 'sass-loader',
        options: {...}
      }]
  },
  	...
  ]
}
```

#### 调用顺序

- 从上面的例子我们可以看出来，转换 `sass` 文件需要用到三个 `Loader`，但我们在书写 `Loader` 的时候要注意书写的顺序，`Loader` 的执行顺序是从 `use` 数组的最后开始执行的（从 `sass-loader` 到 `css-loader` 再到 `style-loader`）

#### 链式调用

- 既然解析 `sass` 文件会用到三个 `Loader`，那么下一个 `Loader` 接受到的值就是上一个 `Loader` 处理后的值，第一个执行的 `Loader` 接受的就是 `test` 匹配的源文件，整个就是一个链式调用的过程，类似于 `jQuery`。

#### 模块化

- 由于我们是在 `node` 的环境中去使用 `Loader`，所以我们的 `Loader` 也应该使用模块化的设计原则。

#### 无状态

- 在多次模块的转化之间，我们不应该在 `Loader` 中保留状态。每个 `Loader` 运行时应该确保与其他编译好的模块保持独立，同样也应该与前几个 `Loader` 对相同模块的编译结果保持独立。

### 深入 `loader`

#### 实用工具

1. `loader-utils`：提供了很多有用的工具，细心的读者应该有注意到在 `Loader` 的配置中有一个 `options` 的对象，这个对象的值就可以通过 `loader-utils` 包中的 `getOptions` 获得。
2. `schema-utils`：可以用 `schema-utils` 提供的工具，获取用于校验 `options` 的 `JSON Schema `常量，从而校验 `loader options`。

```
import { getOptions } from 'loader-utils';
import { validateOptions } from 'schema-utils';

const optionSchema = {
  type: object,
  properties: {
    test: { type: string }
  }
}

export default function(source) {
    const options = getOptions(this);
    validateOptions(optionSchema, options, 'Example Loader');
    // 在这里写转换 source 的逻辑 ...
    source = source
    return `export default ${ JSON.stringify(source) }`;
};
```

#### 其他结果返回

- 通常我们是将 `source` 处理之后直接返回给下一个 `Loader` 处理，如果我们想在返回的结果中加入其他的内容，我们可以通过 `this.callback` 进行添加，对应还有其他的一些 `API`（[loader API](https://www.webpackjs.com/api/loaders/)），这些都是 `Webpack` 为了方便与 `Loader` 通信二注入的。

- `this.callback`一个可以同步或者异步调用的可以返回多个结果的函数。预期的参数是：

```
this.callback(
  err: Error | null,
  content: string | Buffer,
  sourceMap?: SourceMap,
  meta?: any
);
```

#### 异步 `Loader`

- 在某些常见下，你的项目可能需要请求某些数据来对你的某些文件来进行处理，例如你需要请求一些动态的资源进行某些带标记的资源进行替换，这时候如果不适用异步进行，那构建就会阻塞从而导致整个项目的构建时间增加。这时我们就需要用到 `Webpack` 注入的 `API` 中的 [this.async](https://www.webpackjs.com/api/loaders/#this-async)。示例：

```
module.exports = function(source) {
    var callback = this.async();,
    someAsyncOperation(source, function(err, result, sourceMaps, ast) {
        callback(err, result, sourceMaps, ast);
	});
}
```

#### 其他功能

- 处理二进制

```
module.exports = function(source) {
    // 在 exports.raw === true 时，Webpack 传给 Loader 的 source 是 Buffer 类型的
    source instanceof Buffer === true;
    // Loader 返回的类型也可以是 Buffer 类型的
    // 在 exports.raw !== true 时，Loader 也可以返回 Buffer 类型的结果
    return source;
};
// 通过 exports.raw 属性告诉 Webpack 该 Loader 是否需要二进制数据
module.exports.raw = true
```

- 获取配置中的 `target`

```
module.exports = function(source) {
	const target = this.target; // 'web', 'node'...
    return source;
};
```

- 获取 `Loader` 配置的 `options`
  - 除了上面通过 `loader-utils` `getOptions`方法之外，`Webpack` 注入的 `this.query` 也可以获取到对应的 `options`，但是如果没有配置 `options` 的话 `this.query` 就是一个以 `?` 开头的字符串。
- 其他更多内置 `API` 请异步 [Webpack Loader API](https://www.webpackjs.com/api/loaders/) 官方文档查看。

### 开发原则

#### 公用代码

- 当你有多个自定义的 `Loader` 时，如果有两个及以上的 `Loader` 使用了某一段相同的代码，你应该将这部分代码单独抽离出来，避免重复。

#### 同伴依赖

- 如果你开发的 `Loader` 只是简单包装另外一个包，那么你应该在 `package.json` 中将这个包设为同伴依赖（`peerDependency`）。这可以让应用开发者知道该指定哪个具体的版本。
- 例如，`sass-loader` 将 `node-sass` 指定为同伴依赖：

```
"peerDependencies": {
  "node-sass": "^4.10.0"
}
```

#### 绝对路径

- 不要在 `Loader` 模块里写绝对路径，因为当项目根路径变了，这些路径会干扰 `Webpack` 计算 `hash` （把 `module` 的路径转化为 `module` 的引用 `id`）。`loader-utils` 里有一个 `stringifyRequest` 方法，它可以把绝对路径转化为相对路径。

### 实现 loader

- 通过上面的介绍，我们对 `Loader` 已经有一定的了解了，下面我们就简单实现一个自己的 `Loader`。

#### 准备工作

- 在实现 `Loader` 之前，我们需要准备一个简单的项目来测试后面实现的 `Loader`，所以我用 `Webpack` 配置了一个简单的项目，注意的地方我在文件中加入了注释，配置如下：

1. 安装内容

```
    "clean-webpack-plugin": "^3.0.0", // 每次打包清除之前的文件
    "html-webpack-plugin": "^4.5.0", // html模板，用于插入打包好的js文件，手动引入也行
    "path": "^0.12.7", // 处理文件路径
    "webpack-cli": "^4.2.0", // 还需要全局安装
    "webpack": "^5.4.0" // 还需要全局安装
```

2. `webpack.config.js`

```
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
                use: ['nodeal-loader']
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
```

3. 文件目录
   ![](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b9a56335913a47e8aa21a2ebe10c0443~tplv-k3u1fbpfcp-watermark.image)

- 这个目录是我随手建的，你可以根据自己的习惯自己建，不同的目录记得修改相应的配置即可。

#### 最简单的 loader

- 首先我们实现一个最简单的 `Loader` ，既是不做任何处理，直接将拿到的内容返回出去。

```
// nodeal-loader.js
module.exports = function(source) {
    return source;
};
```

- 我们执行打包命令，如果出现下面这个错误：

```
Module not found: Error: Can't resolve 'nodeal-loader' in 'xxx(你的项目路劲)'
```

1. 你可以先检查你写的 `Loader` 的名称是否一致
2. 查看你的 `webpack.config.js` 是否有如下配置，并且路劲是否正确

```
resolveLoader: {
    modules: [ 'node_modules', path.resolve(__dirname, 'loader')] // 指定loader的查找方式
}
```

3. 将你写的 `Loader` 发布到 `Npm` 上，然后像其他 `Loader` 一样通过包管理工具下载下来。[发布自己的 npm 包](https://www.cnblogs.com/detanx/p/npm.html)
4. 使用 `Npm link`

   - `Npm link` 专门用于开发和调试本地 `Npm` 模块，能做到在不发布模块的情况下，把本地的一个正在开发的模块的源码链接到项目的 `node_modules` 目录下，让项目可以直接使用本地的 `Npm` 模块。
   - 由于是通过软链接的方式实现的，编辑了本地的 `Npm` 模块代码，在项目中也能使用到编辑后的代码。
   - 完成 `Npm link` 的步骤如下：

     1. 确保正在开发的本地 `Npm` 模块（也就是正在开发的 `Loader`）的 `package.json` 已经正确配置好；
     2. 在本地 Npm 模块根目录下执行 `npm link`，把本地模块注册到全局；
     3. 在项目根目录下执行`npm link loader-name`，把第 `2` 步注册到全局的本地 `Npm` 模块链接到项目的 `node_moduels` 下，其中的 `loader-name` 是指在第 `1` 步中的 `package.json` 文件中配置的模块名称。

   - 链接好 `Loader` 到项目后你就可以像使用一个真正的 `Npm` 模块一样使用本地的 `Loader` 。

#### 去掉 `console` 的 `loader`

- 什么的 `Loader` 没有做任何事情，下面我们实现一个去掉 `js` 文件中 `console`，在日常开发中这样的功能其实有很多插件都已经做了（例如：`uglifyjs-webpack-plugin`），这里只是做一个示例。
- 修改 `Loader` 如下：

```
// remove-console-loader.js 注意修改相应的配置
module.exports = function(source) {
    source = source.replace(/console\.log\(.*?\);?/, '')
    this.callback(null, source)
    return source;
};
```

- 在 `index.js` 中添加下面的代码

```
alert('测试');
console.log('detanx');
```

- 我们执行打包命令，如果出现下面这个错误：
  ![](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c47bd522ae59410a93760b83dd45cda9~tplv-k3u1fbpfcp-watermark.image)
- 检查一下是否在 `Loader` 的配置中添加了其他的 `Loader`，这可能是其他 `Loader` 返回的 `source` 类型没有 `replace` 方法导致的，可以将其他 loader 先去掉。
- 在浏览器中打开 `dist` 下面的 `html` 文件，我们看见 `alert` 的内容已经显示出来了，但是控制台没有任何内容打印，我们没有添加其他任何的插件或 `loader`，这证明我们写的 `Loader` 生效了。
  ![](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/dc04c1645d994a79ab7f63fcc8322f5a~tplv-k3u1fbpfcp-watermark.image)
- 我们再看看打包后的文件，`alert` 被保留了下来，`console` 被去掉了。
  ![](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/8699cdd875b943fb926240e8c512a11c~tplv-k3u1fbpfcp-watermark.image)

#### `Loader` 扩展

- 处理上面实现的去掉 `console` 之外，我们还可以实现其他的功能，例如去掉 `alert`、将隐式转换替换为严格相等或不等（`!=`、`==` 替换为 `!==`、`===`）、将资源链接替换为 `require` 引入的方式等等。

### 总结

- 对模块化、`Loader` 有了更深的了解；
- 需要特殊处理的资源，没有现成的 `Loader` 我们可以尝试自己去实现；
- 对` Webpack` 的配置及打包流程有了进一步的理解；
- 回顾了如何发布 `Npm` 包的流程。
