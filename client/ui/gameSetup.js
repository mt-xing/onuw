import Dom from '../dom.js';
import Socket from '../socket.js';
import OnuwGame from '../game.js';
import { MultiRoles, Roles, roleToName } from '../../game/role.js';
import { DEFAULT_ROLE_TIME, DEFAULT_TALK_TIME } from '../../game/constants.js';
import { CENTER_SIZE } from '../../game/state.js';
import { assertUnreachable } from '../../game/utils.js';

export default class GameSetup {
	/**
	 * @param {Socket} socket
	 * @param {OnuwGame} game
	 * @param {HTMLElement} gameDom
	 * @param {(game: OnuwGame) => void} completeCallback
	 * @returns {GameSetup}
	 */
	static construct(socket, game, gameDom, completeCallback) {
		if (game.isHost) {
			return new HostSetup(socket, game, gameDom, completeCallback);
		} else {
			return new ClientSetup(socket, game, gameDom, completeCallback);
		}
	}

	/**
	  * @type {OnuwGame}
	  */
	#game;

	/**
	 * Number of things waiting on before we can start
	 * 0 = ready to start
	 * 1 = waiting on either final setup confirmation or role
	 * 2 = waiting on both
	 * @type {0|1|2}
	 */
	#waiting;

	/** @type {(game: OnuwGame) => void} */
	#allDone;

	/**
	 * ABSTRACT CLASS
	 *
	 * @param {Socket} socket
	 * @param {OnuwGame} game
	 * @param {HTMLElement} gameDom
	 * @param {(game: OnuwGame) => void} completeCallback
	 */
	constructor(socket, game, gameDom, completeCallback) {
		if (this.constructor === GameSetup) {
			throw new Error('GameSetup is an abstract class');
		}
		// eslint-disable-next-line no-param-reassign
		gameDom.textContent = null;
		this.#game = game;
		this.#game.restart();

		this.#waiting = 2;
		this.#allDone = completeCallback;

		socket.off('setupFinal');
		socket.on('setupFinal', this.#finalSetup.bind(this));
		socket.off('setupRole');
		socket.on('setupRole', this.#receiveRole.bind(this));
	}

	/**
	 * @param {string} data
	 */
	#finalSetup(data) {
		/** @type {{roles: Roles[], roleTime: number, talkTime: number, names: string[]}} */
		const {
			roles, roleTime, talkTime, names,
		} = JSON.parse(data);
		this.#game.confirmData(roles, roleTime, talkTime, names);
		this.#waiting--;
		if (this.#waiting === 0) {
			this.#allDone(this.#game);
		}
	}

	/**
	 * @param {string} data
	 */
	#receiveRole(data) {
		/** @type {{role: Roles}} */
		const { role } = JSON.parse(data);
		this.#game.startingRole = role;
		this.#waiting--;
		if (this.#waiting === 0) {
			this.#allDone(this.#game);
		}
	}
}

class HostSetup extends GameSetup {
	/** @type {Socket} */
	#socket;

	/** @type {OnuwGame} */
	#game;

	/** @type {HTMLButtonElement} */
	#startBtn;

	/** @type {HTMLElement} */
	#counter;

	/** @type {HTMLElement} */
	#counterText1;

	/** @type {HTMLElement} */
	#counterText2;

	/**
	 * @param {Socket} socket
	 * @param {OnuwGame} game
	 * @param {HTMLElement} gameDom
	 * @param {(game: OnuwGame) => void} completeCallback
	 */
	constructor(socket, game, gameDom, completeCallback) {
		super(socket, game, gameDom, completeCallback);

		this.#socket = socket;
		this.#game = game;

		const header = document.createElement('header');
		header.classList.add('setupHeader');
		gameDom.appendChild(header);

		const rolesLeftWrap = document.createElement('p');
		this.#counterText1 = Dom.span('Select ');
		rolesLeftWrap.appendChild(this.#counterText1);
		this.#counter = document.createElement('strong');
		this.#counter.textContent = `${this.#game.numPlayers + CENTER_SIZE}`;
		rolesLeftWrap.appendChild(this.#counter);
		this.#counterText2 = Dom.span(' more roles');
		rolesLeftWrap.appendChild(this.#counterText2);
		this.#startBtn = Dom.button('Begin Game', () => {
			this.#socket.emit('setupDone', '');
		});
		rolesLeftWrap.appendChild(this.#startBtn);

		const inputsWrap = Dom.p('Seconds per role: ');
		const role = Dom.input('number', undefined, `${DEFAULT_ROLE_TIME}`);
		role.min = '1';
		role.step = '1';
		role.max = '60';
		role.addEventListener('change', this.#changeRoleTime.bind(this));
		inputsWrap.appendChild(role);
		inputsWrap.appendChild(document.createTextNode('Minutes to discuss: '));
		const talk = Dom.input('number', undefined, `${DEFAULT_TALK_TIME}`);
		talk.min = '1';
		talk.step = '1';
		talk.max = '30';
		talk.addEventListener('change', this.#changeTalkTime.bind(this));
		inputsWrap.appendChild(talk);
		header.appendChild(rolesLeftWrap);
		header.appendChild(inputsWrap);

		const main = document.createElement('main');
		main.classList.add('setup');
		gameDom.appendChild(main);

		const h2Wrap = document.createElement('div');
		h2Wrap.classList.add('header');
		h2Wrap.appendChild(Dom.h2('Unused Roles'));
		h2Wrap.appendChild(Dom.h2('Used Roles'));
		main.appendChild(h2Wrap);

		for (const r in Roles) {
			if (!Object.prototype.hasOwnProperty.call(Roles, r)) {
				continue;
			}

			/** @type {Roles} */
			// @ts-ignore
			const roleID = Roles[/* @type {keyof typeof Roles} */(r)];
			const specialRules = MultiRoles[roleID];

			switch (specialRules?.type) {
			case 'all':
				main.appendChild(this.#getButton(roleID, specialRules.number));
				break;
			case 'up to':
				for (let i = 0; i < specialRules.number; i++) {
					main.appendChild(this.#getButton(roleID, 1));
				}
				break;
			default:
				main.appendChild(this.#getButton(roleID, 1));
				break;
			}
		}
	}

	/**
	 * @param {Roles} roleID
	 * @param {number} num
	 * @returns {HTMLButtonElement}
	 */
	#getButton(roleID, num) {
		let active = false;
		const textFooter = num !== 1 ? ` x${num}` : '';
		const b = Dom.button(roleToName[roleID] + textFooter, () => {
			if (!active) {
				b.classList.add('active');
				for (let i = 0; i < num; i++) {
					this.#game.addRole(roleID);
				}
				this.#sendModdedRoles(Array(num).fill(roleID), []);
			} else {
				b.classList.remove('active');
				for (let i = 0; i < num; i++) {
					this.#game.removeRole(roleID);
				}
				this.#sendModdedRoles([], Array(num).fill(roleID));
			}
			active = !active;
			this.#computeRoles();
		});
		return b;
	}

	#computeRoles() {
		const needed = this.#game.numPlayers + CENTER_SIZE;
		if (needed === this.#game.numRoles) {
			this.#startBtn.classList.add('active');
			return;
		}
		this.#startBtn.classList.remove('active');
		const delta = Math.abs(needed - this.#game.numRoles);
		this.#counterText1.textContent = needed > this.#game.numRoles ? 'Select ' : 'Remove ';
		this.#counter.textContent = `${delta}`;
		this.#counterText2.textContent = delta === 1 ? ' more role' : 'more roles';
	}

	/**
	 * @param {Roles[]} add
	 * @param {Roles[]} sub
	 */
	#sendModdedRoles(add, sub) {
		this.#socket.send('setupInfo', {
			roleAdd: add,
			roleSub: sub,
			roleTime: this.#game.roleTime,
			talkTime: this.#game.talkTime,
		});
	}

	/**
	 * @param {Event} ev
	 */
	#changeRoleTime(ev) {
		this.#game.roleTime = parseInt(
			/** @type {HTMLInputElement} */(ev.currentTarget).value,
			10,
		);
		if (this.#game.roleTime < 1) {
			this.#game.roleTime = 1;
			// eslint-disable-next-line no-param-reassign
			/** @type {HTMLInputElement} */(ev.currentTarget).value = '1';
		}
		this.#sendTimes();
	}

	/**
	 * @param {Event} ev
	 */
	#changeTalkTime(ev) {
		this.#game.talkTime = parseInt(
			/** @type {HTMLInputElement} */(ev.currentTarget).value,
			10,
		) * 60;
		if (this.#game.talkTime < 1) {
			this.#game.talkTime = 60;
			// eslint-disable-next-line no-param-reassign
			/** @type {HTMLInputElement} */(ev.currentTarget).value = '1';
		}
		this.#sendTimes();
	}

	#sendTimes() {
		this.#socket.send('setupInfo', {
			roleAdd: [],
			roleSub: [],
			roleTime: this.#game.roleTime,
			talkTime: this.#game.talkTime,
		});
	}
}

class ClientSetup extends GameSetup {
	/** @type {Socket} */
	#socket;

	/** @type {OnuwGame} */
	#game;

	/** @type {HTMLElement} */
	#roleTime;

	/** @type {HTMLElement} */
	#talkTime;

	/**
	 * @param {Socket} socket
	 * @param {OnuwGame} game
	 * @param {HTMLElement} gameDom
	 * @param {(game: OnuwGame) => void} completeCallback
	 */
	constructor(socket, game, gameDom, completeCallback) {
		super(socket, game, gameDom, completeCallback);

		this.#socket = socket;
		this.#game = game;

		const header = document.createElement('header');
		header.classList.add('setupHeader');
		gameDom.appendChild(header);

		const rolesLeftWrap = Dom.p('Waiting for host');
		const inputsWrap = Dom.p('Seconds per role: ');
		this.#roleTime = Dom.span(`${DEFAULT_ROLE_TIME}`);
		inputsWrap.appendChild(this.#roleTime);
		inputsWrap.appendChild(document.createTextNode('Minutes to discuss: '));
		this.#talkTime = Dom.span(`${DEFAULT_TALK_TIME}`);
		inputsWrap.appendChild(this.#talkTime);
		header.appendChild(rolesLeftWrap);
		header.appendChild(inputsWrap);

		const main = document.createElement('main');
		main.classList.add('setup');
		gameDom.appendChild(main);

		const h2Wrap = document.createElement('div');
		h2Wrap.classList.add('header');
		h2Wrap.appendChild(Dom.h2('Unused Roles'));
		h2Wrap.appendChild(Dom.h2('Used Roles'));
		main.appendChild(h2Wrap);

		/**
		 * @param {Roles} roleID
		 * @param {number} number
		 * @returns {HTMLElement}
		 */
		const getDiv = (roleID, number) => {
			// <div class="role">Test Role</div>
			const d = document.createElement('div');
			d.classList.add('role');
			d.textContent = (number !== 1 ? `${roleToName[roleID]} x${number}` : roleToName[roleID]);
			return d;
		};

		for (const r in Roles) {
			if (!Object.prototype.hasOwnProperty.call(Roles, r)) {
				continue;
			}

			/** @type {Roles} */
			// @ts-ignore
			const roleID = Roles[/* @type {keyof typeof Roles} */(r)];
			const specialRules = MultiRoles[roleID];

			switch (specialRules?.type) {
			case 'all':
				main.appendChild(getDiv(roleID, specialRules.number));
				break;
			case 'up to':
				for (let i = 0; i < specialRules.number; i++) {
					main.appendChild(getDiv(roleID, 1));
				}
				break;
			default:
				main.appendChild(getDiv(roleID, 1));
				break;
			}
		}
	}
}
