/* eslint-disable no-console */
import { Roles, Teams } from './role.js';
import computeWinner from './winLogic.js';

/**
 * @type {Record<string, [Roles[], number[], Teams[]]>}
 */
const winTests = {
	'basic villager kill werewolf': [
		[Roles.WEREWOLF, Roles.MASON, Roles.MASON], [3, 0, 0],
		[Teams.VILLAGER],
	],
};

export default function runWinTests() {
	let fails = 0;
	for (const name in winTests) {
		if (Object.prototype.hasOwnProperty.call(winTests, name)) {
			const result = computeWinner(winTests[name][0], winTests[name][1]);
			const expected = winTests[name][2];

			let fail = false;
			if (result.length !== expected.length) { fail = true; }
			if (result.some((x, i) => expected[i] !== x)) { fail = true; }

			if (fail) {
				fails++;
				console.log('==============================');
				console.log('\tTEST FAILURE');
				console.log('\tWin logic test name:');
				console.log(`\t${name}`);
				console.log('\tExpected following array');
				console.log(`\t\t${JSON.stringify(expected)}`);
				console.log('\tReceived following array');
				console.log(`\t\t${JSON.stringify(result)}`);
				console.log('==============================');
			} else {
				console.log(`Passed win logic test ${name}`);
			}
		}
	}
	return fails;
}
