import * as crypto from "crypto";
import * as E from "fp-ts/Either";
import { ILogger } from "./logging";

/*
 * Set of utility functions for the authentication process
 */

export const encode = (data: string): string =>
  Buffer.from(data).toString("base64");

export const formatKey = (key: string): string => {
  const startToken = "-----BEGIN PRIVATE KEY-----";
  const endToken = "-----END PRIVATE KEY-----";

  const keyBody = key
    .replace(startToken, "")
    .replace(endToken, "")
    .split(" ")
    .join("\n");

  return `${startToken}${keyBody}${endToken}`;
};

export const sign = (
  plainText: string,
  key: string,
  passphrase: string,
  algorithm: string,
  logger: ILogger
): E.Either<Error, string> =>
  E.tryCatch(
    () => {
      const signerObject = crypto.createSign(algorithm);
      signerObject.update(plainText);

      return signerObject.sign({ key, passphrase }, "base64");
    },
    err => {
      logger.logInfo(`Cannot sign message.\n${err as string}`);
      logger.logUnknown(err);
      return E.toError(err);
    }
  );

const formatAlgoString = (algo: string): string => {
  if (algo === "SHA256withRSA") {
    return "RSA-SHA256";
  } else {
    return algo;
  }
};

export const verify = (
  plainText: string,
  signedText: string,
  key: string,
  algorithm: string,
  logger: ILogger
): E.Either<Error, boolean> =>
  E.tryCatch(
    () => {
      const verifierObject = crypto.createVerify(formatAlgoString(algorithm));
      verifierObject.update(plainText);
      const res = verifierObject.verify(key, signedText, "base64");

      logger.logInfo(
        `Verify response.\ntext: ${plainText}\nsignature: ${signedText}\nalgorithm: ${algorithm}\nResult:${res}`
      );

      return res;
    },
    err => {
      logger.logInfo(`Cannot verify message.\n${err as string}`);
      logger.logUnknown(err as string);
      return E.toError(err);
    }
  );
