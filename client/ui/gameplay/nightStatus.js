import Role, { Roles } from '../../../game/role.js';
import { constructRole } from '../../../game/rolesIndiv.js';
import Dom from '../../dom.js';

export default class NightStatus {
	/**
	 * @type {HTMLElement}
	 */
	#wrap;

	/**
	 * @type {Map<Roles, HTMLElement>}
	 */
	#bars;

	/**
	 * @type {number} Seconds per role
	 */
	#time;

	/**
	 * @param {HTMLElement} dom
	 * @param {Set<Roles>} roles
	 * @param {number} time Seconds per role
	 */
	constructor(dom, roles, time) {
		this.#time = time;

		this.#wrap = document.createElement('aside');
		this.#wrap.className = 'roleWrap';
		dom.appendChild(this.#wrap);
		this.#bars = new Map();

		this.#constructBars(roles);
	}

	/**
	 * @param {Set<Roles>} roles
	 */
	#constructBars(roles) {
		Array.from(roles)
			.map((x) => constructRole(x))
			.filter((x) => x.wakeOrder !== null)
			.sort((a, b) => Role.sortWakeOrder(
				a.wakeOrder ?? [],
				b.wakeOrder ?? [],
			))
			.forEach((r) => {
				const div = document.createElement('div');
				div.appendChild(Dom.span(r.roleName));
				const bar = document.createElement('div');
				bar.className = 'progress';
				// bar.max = this.#time * UPDATES_PER_SECOND;
				div.appendChild(bar);
				this.#wrap.appendChild(div);

				this.#bars.set(r.role, bar);
			});
	}

	/**
	 * @param {Roles} role
	 */
	startRole(role) {
		const bar = this.#bars.get(role);
		if (bar === undefined) {
			// eslint-disable-next-line no-console
			console.error(`ERROR: Could not start role ${role}`);
			return;
		}

		bar.style.transition = `transform ${this.#time}s linear, background 1s ease-in-out`;
		bar.style.transform = 'scaleY(1)';
		setTimeout(() => {
			bar.classList.add('done');
		}, this.#time * 1000);
	}
}
