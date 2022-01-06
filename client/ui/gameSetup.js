import Dom from '../dom.js';
import Socket from '../socket.js';
import OnuwGame from '../game.js';
import { MultiRoles, Roles, roleToName } from '../../game/role.js';

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
	 * @param {Socket} socket
	 * @param {OnuwGame} game
	 * @param {HTMLElement} gameDom
	 */
	constructor(socket, game, gameDom) {
		this.#dom = gameDom;
		this.#dom.textContent = null;
		this.#socket = socket;
		this.#game = game;

		this.#unusedRoles = new Map();
		this.#usedRoles = new Map();

		this.#dom.appendChild(Dom.p(game.isHost ? 'Select roles:' : 'Wait for roles'));
		this.#generateRolesDom();

		if (!game.isHost) {
			this.#socket.on('setupInfo', (msg) => {
				// TODO time
				/** @type {{roleAdd: Roles[], roleSub: Roles[]}} */
				const { roleAdd, roleSub } = JSON.parse(msg);
				roleAdd.forEach(this.addRole.bind(this));
				roleSub.forEach(this.removeRole.bind(this));
			});
		}
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
				roleTime: NaN,
				talkTime: NaN,
			});
		}

		const n = this.#game.numRole(rid);
		this.#game.addRole(rid);

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
				roleTime: NaN,
				talkTime: NaN,
			});
		}

		this.#game.removeRole(rid);
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
}
