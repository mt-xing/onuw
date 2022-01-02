/* eslint-disable no-console */

import runWinTests from './game/winLogicTest.js';

console.log('Running Test Cases');
console.log('\n\n');
let fails = 0;
fails += runWinTests();
console.log('\n\n');
console.log('All tests completed');
console.log(`Total Failures: ${fails}`);
if (fails > 0) {
	console.log('Some tests failed');
}
