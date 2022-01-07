import Dom from '../dom.js';
import Socket from '../socket.js';
import OnuwGame from '../game.js';
import { MultiRoles, Roles, roleToName } from '../../game/role.js';
import { DEFAULT_ROLE_TIME, DEFAULT_TALK_TIME } from '../../game/constants.js';
import { CENTER_SIZE } from '../../game/state.js';

export default class GameSetup {
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
	 * @type {Map<Roles, HTMLElement[]>}
	 */
	#unusedRoles;

	/**
	 * @type {Map<Roles, HTMLElement[]>}
	 */
	#usedRoles;

	/**
	 * @type {HTMLElement}
	 */
	#roleTime;

	/**
	 * @type {HTMLElement}
	 */
	#talkTime;

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
	 * @param {Socket} socket
	 * @param {OnuwGame} game
	 * @param {HTMLElement} gameDom
	 * @param {(game: OnuwGame) => void} completeCallback
	 */
	constructor(socket, game, gameDom, completeCallback) {
		this.#dom = gameDom;
		this.#dom.textContent = null;
		this.#socket = socket;
		this.#game = game;
		this.#game.restart();

		this.#unusedRoles = new Map();
		this.#usedRoles = new Map();

		this.#waiting = 2;
		this.#allDone = completeCallback;

		this.#dom.appendChild(Dom.p(game.isHost ? 'Select roles and set time limits' : 'Wait for game setup'));
		this.#generateRolesDom();
		this.#roleTime = Dom.p(`Seconds per role: ${DEFAULT_ROLE_TIME}`);
		this.#talkTime = Dom.p(`Minutes to discuss: ${DEFAULT_TALK_TIME}`);
		this.#dom.appendChild(this.#roleTime);
		this.#dom.appendChild(this.#talkTime);

		if (!game.isHost) {
			this.#socket.off('setupInfo');
			this.#socket.on('setupInfo', (msg) => {
				/** @type {{roleAdd: Roles[], roleSub: Roles[], roleTime: number, talkTime: number}} */
				const {
					roleAdd, roleSub, roleTime, talkTime,
				} = JSON.parse(msg);
				roleAdd.forEach(this.addRole.bind(this));
				roleSub.forEach(this.removeRole.bind(this));
				this.#changeTimes(roleTime, talkTime);
			});
		} else {
			this.#generateTimeDom();
			this.#dom.appendChild(Dom.button('START THE GAME :D', this.#startGame.bind(this)));
		}

		socket.off('setupFinal');
		socket.on('setupFinal', this.#finalSetup.bind(this));
		socket.off('setupRole');
		socket.on('setupRole', this.#receiveRole.bind(this));
	}

	#generateRolesDom() {
		const unused = document.createElement('div');
		unused.appendChild(Dom.p('Unused Roles:'));
		const used = document.createElement('div');
		used.appendChild(Dom.p('Selected Roles:'));
		this.#dom.appendChild(unused);
		this.#dom.appendChild(used);

		/** @type {keyof typeof Roles} */
		let role;
		for (role in Roles) {
			if (!Object.prototype.hasOwnProperty.call(Roles, role)) {
				continue;
			}
			const roleID = Roles[role];

			const specialRules = MultiRoles[roleID];

			/**
			 * @param {string} text
			 * @param {(ev: MouseEvent) => void} fn
			 * @returns {HTMLElement}
			 */
			const getBtn = (text, fn) => {
				if (this.#game.isHost) {
					const b = Dom.button(text, fn, 'classSelect');
					return b;
				}
				return Dom.p(text, 'classSelect');
			};

			if (specialRules === undefined || specialRules.type === 'up to') {
				/** @type {HTMLElement[]} */
				const uu = [];
				/** @type {HTMLElement[]} */
				const u = [];
				for (let i = 0; i < (specialRules === undefined ? 1 : specialRules.number); i++) {
					const b = getBtn(roleToName[roleID], this.addRole.bind(this, roleID));
					unused.appendChild(b);
					uu.push(b);
					const b2 = getBtn(roleToName[roleID], this.removeRole.bind(this, roleID));
					used.appendChild(b2);
					b2.style.display = 'none';
					u.push(b2);
				}
				this.#unusedRoles.set(roleID, uu);
				this.#usedRoles.set(roleID, u);
			} else if (specialRules.type === 'all') {
				const t = `${roleToName[roleID]} x${specialRules.number}`;
				const b = getBtn(t, this.addRole.bind(this, roleID));
				unused.appendChild(b);
				this.#unusedRoles.set(roleID, [b]);
				const b2 = getBtn(t, this.removeRole.bind(this, roleID));
				used.appendChild(b2);
				b2.style.display = 'none';
				this.#usedRoles.set(roleID, [b2]);
			}
		}
	}

	#generateTimeDom() {
		if (!this.#game.isHost) {
			throw new Error();
		}
		this.#roleTime.textContent = 'Seconds per role: ';
		const role = Dom.input('number', undefined, `${DEFAULT_ROLE_TIME}`);
		role.min = '1';
		role.step = '1';
		role.max = '60';
		this.#roleTime.appendChild(role);
		role.addEventListener(
			'change',
			/**
			 * @param {Event} ev
			 */
			(ev) => {
				this.#game.roleTime = parseInt(
					/** @type {HTMLInputElement} */(ev.currentTarget).value,
					10,
				);
				if (this.#game.roleTime < 1) {
					this.#game.roleTime = 1;
					// eslint-disable-next-line no-param-reassign
					/** @type {HTMLInputElement} */(ev.currentTarget).value = '1';
				}
				this.#socket.send('setupInfo', {
					roleAdd: [],
					roleSub: [],
					roleTime: this.#game.roleTime,
					talkTime: this.#game.talkTime,
				});
			},
		);

		this.#talkTime.textContent = 'Minutes to discuss: ';
		const talk = Dom.input('number', undefined, `${DEFAULT_TALK_TIME}`);
		talk.min = '1';
		talk.step = '1';
		talk.max = '20';
		this.#talkTime.appendChild(talk);
		talk.addEventListener(
			'change',
			/**
			 * @param {Event} ev
			 */
			(ev) => {
				this.#game.talkTime = parseInt(
					/** @type {HTMLInputElement} */(ev.currentTarget).value,
					10,
				) * 60;
				if (this.#game.talkTime < 1) {
					this.#game.talkTime = 60;
					// eslint-disable-next-line no-param-reassign
					/** @type {HTMLInputElement} */(ev.currentTarget).value = '1';
				}
				this.#socket.send('setupInfo', {
					roleAdd: [],
					roleSub: [],
					roleTime: this.#game.roleTime,
					talkTime: this.#game.talkTime,
				});
			},
		);
	}

	/**
	 * Add a role to play
	 *
	 * Will update DOM and game state
	 *
	 * Note that for multi-roles with 'all' (the Mason),
	 * this function will not update the DOM after the first mason has
	 * already been changed (as there should only be one mason button).
	 * For multi-roles, calling this once as host is enough to broadcast all role changes.
	 * @param {Roles} rid
	 */
	addRole(rid) {
		const multi = MultiRoles[rid];
		const isMulti = multi !== undefined && multi.type === 'all';
		if (this.#game.isHost) {
			this.#socket.send('setupInfo', {
				roleAdd: isMulti ? Array(multi.number).fill(rid) : [rid],
				roleSub: [],
				roleTime: this.#game.roleTime,
				talkTime: this.#game.talkTime,
			});
		}

		const n = this.#game.numRole(rid);
		this.#game.addRole(rid);
		if (this.#game.isHost && isMulti) {
			for (let i = 1; i < multi.number; i++) {
				this.#game.addRole(rid);
			}
		}

		const d = this.#unusedRoles.get(rid);
		if (d === undefined) {
			// eslint-disable-next-line no-console
			console.error(`ERROR Could not add role ${rid}`);
			return;
		}
		if (isMulti) {
			if (n >= d.length) {
				return;
			}
		}
		d[n].style.display = 'none';

		const u = this.#usedRoles.get(rid);
		if (u === undefined) {
			// eslint-disable-next-line no-console
			console.error(`ERROR Could not add role ${rid}`);
			return;
		}
		u[n].style.display = '';
	}

	/**
	 * @param {Roles} rid
	 */
	removeRole(rid) {
		const multi = MultiRoles[rid];
		const isMulti = multi !== undefined && multi.type === 'all';
		if (this.#game.isHost) {
			this.#socket.send('setupInfo', {
				roleAdd: [],
				roleSub: isMulti ? Array(multi.number).fill(rid) : [rid],
				roleTime: this.#game.roleTime,
				talkTime: this.#game.talkTime,
			});
		}

		this.#game.removeRole(rid);
		if (this.#game.isHost && isMulti) {
			for (let i = 1; i < multi.number; i++) {
				this.#game.removeRole(rid);
			}
		}
		const n = this.#game.numRole(rid);

		const d = this.#unusedRoles.get(rid);
		if (d === undefined) {
			// eslint-disable-next-line no-console
			console.error(`ERROR Could not add role ${rid}`);
			return;
		}

		if (isMulti && n >= d.length) {
			return;
		}

		d[n].style.display = '';

		const u = this.#usedRoles.get(rid);
		if (u === undefined) {
			// eslint-disable-next-line no-console
			console.error(`ERROR Could not add role ${rid}`);
			return;
		}
		u[n].style.display = 'none';
	}

	/**
	 * Only to be called as non-host
	 * @param {number} roleTime Seconds
	 * @param {number} talkTime Seconds
	 */
	#changeTimes(roleTime, talkTime) {
		if (this.#game.isHost) { throw new Error(); }
		this.#roleTime.textContent = `Seconds per role: ${roleTime}`;
		this.#talkTime.textContent = `Minutes to discuss: ${talkTime / 60}`;
		this.#game.roleTime = roleTime;
		this.#game.talkTime = talkTime;
	}

	#startGame() {
		if (!this.#game.isHost) { throw new Error(); }
		if (this.#game.numRoles - CENTER_SIZE !== this.#game.numPlayers) {
			// eslint-disable-next-line no-alert
			alert(`The number of roles must equal number of players plus ${CENTER_SIZE}`);
			return;
		}
		this.#socket.emit('setupDone', '');
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
