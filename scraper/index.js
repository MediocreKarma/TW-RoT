import { scrapeQuestions } from "./questions.js";
import { scrapeTheory } from "./theory.js";

// TODO: potentially one single thread for each type of operation

(async () => {
  scrapeTheory();
})();
