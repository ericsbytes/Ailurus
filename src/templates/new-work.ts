import { EmbedBuilder } from 'discord.js';
import { Work } from '../types/work';
import palette from '../bot/constants/palette';
import emojis from '../bot/constants/emojis';

const TRUNCATE_LENGTH = 1014;

function truncate(str: string) {
	return str.length > TRUNCATE_LENGTH
		? str.slice(0, TRUNCATE_LENGTH) + ' [...]'
		: str;
}

function truncateTags(tagsString: string): string {
	if (tagsString.length <= TRUNCATE_LENGTH) {
		return tagsString;
	}

	const pattern = new RegExp(`^(.{1,${TRUNCATE_LENGTH}})(,\\s[^,]+)?`);
	const match = pattern.exec(tagsString);

	if (!match) return tagsString.slice(0, TRUNCATE_LENGTH) + ' [...]';

	return `${match[1]}, [...]`;
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
					value: truncateTags(
						[
							...data.warnings.map(tag => `__**\`${tag}\`**__`),
							...data.pairings.map(tag => `**\`${tag}\`**`),
							...data.tags.map(tag => `\`${tag}\``),
						]
							.join(', ')
							.trim()
					),
				},
				{
					name: 'Summary',
					value: truncate(`>>> ${data.summary.trim()}`),
				},
				{
					name: 'Word Count',
					value: `${data.wordCount.toLocaleString()}`,
					inline: true,
				},
				{
					name: 'Chapters',
					value: `${data.chapters}/${data.totalChapters || '?'}`,
					inline: true,
				},
				{
					name: 'Last Updated',
					value: `${data.lastUpdated}`,
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
