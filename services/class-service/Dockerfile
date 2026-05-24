FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY ./src ./src
COPY tsconfig.json ./

RUN npm run build

EXPOSE 3003

CMD ["npm", "start"]
