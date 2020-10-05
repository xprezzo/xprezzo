/**
 * Module dependencies.
 */

var xprezzo = require('../..');
var path = require('path');
var app = xprezzo();
var logger = require('xprezzo-logger-factory');
var cookieParser = require('xprezzo-cookie-parser');
var methodOverride = require('method-override');
var site = require('./site');
var post = require('./post');
var user = require('./user');

module.exports = app;

// Config

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

/* istanbul ignore next */
if (!module.parent) {
  app.use(logger('dev'));
}

app.use(methodOverride('_method'));
app.use(cookieParser());
app.use(xprezzo.urlencoded({ extended: true }))
app.use(xprezzo.static(path.join(__dirname, 'public')));

// General

app.get('/', site.index);

// User

app.get('/users', user.list);
app.all('/user/:id/:op?', user.load);
app.get('/user/:id', user.view);
app.get('/user/:id/view', user.view);
app.get('/user/:id/edit', user.edit);
app.put('/user/:id/edit', user.update);

// Posts

app.get('/posts', post.list);

/* istanbul ignore next */
if (!module.parent) {
  app.listen(3000);
  console.log('Xprezzo started on port 3000');
}
