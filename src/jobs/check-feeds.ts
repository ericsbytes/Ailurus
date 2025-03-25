import axios from 'axios';
import * as cheerio from 'cheerio';

import { Ao3WorkSnapshot } from '@prisma/client';
import { Job } from '../types/job';
import { Channel, Client, TextChannel } from 'discord.js';
import DataService from '../services/DataService';
import { Work } from '../types/work';
import {
	ContentRating,
	Orientation,
	ContentWarning,
	Completion,
} from '../enums/warnings';
import NewWork from '../templates/new-work';
import emojis from '../constants/emojis';

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

async function parseFeed(feed: { url: string }) {
	const { data } = await axios.get(feed.url);

	const $ = cheerio.load(data);

	const $works = $('ol.index.group').children('li');
	const tagName = $('h2.heading > a.tag').text();
	console.log(`checking ${tagName}.`);

	const works = $works
		.map((index, element) => {
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
				lastUpdated: new Date(lastUpdated),
			};

			return workData;
		})
		.toArray();
	return { tagName, works };
}

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
				const channel = await client.channels.cache.get(feed.channel);

				if (!channel || !channel.isTextBased()) {
					throw `Channel ${feed.channel} not found or not a text channel`;
				}

				const { tagName, works } = await parseFeed(feed);

				// Get previous work snapshots from database
				const previousSnapshots = (await DataService.getWorkSnapshots(
					feed.id
				)) as Ao3WorkSnapshot[];

				// Create maps for faster lookups
				const previousSnapshotsMap = new Map(
					previousSnapshots.map(snapshot => [
						snapshot.workId,
						snapshot,
					])
				);

				// Create arrays of work IDs in their current order
				const currentWorkIds = works.map(work =>
					parseIdFromUrl(work.link)
				);
				const previousWorkIds = previousSnapshots.map(
					snapshot => snapshot.workId
				);

				// Arrays to store new and updated works
				const newWorks = [];
				const updatedWorks = [];

				// Check each current work
				for (const work of works) {
					const previousSnapshot = previousSnapshotsMap.get(
						parseIdFromUrl(work.link)
					);

					if (!previousSnapshot) {
						// Work ID not in snapshots - it's a new work
						console.log(`work not in ss: ${work.title}`);

						newWorks.push(work);
						continue;
					}

					// Work exists in snapshots - check if updated by timestamp
					if (
						work.lastUpdated.getTime() !==
						previousSnapshot.lastUpdated.getTime()
					) {
						console.log(`work date changed: ${work.title}`);

						updatedWorks.push(work);
						continue;
					}

					// Check if position has improved (lower index = higher position)
					const currentPosition = currentWorkIds.indexOf(
						parseIdFromUrl(work.link)
					);
					const previousPosition = previousWorkIds.indexOf(
						parseIdFromUrl(work.link)
					);

					if (currentPosition < previousPosition) {
						// Work has moved up in the list without timestamp change
						console.log(`work moved up: ${work.title}`);
						updatedWorks.push(work);
					}
					// If work has moved down without timestamp change, it's not considered updated
				}

				if (feed.init && newWorks.length + updatedWorks.length != 0) {
					await (channel as TextChannel).send({
						content: `${
							emojis.BOT.PENCIL
						} **Retrived** latest data for tag [**\`${
							feed.feedName || tagName
						}\`**](${feed.url}) <t:${Math.floor(
							new Date().getTime() / 1000
						)}:R>.`,
					});

					for (const work of [...newWorks, ...updatedWorks]) {
						const newWork = new NewWork(work);

						console.log(newWork.getEmbed());

						await (channel as TextChannel).send({
							embeds: [newWork.getEmbed()],
						});
					}
				}

				// Save current works as new snapshots
				const snapshotsToSave = works.map(work => ({
					workId: parseIdFromUrl(work.link),
					index: currentWorkIds.indexOf(parseIdFromUrl(work.link)),
					chapters: work.chapters,
					lastUpdated: work.lastUpdated,
				}));

				await DataService.updateFeed(feed.id, new Date());
				await DataService.saveWorkSnapshots(feed.id, snapshotsToSave);
			} catch (error) {
				console.error('Error checking feed:', error);
			}
		}
	},
};
