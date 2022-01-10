import Dom from '../../dom.js';

export default class MessageLog {
	#wrap;

	/**
     * @param {HTMLElement} dom
     */
	constructor(dom) {
		this.#wrap = document.createElement('main');
		this.#wrap.classList.add('messageLog');
		dom.appendChild(this.#wrap);
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
		this.#wrap.appendChild(el);
		const t = window.getComputedStyle(el).transform;
		if (t !== 'matrix(0, 0, 0, 0, 0, 0)') {
			// eslint-disable-next-line no-console
			console.error(`Weird; this section spawned with ${t}`);
		}
		// eslint-disable-next-line no-param-reassign
		el.style.transform = 'scale(1)';
	}
}
