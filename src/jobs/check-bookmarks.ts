import axios from 'axios';
import * as cheerio from 'cheerio';

import { Ao3WorkSnapshot } from '@prisma/client';
import { Job } from '../types/job';
import { Client, TextChannel } from 'discord.js';
import DataService from '../services/DataService';
import AO3Service from '../services/AO3Service';
import { Work } from '../types/work';
import {
	ContentRating,
	Orientation,
	ContentWarning,
	Completion,
} from '../enums/warnings';
import NewWork from '../templates/new-work';
import emojis from '../bot/constants/emojis';
import { config } from '../config';

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

function parseIdFromUrl(titleLink: string) {
	return titleLink.split('/').filter(Boolean).pop() || '';
}

async function parseFeed(feed: { url: string }, client = axios) {
	const { data } = await client.get(feed.url);

	const $ = cheerio.load(data);

	const $works = $('ol.index.group').children('li');

	const res: Work[] = [];

	for (const element of $works) {
		const elt = $(element);

		// get header info
		const $header = elt.children('div.header.module');
		const $heading = $header.children('h4.heading');

		const lastUpdated = $header.find('p.datetime').text();

		if (!lastUpdated) continue;

		const $title = $heading.children('a').first();
		console.log('Checking work:', $title.text());

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

		console.log(
			$title.text(),
			'stats:',
			wordCount,
			chaptersWritten,
			chapters,
			lastUpdated,
		);

		const workData: Work = {
			title: $title.text(),
			link: titleLink ?? '',
			authors: authors,

			contentRating: mappedValues.contentRating as ContentRating,
			orientation: mappedValues.orientation as Orientation,
			contentWarning: mappedValues.contentWarning as ContentWarning,
			completion: mappedValues.completion as Completion,

			fandoms: fandoms,
			warnings: warnings,
			pairings: relationships,
			tags: allTags,
			summary: summary,

			wordCount: parseInt(wordCount.replace(/,/g, '')),
			chapters: parseInt(chaptersWritten.replace(/,/g, '')),
			totalChapters: parseInt(chapters.replace(/,/g, '')),
			lastUpdated: lastUpdated,
		};

		res.push(workData);
	}

	return res;
}

export const checkBookmarks: Job = {
	name: 'check-bookmarks',
	enabled: true,
	schedule: '0 * * * *',
	onStart: true,
	async action(client: Client) {
		// check channel exists
		const channel = await client.channels.cache.get(
			config.ao3.bookmarksChannel as string,
		);

		if (!channel || !channel.isTextBased()) {
			throw `Channel ${config.ao3.bookmarksChannel} not found or not a text channel`;
		}

		// log into ao3
		console.log('attempting login');

		const ao3Service = new AO3Service();
		await ao3Service.login(
			config.ao3.username as string,
			config.ao3.password as string,
		);

		console.log('Checking for bookmarks posts...');

		await new Promise(r => setTimeout(r, 3000));

		// parse bookmarks page
		const bookmarksURL = config.ao3.bookmarksURL as string;

		const res = await ao3Service.client.get(bookmarksURL);
		const $ = cheerio.load(res.data);
		const pageCountText = $('.pagination li:not(.previous):not(.next)')
			.last()
			.text()
			.trim();
		const pageCount = pageCountText ? parseInt(pageCountText) : 1;

		// process bookmarks
		const bookmarks = await DataService.getAllBookmarks();
		const updated: Set<Work> = new Set();
		const toStore: Set<Work> = new Set();

		for (let page = 1; page <= pageCount; page++) {
			const pageURL = `${bookmarksURL}&page=${page}`;

			const works: Work[] = await parseFeed({ url: pageURL }, ao3Service.client);

			for (const work of works) {
				const workId = parseIdFromUrl(work.link);

				console.log(`checking ${work.title}`);
				
				const existingWork = bookmarks.find(b => b.workId === workId);
				
				toStore.add(work);

				// if work is not being tracked, track
				if (!existingWork) {
					// TODO: add bookmark to db
					continue;
				}

				// check last stored version vs current version
				if (
					work.lastUpdated !== existingWork.lastUpdated ||
					work.chapters !== existingWork.chapters
				) {
					updated.add(work);
				}
			}
		}

		console.log(
			`Found ${updated.size} updated bookmarks and ${toStore.size} total bookmarks to store.`,
		);

		if (updated.size !== 0) {
			await (channel as TextChannel).send({
				content: `${
					emojis.BOT.PENCIL
				} **Retrived** latest updates for [**bookmarks**](<${config.ao3.bookmarksURL}>) <t:${Math.floor(
					new Date().getTime() / 1000,
				)}:R>.`,
			});

			for (const work of updated) {
				const newWork = new NewWork(work as Work);

				await (channel as TextChannel).send({
					embeds: [newWork.getEmbed()],
				});
			}
		}

		const snapshotsToSave = [...toStore].map(work => ({
			workId: parseIdFromUrl(work.link),
			chapters: work.chapters,
			lastUpdated: work.lastUpdated,
		}));

		await DataService.replaceBookmarks(snapshotsToSave);
	},
};
