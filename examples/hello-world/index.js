var xprezzo = require('../../');

var app = xprezzo();

app.get('/', function(req, res){
  res.send('Hello World');
});

/* istanbul ignore next */
if (!module.parent) {
  app.listen(3000);
  console.log('Xprezzo started on port 3000');
}
