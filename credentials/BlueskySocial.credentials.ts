import {
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class BlueskySocial implements ICredentialType {
	name = 'blueskySocialApi';
	displayName = 'Bluesky Social API';
	documentationUrl = 'https://github.com/bluesky-social/atproto';
	properties: INodeProperties[] = [
		{
			displayName: 'Handle',
			name: 'handle',
			type: 'string',
			default: '',
			description: 'Your Bluesky handle (e.g., example.bsky.social)',
		},
		{
			displayName: 'Password',
			name: 'password',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
		},
	];

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://bsky.social',
			url: '/xrpc/com.atproto.server.createSession',
			method: 'POST',
			body: {
				identifier: '={{$credentials.handle}}',
				password: '={{$credentials.password}}',
			},
			json: true,
		},
	};
}
