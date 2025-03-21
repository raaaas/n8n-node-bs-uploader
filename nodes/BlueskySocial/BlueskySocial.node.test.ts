import { IExecuteFunctions } from 'n8n-workflow';
import { BlueskySocial } from './BlueskySocial.node';
import { NodeOperationError } from 'n8n-workflow';
import { Mock } from 'jest-mock';
require('dotenv').config();
describe('BlueskySocial', () => {
  let node: BlueskySocial;
  let executeFunctions: IExecuteFunctions;

  beforeEach(() => {
    node = new BlueskySocial();
    executeFunctions = {
      getNodeParameter: jest.fn() as jest.Mock,
      getCredentials: jest.fn() as jest.Mock,

      helpers: {
        request: jest.fn() as jest.Mock,
      },
      continueOnFail: jest.fn() as jest.Mock,
      getNode: jest.fn() as jest.Mock,
      getInputData: jest.fn() as jest.Mock,
    } as any;
  });

  it('should upload media successfully', async () => {
    // Mock the necessary functions and data
    (executeFunctions.getNodeParameter as jest.Mock).mockReturnValueOnce('uploadMedia');
    (executeFunctions.getNodeParameter as jest.Mock).mockReturnValueOnce('data');
    (executeFunctions.getInputData as jest.Mock).mockReturnValue([
      {
        json: {},
        binary: {
          data: {
            data: require('fs').readFileSync(process.env.TEST_IMAGE_PATH),
            mimeType: 'image/jpeg',
          },
        },
      },
    ]);
    (executeFunctions.getCredentials as jest.Mock).mockReturnValue({
      handle: process.env.BLUESKY_HANDLE,
      password: process.env.BLUESKY_PASSWORD,
    });
    (executeFunctions.helpers.request as jest.Mock).mockResolvedValueOnce({ accessJwt: 'testJwt' });
    (executeFunctions.helpers.request as jest.Mock).mockResolvedValueOnce(JSON.stringify({ blob: { ref: 'testRef' } }));

    // Call the execute function
    const result = await node.execute.call(executeFunctions as IExecuteFunctions);

    // Assert the result
    expect(result).toEqual([
      [
        {
          json: {
            blob: {
              blob: { ref: 'testRef' },
            },
          },
          binary: {},
        },
      ],
    ]);
  });

  it('should throw an error if no binary data is provided', async () => {
    // Mock the necessary functions and data
    (executeFunctions.getNodeParameter as jest.Mock).mockReturnValueOnce('uploadMedia');
    (executeFunctions.getNodeParameter as jest.Mock).mockReturnValueOnce('data');
    (executeFunctions.getInputData as jest.Mock).mockReturnValue([
      {
        json: {},
        binary: {},
      },
    ]);

    // Call the execute function and assert that it throws an error
    await expect(node.execute.call(executeFunctions as any)).rejects.toThrowError(NodeOperationError);
  });

  it('should handle API errors', async () => {
    // Mock the necessary functions and data
    (executeFunctions.getNodeParameter as jest.Mock).mockReturnValueOnce('uploadMedia');
    (executeFunctions.getNodeParameter as jest.Mock).mockReturnValueOnce('data');
    (executeFunctions.getInputData as jest.Mock).mockReturnValue([
      {
        json: {},
        binary: {
          data: {
            data: Buffer.from('test data'),
            mimeType: 'image/jpeg',
          },
        },
      },
    ]);
    (executeFunctions.getCredentials as jest.Mock).mockReturnValue({
      handle: 'testHandle',
      password: 'testPassword',
    });
    (executeFunctions.helpers.request as jest.Mock).mockResolvedValueOnce({ accessJwt: 'testJwt' });
    (executeFunctions.helpers.request as jest.Mock).mockRejectedValueOnce(new Error('API error'));

    // Call the execute function and assert that it throws an error
    await expect(node.execute.call(executeFunctions as any)).rejects.toThrowError('API error');
  });
});
