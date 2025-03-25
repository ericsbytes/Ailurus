import { EmbedBuilder } from 'discord.js';
import { Work } from '../types/work';
import palette from '../constants/palette';
import emojis from '../constants/emojis';

const SUMMARY_TRUNCATE_LENGTH = 1014;

function truncate(str: string) {
	return str.length > SUMMARY_TRUNCATE_LENGTH
		? str.slice(0, SUMMARY_TRUNCATE_LENGTH) + ' [...]'
		: str;
}

export default class NewWork {
	work: Work;
	embed: EmbedBuilder;

	constructor(data: Work) {
		this.work = data;

		this.embed = new EmbedBuilder()
			.setTitle(data.title)
			.setURL(`https://archiveofourown.org${data.link}`)
			.setAuthor({
				name: data.authors.join(', '),
			})
			.setDescription(`-# ${data.fandoms.join(', ')}`)
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
					value: truncate(
						[
							...data.warnings.map(tag => `__**\`${tag}\`**__`),
							...data.pairings.map(tag => `**\`${tag}\`**`),
							...data.tags.map(tag => `\`${tag}\``),
						].join(', ')
					),
				},
				{
					name: 'Summary',
					value: truncate(`>>> ${data.summary}`),
				},
				{
					name: 'Word Count',
					value: `${data.wordCount.toLocaleString()}`,
					inline: true,
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
				}
			)
			.setFooter({
				text:
					data.chapters === 1
						? 'This is a new work.'
						: 'This is an updated work.',
			})
			.setColor(
				data.chapters == 1
					? palette.EMBED.NEW_WORK_COLOR
					: palette.EMBED.UPDATED_WORK_COLOR
			);
	}

	getEmbed() {
		return this.embed;
	}
}
