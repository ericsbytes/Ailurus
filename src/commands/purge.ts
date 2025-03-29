import {
	CommandInteraction,
	MessageFlags,
	PermissionFlagsBits,
	SlashCommandBuilder,
	TextChannel,
} from 'discord.js';
import emojis from '../constants/emojis';

export const data = new SlashCommandBuilder()
	.setName('purge')
	.setDescription('Purges all messages from the current channel.');

export async function execute(interaction: CommandInteraction) {
	const channel = interaction.channel;
	if (!channel || !interaction.guild) {
		return interaction.reply({
			content: `${emojis.BOT.LEAF} This command can only be used in a text channel.`,
			flags: MessageFlags.Ephemeral,
		});
	}

	const me = interaction.guild.members.me;

	if (!me) {
		console.error('Bot is not in the guild.');
		return;
	}

	if (
		!(interaction.channel as TextChannel)
			.permissionsFor(me)
			.has(PermissionFlagsBits.ManageMessages)
	) {
		return interaction.reply({
			content: `${emojis.BOT.LEAF} Missing \`Manage Messages\` permission.`,
			flags: MessageFlags.Ephemeral,
		});
	}

	let messages;

	do {
		messages = await (interaction.channel as TextChannel).bulkDelete(
			100,
			true
		);
	} while (messages.size > 0);

	return interaction.reply({
		content: `${emojis.BOT.LEAF} \`Purged all messages from channel.\``,
		flags: MessageFlags.Ephemeral,
	});
}
