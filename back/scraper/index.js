import {populateQuestions, scrapeQuestions} from "./questions.js";
import {populateSigns, scrapeSigns} from "./signs.js";
import {populateTheory, scrapeTheory} from "./theory.js";
import {populateComparisonTables, scrapeWikiTables} from "./wikipediaTables.js";

(async () => {
    //wait populateQuestions();
    //await populateSigns();
    //await populateTheory();
    await populateComparisonTables();
})();
