var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');
var Promise = require('bluebird');
var mongoose = require('mongoose');
require('sinon-mongoose');
var GameModel = require('../app/game.model');
var config = require('../app/config');

describe('GameModel Testing', function() {

  describe('isGameActive', function() {
    it('should return false on empty word', function() {
      var game = new GameModel({
        word: '',
        wrong_guesses: ''
      });
      var active = game.isGameActive();
      expect(active).to.equal(false);
    });
    it('should return false on non-empty word with max guesses', function() {
      var game = new GameModel({
        word: 'test',
        wrong_guesses: 'a'.repeat(config.max_wrong_guesses)
      });
      var active = game.isGameActive();
      expect(active).to.equal(false);
    });
    it('should return true on non-empty word with < max guesses', function() {
      var game = new GameModel({
        word: 'test',
        wrong_guesses: 'a'.repeat(config.max_wrong_guesses - 1)
      });
      var active = game.isGameActive();
      expect(active).to.equal(true);
    });
  });

  describe('fillWordWithGuesses', function() {
    it('should properly fill a word with guesses', function(){
      var game = new GameModel({
        word: 'archipelago',
        right_guesses: 'ahlo'
      });
      var filled = game.fillWordWithGuesses();
      expect(filled).to.equal('a__h___la_o');
    });
  });

  describe('newGame', function() {
    it('should pick a new word and clear guesses', function(){
      var gameMock = sinon.mock(new GameModel({
        word: 'fakeword',
        right_guesses: 'ahlo',
        wrong_guesses: 'zxv'
      }));
      var game = gameMock.object;
      gameMock.expects('save').yields(null);
      return game.newGame().then(function() {
        expect(game.word).to.not.equal('fakeword');
        expect(game.wrong_guesses).to.equal('');
        expect(game.right_guesses).to.equal('');
      });
    });
    it('should increment losses when lost', function(){
      var gameMock = sinon.mock(new GameModel({
        word: 'fakeword',
        right_guesses: '',
        wrong_guesses: 'zx',
        losses: '0'
      }));
      var game = gameMock.object;
      gameMock.expects('save').yields(null);
      return game.newGame().then(function() {
        expect(game.losses).to.equal(1);
      });
    });
  });

  describe('guessLetter', function(){
    it('should error when game not active', function(){
      var gameMock = sinon.mock(new GameModel({
        word: '',
        wrong_guesses: ''
      }));
      var game = gameMock.object;
      gameMock.expects('save').yields(null);
      return game.guessLetter('x')
        .then( function(){
          expect.fail(0, 1, 'expected an error');
        })
        .catch(function(err){
          expect(err.message).to.equal('can not make guesses in current state');
        });
    });
    it('should error when game is already won', function(){
      var gameMock = sinon.mock(new GameModel({
        word: 'test',
        wrong_guesses: '',
        right_guesses: 'tes'
      }));
      var game = gameMock.object;
      gameMock.expects('save').yields(null);
      return game.guessLetter('x')
        .then( function(){
          expect.fail(0, 1, 'expected an error');
        })
        .catch(function(err){
        expect(err.message).to.equal('can not make guesses in current state');
      });
    });
    it('should error when game is already lost', function(){
      var gameMock = sinon.mock(new GameModel({
        word: 'test',
        wrong_guesses: 'a'.repeat(config.max_wrong_guesses),
        right_guesses: ''
      }));
      var game = gameMock.object;
      gameMock.expects('save').yields(null);
      return game.guessLetter('x')
        .then( function(){
          expect.fail(0, 1, 'expected an error');
        })
        .catch(function(err){
        expect(err.message).to.equal('can not make guesses in current state');
      });
    });
    it('should translate uppercase guess to lowercase', function(){
      var gameMock = sinon.mock(new GameModel({
        word: 'test',
        wrong_guesses: '',
        right_guesses: ''
      }));
      var game = gameMock.object;
      gameMock.expects('save').yields(null);
      return game.guessLetter('E').then(function(){
        expect(game.right_guesses).to.equal('e');
      });
    });
    it('should error when no letter is given', function(){
      var gameMock = sinon.mock(new GameModel({
        word: 'test',
        wrong_guesses: '',
        right_guesses: ''
      }));
      var game = gameMock.object;
      gameMock.expects('save').yields(null);
      return game.guessLetter()
        .then( function(){
          expect.fail(0, 1, 'expected an error');
        })
        .catch(function(err){
          expect(err.message).to.equal('invalid guess');
        });
    });
    it('should error when invalid character is guessed', function(){
      var gameMock = sinon.mock(new GameModel({
        word: 'test',
        wrong_guesses: '',
        right_guesses: ''
      }));
      var game = gameMock.object;
      gameMock.expects('save').yields(null);
      return game.guessLetter('#')
        .then( function(){
          expect.fail(0, 1, 'expected an error');
        })
        .catch(function(err){
        expect(err.message).to.equal('invalid guess');
      });
    });
    it('should error when letter is already guessed and right', function(){
      var gameMock = sinon.mock(new GameModel({
        word: 'test',
        wrong_guesses: '',
        right_guesses: 'e'
      }));
      var game = gameMock.object;
      gameMock.expects('save').yields(null);
      return game.guessLetter('e')
        .then( function(){
          expect.fail(0, 1, 'expected an error');
        })
        .catch(function(err){
        expect(err.message).to.equal('invalid guess');
      });
    });
    it('should error when letter is already guessed and wrong', function(){
      var gameMock = sinon.mock(new GameModel({
        word: 'test',
        wrong_guesses: 'x',
        right_guesses: ''
      }));
      var game = gameMock.object;
      gameMock.expects('save').yields(null);
      return game.guessLetter('x')
        .then( function(){
          expect.fail(0, 1, 'expected an error');
        })
        .catch(function(err){
        expect(err.message).to.equal('invalid guess');
      });
    });
    it('should accept and register a right guess', function(){
      var gameMock = sinon.mock(new GameModel({
        word: 'test',
        wrong_guesses: '',
        right_guesses: ''
      }));
      var game = gameMock.object;
      gameMock.expects('save').yields(null);
      return game.guessLetter('t').then(function(){
        expect(game.right_guesses).to.equal('t');
      });
    });
    it('should accept and register a wrong guess', function(){
      var gameMock = sinon.mock(new GameModel({
        word: 'test',
        wrong_guesses: '',
        right_guesses: ''
      }));
      var game = gameMock.object;
      gameMock.expects('save').yields(null);
      return game.guessLetter('z').then(function(){
        expect(game.wrong_guesses).to.equal('z');
      });
    });
    it('should detect and increment a loss', function(){
      var gameMock = sinon.mock(new GameModel({
        word: 'test',
        wrong_guesses: 'a'.repeat(config.max_wrong_guesses - 1),
        right_guesses: '',
        losses: 0
      }));
      var game = gameMock.object;
      gameMock.expects('save').yields(null);
      return game.guessLetter('z').then(function(){
        expect(game.losses).to.equal(1);
      });
    });
    it('should detect and increment a win', function(){
      var gameMock = sinon.mock(new GameModel({
        word: 'test',
        wrong_guesses: '',
        right_guesses: 'te',
        wins: 0
      }));
      var game = gameMock.object;
      gameMock.expects('save').yields(null);
      return game.guessLetter('s').then(function(){
        expect(game.wins).to.equal(1);
      });
    });
  });

});
