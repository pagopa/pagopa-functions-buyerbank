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
import { getDayBlobTask, getLastBlobTask } from "../services/storage";
import { getLogger } from "../utils/logging";
import { getConfigOrThrow } from "../utils/config";

const conf = getConfigOrThrow();

type IHttpHandler = (
  context: Context
) => Promise<IResponseErrorNotFound | IResponseSuccessJson<string>>;

export const getBuyerBanks = (): IHttpHandler => (
  context: Context
): Promise<IResponseErrorNotFound | IResponseSuccessJson<string>> => {
  const logger = getLogger(context, "BuyerBankService", "GetBuyerBank");
  const blobServiceClient = BlobServiceClient.fromConnectionString(
    conf.BUYERBANKS_SA_CONNECTION_STRING
  );

  return pipe(
    getDayBlobTask(blobServiceClient, conf.BUYERBANKS_BLOB_CONTAINER),
    TE.orElse((e: Error) => {
      logger.logUnknown(e);
      return getLastBlobTask(blobServiceClient, conf.BUYERBANKS_BLOB_CONTAINER);
    }),
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
