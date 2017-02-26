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
    it('should pick a new word and clear guesses', function(done){
      var gameMock = sinon.mock(new GameModel({
        word: 'fakeword',
        right_guesses: 'ahlo',
        wrong_guesses: 'zxv'
      }));
      var game = gameMock.object;
      gameMock.expects('save').yields(null);
      game.newGame().then(function(err){
        expect(game.word).to.not.equal('fakeword');
        expect(game.wrong_guesses).to.equal('');
        expect(game.right_guesses).to.equal('');
        done();
      });
    });
    it('should increment losses when lost', function(done){
      var gameMock = sinon.mock(new GameModel({
        word: 'fakeword',
        right_guesses: '',
        wrong_guesses: 'zx',
        losses: '0'
      }));
      var game = gameMock.object;
      gameMock.expects('save').yields(null);
      game.newGame().then(function(err){
        expect(game.losses).to.equal(1);
        done();
      });
    });
  });

});
