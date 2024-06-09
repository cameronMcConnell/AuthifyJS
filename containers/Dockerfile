FROM node:16

RUN mkdir -p /AuthifyJS/src

WORKDIR /AuthifyJS

COPY src/index.js src/utils.js ./src

COPY package.json package-lock.json ./

RUN npm install

EXPOSE 9000

CMD ["node", "src/index.js"]