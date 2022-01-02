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
	const roles = rolesID.map((r) => constructRole(r));
	const hasWerewolfNonMinion = roles.some(
		(r) => r.killTeam === Teams.WEREWOLF,
	);

	const votesForPlayerRaw = votes.map((_) => 0);
	votes.forEach((v) => votesForPlayerRaw[v]++);
	const votesForPlayer = votesForPlayerRaw.map((x) => (x > 1 ? x : 0));

	const maxVotes = votesForPlayer.reduce((a, x) => (x > a ? x : a), -1);
	const killedPlayers = votesForPlayer
		.map((v, i) => (v === maxVotes && v > 1 ? i : NaN))
		.filter((x) => !Number.isNaN(x));

	// There is a tanner
	if (allRoles.has(Roles.TANNER)) {
		// No one was killed
		if (maxVotes <= 1) {
			if (hasWerewolfNonMinion) { return [Teams.WEREWOLF]; }
			return [Teams.VILLAGER];
		}

		// Tanner died
		if (killedPlayers.some((p) => roles[p].winTeam === Teams.TANNER)) {
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
	}

	// Either no tanner at all, or tanner didn't die (but someone did)
	// Either way, tanner is now irrelevant

	const werewolfDied = killedPlayers.some((k) => roles[k].killTeam === Teams.WEREWOLF);

	// If at least one werewolf died => villagers win
	if (werewolfDied) {
		return [Teams.VILLAGER];
	}

	// If no werewolves and no one died => villagers win
	if (!hasWerewolfNonMinion && maxVotes <= 1) {
		return [Teams.VILLAGER];
	}

	// Werewolves win if and only if there is a werewolf and none were killed
	if (hasWerewolfNonMinion) {
		return [Teams.WEREWOLF];
	}

	// No werewolves AND someone died

	// If no minion, then no one wins
	if (!allRoles.has(Roles.MINION)) {
		return [];
	}

	// Special case - we have a minion but no werewolves
	// Rules are iffy, so here's what I'm doing:
	// Kill only minion = villagers win
	// Kill only non-minion = minion wins <- rules do specify this
	// Kill both = no one wins
	if (killedPlayers.length === 1 && roles[killedPlayers[0]].role === Roles.MINION) {
		return [Teams.VILLAGER];
	} else if (killedPlayers.every((id) => roles[id].role !== Roles.MINION)) {
		return [Teams.WEREWOLF];
	} else {
		return [];
	}
}
