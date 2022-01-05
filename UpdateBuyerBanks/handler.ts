/* eslint-disable no-console */
import { Context } from "@azure/functions";
import { pipe, flow } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/Either";
import { BlobServiceClient } from "@azure/storage-blob";
import * as MyBankClient from "../utils/MyBankCustomClient";
import { withApiRequestWrapper } from "../utils/api";
import { getConfigOrThrow } from "../utils/config";
import { fetchApi } from "../utils/fetch";
import { getLogger } from "../utils/logging";
import { sign } from "../utils/auth";
import { setDayBlobTask } from "../services/storage";
import { getPayerPSPsSCT01Request } from "../generated/definitions/mybank/getPayerPSPsSCT01Request";

/*
 * Time triggered function for daily buyerbank list update
 */

const conf = getConfigOrThrow();

const mybankclient = MyBankClient.createClient({
  baseUrl: conf.MY_BANK_RS_URL,
  fetchApi
});

// eslint-disable-next-line prettier/prettier
const body: getPayerPSPsSCT01Request = `{"input":{"branch": "10000","institute": "1000"}}`;;

const params = {
  "X-Signature-Type": conf.MY_BANK_SIGN_ALG_STRING,
  "X-Thumbprint": conf.MY_BANK_THUMBPRINT,
  input: body
};

export const updateBuyerBank = async (
  context: Context,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  timer: any
): Promise<void> => {
  getLogger(context, "BuyerBankService", "UpdateBuyerBank").logInfo(
    `Timed update executed, timer: ${timer}`
  );
  const logger = getLogger(context, "BuyerBankService", "UpdateBuyerBank");

  const signedBody = flow(
    E.fromPredicate(
      signature => signature as boolean,
      _ => _
    ),
    E.map(signature => signature),
    E.mapLeft(_ =>
      pipe(
        sign(
          JSON.stringify(body),
          conf.MY_BANK_KEY.toString(),
          conf.MY_BANK_CERT_PASSPHRASE.toString(),
          conf.MY_BANK_SIGN_ALG.toString()
        ),
        E.fold(
          (err: Error) => logger.logUnknown(err),
          (signature: string) => signature
        )
      )
    ),
    E.toUnion
  )(conf.MY_BANK_SIGNATURE);

  await pipe(
    withApiRequestWrapper(
      getLogger(context, "BuyerBankService", "UpdateBuyerBank"),
      () =>
        mybankclient.getPayerPSPsSCT01({
          ...params,
          ...{ "X-Signature": signedBody as string }
        }),
      200
    ),
    TE.mapLeft(err => logger.logUnknown(err)),
    TE.map(async res => {
      const blobClient = BlobServiceClient.fromConnectionString(
        conf.MY_BANK_AZ_STORAGE_CONN_STRING
      );
      await pipe(
        setDayBlobTask(
          blobClient,
          conf.MY_BANK_CONTAINER_NAME,
          JSON.stringify(res)
        ),
        TE.mapLeft(err => {
          logger.logUnknown(err);
        }),
        TE.map(resp =>
          logger.logInfo(
            `Response: ${JSON.stringify(
              // eslint-disable-next-line no-underscore-dangle
              resp._response.status.toString()
            )} `
          )
        )
      )();
    })
  )();
};
