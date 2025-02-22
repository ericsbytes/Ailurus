import { Client } from 'discord.js';

export type Job = {
	name: string;
	schedule: string;
	onStart: boolean;
	action: () => Promise<void> | void;
};
