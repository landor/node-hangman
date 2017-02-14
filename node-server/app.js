var express = require('express');
var app = express();
var mongoose = require('mongoose');

//DB setup
mongoose.connect('mongodb://mongo:27017');

app.get('/', function(req, res){
  res.send('Hello World');
});

app.get('/test', function(req, res, next) {
  res.json({ message: 'Hello World' });
});

app.listen(3000, function(){
  console.log('Hangman listening on port 3000.');
});
