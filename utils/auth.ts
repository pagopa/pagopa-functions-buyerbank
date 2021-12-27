import * as crypto from "crypto";
import * as E from "fp-ts/Either";

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
