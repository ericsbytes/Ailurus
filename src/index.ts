import { Client } from 'discord.js';
import { config } from './config';
import { commands } from './commands';
import { deployCommands, deployGlobalCommands } from './utils/deploy-commands';
import JobService from './services/JobService';
import jobs from './jobs';

const client = new Client({
	intents: ['Guilds', 'GuildMessages', 'DirectMessages', 'MessageContent'],
});

client.once('ready', async () => {
	console.log('Ailurus has started!');
	console.log(`Logged in as ${client.user?.tag}`);

	await deployGlobalCommands();

	const jobService = new JobService(client, jobs);
	await jobService.start();

	console.log('Jobs started!');
});

client.on('guildCreate', async guild => {
	await deployCommands({ guildId: guild.id });
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) {
		return;
	}
	const { commandName } = interaction;

	console.log(`Received command: ${commandName}`);

	if (commands[commandName as keyof typeof commands]) {
		console.log(`Executing command: ${commandName}`);

		commands[commandName as keyof typeof commands].execute(interaction);
	}
});

client.login(config.bot.token);
