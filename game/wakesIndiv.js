import { Modifiers, Roles, Teams } from './role.js';
import State, { CENTER_SIZE } from './state.js';
import { makeList } from './utils.js';
import WakeOrder from './wake.js';

// #region Werewolves

/**
 * Fetch a list of all the werewolf players at a current point in the game
 * @param {State} state
 * @returns {string[]}
 */
function getAllWerewolves(state) {
	const wolves = [];
	for (let i = 0; i < state.numPlayers; i++) {
		if (state.getPlayer(i).currentRole.killTeam === Teams.WEREWOLF) {
			wolves.push(state.getName(i));
		}
	}
	return wolves;
}

export class WerewolfWake extends WakeOrder {
	constructor() {
		super([2, 0], 'Werewolves');
	}

	/**
     * Returns the player names of the dream wolf, if one exists in the game
     * @param {State} state
     * @returns {string | null}
     */
	static #getDreamWolf(state) {
		for (let i = 0; i < state.numPlayers; i++) {
			if (state.getPlayer(i).currentRole.role === Roles.DREAM_WOLF) {
				return state.getName(i);
			}
		}
		return null;
	}

	/**
	 * @param {(num: number, allowSelf: boolean) => Promise<number[]>} pickPlayers
	 * Number of players and whether self selection is allowed to ids
	 * @param {(num: number) => Promise<number[]>} pickCenters Number of cards to pick to ids
	 * @param {(choices: string[]) => Promise<number>} pickChoice Array of choices to id of choice
	 * @param {(msg: string) => void} giveInfo Show information to the player
	 * @param {State} state Reference to the current game state
	 * @param {number} id Current player ID
	 */
	async act(pickPlayers, pickCenters, pickChoice, giveInfo, state, id) {
		const wolves = getAllWerewolves(state);
		giveInfo(`The werewolves are: ${makeList(wolves)}`);
		const dream = WerewolfWake.#getDreamWolf(state);
		if (dream !== null) {
			giveInfo(`However, ${dream} is a dream wolf`);
		}
		if (wolves.length === 1) {
			giveInfo('Since you are the only werewolf, you may view a role from the center');
			const pick = await pickCenters(1);
			if (pick.length === 1) {
				giveInfo(`The center role you picked was ${state.getCenter(pick[0]).roleName}`);
			}
		}
	}
}

export class MysticWolfWake extends WakeOrder {
	constructor() {
		super([2, 1], 'Mystic Wolf');
	}

	/**
	 * @param {(num: number, allowSelf: boolean) => Promise<number[]>} pickPlayers
	 * Number of players and whether self selection is allowed to ids
	 * @param {(num: number) => Promise<number[]>} pickCenters Number of cards to pick to ids
	 * @param {(choices: string[]) => Promise<number>} pickChoice Array of choices to id of choice
	 * @param {(msg: string) => void} giveInfo Show information to the player
	 * @param {State} state Reference to the current game state
	 * @param {number} id Current player ID
	 */
	async act(pickPlayers, pickCenters, pickChoice, giveInfo, state, id) {
		giveInfo('You may view one other player\'s role');
		const view = await pickPlayers(1, false);
		if (view.length === 1) {
			giveInfo(`The role ${state.getName(view[0])} has is ${state.getPlayer(view[0]).currentRole.roleName}`);
		}
	}
}

export class MinionWake extends WakeOrder {
	constructor() {
		super([3], 'Minion');
	}

	/**
	 * @param {(num: number, allowSelf: boolean) => Promise<number[]>} pickPlayers
	 * Number of players and whether self selection is allowed to ids
	 * @param {(num: number) => Promise<number[]>} pickCenters Number of cards to pick to ids
	 * @param {(choices: string[]) => Promise<number>} pickChoice Array of choices to id of choice
	 * @param {(msg: string) => void} giveInfo Show information to the player
	 * @param {State} state Reference to the current game state
	 * @param {number} id Current player ID
	 */
	async act(pickPlayers, pickCenters, pickChoice, giveInfo, state, id) {
		const ww = getAllWerewolves(state);
		if (ww.length > 0) {
			giveInfo(`The werewolves are: ${makeList(ww)}`);
		} else {
			giveInfo('There are no werewolves.');
			giveInfo('If there are still no werewolves by the end of the night, then you must convince the villagers to kill a villager besides yourself to win.');
		}
	}
}
// #endregion

// #region Villagers
export class SentinelWake extends WakeOrder {
	constructor() {
		super([0], 'Sentinel');
	}

	/**
	 * @param {(num: number, allowSelf: boolean) => Promise<number[]>} pickPlayers
	 * Number of players and whether self selection is allowed to ids
	 * @param {(num: number) => Promise<number[]>} pickCenters Number of cards to pick to ids
	 * @param {(choices: string[]) => Promise<number>} pickChoice Array of choices to id of choice
	 * @param {(msg: string) => void} giveInfo Show information to the player
	 * @param {State} state Reference to the current game state
	 * @param {number} id Current player ID
	 */
	async act(pickPlayers, pickCenters, pickChoice, giveInfo, state, id) {
		giveInfo('You may pick one other player to protect');
		const protect = await pickPlayers(1, false);
		if (protect.length === 1) {
			const i = protect[0];
			state.getPlayer(i).currentRole.modifiers.add(Modifiers.SENTINEL);
		}
	}
}

export class MasonWake extends WakeOrder {
	constructor() {
		super([4], 'Masons');
	}

	/**
	 * @param {(num: number, allowSelf: boolean) => Promise<number[]>} pickPlayers
	 * Number of players and whether self selection is allowed to ids
	 * @param {(num: number) => Promise<number[]>} pickCenters Number of cards to pick to ids
	 * @param {(choices: string[]) => Promise<number>} pickChoice Array of choices to id of choice
	 * @param {(msg: string) => void} giveInfo Show information to the player
	 * @param {State} state Reference to the current game state
	 * @param {number} id Current player ID
	 */
	async act(pickPlayers, pickCenters, pickChoice, giveInfo, state, id) {
		const masons = [];
		for (let i = 0; i < state.numPlayers; i++) {
			if (state.getPlayer(i).currentRole.role === Roles.MASON) {
				masons.push(state.getName(i));
			}
		}
		if (masons.length === 1) {
			giveInfo('You are the only mason. The other mason started in the center.');
		} else {
			giveInfo(`The masons are ${makeList(masons)}`);
		}
	}
}

export class SeerWake extends WakeOrder {
	constructor() {
		super([5, 1], 'Seer');
	}

	/**
	 * @param {(num: number, allowSelf: boolean) => Promise<number[]>} pickPlayers
	 * Number of players and whether self selection is allowed to ids
	 * @param {(num: number) => Promise<number[]>} pickCenters Number of cards to pick to ids
	 * @param {(choices: string[]) => Promise<number>} pickChoice Array of choices to id of choice
	 * @param {(msg: string) => void} giveInfo Show information to the player
	 * @param {State} state Reference to the current game state
	 * @param {number} id Current player ID
	 */
	async act(pickPlayers, pickCenters, pickChoice, giveInfo, state, id) {
		const choice = await pickChoice(['View two center roles', 'View one other player\'s role']);
		if (choice === 0) {
			// View two center
			const cards = await pickCenters(2);
			if (cards.length !== 0) {
				const roles = cards.map((c) => state.getCenter(c).roleName);
				giveInfo(`The roles you selected in the center were ${makeList(roles)}`);
			}
		} else if (choice === 1) {
			// View one other player
			const card = await pickPlayers(1, false);
			if (card.length === 1) {
				const pid = card[0];
				giveInfo(`The role that ${state.getName(pid)} has is ${state.getPlayer(pid).currentRole.roleName}`);
			}
		}
	}
}

export class ApprenticeSeerWake extends WakeOrder {
	constructor() {
		super([5, 2], 'Apprentice Seer');
	}

	/**
	 * @param {(num: number, allowSelf: boolean) => Promise<number[]>} pickPlayers
	 * Number of players and whether self selection is allowed to ids
	 * @param {(num: number) => Promise<number[]>} pickCenters Number of cards to pick to ids
	 * @param {(choices: string[]) => Promise<number>} pickChoice Array of choices to id of choice
	 * @param {(msg: string) => void} giveInfo Show information to the player
	 * @param {State} state Reference to the current game state
	 * @param {number} id Current player ID
	 */
	async act(pickPlayers, pickCenters, pickChoice, giveInfo, state, id) {
		giveInfo('You may view one role from the center');
		const cards = await pickCenters(1);
		if (pickCenters.length === 1) {
			const role = state.getCenter(cards[0]);
			giveInfo(`The role you selected in the center was ${role.roleName}`);
		}
	}
}

export class RobberWake extends WakeOrder {
	constructor() {
		super([6, 1], 'Robber');
	}

	/**
	 * @param {(num: number, allowSelf: boolean) => Promise<number[]>} pickPlayers
	 * Number of players and whether self selection is allowed to ids
	 * @param {(num: number) => Promise<number[]>} pickCenters Number of cards to pick to ids
	 * @param {(choices: string[]) => Promise<number>} pickChoice Array of choices to id of choice
	 * @param {(msg: string) => void} giveInfo Show information to the player
	 * @param {State} state Reference to the current game state
	 * @param {number} id Current player ID
	 */
	async act(pickPlayers, pickCenters, pickChoice, giveInfo, state, id) {
		if (state.getPlayer(id).currentRole.modifiers.has(Modifiers.SENTINEL)) {
			giveInfo('Your role has been guarded by the sentinel. You will not be swapping roles tonight.');
			return;
		}

		giveInfo('You may choose to steal another player\'s role');
		const cards = await pickPlayers(1, false);
		if (cards.length === 1) {
			const swapID = cards[0];
			state.swap(id, swapID);
			giveInfo(`Your new role is ${state.getPlayer(id).currentRole.roleName}`);
		}
	}
}

export class WitchWake extends WakeOrder {
	constructor() {
		super([6, 2], 'Witch');
	}

	/**
	 * @param {(num: number, allowSelf: boolean) => Promise<number[]>} pickPlayers
	 * Number of players and whether self selection is allowed to ids
	 * @param {(num: number) => Promise<number[]>} pickCenters Number of cards to pick to ids
	 * @param {(choices: string[]) => Promise<number>} pickChoice Array of choices to id of choice
	 * @param {(msg: string) => void} giveInfo Show information to the player
	 * @param {State} state Reference to the current game state
	 * @param {number} id Current player ID
	 */
	async act(pickPlayers, pickCenters, pickChoice, giveInfo, state, id) {
		giveInfo('You may choose to view a center role. If you do, you must swap it with another player.');
		const cards = await pickCenters(1);
		if (cards.length === 1) {
			const centerCard = cards[0];
			const fallbackPlayer = (() => {
				const a = Math.floor(Math.random() * state.numPlayers);
				if (state.getPlayer(a).currentRole.modifiers.has(Modifiers.SENTINEL)) {
					// Fallback player cannot be sentinel
					if (a === 0) { return 1; }
					return a - 1;
				}
				return a;
			})();
			giveInfo(`The center role was ${state.getCenter(centerCard).roleName}. You must swap it with a player. If you do not select in time, it will be swapped with the following randomly selected player: ${state.getName(fallbackPlayer)}`);
			const selectedPlayer = await pickPlayers(1, true);
			const actualPlayer = selectedPlayer.length === 1 ? selectedPlayer[0] : fallbackPlayer;
			state.swapCenter(actualPlayer, centerCard);
		}
	}
}

export class TroublemakerWake extends WakeOrder {
	constructor() {
		super([7], 'Troublemaker');
	}

	/**
	 * @param {(num: number, allowSelf: boolean) => Promise<number[]>} pickPlayers
	 * Number of players and whether self selection is allowed to ids
	 * @param {(num: number) => Promise<number[]>} pickCenters Number of cards to pick to ids
	 * @param {(choices: string[]) => Promise<number>} pickChoice Array of choices to id of choice
	 * @param {(msg: string) => void} giveInfo Show information to the player
	 * @param {State} state Reference to the current game state
	 * @param {number} id Current player ID
	 */
	async act(pickPlayers, pickCenters, pickChoice, giveInfo, state, id) {
		giveInfo('You may swap the roles of two other players');
		const cards = await pickPlayers(2, false);
		if (cards.length === 2) {
			state.swap(cards[0], cards[1]);
		}
	}
}

export class DrunkWake extends WakeOrder {
	constructor() {
		super([8], 'Drunk');
	}

	/**
	 * @param {(num: number, allowSelf: boolean) => Promise<number[]>} pickPlayers
	 * Number of players and whether self selection is allowed to ids
	 * @param {(num: number) => Promise<number[]>} pickCenters Number of cards to pick to ids
	 * @param {(choices: string[]) => Promise<number>} pickChoice Array of choices to id of choice
	 * @param {(msg: string) => void} giveInfo Show information to the player
	 * @param {State} state Reference to the current game state
	 * @param {number} id Current player ID
	 */
	async act(pickPlayers, pickCenters, pickChoice, giveInfo, state, id) {
		if (state.getPlayer(id).currentRole.modifiers.has(Modifiers.SENTINEL)) {
			giveInfo('Your role has been guarded by the sentinel. You will not be swapping roles tonight.');
			return;
		}

		giveInfo('You must select a center role to swap with your own. If you do not select in time, one will be selected for you.');
		const cards = await pickCenters(1);
		const card = cards.length === 1 ? cards[0] : Math.floor(Math.random() * CENTER_SIZE);
		state.swapCenter(id, card);
	}
}

export class InsomniacWake extends WakeOrder {
	constructor() {
		super([9], 'Insomniac');
	}

	/**
	 * @param {(num: number, allowSelf: boolean) => Promise<number[]>} pickPlayers
	 * Number of players and whether self selection is allowed to ids
	 * @param {(num: number) => Promise<number[]>} pickCenters Number of cards to pick to ids
	 * @param {(choices: string[]) => Promise<number>} pickChoice Array of choices to id of choice
	 * @param {(msg: string) => void} giveInfo Show information to the player
	 * @param {State} state Reference to the current game state
	 * @param {number} id Current player ID
	 */
	async act(pickPlayers, pickCenters, pickChoice, giveInfo, state, id) {
		if (state.getPlayer(id).currentRole.modifiers.has(Modifiers.SENTINEL)) {
			giveInfo('Your role has been guarded by the sentinel. You will not see your current role tonight.');
			return;
		}
		giveInfo(`Your current role is ${state.getPlayer(id).currentRole.roleName}`);
	}
}

export class RevealerWake extends WakeOrder {
	constructor() {
		super([10], 'Revealer');
	}

	/**
	 * @param {(num: number, allowSelf: boolean) => Promise<number[]>} pickPlayers
	 * Number of players and whether self selection is allowed to ids
	 * @param {(num: number) => Promise<number[]>} pickCenters Number of cards to pick to ids
	 * @param {(choices: string[]) => Promise<number>} pickChoice Array of choices to id of choice
	 * @param {(msg: string) => void} giveInfo Show information to the player
	 * @param {State} state Reference to the current game state
	 * @param {number} id Current player ID
	 */
	async act(pickPlayers, pickCenters, pickChoice, giveInfo, state, id) {
		giveInfo('You may select one player\'s role to reveal.');
		const cards = await pickPlayers(1, false);
		if (cards.length === 1) {
			const pid = cards[0];
			const pRole = state.getPlayer(pid).currentRole;

			giveInfo(`The role ${state.getName(pid)} has is ${pRole.roleName}`);

			if (pRole.winTeam === Teams.VILLAGER) {
				pRole.modifiers.add(Modifiers.REVEALER);
			} else {
				giveInfo('Because this role is not on the villager team, it will not be shown to other players');
			}
		}
	}
}
// #endregion
