import { Roles, Teams } from './role.js';
import { constructRole } from './rolesIndiv.js';

/**
 * Compute the winner for a game of onuw
 * @param {Roles[]} rolesID Array of player roles
 * @param {number[]} votes Array of player IDs each player voted to kill
 * @returns {Teams[]} Winning teams
 */
export default function computeWinner(rolesID, votes) {
	const allRoles = new Set(rolesID);
	const hasTanner = allRoles.has(Roles.TANNER);
	const roles = rolesID.map((r) => constructRole(r));
	const hasWerewolfNonMinion = roles.some(
		(r) => r.killTeam === Teams.WEREWOLF,
	);

	const votesForPlayer = votes.map((_) => 0);
	votes.forEach((v) => votesForPlayer[v]++);

	const maxVotes = votesForPlayer.reduce((a, x) => (x > a ? x : a), -1);
	const killedPlayers = votesForPlayer
		.map((v, i) => (v === maxVotes ? i : NaN))
		.filter((x) => !Number.isNaN(x));

	if (!hasTanner) {
		// Werewolves win if and only if there is a werewolf and none were killed
		if (hasWerewolfNonMinion) {
			if (maxVotes <= 1) { return [Teams.WEREWOLF]; }
			if (killedPlayers.every((k) => roles[k].killTeam !== Teams.WEREWOLF)) {
				return [Teams.WEREWOLF];
			}
		}
		return [Teams.VILLAGER];
	}

	// There is a tanner

	if (maxVotes <= 1) {
		// No one was killed
		if (hasWerewolfNonMinion) { return [Teams.WEREWOLF]; }
		return [Teams.VILLAGER];
	}

	if (killedPlayers.some((p) => roles[p].winTeam === Teams.TANNER)) {
		// Tanner died

		// Killed a werewolf too => villagers ALSO win
		if (
			hasWerewolfNonMinion
			&& killedPlayers.some((k) => roles[k].killTeam === Teams.WEREWOLF)
		) {
			return [Teams.TANNER, Teams.VILLAGER];
		}

		// No werewolves died => werewolves do NOT win
		return [Teams.TANNER];
	}

	// Tanner did not die
	// Werewolves win if and only if there is a werewolf and none were killed
	if (
		hasWerewolfNonMinion
		&& killedPlayers.every((k) => roles[k].killTeam !== Teams.WEREWOLF)
	) {
		return [Teams.WEREWOLF];
	}
	return [Teams.VILLAGER];
}
