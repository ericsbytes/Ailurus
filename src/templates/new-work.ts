import { EmbedBuilder } from 'discord.js';
import { Work } from '../types/work';
import palette from '../constants/palette';
import emojis from '../constants/emojis';

const SUMMARY_MAX_LENGTH = 1020;
const SUMMARY_TRUNCATE_LENGTH = 1014;

export default class NewWork {
	work: Work;
	embed: EmbedBuilder;

	constructor(data: Work) {
		this.work = data;

		this.embed = new EmbedBuilder()
			.setTitle(data.title)
			.setURL(data.link)
			.setAuthor({
				name: data.author,
				url: `https://archiveofourown.org/users/${data.author}/pseuds/${data.author}/`,
			})
			.setDescription(`-# ${data.fandom}`)
			.addFields(
				{
					name: 'Warnings',
					value: `${emojis.AO3[data.contentRating]}${
						emojis.AO3[data.orientation]
					}\n${emojis.AO3[data.contentWarning]}${
						emojis.AO3[data.completion]
					}`,
				},
				{
					name: 'Tags',
					value: [
						...data.pairings.map(tag => `**\`${tag}\`**`),
						...data.tags.map(tag => `\`${tag}\``),
					].join(', '),
				},
				{
					name: 'Summary',
					value: `>>> ${
						data.summary.length > SUMMARY_MAX_LENGTH
							? data.summary.slice(0, SUMMARY_TRUNCATE_LENGTH) +
							  ' [...]'
							: data.summary
					}`,
				},
				{
					name: 'Chapters',
					value: `${data.chapters}/${data.totalChapters}`,
					inline: true,
				},
				{
					name: 'Last Updated',
					value: `<t:${Math.floor(
						data.lastUpdated.getTime() / 1000
					)}:D>`,
					inline: true,
				},
				{
					name: 'Published',
					value: `<t:${Math.floor(
						data.published.getTime() / 1000
					)}:D>`,
					inline: true,
				}
			)
			.setFooter({
				text:
					data.published === data.lastUpdated
						? 'This is a new work.'
						: 'This is an updated work.',
			})
			.setColor(
				data.published === data.lastUpdated
					? palette.EMBED.NEW_WORK_COLOR
					: palette.EMBED.UPDATED_WORK_COLOR
			);
	}

	getEmbed() {
		return this.embed;
	}
}
