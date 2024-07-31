FROM node:18 AS build

WORKDIR /app

COPY server/package*.json ./

RUN npm install

COPY server/ .

EXPOSE 5000

CMD ["node", "app.js"]
