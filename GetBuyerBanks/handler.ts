import * as express from "express";

import { Context } from "@azure/functions";
import { ContextMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/context_middleware";
import {
  withRequestMiddlewares,
  wrapRequestHandler
} from "@pagopa/io-functions-commons/dist/src/utils/request_middleware";
import {
  IResponseErrorNotFound,
  IResponseSuccessJson,
  ResponseErrorNotFound,
  ResponseSuccessJson
} from "@pagopa/ts-commons/lib/responses";
import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/TaskEither";
import { BlobServiceClient } from "@azure/storage-blob";
import { getDayBlobTask } from "../services/storage";
import { getLogger } from "../utils/logging";
import { getConfigOrThrow } from "../utils/config";

const conf = getConfigOrThrow();

type IHttpHandler = (
  context: Context
) => Promise<IResponseErrorNotFound | IResponseSuccessJson<string>>;

const getBuyerBanks = (): IHttpHandler => (
  context: Context
): Promise<IResponseErrorNotFound | IResponseSuccessJson<string>> => {
  const logger = getLogger(context, "BuyerBankService", "GetBuyerBank");
  const blobServiceClient = BlobServiceClient.fromConnectionString(
    conf.MY_BANK_AZ_STORAGE_CONN_STRING
  );

  return pipe(
    getDayBlobTask(blobServiceClient, conf.MY_BANK_CONTAINER_NAME),
    TE.mapLeft(err => {
      logger.logUnknown(err);
      return ResponseErrorNotFound(
        "Not found",
        "Daily buyerbank list not found"
      );
    }),
    TE.map(res => ResponseSuccessJson(res)),
    TE.toUnion
  )();
};

export const BuyerbanksCtrl = (): express.RequestHandler => {
  const middlewaresWrap = withRequestMiddlewares(ContextMiddleware());

  return wrapRequestHandler(middlewaresWrap(getBuyerBanks()));
};
