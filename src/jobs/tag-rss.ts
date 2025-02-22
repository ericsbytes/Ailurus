import Parser from 'rss-parser';

import { Job } from '../types/job';
import { Client } from 'discord.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const tagRss: Job = {
	name: 'tag-rss',
	schedule: '*/10 * * * * *',
	async action() {
		console.log('Checking for new posts...');

		const parser = new Parser();

		const feeds = await prisma.rssFeed.findMany();

		for (const feed of feeds) {
			try {
				const parsedFeed = await parser.parseURL(feed.url);
				console.log(parsedFeed.updated);
			} catch (error) {
				console.error(error);
			}
		}
	},
};
