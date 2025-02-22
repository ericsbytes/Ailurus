import { Client } from 'discord.js';
import { config } from './config';
import { commands } from './commands';
import { deployCommands } from './deploy-commands';
import JobService from './services/JobService';
import jobs from './jobs';

const client = new Client({
	intents: ['Guilds', 'GuildMessages', 'DirectMessages', 'MessageContent'],
});

client.once('ready', async () => {
	console.log('Discord bot is ready! 🤖');

	await deployCommands({ guildId: '747591437331202071' });

	const jobService = new JobService(jobs);
	jobService.start();
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

client.on('messageCreate', message => {
	if (!message.member) {
		// If the message is a DM, stop further execution
		return;
	}
	console.log(`${message.member.displayName} sent: ${message.content}`);
});

client.login(config.TOKEN);
