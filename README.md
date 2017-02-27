# node-hangman
hangman game web-app created with node, mongo, and vue

## to run
```
git clone https://github.com/landor/node-hangman
cd node-hangman/node-server
```

### If you do not already have Mongo running locally, you can use the docker instance included here:
```
docker-compose build
docker-compose up -d
```

### Then continue:
```
npm install
gulp build
npm start
```
Now open your browser to http://localhost:3000


When finished, if you are using Mongo in the docker instance:
```
docker-compose down
```


## tests
```
npm test
```
