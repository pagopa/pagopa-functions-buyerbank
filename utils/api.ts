import { IResponseType } from "@pagopa/ts-commons/lib/requests";
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import { TaskEither } from "fp-ts/lib/TaskEither";
import * as t from "io-ts";
import { ILogger } from "./logging";
import {
  ErrorResponses,
  toDefaultResponseErrorInternal,
  toErrorServerResponse
} from "./responses";

export const withApiRequestWrapper = <T, V>(
  logger: ILogger,
  apiCallWithParams: () => Promise<
    t.Validation<IResponseType<number, T | V, never>>
  >,
  successStatusCode: 200 | 201 | 202 = 200,
  errorServerHandler: <S extends number>(
    response: IResponseType<S, V>
  ) => ErrorResponses = toErrorServerResponse
): TaskEither<ErrorResponses, T> =>
  pipe(
    TE.tryCatch(
      () => apiCallWithParams(),
      errs => {
        logger.logUnknown(errs);
        return toDefaultResponseErrorInternal(errs);
      }
    ),
    TE.fold(
      err => TE.left(err),
      errorOrResponse =>
        pipe(
          errorOrResponse,
          E.fold(
            errs => {
              logger.logErrors(errs);
              return TE.left(toDefaultResponseErrorInternal(errs));
            },
            responseType =>
              responseType.status !== successStatusCode
                ? TE.left(
                    errorServerHandler(responseType as IResponseType<number, V>)
                  )
                : TE.of(responseType.value as T)
          )
        )
    )
  );
