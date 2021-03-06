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

/*
 * API utility function for response handling
 */
export interface IResponseWithHeaders<T> {
  readonly value: T;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly headers: any;
}

export const withApiRequestWrapper = <T, V>(
  logger: ILogger,
  apiCallWithParams: () => Promise<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    t.Validation<IResponseType<number, T | V, any>>
  >,
  successStatusCode: 200 | 201 | 202 = 200,
  errorServerHandler: <S extends number>(
    response: IResponseType<S, V>
  ) => ErrorResponses = toErrorServerResponse
): TaskEither<ErrorResponses, IResponseWithHeaders<T>> =>
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
                : TE.of({
                    headers: responseType.headers,
                    value: responseType.value as T
                  })
          )
        )
    )
  );
