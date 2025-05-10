import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

class DataService {
	static db: PrismaClient = prisma;

	static async getAllFeeds() {
		return await this.db.ao3Feeds.findMany();
	}

	static async updateFeed(id: string, date: Date) {
		return await this.db.ao3Feeds.update({
			where: { id: id },
			data: {
				lastRefresh: date,
				init: true,
			},
		});
	}

	static async getWorkSnapshots(feedId: string) {
		return await this.db.ao3WorkSnapshot.findMany({
			where: {
				ao3FeedsId: feedId,
			},
			orderBy: {
				index: 'asc',
			},
		});
	}

	static async saveWorkSnapshots(
		feedId: string,
		snapshots: Prisma.Ao3WorkSnapshotCreateInput[]
	) {
		await this.db.ao3WorkSnapshot.deleteMany({
			where: {
				ao3FeedsId: feedId,
			},
		});

		return await Promise.all(
			snapshots.map(snapshot =>
				this.db.ao3WorkSnapshot.create({
					data: {
						index: snapshot.index,
						workId: snapshot.workId,
						chapters: snapshot.chapters,
						lastUpdated: snapshot.lastUpdated,
						ao3FeedsId: feedId,
					},
				})
			)
		);
	}
}
export default DataService;
