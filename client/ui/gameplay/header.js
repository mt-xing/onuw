import { Roles } from '../../../game/role.js';
import { constructRole } from '../../../game/rolesIndiv.js';
import { secondsToTime } from '../../../game/utils.js';
import Dom from '../../dom.js';

export default class Header {
	/** @type {HTMLElement} */
	#wrap;

	/** @type {HTMLElement} */
	#timerWrap;

	/** @type {HTMLElement} */
	#timerHeading;

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
		this.#timerHeading = document.createElement('h2');
		this.#timerHeading.textContent = 'Night';
		this.#timerWrap.appendChild(this.#timerHeading);

		this.#timeLeft = NaN;
	}

	/**
     * @param {Roles} role
     */
	#showRole(role) {
		const r = constructRole(role);
		const h2 = document.createElement('h2');
		h2.textContent = r.roleName;
		h2.classList.add('roleName');

		const roleDesc = document.createElement('div');
		roleDesc.classList.add('roleDesc');
		roleDesc.appendChild(Dom.p(r.instructions));
		roleDesc.appendChild(Dom.p('This is the role you started with and will act as at night. You might not end the night as the same role.'));

		this.#wrap.appendChild(h2);
		this.#wrap.appendChild(roleDesc);
	}

	/**
	 * @param {number} time
	 */
	startTimer(time) {
		this.#timerHeading.textContent = 'Day';

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
