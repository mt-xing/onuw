import Dom from '../../dom.js';
import Socket from '../../socket.js';
import MessageLog from './messageLog.js';

export default class Choice {
	/** @type {HTMLElement} */
	#element;

	/** @type {(HTMLInputElement|null)[]} */
	#inputElements;

	/** @type {HTMLButtonElement} */
	#confirmBtn;

	/**
	 * @param {Socket} socket
	 * @param {MessageLog} dom
	 * @param {number} nonce
	 * @param {[string, string | null][]} choices Choice text and enabled
	 * @param {number} num
	 * @param {string} heading
	 */
	constructor(socket, dom, nonce, choices, num, heading) {
		this.#element = document.createElement('section');
		this.#element.className = 'selection';

		this.#element.appendChild(Dom.p(heading));

		const choiceList = document.createElement('ul');
		// eslint-disable-next-line operator-linebreak
		this.#inputElements = /** @type {(HTMLInputElement|null)[]} */
			(choices.map((choice) => {
				if (choice[1] !== null) {
					const span = Dom.span(`${choice[0]}: `);
					const em = document.createElement('em');
					em.textContent = `${choice[1]}`;
					span.appendChild(em);
					choiceList.appendChild(Dom.li(span));
					return null;
				}
				const chk = Dom.input('checkbox');
				const label = document.createElement('label');
				label.appendChild(chk);
				label.appendChild(Dom.span(choice[0]));
				choiceList.appendChild(Dom.li(label));
				return chk;
			}));
		this.#inputElements.forEach((x) => {
			if (x !== null) {
				x.addEventListener('change', this.#handleInputChange.bind(this, num));
			}
		});
		this.#element.appendChild(choiceList);

		this.#confirmBtn = Dom.button('Confirm Choice', this.#handleConfirm.bind(this, socket, nonce, num));
		this.#confirmBtn.disabled = true;
		this.#element.appendChild(this.#confirmBtn);

		dom.msgRaw(this.#element);
	}

	/**
	 * @param {number} num
	 */
	#handleInputChange(num) {
		/** @type {number[]} */
		const c = this.#inputElements.map((chk) => (chk !== null && chk.checked ? 1 : 0));
		const n = c.reduce((a, x) => a + x);

		this.#confirmBtn.disabled = (n !== num);
	}

	/**
	 * @param {Socket} socket
	 * @param {number} nonce
	 * @param {number} num
	 */
	#handleConfirm(socket, nonce, num) {
		/** @type {number[]} */
		const c = this.#inputElements.map((chk) => (chk !== null && chk.checked ? 1 : 0));
		const n = c.reduce((a, x) => a + x);

		if (n !== num) {
			// eslint-disable-next-line no-console
			console.error(`Error: Select ${num} choice(s)`);
			return;
		}

		const ids = c
			.map((x, id) => (x === 1 ? id : NaN))
			.filter((x) => !Number.isNaN(x));

		socket.send('pick', {
			nonce,
			id: ids,
		});
		this.#confirmBtn.disabled = true;

		this.#element.classList.add('locked');
		this.#element.appendChild(Dom.p('✔️ Your choice has been submitted', 'done'));
	}

	timeout() {
		this.#element.classList.add('locked');
		this.#element.appendChild(Dom.p('❌ Sorry, you did not confirm your selection in time', 'timeout'));
	}
}
