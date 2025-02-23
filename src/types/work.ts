export type Work = {
	// META DATA
	title: string;
	link: string;
	author: string;

	// ICONS
	contentRating: ContentRating;
	orientation: Orientation;
	contentWarning: ContentWarning;
	completion: Completion;

	// CONTENT
	fandom: boolean;
	pairings: string[];
	tags: string[];
	summary: string;

	// STATS
	chapters: number;
	totalChapters: number;
	lastUpdated: Date;
	published: Date;
};
