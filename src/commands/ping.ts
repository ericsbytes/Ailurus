import {
	CommandInteraction,
	MessageFlags,
	SlashCommandBuilder,
} from 'discord.js';
import emojis from '../constants/emojis';

export const data = new SlashCommandBuilder()
	.setName('ping')
	.setDescription('Replies with Pong!');

export async function execute(interaction: CommandInteraction) {
	const ping = Date.now() - interaction.createdTimestamp;

	return interaction.reply({
		content: `${emojis.BOT.PADDLE} \`${ping}ms\``,
		flags: MessageFlags.Ephemeral,
	});
}
