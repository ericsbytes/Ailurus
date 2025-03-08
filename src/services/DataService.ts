import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class DataService {
	static db: PrismaClient = prisma;

	static async addFeed(url: string) {
		return await this.db.tags.create({
			data: {
				url: url,
			},
		});
	}

	static async updateFeed(id: string, date: Date) {
		return await this.db.tags.update({
			where: { id: id },
			data: {
				lastRefresh: date,
			},
		});
	}

	static async getAllFeeds() {
		console.log('Getting all feeds');
		console.log(await this.db.tags.findMany());

		return await this.db.tags.findMany();
	}
}
export default DataService;
