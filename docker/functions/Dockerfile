FROM node:18.16.0@sha256:4a55308cc855cba1a925d19ae4e45838741dad2fd7bb8949a93b2a0f2ae339e3

WORKDIR /usr/src/app

RUN npm i -g azure-functions-core-tools@4 --unsafe-perm true

ENV AzureWebJobsScriptRoot=/usr/src/app \
    AzureFunctionsJobHost__Logging__Console__IsEnabled=true

CMD ["func", "start", "--javascript"]
