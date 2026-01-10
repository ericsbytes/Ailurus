import {
	ChatInputCommandInteraction,
	MessageFlags,
	SlashCommandBuilder,
} from 'discord.js';
import emojis from '../constants/emojis';
import DataService from '../../services/DataService';

export const data = new SlashCommandBuilder()
	.setName('track-course')
	.setDescription('Tracks a Brown course, waiting for its availability.!')
	.addIntegerOption(option =>
		option
			.setName('crn')
			.setDescription('The CRN of the course to track.')
			.setRequired(true)
	);

export async function execute(interaction: ChatInputCommandInteraction) {
	const crn = interaction.options.getInteger('crn', true);

	try {
		await DataService.addCourse(crn, interaction.user.id);

		await interaction.reply({
			content: `${emojis.BOT.LEAF} Now tracking course with CRN **${crn}** for availability!`,
			flags: MessageFlags.Ephemeral,
		});
	} catch (error) {
		console.error('Error adding course:', error);
		await interaction.reply({
			content: `${emojis.BOT.UPDATE} Failed to track course with CRN **${crn}**. It may already be tracked.`,
			flags: MessageFlags.Ephemeral,
		});
	}
}
