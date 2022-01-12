const mockedStream = require('stream').Readable();
mockedStream._read = function (size: any) { };

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
          download: jest.fn().mockReturnValue({
            readableStreamBody: mockedStream
          })
        })
      }),
    }),
  }
}));

describe('storage', () => {


  it('It should sucessfully fetch a blob', async () => {

    const blobServiceClient = BlobServiceClient.fromConnectionString("");
    const res = await getDayBlob(blobServiceClient, CONTAINER);

    expect(res).toBe(JSON.stringify(undefined));
  });

  it('It should fetch undefined', async () => {

    const blobServiceClient = BlobServiceClient.fromConnectionString("");
    const res = await getDayBlob(blobServiceClient, CONTAINER);

    expect(res).toBe(undefined)
  });
});
