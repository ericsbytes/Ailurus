import cron from 'node-cron';

import { Job } from '../types/job';

class JobService {
	jobs: Job[] = [];

	constructor(jobs: Job[]) {
		this.jobs = jobs;
	}

	registerJob(job: Job) {}

	async start() {
		await Promise.all(
			this.jobs
				.filter(job => job.onStart)
				.map(async job => {
					console.log(`Starting job immediately: ${job.name}`);
					await job.action();
				})
		);

		this.jobs.forEach(async job => {
			console.log(`Starting job: ${job.name}`);

			cron.schedule(job.schedule, async () => {
				await job.action();
			});
		});
	}
}

export default JobService;
