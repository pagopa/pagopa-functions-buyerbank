import { BlobItem } from '@azure/storage-blob';
import { getLastBlob, listBlobs } from '../storage';

const BLOB_NAME = "blob.json"

it('It should sucessfully featch a blob', async () => {

  const expectedBlob = {
    output: {
      result: "sucess",
      messages: [
        {
          code: "200",
          message: "ok",
          severity: "info"
        }
      ],
      body: {
        aliases: [
          {
            id: 0,
            participantID: "string",
            country: "string",
            alias: "string",
            language: "string"
          }
        ]
      }
    }
  }
  const containerClientStub = {
    listBlobsFlat: async function* (): AsyncIterableIterator<BlobItem> {
      yield expectedBlob as unknown as BlobItem;
    }
  };

  const blobClientStub = {
    getContainerClient: (_: any) => containerClientStub
  };

  const res = await listBlobs(blobClientStub as any, BLOB_NAME).next();

  expect(res.value).toBe(expectedBlob)
});

it('It should sucessfully featch a blob', async () => {
  const date1 = new Date();
  const date2 = new Date(date1.getTime() + 10 * 1000); // +10 sec

  const blobs = [{
    key1: "value1",
    properties: {
      lastModified: date1
    }
  },
  {
    key1: "value2",
    properties: {
      lastModified: date2
    }
  }];

  const containerClientStub = {
    listBlobsFlat: async function* (): AsyncIterableIterator<BlobItem> {
      yield blobs[0] as unknown as BlobItem;
      yield blobs[1] as unknown as BlobItem;
    }
  };

  const blobClientStub = {
    getContainerClient: (_: any) => containerClientStub
  };

  const res = await getLastBlob(blobClientStub as any, BLOB_NAME);

  expect(res).toBe(blobs[1])
});
