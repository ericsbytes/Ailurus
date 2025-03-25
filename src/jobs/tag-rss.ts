import Parser from 'rss-parser';
import cheerio from 'cheerio';

import { Job } from '../types/job';
import { Client } from 'discord.js';
import { Work } from '../types/work';
import DataService from '../services/DataService';

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
	enabled: false,
	schedule: '* * * * *',
	// schedule: "0 * * * *",
	onStart: true,
	async action(client: Client) {
		console.log('Checking for new posts...');

		const feeds = await DataService.getAllFeeds();

		for (const feed of feeds) {
			try {
				const parsedFeed = await parser.parseURL(encodeURI(feed.url));

				console.log('retrieved');

				if (feed.lastRefresh === parsedFeed.updated) {
					console.log('No new posts');
					continue;
				}

				const newPosts = parsedFeed.items.filter(
					item =>
						new Date(item.updated) >
						(feed.lastRefresh ?? new Date(0))
				);

				console.log(
					parsedFeed.items.sort((a, b) => a.updated - b.updated)
				);

				for (const item of newPosts) {
					const work: Work = {
						title: item.title ?? 'Untitled work',
						link: item.link ?? '',
						author: item.author ?? 'Unknown author',
						published: new Date(item.published ?? 0),
						lastUpdated: new Date(item.updated ?? 0),
					};
				}

				await DataService.updateFeed(feed.id, parsedFeed.updated);
			} catch (error) {
				console.error(error);
			}
		}
	},
};
