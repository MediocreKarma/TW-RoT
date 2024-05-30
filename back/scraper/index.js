import {populateQuestions, scrapeQuestions} from "./questions.js";
import {populateSigns, scrapeSigns} from "./signs.js";
import { scrapeTheory } from "./theory.js";
import { scrapeWikiTables } from "./wikipediaTables.js";
import { pool } from "./db.js";

(async () => {
    //wait populateQuestions();
    await populateSigns();
})();
