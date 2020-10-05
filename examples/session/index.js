
// install redis first:
// https://redis.io/

// then:
// $ npm install redis
// $ redis-server

var xprezzo = require('../..');
var session = require('xprezzo-session');

var app = xprezzo();

// Populates req.session
app.use(session({
  resave: false, // don't save session if unmodified
  saveUninitialized: false, // don't create session until something stored
  secret: 'keyboard cat'
}));

app.get('/', function(req, res){
  var body = '';
  if (req.session.views) {
    ++req.session.views;
  } else {
    req.session.views = 1;
    body += '<p>First time visiting? view this page in several browsers :)</p>';
  }
  res.send(body + '<p>viewed <strong>' + req.session.views + '</strong> times.</p>');
});

/* istanbul ignore next */
if (!module.parent) {
  app.listen(3000);
  console.log('Xprezzo started on port 3000');
}
