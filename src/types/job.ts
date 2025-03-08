import { Client } from 'discord.js';

export type Job = {
	name: string;
	enabled: boolean;
	schedule: string;
	onStart: boolean;
	action: (client: Client) => Promise<void> | void;
};
