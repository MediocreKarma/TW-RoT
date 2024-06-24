import { populateQuestions } from './questions.js';
import { populateSigns } from './signs.js';
import { populateTheory } from './theory.js';
import { populateComparisonTables } from './wikipediaTables.js';

/**
 * Call all database populating functions
 * Await each one, otherwise program may have errors.
 * Lasts about 5 minutes.
 */
(async () => {
    await populateSigns();
    await populateTheory();
    await populateComparisonTables();
    await populateQuestions();
})();
