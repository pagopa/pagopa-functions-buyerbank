import { Context } from "@azure/functions";
import { pipe, flow } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import * as E from "fp-ts/Either";
import * as MyBankClient from "../utils/MyBankCustomClient";
import { getConfigOrThrow } from "../utils/config";
import { fetchApi } from "../utils/fetch";
import { getLogger } from "../utils/logging";
import { sign } from "../utils/auth";
import { updateBuyerBankTask } from "../services/storage";
import { getPayerPSPsSCT01Request } from "../generated/definitions/mybank/getPayerPSPsSCT01Request";

/*
 * Time triggered function for daily buyerbank list update
 */

const conf = getConfigOrThrow();

const mybankclient = MyBankClient.createClient({
  baseUrl: conf.PAGOPA_BUYERBANKS_RS_URL,
  fetchApi
});

// eslint-disable-next-line prettier/prettier
const body: getPayerPSPsSCT01Request = `{"input":{"branch": "10000","institute": "1000"}}`;

const params = {
  "X-Signature-Type": conf.PAGOPA_BUYERBANKS_SIGN_ALG_STRING,
  "X-Thumbprint": conf.PAGOPA_BUYERBANKS_THUMBPRINT,
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
          conf.PAGOPA_BUYERBANKS_KEY_CERT.toString(),
          conf.PAGOPA_BUYERBANKS_CERT_PASSPHRASE.toString(),
          conf.PAGOPA_BUYERBANKS_SIGN_ALG.toString()
        ),
        E.fold(
          (err: Error) => logger.logUnknown(err),
          (signature: string) => signature
        )
      )
    ),
    E.toUnion
  )(conf.PAGOPA_BUYERBANKS_SIGNATURE);

  await pipe(
    updateBuyerBankTask(
      params,
      signedBody as string,
      mybankclient,
      logger,
      conf
    ),
    TE.mapLeft(err => {
      logger.logUnknown(err);
      throw err;
    }),
    TE.map(_ => logger.logInfo("List updated"))
  )();
};
