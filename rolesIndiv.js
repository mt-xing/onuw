import Role, { Modifiers, Roles, Teams } from './role';
import State, { CENTER_SIZE } from './state';
import { makeList } from './utils';

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

/**
 * Convert a list of werewolf names to a string describing all the werewolves.
 * @param {string[]} wolves
 * @returns {string}
 */
function werewolfString(wolves) {
	return `The werewolves are: ${makeList(wolves)}`;
}

export class Werewolf extends Role {
	constructor() {
		super(
			Roles.WEREWOLF,
			'You\'re evil',
			'You will see who else started as a werewolf. Work together to fool the villagers.',
			[2, 0],
		);
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
		giveInfo(werewolfString(wolves));
		if (wolves.length === 1) {
			const pick = await pickCenters(1);
			if (pick.length === 1) {
				giveInfo(`The center card you picked was ${state.getCenter(pick[0]).role}`);
			}
		}
	}
}

export class MysticWolf extends Role {
	constructor() {
		super(
			Roles.MYSTIC_WOLF,
			'You\'re evil and transcendent',
			'You will see the other werewolves. You may also look at another player\'s card to help you fool the villagers.',
			[2, 1],
		);
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
		giveInfo(werewolfString(wolves));
		if (wolves.length === 1) {
			const pick = await pickCenters(1);
			if (pick.length === 1) {
				giveInfo(`The center card you picked was ${state.getCenter(pick[0]).role}`);
			}
		}
		const view = await pickPlayers(1, false);
		giveInfo(`The card ${state.getName(view[0])} has is ${state.getPlayer(view[0]).currentRole.role}`);
	}
}

export class DreamWolf extends Role {
	constructor() {
		super(
			Roles.DREAM_WOLF,
			'You\'re evil but sleepy',
			'You did not wake up in time for the werewolf roll call. You do not know the other werewolves (but they know you).',
			null,
		);
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
	async act(pickPlayers, pickCenters, pickChoice, giveInfo, state, id) {}
}

export class Minion extends Role {
	constructor() {
		super(
			Roles.MINION,
			'You\'re a huge werewolf stan',
			'You will see the other werewolves. You need to protect them, even if it costs you your life.',
			[3],
		);
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
		giveInfo(werewolfString(getAllWerewolves(state)));
	}
}
// #endregion

// #region Villagers
export class Sentinel extends Role {
	constructor() {
		super(
			Roles.SENTINEL,
			'Protector',
			'You may choose one other player to guard. That player\'s role will no longer be touched (may not be swapped, changed, and even the player themselves may not look at it)',
			[0],
		);
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
		const protect = await pickPlayers(1, false);
		if (protect.length === 1) {
			const i = protect[0];
			state.getPlayer(i).currentRole.modifiers.add(Modifiers.SENTINEL);
		}
	}
}

export class Mason extends Role {
	constructor() {
		super(
			Roles.MASON,
			'Twins',
			'There are exactly two masons. You will get to see each other. If you do not see the other mason, the other mason started in the center.',
			[4],
		);
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

export class Seer extends Role {
	constructor() {
		super(
			Roles.SEER,
			'Transcendent, or just a cheater',
			'You may choose to either view two cards from the center or one other player\'s role.',
			[5, 1],
		);
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
		const choice = await pickChoice(['View two center cards', 'View one other player\'s card']);
		if (choice === 0) {
			// View two center
			const cards = await pickCenters(2);
			if (cards.length !== 0) {
				const roles = cards.map((c) => state.getCenter(c).role);
				giveInfo(`The cards you selected in the center were ${makeList(roles)}`);
			}
		} else {
			// View one other player
			const card = await pickPlayers(1, false);
			if (card.length === 1) {
				const pid = card[0];
				giveInfo(`The card that ${state.getName(pid)} has is ${state.getPlayer(pid).currentRole.role}`);
			}
		}
	}
}

export class ApprenticeSeer extends Role {
	constructor() {
		super(
			Roles.SEER,
			'Transcendent, but only kinda',
			'You may view one card from the center.',
			[5, 2],
		);
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
		const cards = await pickCenters(1);
		if (pickCenters.length === 1) {
			const role = state.getCenter(cards[0]);
			giveInfo(`The card you selected in the center was ${role}`);
		}
	}
}

export class Robber extends Role {
	constructor() {
		super(
			Roles.ROBBER,
			'Stealer of roles',
			'You may steal (and view) one other player\'s role, taking on their role and giving them yours',
			[6, 1],
		);
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
		if (this.modifiers.has(Modifiers.SENTINEL)) {
			giveInfo('Your role has been guarded by the sentinel. You will not be swapping roles tonight.');
			return;
		}

		const cards = await pickPlayers(1, false);
		if (cards.length === 1) {
			const swapID = cards[0];
			state.swap(id, swapID);
			giveInfo(`Your new role is ${state.getPlayer(id).currentRole.role}`);
		}
	}
}

export class Witch extends Role {
	constructor() {
		super(
			Roles.WITCH,
			'Does some role magic or something, idk',
			'You may view one role from the center. If you do, you must swap it with any player of your choice.',
			[6, 2],
		);
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
		const cards = await pickCenters(1);
		if (cards.length === 1) {
			const centerCard = cards[0];
			const fallbackPlayer = Math.floor(Math.random() * state.numPlayers);
			giveInfo(`The center card was ${state.getCenter(centerCard).role}. You must swap it with a player. If you do not select in time, it will be swapped with the following randomly selected player: ${state.getName(fallbackPlayer)}`);
			const selectedPlayer = await pickPlayers(1, true);
			const actualPlayer = selectedPlayer.length === 1 ? selectedPlayer[0] : fallbackPlayer;
			state.swapCenter(actualPlayer, centerCard);
		}
	}
}

export class Troublemaker extends Role {
	constructor() {
		super(
			Roles.TROUBLEMAKER,
			'Screws with people',
			'You may exchange the roles of two other players.',
			[7],
		);
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
		const cards = await pickPlayers(2, false);
		if (cards.length === 2) {
			state.swap(cards[0], cards[1]);
		}
	}
}

export class Drunk extends Role {
	constructor() {
		super(
			Roles.DRUNK,
			'You have no idea what you\'re doing',
			'You must pick a role from the center to exchange with your own. You do not get to see your new role.',
			[8],
		);
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
		if (this.modifiers.has(Modifiers.SENTINEL)) {
			giveInfo('Your role has been guarded by the sentinel. You will not be swapping roles tonight.');
			return;
		}

		const cards = await pickCenters(1);
		const card = cards.length === 1 ? cards[0] : Math.floor(Math.random() * CENTER_SIZE);
		state.swapCenter(id, card);
	}
}

export class Insomniac extends Role {
	constructor() {
		super(
			Roles.INSOMNIAC,
			'You can\'t fall asleep. Don\'t we all?',
			'You get to wake up in the night and see your own role.',
			[9],
		);
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
		if (this.modifiers.has(Modifiers.SENTINEL)) {
			giveInfo('Your role has been guarded by the sentinel. You will not see your current role tonight.');
			return;
		}
		giveInfo(`Your current role is ${state.getPlayer(id).currentRole.role}`);
	}
}

export class Revealer extends Role {
	constructor() {
		super(
			Roles.REVEALER,
			'Never learned how to keep your hands to yourself',
			'You may reveal one other player\'s role. If it\'s on the villager team, it will also be revealed to all other players.',
			[10],
		);
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
		const cards = await pickPlayers(1, false);
		if (cards.length === 1) {
			const pid = cards[0];
			const pRole = state.getPlayer(pid).currentRole;

			giveInfo(`The role ${state.getName(pid)} has is ${pRole.role}`);

			if (pRole.winTeam === Teams.VILLAGER) {
				pRole.modifiers.add(Modifiers.REVEALER);
			} else {
				giveInfo('Because this role is not on the villager team, it will not be shown to other players');
			}
		}
	}
}
// #endregion

export class Tanner extends Role {
	constructor() {
		super(
			Roles.TANNER,
			'2meirl4meirl',
			'You want to die. You win if and only if you are killed. You do not wake up during the night.',
			null,
		);
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
	async act(pickPlayers, pickCenters, pickChoice, giveInfo, state, id) {}
}
