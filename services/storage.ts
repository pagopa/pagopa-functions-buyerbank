/* eslint-disable functional/no-let */
/* eslint-disable functional/immutable-data */
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

export const getLastBlob = async (
  blobServiceClient: BlobServiceClient,
  container: string
): Promise<BlobItem | undefined> => {
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
  return res;
};

export const getDayBlob = async (
  blobServiceClient: BlobServiceClient,
  container: string
): Promise<Blob | undefined> => {
  const containerClient = blobServiceClient.getContainerClient(container);

  const downloadResponse = await containerClient
    .getBlobClient("test.json") //.getBlobClient(new Date().toISOString() + "_buyerbanks.json")
    .download();

  return downloadResponse.blobBody;
};

export const getDayBlobTask = (
  blobServiceClient: BlobServiceClient,
  container: string
): TE.TaskEither<Error, Blob | undefined> =>
  TE.tryCatch(
    (): Promise<Blob | undefined> => getDayBlob(blobServiceClient, container),
    E.toError
  );

export const getLastBlobTask = (
  blobServiceClient: BlobServiceClient,
  container: string
): TE.TaskEither<Error, BlobItem | undefined> =>
  TE.tryCatch(
    (): Promise<BlobItem | undefined> =>
      getLastBlob(blobServiceClient, container),
    E.toError
  );

const setDayBlob = async (
  blobServiceClient: BlobServiceClient,
  container: string,
  content: string
): Promise<BlockBlobUploadResponse> => {
  const containerClient = blobServiceClient.getContainerClient(container);

  const blobName = new Date().toISOString() + "_buyerbanks.json";
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
