/* eslint-disable functional/no-let */
/* eslint-disable functional/immutable-data */
import { BlobItem, BlobServiceClient } from "@azure/storage-blob";

export const listBlobs = (
  blobServiceClient: BlobServiceClient,
  container: string
): AsyncIterableIterator<BlobItem> => {
  const containerClient = blobServiceClient.getContainerClient(container);

  return containerClient.listBlobsFlat();
};

export const getLastBlob = async (
  blobServiceCliet: BlobServiceClient,
  container: string
): Promise<BlobItem | undefined> => {
  let res;

  for await (const blob of listBlobs(blobServiceCliet, container)) {
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
