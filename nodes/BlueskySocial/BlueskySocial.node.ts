import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
  NodeConnectionType,
  INodeInputConfiguration,
  INodeOutputConfiguration,
} from 'n8n-workflow';

export class BlueskySocial implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Bluesky Social',
    name: 'blueskySocial',
    group: ['community'],
    version: 1.0,
    description: 'Upload media to Bluesky Social',
    defaults: {
      name: 'Bluesky Social',
    },
    inputs: ['main'] as (NodeConnectionType | INodeInputConfiguration)[],
    outputs: ['main'] as (NodeConnectionType | INodeOutputConfiguration)[],
    credentials: [
      {
        name: 'blueskySocialApi',
        required: true,
      },
    ],
    properties: [
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'Upload Media',
            value: 'uploadMedia',
            description: 'Upload media to Bluesky',
            action: 'Upload media to Bluesky',
          },
        ],
        default: 'uploadMedia',
      },
      {
        displayName: 'Binary Data',
        name: 'binaryData',
        type: 'string',
        default: 'data',
        description: 'Name of the binary property containing the data to upload',
        required: true,
        displayOptions: {
          show: {
            operation: [
              'uploadMedia',
            ],
          },
        },
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const operation = this.getNodeParameter('operation', 0) as string;

    let responseData: any;

    for (let i = 0; i < items.length; i++) {
      try {
        if (operation === 'uploadMedia') {
          const binaryDataPropertyName = this.getNodeParameter('binaryData', i) as any;

          if (items[i].binary === undefined) {
            throw new NodeOperationError(this.getNode(), `No binary data property "${binaryDataPropertyName}" exists on item ${i}!`);
          }

          const binaryData = items[i].binary![binaryDataPropertyName] as any;

          if (binaryData === undefined) {
            throw new NodeOperationError(this.getNode(), `Binary data property "${binaryDataPropertyName}" does not contain any data on item ${i}!`);
          }

          const credentials = await this.getCredentials('blueskySocialApi');

          const handle = credentials.handle as string;
          const password = credentials.password as string;

          // 1. Create Session
          const sessionResponse = await this.helpers.request({
            url: 'https://bsky.social/xrpc/com.atproto.server.createSession',
            method: 'POST',
            body: {
              identifier: handle,
              password: password,
            },
            json: true,
          });

          const accessJwt = sessionResponse.accessJwt;

          // 2. Upload Blob
          const uploadResponse = await this.helpers.request({
            url: 'https://bsky.social/xrpc/com.atproto.repo.uploadBlob',
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessJwt}`,
              'Content-Type': 'application/octet-stream',
            },
            body: (binaryData as any).data,
            encoding: null, // Important for binary data
            json: false, // We expect a binary response
          });

          if (typeof uploadResponse === 'string') {
            responseData = {
              blob: JSON.parse(uploadResponse),
            };
          } else {
            responseData = {
              blob: JSON.parse(uploadResponse.toString()),
            };
          }
        } else {
          throw new NodeOperationError(this.getNode(), `Unknown operation "${operation}"`);
        }

        const executionData: INodeExecutionData = {
          json: responseData,
          binary: {},
        };

        items[i] = executionData;
      } catch (error: any) {
        if (this.continueOnFail()) {
          const executionData: INodeExecutionData = {
            json: {
              error: error.message
            },
            binary: {},
            pairedItem: i,
          };
          items.push(executionData);
          continue;
        }
        throw error;
      }
    }

    return [items];
  }
}
