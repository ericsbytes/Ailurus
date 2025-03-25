import {
	ContentRating,
	Orientation,
	ContentWarning,
	Completion,
} from '../enums/warnings';

export type Work = {
	// META DATA
	title: string;
	link: string;
	authors: string[];

	// ICONS
	contentRating: ContentRating;
	orientation: Orientation;
	contentWarning: ContentWarning;
	completion: Completion;

	// CONTENT
	fandoms: string[];
	warnings: string[];
	pairings: string[];
	tags: string[];
	summary: string;

	// STATS
	wordCount: Number;
	chapters: Number;
	totalChapters: Number;
	lastUpdated: Date;
};
