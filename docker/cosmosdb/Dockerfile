FROM node:18.16.0-alpine

WORKDIR /opt/cosmosdb

RUN npm install -g @zeit/cosmosdb-server ts-node

CMD ["sh", "-c", "cosmosdb-server -p 3000"]
