import express from 'express';

export async function startServer({
	port = Number(process.env.PORT ?? 3000),
} = {}) {
	const app = express();

	app.get('/', (req: express.Request, res: express.Response) =>
		res.status(200).send('Ailurus API')
	);

	app.post(
		'/webhook/courts',
		(req: express.Request, res: express.Response) => {
			// check if url param contains key
			const key = req.query.key;
			if (key !== process.env.COURT_WEBHOOK_KEY) {
				return res.status(401).send('Unauthorized');
			}

			res.status(200).send('Court webhook endpoint');
		}
	);

	const server = app.listen(port, () => {
		console.log(`[api] listening on :${port}`);
	});

	return { app, server };
}
