import Role, { Roles } from '../../../game/role.js';
import { constructRole } from '../../../game/rolesIndiv.js';
import WakeOrder from '../../../game/wake.js';
import Dom from '../../dom.js';

export default class NightStatus {
	/**
	 * @type {HTMLElement}
	 */
	#wrap;

	/**
	 * @type {Map<string, HTMLElement>}
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
		[...new Set(
			Array.from(roles)
				.map((x) => constructRole(x))
				.map((x) => x.wakeOrder).filter(
					/**
					 * @param {(typeof WakeOrder)[]|null} x
					 * @returns {x is (typeof WakeOrder)[]}
					 */
					(x) => x !== null,
				)
				.flat(),
		)]
			.map((X) => new X())
			.sort((a, b) => WakeOrder.sortWakeOrder(a.wakeOrder, b.wakeOrder))
			.forEach((r) => {
				const div = document.createElement('div');
				div.appendChild(Dom.span(r.displayName));
				const bar = document.createElement('div');
				bar.className = 'progress';
				div.appendChild(bar);
				this.#wrap.appendChild(div);

				this.#bars.set(r.constructor.name, bar);
			});
	}

	/**
	 * @param {string} role
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
