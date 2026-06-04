import { crawler } from "./crawler.js";
import { generateInitialUrls } from "./urls.js";

const masterUrlList = generateInitialUrls();

await crawler.run(masterUrlList);
