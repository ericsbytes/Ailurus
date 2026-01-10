import '@dotenvx/dotenvx/config';

import { startBot } from './bot';
import { startServer } from './api/server';

startBot().catch(console.error);
startServer().catch(console.error);
