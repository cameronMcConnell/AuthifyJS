FROM ubuntu:22.04

RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    gnupg && \
    curl -fsSL https://deb.nodesource.com/setup_16.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /AuthifyJS
WORKDIR /AuthifyJS

COPY src/index.js src/utils.js package.json /AuthifyJS/

RUN npm install

ENV PORT=9000

EXPOSE 9000

CMD ["node", "index.js"]