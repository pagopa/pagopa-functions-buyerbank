import { IResponseType } from "@pagopa/ts-commons/lib/requests";
import {
  HttpStatusCodeEnum,
  IResponse,
  IResponseErrorForbiddenNotAuthorized,
  IResponseErrorInternal,
  IResponseErrorNotFound,
  IResponseErrorTooManyRequests,
  IResponseErrorValidation,
  ResponseErrorForbiddenNotAuthorized,
  ResponseErrorGeneric,
  ResponseErrorInternal,
  ResponseErrorNotFound,
  ResponseErrorTooManyRequests
} from "@pagopa/ts-commons/lib/responses";
import { toError } from "fp-ts/lib/Either";
import { Errors } from "io-ts";

export const unhandledResponseStatus = (
  status: number
): IResponseErrorInternal =>
  ResponseErrorInternal(`unhandled API response status [${status}]`);

export const toDefaultResponseErrorInternal = (
  errs: unknown | Errors
): IResponseErrorInternal => ResponseErrorInternal(toError(errs).message);

/**
 * Interface for unauthorized error response.
 */
export interface IResponseErrorUnauthorized
  extends IResponse<"IResponseErrorUnauthorized"> {
  readonly detail: string;
}
/**
 * Returns an unauthorized error response with status code 401.
 */
export const ResponseErrorUnauthorized = (
  title: string,
  detail: string
): IResponseErrorUnauthorized => ({
  ...ResponseErrorGeneric(HttpStatusCodeEnum.HTTP_STATUS_401, title, detail),
  ...{
    detail: `${title}: ${detail}`,
    kind: "IResponseErrorUnauthorized"
  }
});

export type ErrorResponses =
  | IResponseErrorNotFound
  | IResponseErrorUnauthorized
  | IResponseErrorForbiddenNotAuthorized
  | IResponseErrorInternal
  | IResponseErrorTooManyRequests
  | IResponseErrorValidation;

export const toErrorServerResponse = <S extends number, T>(
  response: IResponseType<S, T>
): ErrorResponses => {
  switch (response.status) {
    case 401:
      return ResponseErrorUnauthorized("Unauthorized", "Unauthorized");
    case 403:
      return ResponseErrorForbiddenNotAuthorized;
    case 404:
      return ResponseErrorNotFound("Not found", "Resource not found");
    case 429:
      return ResponseErrorTooManyRequests("Too many requests");
    default:
      return unhandledResponseStatus(response.status);
  }
};
