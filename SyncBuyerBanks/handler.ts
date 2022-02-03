import * as express from "express";

import { Context } from "@azure/functions";
import { pipe, flow } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/Either";
import {
  IResponseErrorGeneric,
  IResponseSuccessJson,
  ResponseSuccessJson
} from "@pagopa/ts-commons/lib/responses";
import {
  withRequestMiddlewares,
  wrapRequestHandler
} from "@pagopa/ts-commons/lib/request_middleware";
import { ContextMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/context_middleware";
import * as MyBankClient from "../utils/MyBankCustomClient";
import { getConfigOrThrow } from "../utils/config";
import { fetchApi } from "../utils/fetch";
import { getLogger } from "../utils/logging";
import { formatKey, sign } from "../utils/auth";
import { updateBuyerBankTask } from "../services/storage";
import { getPayerPSPsSCT01Request } from "../generated/definitions/mybank/getPayerPSPsSCT01Request";
import { ErrorResponses } from "../utils/responses";

const conf = getConfigOrThrow();

type IHttpHandler = (
  context: Context
) => Promise<
  ErrorResponses | IResponseErrorGeneric | IResponseSuccessJson<IResponseError>
>;

interface IResponseError {
  readonly result: string;
}

// eslint-disable-next-line prettier/prettier
const body: getPayerPSPsSCT01Request = `{"input":{"branch": "10000","institute": "1000"}}`;

const params = {
  "X-Signature-Type": conf.PAGOPA_BUYERBANKS_SIGN_ALG_STRING,
  "X-Thumbprint": conf.PAGOPA_BUYERBANKS_THUMBPRINT,
  input: body
};

const mybankclient = MyBankClient.createClient({
  baseUrl: conf.PAGOPA_BUYERBANKS_RS_URL,
  fetchApi
});

export const syncBuyerBanks = (): IHttpHandler => (
  context: Context
): Promise<
  ErrorResponses | IResponseErrorGeneric | IResponseSuccessJson<IResponseError>
> => {
  const logger = getLogger(context, "BuyerBankService", "GetBuyerBank");

  const signedBody = flow(
    E.fromPredicate(
      signature => signature as boolean,
      _ => _
    ),
    E.map(signature => {
      logger.logInfo("Precomputed signature found.");
      return signature;
    }),
    E.mapLeft(_ => {
      logger.logInfo(
        "Precomputed signature not found. Start signing procedure."
      );
      return pipe(
        sign(
          body,
          formatKey(conf.PAGOPA_BUYERBANKS_KEY_CERT.toString()),
          conf.PAGOPA_BUYERBANKS_CERT_PASSPHRASE.toString(),
          conf.PAGOPA_BUYERBANKS_SIGN_ALG.toString(),
          logger
        ),
        E.fold(
          (err: Error) => logger.logUnknown(err),
          (signature: string) => signature
        )
      );
    }),
    E.toUnion
  )(conf.PAGOPA_BUYERBANKS_SIGNATURE);

  return pipe(
    updateBuyerBankTask(
      params,
      signedBody as string,
      mybankclient,
      logger,
      conf
    ),
    TE.mapLeft(err => {
      logger.logUnknown(err);
      return err;
    }),
    TE.map(_ => {
      logger.logInfo("List updated");
      return ResponseSuccessJson({ result: "success" } as IResponseError);
    }),
    TE.toUnion
  )();
};

export const SyncBuyerbanksCtrl = (): express.RequestHandler => {
  const middlewaresWrap = withRequestMiddlewares(ContextMiddleware());

  return wrapRequestHandler(middlewaresWrap(syncBuyerBanks()));
};
