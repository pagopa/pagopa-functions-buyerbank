import { Readable } from 'stream'
const buyerbanks = `{"output":{"result":"200","messages":[],"body":{"aliases":[{"id":1,"participantID":"AA123456","country":"IT","alias":"ALIAS.","language":"it"}]}}}`
const dataStream = Readable['from']([JSON.stringify(buyerbanks)])


import { BlobServiceClient } from '@azure/storage-blob';
import { getDayBlob } from '../storage';

const CONTAINER = "blobs"
/*
 * Unit test suite for Azure storage service utilities
 */


jest.mock('@azure/storage-blob', () => ({
  ...jest.requireActual('@azure/storage-blob'),
  BlobServiceClient: {
    fromConnectionString: jest.fn().mockReturnValue({
      getContainerClient: jest.fn().mockReturnValue({
        getBlobClient: jest.fn().mockReturnValue({
          download: jest.fn()
        })
      }),
    }),
  }
}));

describe('storage', () => {


  it('It should sucessfully fetch a blob', async () => {


    const blobServiceClient = BlobServiceClient.fromConnectionString("");
    (blobServiceClient.getContainerClient("").getBlobClient("").download as jest.Mock).mockReturnValue({
      readableStreamBody: dataStream
    })

    const res = await getDayBlob(blobServiceClient, CONTAINER);

    expect(res).toBe(buyerbanks);
  });

  it('It should fetch undefined', async () => {

    const blobServiceClient = BlobServiceClient.fromConnectionString("");
    (blobServiceClient.getContainerClient("").getBlobClient("").download as jest.Mock).mockReturnValue(undefined)

    await expect(
      getDayBlob(blobServiceClient, CONTAINER))
      .rejects
      .toThrow("Blob not found")
  });
});
