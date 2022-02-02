/**
 * Config module
 *
 * Single point of access for the application confguration. Handles validation on required environment variables.
 * The configuration is evaluate eagerly at the first access to the module. The module exposes convenient methods to access such value.
 */

import * as t from "io-ts";

import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";

import { readableReport } from "@pagopa/ts-commons/lib/reporters";
import { NonEmptyString } from "@pagopa/ts-commons/lib/strings";

// global app configuration
export type IConfig = t.TypeOf<typeof IConfig>;
// eslint-disable-next-line @typescript-eslint/ban-types
export const IConfigR = t.interface({
  AzureWebJobsStorage: NonEmptyString,
  BUYERBANKS_BLOB_CONTAINER: NonEmptyString,
  BUYERBANKS_SA_CONNECTION_STRING: NonEmptyString,
  PAGOPA_BUYERBANKS_BRANCH: NonEmptyString,
  PAGOPA_BUYERBANKS_CERT: NonEmptyString,
  PAGOPA_BUYERBANKS_CERT_PASSPHRASE: t.string,
  PAGOPA_BUYERBANKS_INSTITUTE: NonEmptyString,
  PAGOPA_BUYERBANKS_KEY_CERT: NonEmptyString,
  PAGOPA_BUYERBANKS_RS_URL: NonEmptyString,
  PAGOPA_BUYERBANKS_SIGNATURE: t.string,
  PAGOPA_BUYERBANKS_SIGN_ALG: NonEmptyString,
  PAGOPA_BUYERBANKS_SIGN_ALG_STRING: NonEmptyString,
  PAGOPA_BUYERBANKS_THUMBPRINT: NonEmptyString,
  // QueueStorageConnection: NonEmptyString,
  isProduction: t.boolean
});

export const IConfigO = t.partial({
  PAGOPA_BUYERBANKS_CERT_PEER: t.string,
  PAGOPA_BUYERBANKS_THUMBPRINT_PEER: t.string
});

export const IConfig = t.intersection([IConfigO, IConfigR]);

export const envConfig = {
  ...process.env,
  isProduction: process.env.NODE_ENV === "production"
};

// No need to re-evaluate this object for each call
const errorOrConfig: t.Validation<IConfig> = IConfig.decode(envConfig);

/**
 * Read the application configuration and check for invalid values.
 * Configuration is eagerly evalued when the application starts.
 *
 * @returns either the configuration values or a list of validation errors
 */
export const getConfig = (): t.Validation<IConfig> => errorOrConfig;

/**
 * Read the application configuration and check for invalid values.
 * If the application is not valid, raises an exception.
 *
 * @returns the configuration values
 * @throws validation errors found while parsing the application configuration
 */
export const getConfigOrThrow = (): IConfig =>
  pipe(
    errorOrConfig,
    E.getOrElseW((errors: ReadonlyArray<t.ValidationError>) => {
      throw new Error(`Invalid configuration: ${readableReport(errors)}`);
    })
  );
