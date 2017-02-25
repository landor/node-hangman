var app = new Vue({
  el: '#app',
  data: {
    mode: 'init',
    auth_token: '',
    game: {},
    guess: '',
    input_blocked: false,
    svg_show: false,
  },
  methods: {
    newSession: function() {
      localStorage.auth_token = '';
      this.auth_token = '';
      axios.defaults.headers.common['auth_token'] = '';
      this.updateGameState();
      this.initAuth();
    },
    newSessionClick: function() {
      if (confirm('This will clear your win/loss record. Are you sure?')) {
        this.newSession();
      }
    },
    initAuth: function() {
      if (localStorage.auth_token) {
        // auth token is stored, continue with session
        this.auth_token = localStorage.auth_token;

        // continue to next phase
        this.initAuthSuccess();
      } else {
        // get new auth token to establish a session
        var t = this;
        axios.post('/get-auth-token', {})
        .then(function (res) {
          t.auth_token = res.data.auth_token;
          // store auth token to persist session
          localStorage.auth_token = t.auth_token;

          // continue to next phase
          t.initAuthSuccess();
        })
        .catch(function (error) {
          console.log(error);
        });
      }
    },
    initAuthSuccess: function() {
      axios.defaults.headers.common['auth_token'] = this.auth_token;

      this.playGame();
    },
    playGame: function(op) {
      // play game will return the game or inform that auth is bad
      // if auth is bad, get a new session

      var t = this;
      axios.post('/play-game', op)
      .then(function (res) {
        if (res.data.error == 'no game') {
          // game not found / auth token invalid
          t.newSession();
          return;
        }

        // store new game data
        t.game = res.data.game;

        // update game state
        t.updateGameState();
      })
      .catch(function (error) {
        console.log(error);
      });
    },
    newGame: function() {
      // user is pressing "new game" button
      this.playGame({ op: 'new game' });
    },
    updateGameState: function() {
      var new_mode = 'init';
      // first determine mode
      if (! this.auth_token) {
        new_mode = 'init';
      } else if (this.game.guessed_word == '' || this.game.guessed_word == undefined) {
        new_mode = 'dashboard';
      } else {
        new_mode = 'game';

        // stop blocking input
        this.input_blocked = false;

        // show svg
        this.svg_show = true;
      }
      this.mode = new_mode;
    },
    gameClick: function() {
      this.$refs.guess_input.focus();
    },
    playGuess: function() {
      if (this.input_blocked) {
        this.guess = '';
        return;
      }
      // start blocking input
      this.input_blocked = true;

      var guess = this.guess.charAt(0).toLowerCase();
      this.guess = '';

      // validate
      // a-z only
      var valid = /[a-z]/.test(guess);
      // don't take already guessed letters
      valid = valid && this.game.wrong_guesses.indexOf(guess) < 0;
      valid = valid && this.game.right_guesses.indexOf(guess) < 0;

      if (! valid) {
        this.input_blocked = false;
        return;
      }

      // play guessed letter
      this.playGame({ op: 'guess letter', letter: guess });
    }
  },
  created: function() {
    // set up session with server
    this.initAuth();
  },
});
