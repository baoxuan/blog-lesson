# blog-lesson
express mogoodb


1.新建项目
` $ express -e blog-lesson`
` $ cd blog-lesson &&  npm install`

初始化一个express 项目 并安装相关模块

-e 指定使用ejs模板引擎

**app.js**：启动文件，或者说入口文件

**package.json**：存储着工程的信息及模块依赖，当在 dependencies 中添加依赖的模块时，运行 npm install，npm 会检查当前目录下的 package.json，并自动安装所有指定的模块

**node_modules**：存放 package.json 中安装的模块，当你在 package.json 添加依赖的模块并安装后，存放在这个文件夹下

**public**：存放 image、css、js 等文件

**routes**：存放路由文件

**views**：存放视图文件或者说模版文件

**bin**：存放可执行文件


* req.query： 处理 get 请求，获取 get 请求参数
* req.params： 处理 /:xxx 形式的 get 或 post 请求，获取请求参数
* req.body： 处理 post 请求，获取 post 请求体
* req.param()： 处理 get 和 post 请求，但查找优先级由高到低为 req.params→req.body→req.query


这里使用ejs 模板引擎
ejs 的标签系统非常简单，它只有以下三种标签：

* <% code %>：JavaScript 代码。
* <%= code %>：显示替换过 HTML 特殊字符的内容。
* <%- code %>：显示原始 HTML 内容

注意： `<%= code %>` 和 `<%- code %>` 的区别，当变量 `code` 为普通字符串时，两者没有区别。当 `code` 比如为 `<h1>hello</h1>` 这种字符串时，`<%= code %>` 会原样输出 `<h1>hello</h1>`，而 `<%- code %>` 则会显示 H1 大的 hello 字符串。

使用更为简单灵活的include。include 的简单使用如下：

index.ejs

    <%- include a %>
     hello,world!
    <%- include b %>
a.ejs

      this is a.ejs

b.ejs

		this is b.ejs
最终 index.ejs 会显示：
			
			this is a.ejs
			hello,world!
			this is b.ejs

*注意*
每次我们更新代码都需要手动停止并重启应用，使用supervisor模块可以解决这个问题，每当我们保存修改文件时，supervisor 都会自动帮我们重启应用。

安装

`sudo npm install -g supervisor`

使用 supervisor命令启动app.js(express 4.x 以上)

`supervisor bin/www`





