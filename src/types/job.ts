import { Client } from 'discord.js';

export type Job = {
	name: string;
	schedule: string;
	action: () => Promise<void> | void;
};
