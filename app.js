var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
// var users = require('./routes/users');
var setting = require('./setting');
var flash = require('connect-flash');
var session = require('express-session');
var MongoStroe = require('connect-mongo')(session);

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(flash());

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

// 加载日志中间件
app.use(logger('dev'));
// 加载解析json 中间件
app.use(bodyParser.json());
// 加载解析urlencoded 请求体中间件
app.use(bodyParser.urlencoded({ extended: false }));
// 加载解析cookie 的中间价
app.use(cookieParser());
// 设置public文件夹为存放静态文件的目录。

app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret:setting.cookieSecret,
  key:setting.db,//cookie name
  cookie:{maxAge:1000*60*60*24*30},
  store:new MongoStroe({
    url:'mongodb://localhost/blog'
  })

}));



//路由控制
// app.use('/', routes);
// app.use('/users', users);
routes(app);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
