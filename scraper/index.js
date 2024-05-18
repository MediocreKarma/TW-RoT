import { scrapeQuestions } from "./questions.js";
import { scrapeSigns } from "./signs.js";
import { scrapeTheory } from "./theory.js";
import { scrapeWikiTables } from "./wikipediaTables.js";

(async () => {
  scrapeQuestions();
})();
