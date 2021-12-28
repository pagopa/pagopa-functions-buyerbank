FROM node:14-alpine

RUN mkdir -p /home/node/newman/node_modules && chown -R node:node /home/node/newman
WORKDIR /home/node/newman
COPY --chown=node:node . .
RUN yarn global add newman
USER node

CMD newman run buyerbanks.api.tests.json --reporters cli
