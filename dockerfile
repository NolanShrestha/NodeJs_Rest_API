FROM node:slim
WORKDIR /app
COPY . /app 
RUN npm install
COPY . .
EXPOSE 3000
CMD node server.js
