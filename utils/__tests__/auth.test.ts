import { generateKeyPairSync, createVerify } from "crypto";
import { pipe } from "fp-ts/lib/function";
import * as O from 'fp-ts/Option';
import * as E from 'fp-ts/Either';

/*
 * Unit test suite for authentication utilities
 */

process.env = {
  MY_BANK_RS_URL: "http://localhost:3000",
  MY_BANK_SIGN_ALG: "RSA-SHA512",
  MY_BANK_SIGN_ALG_STRING: "SHA256withRSA",
  MY_BANK_CERT: "cert",
  MY_BANK_CERT_PRIV_KEY: "privkey",
  AzureWebJobsStorage: "azws",
  QueueStorageConnection: "qsc"
}
import { sign, verify } from '../auth';


// Sign a plain text and verify the signature 
describe("Authentication functions", () => {
  it("Should verify a signature", () => {
    const plainText = "Lorem ipsum sic dolor amet.";
    const alg = "RSA-SHA512"
    const { publicKey, privateKey } = generateKeyPairSync("rsa", {
      modulusLength: 4096,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
        cipher: 'aes-256-cbc',
        passphrase: 'top secret'
      }
    });

    pipe(
      sign(plainText, privateKey, 'top secret', alg),
      O.fromEither,
      O.fold(
        () => {
          throw new Error("Error during signature verification process")
        },
        (res) => {
          pipe(
            verify(plainText, res, publicKey, alg),
            O.fromEither,
            O.fold(
              () => { throw new Error("Error during signature verification process") },
              (verified) => {
                if (!verified) {
                  throw new Error("Signature cannot be verified")
                }
              }
            )
          );
        }
      )
    );
  });
});