FROM node:alpine

# use nodemon for development
RUN npm install --global nodemon

WORKDIR /app

# use cached layer for node modules
ADD package.json /app/
RUN npm install && npm ls
RUN mv /app/node_modules /node_modules

# mount project here
VOLUME /app

EXPOSE 3000

CMD ["npm", "start"]
