import {
	CommandInteraction,
	MessageFlags,
	SlashCommandBuilder,
} from 'discord.js';

import { PrismaClient } from '@prisma/client';

export const data = new SlashCommandBuilder()
	.setName('rss')
	.setDescription('RSS options.')
	.addSubcommand(subcommand =>
		subcommand
			.setName('add')
			.setDescription('Add a new RSS feed.')
			.addStringOption(option =>
				option
					.setName('url')
					.setDescription('The RSS url to track.')
					.setRequired(true)
			)
	);

export async function execute(interaction: CommandInteraction) {
	const prisma = new PrismaClient();

	console.log('SS');

	if (interaction.options.getSubcommand() === 'add') {
		await prisma.rssFeed.create({
			data: {
				url: interaction.options.getString('url') as string,
			},
		});
		await interaction.reply({
			content: 'RSS feed added!',
			flags: MessageFlags.Ephemeral,
		});
	}

	await prisma.$disconnect();
}
