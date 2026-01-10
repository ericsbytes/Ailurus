import { REST, Routes } from 'discord.js';
import { config } from '../config';
import { commands } from '../commands';

const commandsData = Object.values(commands).map(command => command.data);

const rest = new REST().setToken(config.bot.token);

type DeployCommandsProps = {
	guildId: string;
};

export async function deployCommands({ guildId }: DeployCommandsProps) {
	try {
		console.log('Started refreshing application (/) commands.');

		await rest.put(
			Routes.applicationGuildCommands(config.bot.clientId, guildId),
			{
				body: commandsData,
			}
		);

		console.log('Successfully reloaded application (/) commands.');
	} catch (error) {
		console.error(error);
	}
}

export async function deployGlobalCommands() {
	try {
		console.log('Started refreshing application (/) commands.');

		await rest.put(Routes.applicationCommands(config.bot.clientId), {
			body: commandsData,
		});

		console.log('Successfully reloaded application (/) commands.');
	} catch (error) {
		console.error(error);
	}
}
