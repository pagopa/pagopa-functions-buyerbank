/* eslint-disable no-console */
import { Context } from "@azure/functions";
import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/Either";
import * as MyBankClient from "../generated/definitions/mybank/client";
import { getPayerPSPsSCT01Request } from "../generated/definitions/mybank/getPayerPSPsSCT01Request";
import { withApiRequestWrapper } from "../utils/api";
import { getConfigOrThrow } from "../utils/config";
import { fetchApi } from "../utils/fetch";
import { getLogger } from "../utils/logging";
import { sign } from "../utils/auth";
// import { toDefaultResponseErrorInternal } from "../utils/responses";

const conf = getConfigOrThrow();

const mybankclient = MyBankClient.createClient({
  baseUrl: conf.MY_BANK_RS_URL,
  fetchApi
});

const body: getPayerPSPsSCT01Request = {
  input: {
    branch: "branch",
    institute: "institute"
  }
};

const params = {
  "X-Signature-Type": conf.MY_BANK_SIGN_ALG_STRING,
  "X-Thumbprint": conf.MY_BANK_THUMBPRINT,
  input: body
};

export const getUpdateBuyerBank = async (
  context: Context,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  timer: any
): Promise<void> => {
  context.log(`Timed update executed, timer: ${timer}`);
  context.log(`key: ${conf.MY_BANK_CERT_PASSPHRASE.toString()}`);
  pipe(
    sign(
      JSON.stringify(body),
      conf.MY_BANK_KEY.toString(),
      conf.MY_BANK_CERT_PASSPHRASE.toString(),
      conf.MY_BANK_SIGN_ALG.toString()
    ),
    E.fold(
      (e: Error) => console.log(e), // toDefaultResponseErrorInternal(e),
      async (signature: string) =>
        await pipe(
          withApiRequestWrapper(
            getLogger(context, "BuyerBankService", "UpdateBuyerBank"),
            () =>
              mybankclient.getPayerPSPsSCT01({
                ...params,
                ...{ "X-Signature": signature }
              }),
            200
          ),
          // TODO: fix flow
          TE.mapLeft(err => console.log(err)), // toDefaultResponseErrorInternal(e),
          TE.map(res => console.log(`Result: ${JSON.stringify(res)}`)) // update blob storage
        )()
    )
  );
};
