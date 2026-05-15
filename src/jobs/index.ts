import { checkBookmarks } from './check-bookmarks';
import { checkCourseAvailability } from './check-course-availability';
import { checkFeeds } from './check-feeds';

export default [checkFeeds, checkCourseAvailability, checkBookmarks];
