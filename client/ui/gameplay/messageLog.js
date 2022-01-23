import Dom from '../../dom.js';

export default class MessageLog {
	/** @type {HTMLElement} */
	#wrap;

	/**
	 * Queue of elements to be spawned in.
	 *
	 * Head of queue is element 0.
	 *
	 * This queue is non-empty if and only if the `#spawnPending()` cycle is currently running.
	 * If it is, do not call `#spawnPending()` again; it will automatically empty this queue out.
	 * Otherwise, call `#spawnPending()` after `push`ing to this queue.
	 *
	 * @type {HTMLElement[]}
	 */
	#pending;

	/**
     * @param {HTMLElement} dom
     */
	constructor(dom) {
		this.#wrap = document.createElement('main');
		this.#wrap.classList.add('messageLog');
		dom.appendChild(this.#wrap);
		this.#pending = [];

		setTimeout(this.wake.bind(this), 1000);
	}

	/**
     * Add a message to the message log
     * @param {string|HTMLElement} el
     */
	msg(el) {
		this.msgRaw(Dom.section(el));
	}

	/**
     * Add a raw element to the message log.
     *
     * Unlike `msg(el)`, this will not wrap the element in a section tag.
     * @param {HTMLElement} el
     */
	msgRaw(el) {
		const queueEmpty = this.#pending.length === 0;
		this.#pending.push(el);
		if (queueEmpty) {
			this.#spawnPending();
		}
	}

	#spawnPending() {
		if (this.#pending.length === 0) { return; }
		const el = this.#pending[0];

		this.#wrap.appendChild(el);
		const t = window.getComputedStyle(el).transform;
		if (t !== 'matrix(0, 0, 0, 0, 0, 0)') {
			// eslint-disable-next-line no-console
			console.error(`Weird; this section spawned with transform ${t}`);
		}
		// eslint-disable-next-line no-param-reassign
		el.style.transform = 'scale(1)';
		this.#wrap.scrollTop = this.#wrap.scrollHeight;

		setTimeout(() => {
			// I'm not expecting this queue to get long
			this.#pending.shift();
			this.#spawnPending();
		}, 1000);
	}

	wake() {
		this.#wrap.style.background = 'white';
	}

	sleep() {
		this.#wrap.style.background = '';
	}
}
