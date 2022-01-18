/* tslint:disable: no-any */
process.env = {
  BUYERBANKS_BLOB_CONTAINER: "banks",
  BUYERBANKS_SA_CONNECTION_STRING: "UseDevelopmentStorage=true;",
  PAGOPA_BUYERBANKS_BRANCH: "1000",
  PAGOPA_BUYERBANKS_CERT: "NonEmptyString",
  PAGOPA_BUYERBANKS_CERT_PASSPHRASE: "",
  PAGOPA_BUYERBANKS_INSTITUTE: "100",
  PAGOPA_BUYERBANKS_KEY_CERT: "cert",
  PAGOPA_BUYERBANKS_RS_URL: "NonEmptyString",
  PAGOPA_BUYERBANKS_SIGNATURE: "NonEmptyString",
  PAGOPA_BUYERBANKS_SIGN_ALG: "RSA-SHA256",
  PAGOPA_BUYERBANKS_SIGN_ALG_STRING: "SHA256withRSA",
  PAGOPA_BUYERBANKS_THUMBPRINT: "NonEmptyString",
  AzureWebJobsStorage: "NonEmptyString"
}
import { getBuyerBanks } from "../handler";
import * as TE from "fp-ts/TaskEither"
import { getDayBlobTask } from "../../services/storage";

const logInfo = (msg: string) => console.log(msg);
const logError = (err: Error) => console.log(`err: ${err.message}`);
const logUnkown = (err: unknown) => console.log(err)

const context = {
  log: {
    error: logInfo,
    info: logError,
    unknown: logUnkown
  }
}


jest.mock('@azure/storage-blob', () => ({
  ...jest.requireActual('@azure/storage-blob'),
  BlobServiceClient: {
    fromConnectionString: jest.fn().mockReturnValue({
      getContainerClient: jest.fn().mockReturnValue({
        getBlobClient: jest.fn().mockReturnValue({
          download: jest.fn().mockReturnValue({
            readableStreamBody: {}
          })
        })
      }),
    }),
  }
}));

const buyerbanks = '{"output":{"result":"200","messages":[],"body":{"aliases":[{"id":1,"participantID":"AA123456","country":"IT","alias":"ALIAS.","language":"it"}]}}}'

jest.mock('../../services/storage', () => ({
  ...jest.requireActual('../../services/storage'),
  getDayBlobTask:
    jest.fn()
}));

describe("getBuyerBanks", () => {
  it("should return the 200 OK and the content of the Blob", async () => {
    (getDayBlobTask as jest.Mock).mockReturnValue(TE.right(buyerbanks))

    const response = await getBuyerBanks()(context as any);
    expect(response.kind).toBe("IResponseSuccessJson");
  });

  it("should return 404 - Not found, when fetching empty container", async () => {
    (getDayBlobTask as jest.Mock).mockReturnValue(TE.left(Error("Blob not found")))

    const response = await getBuyerBanks()(context as any);
    expect(response.kind).toBe("IResponseErrorNotFound");
  });
});