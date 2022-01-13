import { Roles } from '../../../game/role.js';
import { constructRole } from '../../../game/rolesIndiv.js';
import { secondsToTime } from '../../../game/utils.js';
import Dom from '../../dom.js';

export default class Header {
	/** @type {HTMLElement} */
	#wrap;

	/** @type {HTMLElement} */
	#timerWrap;

	/** @type {HTMLElement | undefined} */
	#timer;

	/** @type {number} */
	#timeLeft;

	/**
     *
     * @param {HTMLElement} gameDom
     * @param {Roles} role
     */
	constructor(gameDom, role) {
		this.#wrap = document.createElement('header');
		gameDom.appendChild(this.#wrap);
		this.#wrap.classList.add('roleIndicator');

		this.#showRole(role);

		this.#timerWrap = document.createElement('div');
		this.#timerWrap.classList.add('timer');
		this.#wrap.appendChild(this.#timerWrap);

		this.#timeLeft = NaN;
	}

	/**
     * @param {Roles} role
     */
	#showRole(role) {
		const roleName = document.createElement('div');
		roleName.classList.add('roleName');

		const r = constructRole(role);
		roleName.appendChild(Dom.p('Your starting role:'));
		const h2 = document.createElement('h2');
		h2.textContent = r.roleName;
		roleName.appendChild(h2);

		this.#wrap.appendChild(roleName);
		this.#wrap.appendChild(Dom.p(r.instructions, 'roleDesc'));
	}

	/**
	 * @param {number} time
	 */
	startTimer(time) {
		const h2 = document.createElement('h2');
		h2.textContent = 'Time Remaining';
		this.#timerWrap.appendChild(h2);

		this.#timer = Dom.p(secondsToTime(time));
		this.#timerWrap.appendChild(this.#timer);

		this.#timeLeft = time;

		const updateTimer = () => {
			if (this.#timer === undefined) { return; }
			this.#timeLeft--;
			this.#timer.textContent = secondsToTime(this.#timeLeft);
			if (this.#timeLeft > 0) {
				setTimeout(updateTimer, 1000);
			}
		};
		setTimeout(updateTimer, 1000);
	}

	/**
	 * @param {number} time
	 */
	timeSync(time) {
		this.#timeLeft = time;
	}
}
