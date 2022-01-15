import { secondsToTime } from '../../../game/utils.js';
import Dom from '../../dom.js';

export default class Timer {
	/** @type {number} */
	#timeLeft;

	/** @type {HTMLElement} */
	#timer;

	/**
     *
     * @param {number} time Seconds to put on clock
     * @param {(el: HTMLElement) => void} fnToAdd
     * Callback function to call with the timer element as paramenter
     */
	constructor(time, fnToAdd) {
		this.#timeLeft = time;
		this.#timer = Dom.p(secondsToTime(time), 'timer');

		const updateTimer = () => {
			if (this.#timer === undefined) { return; }
			this.#timeLeft--;
			this.#timer.textContent = secondsToTime(this.#timeLeft);
			if (this.#timeLeft > 0) {
				setTimeout(updateTimer, 1000);
			}
		};
		setTimeout(updateTimer, 1000);

		fnToAdd(this.#timer);
	}

	/**
     * @param {number} time
     */
	timeSync(time) {
		this.#timeLeft = time;
	}
}
