import Role, { Roles } from '../../../game/role.js';
import { constructRole } from '../../../game/rolesIndiv.js';
import Dom from '../../dom.js';

export default class BoardStatus {
	/**
	 * @type {HTMLElement}
	 */
	#wrap;

	/**
     * Element containing the text description of a player.
     * Its parent element is the containing wrapper.
	 * @type {HTMLElement[]}
	 */
	#playerElements;

	/**
	 * @param {HTMLElement} dom
	 * @param {string[]} playerNames
	 */
	constructor(dom, playerNames) {
		this.#wrap = document.createElement('aside');
		this.#wrap.className = 'boardWrap';
		dom.appendChild(this.#wrap);

		this.#playerElements = [];

		this.#constructBoard(playerNames);
	}

	/**
	 * @param {string[]} playerNames
	 */
	#constructBoard(playerNames) {
		this.#playerElements = playerNames.map((name) => {
			const wrap = document.createElement('div');
			this.#wrap.appendChild(wrap);

			const pName = document.createElement('h2');
			pName.textContent = name;
			wrap.appendChild(pName);

			const t = Dom.p('');
			wrap.appendChild(t);

			return t;
		});
	}

	/**
     * @param {Record<number, string>} boardInfo
     */
	showBoard(boardInfo) {
		for (const pid in boardInfo) {
			if (!Object.prototype.hasOwnProperty.call(boardInfo, pid)) { continue; }
			const p = parseInt(pid, 10);
			if (p >= this.#playerElements.length) {
				// eslint-disable-next-line no-console
				console.error('Invalid board info; nonexistent player ID');
				// eslint-disable-next-line no-console
				console.error(boardInfo);
				return;
			}

			this.#playerElements[p].textContent = boardInfo[p];
		}
		this.#wrap.classList.add('visible');
	}

	hideBoard() {
		this.#wrap.classList.remove('visible');
	}
}
