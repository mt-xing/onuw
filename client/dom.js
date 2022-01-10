/**
 * Static helper methods to manipulate the DOM
 */
export default class Dom {
	/**
	 * Construct a button DOM object
	 * @param {string} text
	 * @param {(ev: MouseEvent) => void} [callback]
	 * @param {string} [className]
	 * @returns {HTMLButtonElement}
	 */
	static button(text, callback, className) {
		const d = document.createElement('button');
		if (callback !== undefined) {
			d.onclick = callback;
		}
		d.textContent = text;
		if (className !== undefined) {
			d.className = className;
		}
		return d;
	}

	/**
	 * Construct a paragraph DOM object
	 * @param {string} text
	 * @param {string} [className]
	 * @returns {HTMLParagraphElement}
	 */
	static p(text, className) {
		const p = document.createElement('p');
		p.textContent = text;
		if (className !== undefined) {
			p.className = className;
		}
		return p;
	}

	/**
	 * Construct a paragraph DOM object
	 * @param {string} text
	 * @param {string} [className]
	 * @returns {HTMLSpanElement}
	 */
	static span(text, className) {
		const p = document.createElement('span');
		p.textContent = text;
		if (className !== undefined) {
			p.className = className;
		}
		return p;
	}

	/**
	 * @param {string | HTMLElement} child
	 * @returns {HTMLElement}
	 */
	static section(child) {
		const sec = document.createElement('section');

		if (typeof child === 'string') {
			sec.appendChild(Dom.span(child));
		} else {
			sec.appendChild(child);
		}

		return sec;
	}

	/**
	 *
	 * @param {string | HTMLElement} child
	 * @returns {HTMLLIElement}
	 */
	static li(child) {
		const li = document.createElement('li');

		if (typeof child === 'string') {
			li.appendChild(Dom.span(child));
		} else {
			li.appendChild(child);
		}

		return li;
	}

	/**
	 *
	 * @param {string} type
	 * @param {string} [placeholder]
	 * @param {string} [defaultValue]
	 * @param {string} [className]
	 * @returns {HTMLInputElement}
	 */
	static input(type, placeholder, defaultValue, className) {
		const d = document.createElement('input');
		d.type = type;
		if (placeholder !== undefined) {
			d.placeholder = placeholder;
		}
		if (defaultValue !== undefined) {
			d.defaultValue = defaultValue;
		}
		if (className !== undefined) {
			d.className = className;
		}
		return d;
	}

	static hr() {
		return document.createElement('hr');
	}
}
