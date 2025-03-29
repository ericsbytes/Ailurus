import dotenv from 'dotenv';

dotenv.config();

const { TOKEN, CLIENT_ID, AO3_USERNAME, AO3_PASSWORD } = process.env;

if (!TOKEN || !CLIENT_ID) {
	throw new Error('Missing environment variables');
}

export const config = {
	bot: { token: TOKEN, clientId: CLIENT_ID },
	ao3: { username: AO3_USERNAME, password: AO3_PASSWORD },
};
