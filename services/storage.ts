/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable functional/prefer-readonly-type */

import {
  BlobItem,
  BlobServiceClient,
  BlockBlobUploadResponse
} from "@azure/storage-blob";
import * as E from "fp-ts/lib/Either";
import * as TE from "fp-ts/lib/TaskEither";

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
