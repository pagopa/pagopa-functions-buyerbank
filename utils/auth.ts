import * as crypto from "crypto";
import * as E from "fp-ts/Either";

/*
 * Set of utility functions for the authentication process
 */

export const encode = (data: string): string =>
  Buffer.from(data).toString("base64");

export const sign = (
  plainText: string,
  key: string,
  passphrase: string,
  algorithm: string
): E.Either<Error, string> =>
  E.tryCatch(
    () => {
      const signerObject = crypto.createSign(algorithm);
      signerObject.update(plainText);

      return signerObject.sign({ key, passphrase }, "base64");
    },
    err => E.toError(err)
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
  algorithm: string
): E.Either<Error, boolean> =>
  E.tryCatch(
    () => {
      const verifierObject = crypto.createVerify(formatAlgoString(algorithm));
      verifierObject.update(plainText);

      return verifierObject.verify(key, signedText, "base64");
    },
    err => E.toError(err)
  );
