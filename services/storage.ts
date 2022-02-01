/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable functional/prefer-readonly-type */

import {
  BlobItem,
  BlobServiceClient,
  BlockBlobUploadResponse
} from "@azure/storage-blob";
import * as E from "fp-ts/lib/Either";
import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/lib/TaskEither";
import * as O from "fp-ts/Option";
import { IResponseWithHeaders, withApiRequestWrapper } from "../utils/api";
import { verify } from "../utils/auth";
import { IConfig } from "../utils/config";
import { ILogger } from "../utils/logging";
import { ErrorResponses, toErrorServerResponse } from "../utils/responses";

/*
 * Collection of convenient function for Azure Blob Storage
 */
export const listBlobs = (
  blobServiceClient: BlobServiceClient,
  container: string
): AsyncIterableIterator<BlobItem> => {
  const containerClient = blobServiceClient.getContainerClient(container);

  return containerClient.listBlobsFlat();
};

// Function for convert a ReadableStream into a string
export const streamToString = (
  stream: NodeJS.ReadableStream
): Promise<string> => {
  const chunks: any[] = [];
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line functional/immutable-data
    stream.on("data", chunk => chunks.push(Buffer.from(chunk)));
    stream.on("error", err => reject(err));
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });
};

const getLastBlob = async (
  blobServiceClient: BlobServiceClient,
  container: string
): Promise<string> => {
  const containerClient = blobServiceClient.getContainerClient(container);
  // eslint-disable-next-line functional/no-let
  let res;

  for await (const blob of listBlobs(blobServiceClient, container)) {
    if (
      res === undefined ||
      blob.properties.lastModified.getTime() >
        res.properties.lastModified.getTime()
    ) {
      res = blob;
    }
  }

  if (res === undefined) {
    throw Error("No blob found.");
  }

  const downloadResponse = await containerClient
    .getBlobClient(res.name)
    .download();

  if (downloadResponse === undefined) {
    throw new Error("Blob not found");
  }

  return JSON.parse(
    await streamToString(
      downloadResponse.readableStreamBody as NodeJS.ReadableStream
    )
  );
};

export const getLastBlobTask = (
  blobServiceClient: BlobServiceClient,
  container: string
): TE.TaskEither<Error, string> =>
  TE.tryCatch(
    (): Promise<string> => getLastBlob(blobServiceClient, container),
    E.toError
  );

export const getDayBlob = async (
  blobServiceClient: BlobServiceClient,
  container: string
): Promise<string> => {
  const containerClient = blobServiceClient.getContainerClient(container);
  // Blobs are updated at 1:00 AM, shift 1h before
  const currDate = new Date();
  currDate.setHours(currDate.getHours() - 1);

  const downloadResponse = await containerClient
    .getBlobClient(currDate.toISOString().split("T")[0] + "_buyerbanks.json")
    .download();

  if (downloadResponse === undefined) {
    throw new Error("Blob not found");
  }

  return JSON.parse(
    await streamToString(
      downloadResponse.readableStreamBody as NodeJS.ReadableStream
    )
  );
};

export const getDayBlobTask = (
  blobServiceClient: BlobServiceClient,
  container: string
): TE.TaskEither<Error, string> =>
  TE.tryCatch(
    (): Promise<string> => getDayBlob(blobServiceClient, container),
    E.toError
  );

const setDayBlob = async (
  blobServiceClient: BlobServiceClient,
  container: string,
  content: string
): Promise<BlockBlobUploadResponse> => {
  const containerClient = blobServiceClient.getContainerClient(container);

  const blobName = new Date().toISOString().split("T")[0] + "_buyerbanks.json";
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  return blockBlobClient.upload(content, content.length);
};

export const setDayBlobTask = (
  blobServiceClient: BlobServiceClient,
  container: string,
  content: string
): TE.TaskEither<Error, BlockBlobUploadResponse> =>
  TE.tryCatch(
    (): Promise<BlockBlobUploadResponse> =>
      setDayBlob(blobServiceClient, container, content),
    E.toError
  );

const GetMyBanksData = (
  logger: ILogger,
  params: any,
  body: string,
  client: any
): TE.TaskEither<ErrorResponses, IResponseWithHeaders<string>> =>
  withApiRequestWrapper<string, IResponseWithHeaders<string>>(
    logger,
    () =>
      client.getPayerPSPsSCT01({
        ...params,
        ...{ "X-Signature": body }
      }),
    200,
    err => toErrorServerResponse(err)
  );

export const updateBuyerBankTask = (
  params: any,
  body: string,
  client: any,
  logger: ILogger,
  conf: IConfig
): TE.TaskEither<unknown, Error | BlockBlobUploadResponse> =>
  pipe(
    GetMyBanksData(logger, params, body, client),
    TE.chain(response =>
      TE.tryCatch(
        () => {
          const res = response.value;
          const headers: Headers = response.headers as Headers;

          if (
            headers.get("x-thumbprint") !==
            conf.PAGOPA_BUYERBANKS_THUMBPRINT_PEER
          ) {
            logger.logInfo(
              `Cannot validate response. Unkown thumbprint. ${JSON.stringify(
                response.headers
              )}`
            );
            throw new Error(
              "Error cannot verify the signature. Unknown thumbprint"
            );
          }

          pipe(
            verify(
              res,
              headers.get("x-signature") as string,
              conf.PAGOPA_BUYERBANKS_CERT_PEER,
              headers.get("x-signature-type") as string
            ),
            O.fromEither,
            O.fold(
              () => {
                logger.logInfo("Error during signature verify.");
                throw new Error("Signature cannot be verified");
              },
              verified => {
                if (!verified) {
                  logger.logInfo("Signature does not match.");
                  throw new Error("Invalid signature");
                }
              }
            )
          );

          const blobClient = BlobServiceClient.fromConnectionString(
            conf.BUYERBANKS_SA_CONNECTION_STRING
          );

          return pipe(
            setDayBlobTask(
              blobClient,
              conf.BUYERBANKS_BLOB_CONTAINER,
              JSON.stringify({
                ...{
                  banks: res,
                  timestamp: new Date().toISOString()
                },
                ...{ serviceId: conf.PAGOPA_BUYERBANKS_RS_URL }
              })
            ),
            TE.toUnion
          )();
        },
        reason => reason
      )
    )
  );
