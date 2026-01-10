const { TOKEN, CLIENT_ID, AO3_USERNAME, AO3_PASSWORD, COURT_WEBHOOK_KEY } =
	process.env;

if (!TOKEN || !CLIENT_ID) {
	throw new Error('Missing environment variables');
}

export const config = {
	bot: { token: TOKEN, clientId: CLIENT_ID },
	ao3: { username: AO3_USERNAME, password: AO3_PASSWORD },
	api: {
		port: process.env.PORT ? Number(process.env.PORT) : 3000,
		court_key: COURT_WEBHOOK_KEY || '',
	},
};
