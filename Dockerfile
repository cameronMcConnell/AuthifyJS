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
ENV AWS_ACCESS_KEY_ID=""
ENV AWS_SECRET_ACCESS_KEY=""
ENV AWS_REGION=""
ENV SES_VERIFIED_EMAIL=""
ENV SERVICE_NAME=""


CMD ["node", "src/index.js"]