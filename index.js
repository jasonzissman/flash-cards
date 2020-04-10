var express = require('express');
var app = express();
var port = 3001;

app.use(express.static('app'));

app.listen(port, function () {
  console.log('Flashcards app listening on port %s!', port);
});