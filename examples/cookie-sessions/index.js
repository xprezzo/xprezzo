/**
 * Module dependencies.
 */

var cookieSession = require('xprezzo-cookie-session');
var xprezzo = require('../../');

var app = module.exports = xprezzo();

// add req.session cookie support
app.use(cookieSession({ secret: 'manny is cool' }));

// do something with the session
app.use(count);

// custom middleware
function count(req, res) {
  req.session.count = (req.session.count || 0) + 1
  res.send('viewed ' + req.session.count + ' times\n')
}

/* istanbul ignore next */
if (!module.parent) {
  app.listen(3000);
  console.log('Xprezzo started on port 3000');
}
