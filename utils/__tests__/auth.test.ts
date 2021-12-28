import { generateKeyPairSync, createVerify } from "crypto";
import { pipe } from "fp-ts/lib/function";
import * as O from 'fp-ts/Option';

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
import { sign } from '../auth';

// Sign a plain text and verify the signature 
describe("Authentication functions", () => {
  it("Should verify a signature", () => {
    const plainText = "Lorem ipsum sic dolor amet.";
    const verifierObject = createVerify("RSA-SHA512");
    verifierObject.update(plainText);

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
      sign(plainText, privateKey, 'top secret', "RSA-SHA512"),
      O.fromEither,
      O.fold(
        () => {
          throw new Error("Error during signature verification process")
        },
        (res) => {
          const verified = verifierObject.verify(publicKey, res, "base64");
          expect(verified).toBe(true)
        }
      )
    );
  });
});