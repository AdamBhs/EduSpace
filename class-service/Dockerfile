FROM node:20

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY ./prisma ./prisma
RUN npm run prisma:generate

COPY ./src ./src
COPY tsconfig.json ./

# Build Typescript
RUN npm run build

EXPOSE 3003

CMD ["npm", "start"]
