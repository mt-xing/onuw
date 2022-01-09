import Socket from '../socket.js';
import OnuwGame from '../game.js';
import { Roles, roleToName, Teams } from '../../game/role.js';
import Dom from '../dom.js';
import { constructRole } from '../../game/rolesIndiv.js';
import { CENTER_SIZE } from '../../game/state.js';
import { assertUnreachable, makeList, secondsToTime } from '../../game/utils.js';
import Choice from './gameplay/choices.js';
import NightStatus from './gameplay/nightStatus.js';

export default class Gameplay {
	/**
	 * @type {Socket}
	 */
	#socket;

	/**
	  * @type {OnuwGame}
	  */
	#game;

	/**
	  * @type {HTMLElement}
	  */
	#dom;

	/**
	 * @type {NightStatus}
	 */
	#nightStatus;

	/**
	 * @type {Map<number, Choice>}
	 */
	#playerChoices;

	/**
	 * @param {Socket} socket
	 * @param {OnuwGame} game
	 * @param {HTMLElement} gameDom
	 */
	constructor(socket, game, gameDom) {
		this.#dom = gameDom;
		this.#dom.textContent = null;
		this.#socket = socket;
		this.#game = game;
		this.#playerChoices = new Map();

		this.#nightStatus = new NightStatus(this.#dom, game.allRoles, game.roleTime);

		this.#giveRoleInfo();
		['roleStart', 'msg', 'pickCenters', 'pickChoices', 'pickPlayers', 'timeout', 'wake', 'sleep'].forEach(this.#socket.off.bind(this.#socket));
		this.#socket.on('roleStart', this.#roleStart.bind(this));
		this.#socket.on('msg', this.#msg.bind(this));
		this.#socket.on('pickCenters', this.#pickCenters.bind(this));
		this.#socket.on('pickChoices', this.#pickChoices.bind(this));
		this.#socket.on('pickPlayers', this.#pickPlayers.bind(this));
		this.#socket.on('timeout', this.#timeout.bind(this));
		this.#socket.on('wake', this.#wake.bind(this));
		this.#socket.on('sleep', this.#sleep.bind(this));

		['day', 'time', 'voteReady', 'voteStart', 'voteReceived', 'result'].forEach(this.#socket.off.bind(this.#socket));
		this.#socket.on('day', this.#endOfNight.bind(this));
		this.#socket.on('time', this.#timeSync.bind(this));
		this.#socket.on('voteReady', this.#voteReady.bind(this));
		this.#socket.on('voteStart', this.#voteStart.bind(this));
		this.#socket.on('voteReceived', this.#voteReceived.bind(this));
		this.#socket.on('result', this.#showResults.bind(this));
	}

	#giveRoleInfo() {
		const role = constructRole(this.#game.startingRole);
		this.#dom.appendChild(Dom.p(`Your starting role is ${role.roleName}`));
		this.#dom.appendChild(Dom.p(role.description));
		this.#dom.appendChild(Dom.p(role.instructions));
		this.#dom.appendChild(Dom.p('Good night, all. And good luck.'));
	}

	/**
	 * @param {string} raw
	 */
	#roleStart(raw) {
		/** @type {{role: Roles}} */
		const { role } = JSON.parse(raw);
		this.#nightStatus.startRole(role);
	}

	/**
	 * @param {string} raw
	 */
	#msg(raw) {
		/** @type {{msg: string}} */
		const { msg } = JSON.parse(raw);
		this.#dom.appendChild(Dom.p(msg));
	}

	/**
	 * @param {string} raw
	 */
	#pickCenters(raw) {
		/** @type {{nonce: number, num: number}} */
		const { nonce, num } = JSON.parse(raw);
		const heading = `Please select ${num} ${num === 1 ? 'card' : 'cards'} from the center:`;
		/** @type {[string, string | null][]} */
		const choices = Array.from(Array(CENTER_SIZE).keys())
			.map((center) => [`${center}`, null]);
		this.#promptForSomething(nonce, choices, num, heading);
	}

	/**
	 * @param {string} raw
	 */
	#pickChoices(raw) {
		/** @type {{nonce: number, choices: string[]}} */
		const { nonce, choices } = JSON.parse(raw);
		const heading = 'Please select an option:';
		/** @type {[string, string | null][]} */
		const cc = choices.map((choice) => [`${choice}`, null]);
		this.#promptForSomething(nonce, cc, 1, heading);
	}

	/**
	 * @param {string} raw
	 */
	#pickPlayers(raw) {
		/** @type {{nonce: number, num: number, banned: Record<number, string>}} */
		const { nonce, num, banned } = JSON.parse(raw);

		const heading = `Please select ${num} ${num === 1 ? 'player' : 'players'}:`;
		/** @type {[string, string | null][]} */
		const choices = Array.from(Array(this.#game.numPlayers).keys())
			.map((playerID) => [
				`${this.#game.getPlayerName(playerID)}`,
				banned[playerID] === undefined ? null : banned[playerID],
			]);
		this.#promptForSomething(nonce, choices, num, heading);
	}

	/**
	 * @param {number} nonce
	 * @param {[string, string | null][]} choices Choice text and enabled
	 * @param {number} num
	 * @param {string} heading
	 */
	#promptForSomething(nonce, choices, num, heading) {
		const c = new Choice(this.#socket, this.#dom, nonce, choices, num, heading);
		this.#playerChoices.set(nonce, c);
	}

	/**
	 * @param {string} raw
	 */
	#timeout(raw) {
		/** @type {{nonce: number}} */
		const { nonce } = JSON.parse(raw);

		const c = this.#playerChoices.get(nonce);
		if (c === undefined) {
			// eslint-disable-next-line no-console
			console.error(`Received invalid timeout with nonce ${nonce}`);
			return;
		}

		c.timeout();
	}

	#wake() {
		this.#dom.appendChild(Dom.p('Wake up.'));
	}

	#sleep() {
		this.#dom.appendChild(Dom.p('Return to sleep. Good night.'));
	}

	/**
	 * @param {string} raw
	 */
	#endOfNight(raw) {
		/** @type {{boardInfo: Record<number, string>}} */
		const { boardInfo } = JSON.parse(raw);
		this.#dom.appendChild(Dom.hr());
		this.#dom.appendChild(Dom.p('Everybody, wake up.'));
		this.#dom.appendChild(Dom.p('Good morning.'));
		this.#dom.appendChild(Dom.p('State of the board, if any:'));
		if (Object.keys(boardInfo).length === 0) {
			this.#dom.appendChild(Dom.p('Nothing relevant'));
		} else {
			Object.keys(boardInfo)
				.map((s) => parseInt(s, 10))
				.forEach((playerID) => {
					this.#dom.appendChild(Dom.p(
						`${this.#game.getPlayerName(playerID)}: ${boardInfo[playerID]}`,
					));
				});
		}
		this.#dom.appendChild(Dom.button('I\'m ready to vote', (ev) => {
			this.#socket.emit('voteReady', '');
			// @ts-ignore
			// eslint-disable-next-line no-param-reassign
			ev.currentTarget.disabled = true;
		}));
		this.#dom.appendChild(Dom.p(`Time left: ${secondsToTime(this.#game.talkTime)}`));
	}

	/**
	 * @param {string} raw
	 */
	#timeSync(raw) {
		/** @type {{time: number}} */
		const { time } = JSON.parse(raw);

		this.#dom.appendChild(Dom.p(`Time left: ${secondsToTime(time)}`));
	}

	/**
	 * @param {string} raw
	 */
	#voteReady(raw) {
		/** @type {{id: number}} */
		const { id } = JSON.parse(raw);
		this.#dom.appendChild(Dom.p(`${this.#game.getPlayerName(id)} is ready to vote`));
	}

	#voteStart() {
		this.#dom.textContent = null;
		this.#dom.appendChild(Dom.p('Please vote for a player to kill:'));
		Array.from(Array(this.#game.numPlayers).keys())
			.forEach((playerID) => {
				if (playerID === this.#game.playerID) { return; }
				this.#dom.appendChild(Dom.button(this.#game.getPlayerName(playerID), () => {
					this.#socket.send('vote', { id: playerID });
				}));
			});
	}

	/**
	 * @param {string} raw
	 */
	#voteReceived(raw) {
		/** @type {{playerID: number}} */
		const { playerID } = JSON.parse(raw);
		this.#dom.appendChild(Dom.p(`${this.#game.getPlayerName(playerID)} has voted`));
	}

	/**
	 * @param {string} raw
	 */
	#showResults(raw) {
		/** @type {{votes: number[], playerRoles: Roles[], winTeam: Teams[]}} */
		const { votes, playerRoles, winTeam } = JSON.parse(raw);
		this.#dom.appendChild(Dom.hr());
		this.#dom.appendChild(Dom.p('And the votes are in:'));
		votes.forEach((voteTarget, pID) => {
			this.#dom.appendChild(Dom.p(`${this.#game.getPlayerName(pID)} voted to kill ${this.#game.getPlayerName(voteTarget)}`));
		});
		this.#dom.appendChild(Dom.p('The role everyone ended up with:'));
		playerRoles.forEach((role, pID) => {
			this.#dom.appendChild(Dom.p(`${this.#game.getPlayerName(pID)} was ${roleToName[role]}`));
		});
		this.#dom.appendChild(Dom.p('Winning team(s):'));
		if (winTeam.length === 0) {
			this.#dom.appendChild(Dom.p('Nobody. Everyone lost. Y\'all suck.'));
		} else {
			this.#dom.appendChild(Dom.p(makeList(winTeam.map((t) => {
				switch (t) {
				case Teams.WEREWOLF:
					return 'Werewolves';
				case Teams.VILLAGER:
					return 'Villagers';
				case Teams.TANNER:
					return 'Tanner';
				default:
					return assertUnreachable(t);
				}
			}))));
		}
		const yourRole = constructRole(playerRoles[this.#game.playerID]);
		if (winTeam.some((w) => yourRole.winTeam === w)) {
			this.#dom.appendChild(Dom.p('YOU WON!'));
		} else {
			this.#dom.appendChild(Dom.p('You lose. Better luck next time'));
		}
		if (this.#game.isHost) {
			this.#dom.appendChild(Dom.button('Play again?', () => {
				this.#socket.emit('restart', '');
			}));
		}
	}
}
