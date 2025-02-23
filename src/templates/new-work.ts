import { EmbedBuilder } from 'discord.js';
import { Work } from '../types/work';
import emojis from '../constants/emojis';

export default class NewWork {
	constructor(data: Work) {
		console.log('NewWork');

		const newEmbed = new EmbedBuilder()
			.setTitle(data.title)
			.setURL(data.link)
			.setAuthor({
				name: data.author,
				url: `https://archiveofourown.org/users/acemarry/pseuds/${data.author}/`,
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
						data.summary.length > 1020
							? data.summary.slice(0, 1014) + ' [...]'
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
				text: `${
					data.published == data.lastUpdated
						? 'This is a new work.'
						: 'This is an updated work.'
				}`,
			})
			.setColor(data.published == data.lastUpdated ? 0xddcaee : 0xffebe0);
	}
}
