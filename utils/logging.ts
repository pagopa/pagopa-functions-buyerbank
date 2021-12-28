/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Context } from "@azure/functions";
import { errorsToReadableMessages } from "@pagopa/ts-commons/lib/reporters";
import { Errors } from "io-ts";

/*
 * Logging utilities
 */

export const getLogger = (
  context: Context,
  logPrefix: string,
  name: string
) => ({
  logErrors: (errs: Errors) =>
    context.log.error(
      `${logPrefix}|${name}|ERROR=${errorsToReadableMessages(errs)}`
    ),
  logInfo: (errs: string) =>
    context.log.info(`${logPrefix}|${name}|INFO=${errs}`),
  logUnknown: (errs: unknown) =>
    context.log.error(
      `${logPrefix}|${name}|UNKNOWN_ERROR=${JSON.stringify(errs)}`
    ),
  logWarning: (errs: unknown) =>
    context.log.warn(
      `${logPrefix}|${name}|UNKNOWN_ERROR=${JSON.stringify(errs)}`
    )
});

export type ILogger = ReturnType<typeof getLogger>;
