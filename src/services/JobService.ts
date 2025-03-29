import cron from 'node-cron';
import { Client } from 'discord.js';
import { Job } from '../types/job';

class JobService {
	jobs: Job[] = [];
	client: Client;

	constructor(client: Client, jobs: Job[]) {
		this.jobs = jobs;
		this.client = client;
	}

	registerJob(job: Job) {
		this.jobs.push(job);

		if (job.onStart) {
			job.action(this.client);
		}

		console.log(`Registering job: ${job.name}`);

		cron.schedule(job.schedule, async () => {
			try {
				await job.action(this.client);
			} catch (error) {
				console.error(`Error executing job ${job.name}:`, error);
			}
		});
	}

	async start() {
		const enabledJobs = this.jobs.filter(job => job.enabled);

		await Promise.all(
			enabledJobs
				.filter(job => job.onStart)
				.map(async job => {
					console.log(`Starting job immediately: ${job.name}`);
					await job.action(this.client);
				})
		);

		enabledJobs.forEach(async job => {
			console.log(`Starting job: ${job.name}`);

			cron.schedule(job.schedule, async () => {
				try {
					await job.action(this.client);
				} catch (error) {
					console.error(`Error executing job ${job.name}:`, error);
				}
			});
		});
	}
}

export default JobService;
