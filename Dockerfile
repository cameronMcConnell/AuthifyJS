FROM node:16

RUN mkdir -p /AuthifyJS/src

WORKDIR /AuthifyJS

COPY src/index.js src/utils.js ./src

COPY package.json package-lock.json ./

RUN npm install

EXPOSE 9000

ENV PORT=9000
ENV MONGO_URL=""
ENV DB_NAME=""
ENV ADMIN_KEY=""

CMD ["node", "src/index.js"]