/* eslint-disable no-console */
import { Roles, Teams } from './role.js';
import computeWinner from './winLogic.js';

/**
 * @type {Record<string, [Roles[], number[], Teams[]]>}
 */
const winTests = {
	'basic villager kill werewolf': [
		[Roles.WEREWOLF, Roles.MASON, Roles.MASON], [0, 0, 1],
		[Teams.VILLAGER],
	],
	'basic villagers lose': [
		[Roles.WEREWOLF, Roles.MASON, Roles.MASON], [1, 1, 0],
		[Teams.WEREWOLF],
	],
	'basic tanner game': [
		[Roles.WEREWOLF, Roles.TANNER, Roles.MASON], [1, 1, 0],
		[Teams.TANNER],
	],
	'multiple deaths werewolves lose': [
		[Roles.WEREWOLF, Roles.MYSTIC_WOLF, Roles.MASON, Roles.MASON, Roles.INSOMNIAC],
		[2, 2, 1, 1, 0],
		[Teams.VILLAGER],
	],
	'no one died and no werewolves': [
		[Roles.MASON, Roles.MASON, Roles.INSOMNIAC], [1, 2, 0],
		[Teams.VILLAGER],
	],
	'no one died but werewolves exist': [
		[Roles.DREAM_WOLF, Roles.MASON, Roles.INSOMNIAC], [1, 2, 0],
		[Teams.WEREWOLF],
	],
	'multiple deaths werewolves win': [
		[Roles.WEREWOLF, Roles.MYSTIC_WOLF, Roles.MASON, Roles.MASON, Roles.INSOMNIAC],
		[2, 2, 3, 3, 0],
		[Teams.WEREWOLF],
	],
	'tanner dies everyone else lose': [
		[Roles.WEREWOLF, Roles.MYSTIC_WOLF, Roles.MASON, Roles.MASON, Roles.TANNER],
		[4, 4, 3, 3, 0],
		[Teams.TANNER],
	],
	'tanner dies villagers win': [
		[Roles.WEREWOLF, Roles.MYSTIC_WOLF, Roles.MASON, Roles.MASON, Roles.TANNER],
		[4, 4, 0, 3, 0],
		[Teams.TANNER, Teams.VILLAGER],
	],
	'tanner dies no werewolves 2 kills': [
		[Roles.INSOMNIAC, Roles.APPRENTICE_SEER, Roles.MASON, Roles.MASON, Roles.TANNER],
		[4, 4, 0, 0, 3],
		[Teams.TANNER],
	],
	'tanner dies no werewolves 1 kill': [
		[Roles.INSOMNIAC, Roles.APPRENTICE_SEER, Roles.MASON, Roles.MASON, Roles.TANNER],
		[4, 4, 0, 4, 0],
		[Teams.TANNER],
	],
	'no werewolves, killed villager': [
		[Roles.INSOMNIAC, Roles.APPRENTICE_SEER, Roles.MASON, Roles.MASON],
		[3, 3, 0, 3],
		[],
	],
	'minion villagers lose': [
		[Roles.WEREWOLF, Roles.MINION, Roles.MASON], [1, 1, 0],
		[Teams.WEREWOLF],
	],
	'minion villagers win': [
		[Roles.WEREWOLF, Roles.MINION, Roles.MASON, Roles.MASON], [1, 2, 0, 0],
		[Teams.VILLAGER],
	],
	'minion villagers tie win': [
		[Roles.WEREWOLF, Roles.MINION, Roles.MASON, Roles.MASON], [1, 1, 0, 0],
		[Teams.VILLAGER],
	],
	'minion no werewolf minion wins': [
		[Roles.MINION, Roles.MASON, Roles.MASON], [1, 0, 1],
		[Teams.WEREWOLF],
	],
	'minion no werewolf minion loses': [
		[Roles.MINION, Roles.MASON, Roles.MASON], [1, 0, 0],
		[Teams.VILLAGER],
	],
	'minion no werewolf everyone loses': [
		[Roles.MINION, Roles.MASON, Roles.MASON, Roles.INSOMNIAC], [1, 0, 0, 1],
		[],
	],
	'minion tanner no werewolf everyone loses': [
		[Roles.MINION, Roles.MASON, Roles.MASON, Roles.INSOMNIAC, Roles.TANNER],
		[1, 0, 0, 1, 2],
		[],
	],
	'minion tanner no werewolf minion wins': [
		[Roles.MINION, Roles.MASON, Roles.MASON, Roles.INSOMNIAC, Roles.TANNER],
		[1, 0, 2, 1, 2],
		[Teams.WEREWOLF],
	],
	'minion tanner no werewolf minion loses': [
		[Roles.MINION, Roles.MASON, Roles.MASON, Roles.INSOMNIAC, Roles.TANNER],
		[1, 0, 0, 1, 0],
		[Teams.VILLAGER],
	],
	'minion tanner no werewolf tanner wins': [
		[Roles.MINION, Roles.MASON, Roles.MASON, Roles.INSOMNIAC, Roles.TANNER],
		[4, 0, 4, 4, 1],
		[Teams.TANNER],
	],
	'minion tanner no werewolf tanner wins kill minion': [
		[Roles.MINION, Roles.MASON, Roles.MASON, Roles.INSOMNIAC, Roles.TANNER, Roles.WITCH],
		[4, 0, 4, 4, 0, 0],
		[Teams.TANNER],
	],
	'kill hunter kills werewolf': [
		[Roles.WEREWOLF, Roles.MASON, Roles.MASON, Roles.HUNTER], [3, 3, 3, 0],
		[Teams.VILLAGER],
	],
	'kill hunter kills villager': [
		[Roles.WEREWOLF, Roles.MASON, Roles.MASON, Roles.HUNTER], [3, 3, 3, 1],
		[Teams.WEREWOLF],
	],
};

export default function runWinTests() {
	let fails = 0;
	for (const name in winTests) {
		if (Object.prototype.hasOwnProperty.call(winTests, name)) {
			const result = computeWinner(winTests[name][0], winTests[name][1]);
			const expected = winTests[name][2];

			let fail = false;
			const resultSet = new Set(result);
			const expectSet = new Set(expected);
			if (resultSet.size !== expectSet.size) { fail = true; }
			if (!fail) {
				if (result.some((x) => !expectSet.has(x))) { fail = true; }
			}

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
				console.log(`Passed win logic test: ${name}`);
			}
		}
	}
	return fails;
}
