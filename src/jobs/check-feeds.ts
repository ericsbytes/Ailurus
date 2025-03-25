import axios from 'axios';
import * as cheerio from 'cheerio';

import { Job } from '../types/job';
import { Client } from 'discord.js';
import DataService from '../services/DataService';
import { Work } from '../types/work';
import {
	ContentRating,
	Orientation,
	ContentWarning,
	Completion,
} from '../enums/warnings';

function mapSymbolsToEnums(warningsSymbols: string[]) {
	const mappedValues: { [key: string]: string | null } = {
		contentRating: null,
		orientation: null,
		contentWarning: null,
		completion: null,
	};

	for (const tag of warningsSymbols) {
		if (Object.values(ContentRating).includes(tag as ContentRating)) {
			mappedValues.contentRating = tag as ContentRating;
		} else if (Object.values(Orientation).includes(tag as Orientation)) {
			mappedValues.orientation = tag as Orientation;
		} else if (
			Object.values(ContentWarning).includes(tag as ContentWarning)
		) {
			mappedValues.contentWarning = tag as ContentWarning;
		} else if (Object.values(Completion).includes(tag as Completion)) {
			mappedValues.completion = tag as Completion;
		}
	}
	return mappedValues;
}

async function parseWork(element: Element) {}

export const checkFeeds: Job = {
	name: 'check-feeds',
	enabled: true,
	schedule: '0 * * * *',
	onStart: true,
	async action(client: Client) {
		const feeds = await DataService.getAllFeeds();

		console.log('Checking for new posts...');
		console.log(feeds);

		for (const feed of feeds) {
			try {
				const { data } = await axios.get(feed.url);
				const channel = await client.channels.cache.get(feed.channel);

				const $ = cheerio.load(data);

				const $works = $('ol.index.group').children('li');
				const tagName = $('h2.heading > a.tag').text();
				console.log(`checking ${tagName}.`);

				$works.each((index, element) => {
					console.log('Checking work:', index);

					const elt = $(element);

					// get header info
					const $header = elt.children('div.header.module');
					const $heading = $header.children('h4.heading');

					const lastUpdated = $header.find('p.datetime').text();

					const $title = $heading.children('a').first();
					const titleLink = $title.attr('href');
					const authors = $heading
						.children('a[rel="author"]')
						.map((i, el) => $(el).text())
						.get();

					const fandoms = $header
						.find('h5.fandoms.heading > a.tag')
						.map((i, el) => $(el).text())
						.get();

					const warningsSymbols = $header
						.find('ul.required-tags > li > a > span')
						.map((i, el) => $(el).attr('class')?.split(' ')[0])
						.get();

					// tags
					const $tags = elt.children('ul.tags');
					const warnings = $tags
						.find('li.warnings > strong > a')
						.map((i, el) => $(el).text())
						.get();

					const relationships = $tags
						.find('li.relationships > a')
						.map((i, el) => $(el).text())
						.get();

					const allTags = $tags
						.find('li:not(.warnings):not(.relationships) > a')
						.map((i, el) => $(el).text())
						.get();

					// summary
					const summary = elt.children('blockquote.summary').text();

					// stats
					const $stats = elt.children('dl.stats');

					const wordCount = $stats.find('dd.words').text();
					const [chaptersWritten, chapters] = $stats
						.find('dd.chapters')
						.text()
						.split('/');

					// convert tags into ao3 symbols
					const mappedValues = mapSymbolsToEnums(warningsSymbols);

					const workData: Work = {
						title: $title.text(),
						link: titleLink ?? '',
						authors: authors,

						contentRating:
							mappedValues.contentRating as ContentRating,
						orientation: mappedValues.orientation as Orientation,
						contentWarning:
							mappedValues.contentWarning as ContentWarning,
						completion: mappedValues.completion as Completion,

						fandoms: fandoms,
						warnings: warnings,
						pairings: relationships,
						tags: allTags,
						summary: summary,

						wordCount: parseInt(wordCount),
						chapters: parseInt(chaptersWritten),
						totalChapters: parseInt(chapters),
						lastUpdated: new Date(lastUpdated),
					};

					console.log(workData);
				});
			} catch (error) {
				console.error('Error checking feed:', error);
			}
		}
	},
};
