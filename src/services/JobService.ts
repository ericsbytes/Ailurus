import cron from 'node-cron';

import { Job } from '../types/job';

class JobService {
	jobs: Job[] = [];

	constructor(jobs: Job[]) {
		this.jobs = jobs;
	}

	registerJob(job: Job) {}

	start() {
		this.jobs.forEach(job => {
			console.log(`Starting job: ${job.name}`);

			cron.schedule(job.schedule, async () => {
				await job.action();
			});
		});
	}
}

export default JobService;
