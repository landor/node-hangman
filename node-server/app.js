var express = require('express');
var bodyParser = require('body-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
var crypto = require('crypto');

var app = express();
app.use(express.static('public'));
app.use(logger('dev'));
app.use(bodyParser.json());

var config = require('./app/config');


/* DB, schema, model */

mongoose.connect('mongodb://localhost:27017/hangman');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {});
var GameModel = require('./app/game.model');


/* ROUTES */

app.post('/get-auth-token', function(req, res, next) {
  // generate a new game and return the auth token
  var auth_token;
  var makeRandomToken = function(){
    auth_token = crypto.randomBytes(20).toString('hex');
    GameModel.findOne({ auth_token: auth_token }, function (err, doc) {
      if (! doc) {
        // make game document
        var game = new GameModel();
        game.auth_token = auth_token;
        game.wins = 0;
        game.losses = 0;
        game.word = '';
        game.wrong_guesses = '';
        game.right_guesses = '';
        game.save(function(err){
          if (err) {
            console.log('error creating game', err)
          }
        });

        // return new auth token
        res.json({ auth_token: auth_token });
      } else {
        makeRandomToken();
      }
    });
  };
  makeRandomToken();
});

app.post('/play-game', function(req, res, next) {
  // find game (validate auth)
  GameModel.findOne({ auth_token: req.get('auth_token') }, function (err, game) {
    if (! game) {
      // auth token doesn't match a game
      returnError('no game');
      return;
    }

    // perform game operation / mutate game
    switch(req.body.op) {
      case 'new game':
        game.newGame().then(function() {
          returnGame(game);
        }, function(err) {
          returnError(err);
        });
        break;
      case 'guess letter':
        // user is guessing a letter
        game.guessLetter(req.body.letter).then(function(){
          returnGame(game);
        }, function(err) {
          returnError(err);
        });
        break;
      default:
        returnGame(game);
    }

  });

  // return game state
  function returnGame(game) {

    // only reveal certain information to the client
    var res_game = {
      // mangled word showing guesses filled in
      guessed_word: game.fillWordWithGuesses(),
      wrong_guesses: game.wrong_guesses,
      right_guesses: game.right_guesses,
      max_wrong_guesses: config.max_wrong_guesses,
      wrong_guesses_left: config.max_wrong_guesses - game.wrong_guesses.length,
      word_length: game.word.length,
      losses: game.losses,
      wins: game.wins,
      isActive: game.isGameActive(),
      isWon: game.isGameWon(),
      isLost: game.isGameLost(),
    };

    // reveal word when game is lost
    if (game.isGameLost()) {
      res_game.revealed_word = game.word;
    }

    res.json({ game: res_game });
  }

  // return an error
  function returnError(err) {
    res.json({ error: err });
  }

});

app.listen(3000, function(){
  console.log('Hangman listening on port 3000.');
});
