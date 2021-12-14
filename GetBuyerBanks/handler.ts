import * as express from "express";
import * as t from "io-ts";

import { Context } from "@azure/functions";
import { ContextMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/context_middleware";
import { RequiredParamMiddleware } from "@pagopa/io-functions-commons/dist/src/utils/middlewares/required_param";
import {
  withRequestMiddlewares,
  wrapRequestHandler
} from "@pagopa/io-functions-commons/dist/src/utils/request_middleware";
import {
  IResponseErrorNotFound,
  IResponseSuccessJson,
  ResponseSuccessJson
} from "@pagopa/ts-commons/lib/responses";

type IHttpHandler = (
  context: Context,
  param: unknown
) => Promise<
  | IResponseSuccessJson<{
      readonly message: string;
    }>
  | IResponseErrorNotFound
>;

export const HttpHandler = (): IHttpHandler => async (
  ctx,
  param
): Promise<
  IResponseSuccessJson<{
    readonly message: string;
  }>
> =>
  ResponseSuccessJson({
    headers: ctx.req?.headers,
    message: `Hello ${param} !`
  });

export const HttpCtrl = (): express.RequestHandler => {
  const handler = HttpHandler();

  const middlewaresWrap = withRequestMiddlewares(
    ContextMiddleware(),
    RequiredParamMiddleware("someParam", t.string)
  );

  return wrapRequestHandler(middlewaresWrap(handler));
};
