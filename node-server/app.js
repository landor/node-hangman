var express = require('express');
var bodyParser = require('body-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
var crypto = require('crypto');
var randomWord = require('random-word');

var app = express();
app.use(express.static('public'));
app.use(logger('dev'));
app.use(bodyParser.json());

var max_wrong_guesses = 10;


/* DB, schema, model */

mongoose.connect('mongodb://mongo:27017');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {});
var gameSchema = mongoose.Schema({
  auth_token: { type: String, required: true, index: { unique: true } },
  wins: Number,
  losses: Number,
  word: String,
  wrong_guesses: String,
  right_guesses: String,
});
gameSchema.methods.newGame = function(cb) {
  if (this.isGameActive() && ! this.isGameWon()) {
    // new game while a game is underway counts as a loss
    this.losses++;
  }
  
  // pick a new word
  this.word = randomWord();
  
  // reset guesses
  this.wrong_guesses = '';
  this.right_guesses = '';
  
  this.save(function(err){
    if (err) {
      console.log('error creating game', err)
    } else {
      cb();
    }
  });
}
gameSchema.methods.guessLetter = function(letter, cb) {
  // establish that game is active and not won or lost
  if (! this.isGameActive() || this.isGameWon() || this.isGameLost()) {
    cb();
    return;
  }
  
  // validate guess
  letter = letter.charAt(0).toLowerCase();
  // a-z only
  var valid = /[a-z]/.test(letter);
  // don't take already guessed letters
  valid = valid && this.wrong_guesses.indexOf(letter) < 0;
  valid = valid && this.right_guesses.indexOf(letter) < 0;
  if (! valid) {
    cb();
    return;
  }
  
  // add guess
  if (this.word.indexOf(letter) >= 0) {
    // correct guess
    this.right_guesses += letter;
    this.right_guesses = sortString(this.right_guesses);
  } else {
    // incorrect guess
    this.wrong_guesses += letter;
    this.wrong_guesses = sortString(this.wrong_guesses);
  }
  
  // detect and increment loss
  if (this.isGameLost()) {
    this.losses++;
  }
  
  // detect and increment win
  if (this.isGameWon()) {
    this.wins++;
  }
  
  this.save(function(err){
    if (err) {
      console.log('error saving game', err)
    } else {
      cb();
    }
  });
}
gameSchema.methods.isGameActive = function() {
  // word must exist
  var active = this.word.length;
  
  // wrong guesses count must be less than max
  active = active && this.wrong_guesses.length < max_wrong_guesses;
  
  return active;
}
gameSchema.methods.isGameLost = function() {
  // word must exist
  var lost = this.word.length;
  
  // wrong guesses count must be at max
  lost = lost && this.wrong_guesses.length == max_wrong_guesses;
  
  return lost;
}
gameSchema.methods.isGameWon = function() {
  // word must exist
  var won = this.word.length;
  
  // wrong guesses count must be less than max
  won = won && this.wrong_guesses.length < max_wrong_guesses;
  
  // all letters in word must be guessed
  won = won && this.right_guesses.length > 0;
  for (var i = 0; won && i < this.word.length; i++ ) {
    won = this.right_guesses.indexOf(this.word.charAt(i)) >= 0;
  }
  
  return won;
}
gameSchema.methods.fillWordWithGuesses = function() {
  var ret = '';
  var letter;
  for (var i = 0; i < this.word.length; i++ ) {
    letter = this.word.substr(i, 1);
    if (this.right_guesses.indexOf(letter) >= 0) {
      // letter has been guessed
      ret += letter;
    } else {
      // letter has not been guessed
      ret += '_';
    }
  }
  
  return ret;
}
var GameModel = mongoose.model('Game', gameSchema);


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
      res.json({ error: 'no game' });
      return;
    }
  
    // perform game operation / mutate game
    switch(req.body.op) {
      case 'new game':
        game.newGame(function(){
          returnGame(game);
        });
        break;
      case 'guess letter':
        // user is guessing a letter
        game.guessLetter(req.body.letter, function(){
          returnGame(game);
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
      max_wrong_guesses: max_wrong_guesses,
      wrong_guesses_left: max_wrong_guesses - game.wrong_guesses.length,
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
  
});

app.listen(3000, function(){
  console.log('Hangman listening on port 3000.');
});


/* FUNCTIONS */

function sortString(str) {
  str = str.split('');
  str = str.sort(function(a, b) {
    if (a > b) {
      return 1;
    } else if (a < b) {
      return -1;
    }
    return 0;
  });
  str = str.join('');
  return str;
}
