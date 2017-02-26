var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
var Promise = require('bluebird');
var randomWord = require('random-word');
var config = require('./config');

var gameSchema = mongoose.Schema({
  auth_token: { type: String, required: true, index: { unique: true } },
  wins: Number,
  losses: Number,
  word: String,
  wrong_guesses: String,
  right_guesses: String,
});

gameSchema.methods.newGame = function() {
  if (this.isGameActive() && ! this.isGameWon()) {
    // new game while a game is underway counts as a loss
    this.losses++;
  }

  // pick a new word
  this.word = randomWord();

  // reset guesses
  this.wrong_guesses = '';
  this.right_guesses = '';

  var t = this;
  return new Promise(function(resolve, reject) {
    t.save(function(err){
      if (err) {
        console.log('error creating game', err)
        reject(err);
      } else {
        resolve();
      }
    });
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
  var active = this.word.length > 0;

  // wrong guesses count must be less than max
  active = active && this.wrong_guesses.length < config.max_wrong_guesses;

  return active;
}
gameSchema.methods.isGameLost = function() {
  // word must exist
  var lost = this.word.length > 0;

  // wrong guesses count must be at max
  lost = lost && this.wrong_guesses.length == config.max_wrong_guesses;

  return lost;
}
gameSchema.methods.isGameWon = function() {
  // word must exist
  var won = this.word.length > 0;

  // wrong guesses count must be less than max
  won = won && this.wrong_guesses.length < config.max_wrong_guesses;

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

var GameModel = mongoose.model('Game', gameSchema);

module.exports = GameModel;
