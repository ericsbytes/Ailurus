import {
	CommandInteraction,
	MessageFlags,
	ModalBuilder,
	SlashCommandBuilder,
} from 'discord.js';

import DataService from '../services/DataService';

export const data = new SlashCommandBuilder()
	.setName('feed')
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
	if (interaction.options.getSubcommand() === 'add') {
		const newFeedModal = new ModalBuilder()
			.setTitle('Add a new feed')
			.setCustomId('add_feed');

		await interaction.reply({
			content: 'RSS feed added!',
			flags: MessageFlags.Ephemeral,
		});
	}
}
