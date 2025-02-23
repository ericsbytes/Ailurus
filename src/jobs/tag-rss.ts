import Parser from 'rss-parser';

import { Job } from '../types/job';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const parser = new Parser({
	customFields: {
		feed: ['updated'],
		item: [
			'id',
			'published',
			'updated',
			'title',
			'link',
			'summary',
			'author',
		],
	},
});

export const tagRss: Job = {
	name: 'tag-rss',
	schedule: '* * * * *',
	// schedule: "0 * * * *",
	onStart: true,
	async action() {
		console.log('Checking for new posts...');

		const feeds = await prisma.rssFeed.findMany();

		for (const feed of feeds) {
			try {
				console.log(feed.url);

				const parsedFeed = await parser.parseURL(feed.url);

				if (feed.lastRefresh === parsedFeed.updated) {
					console.log('No new posts');
					continue;
				}

				const newPosts = parsedFeed.items.filter(
					item =>
						new Date(item.published) >
						(feed.lastRefresh ?? new Date(0))
				);

				console.log(newPosts);

				await prisma.rssFeed.update({
					where: { id: feed.id },
					data: { lastRefresh: parsedFeed.updated },
				});
			} catch (error) {
				console.error(error);
			}
		}
	},
};
