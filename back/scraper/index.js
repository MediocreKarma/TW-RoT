import { populateQuestions } from './questions.js';
import { populateSigns } from './signs.js';
import { populateTheory } from './theory.js';
import { populateComparisonTables } from './wikipediaTables.js';

(async () => {
    // await populateSigns();
    // await populateTheory();
    await populateComparisonTables();
    // await populateQuestions();
})();
