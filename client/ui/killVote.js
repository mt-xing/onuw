import Dom from '../dom.js';
import OnuwGame from '../game.js';
import Socket from '../socket.js';

export default class KillVote {
	/** @type {HTMLElement} */
	#wrap;

	/** @type {LineItem[]} */
	#lis;

	/**
     * @param {HTMLElement} gameDom
     * @param {Socket} socket
     * @param {OnuwGame} game
     */
	constructor(gameDom, socket, game) {
		this.#wrap = document.createElement('main');
		this.#wrap.classList.add('voteWrap');
		this.#wrap.appendChild(Dom.h2('Vote to Kill'));

		this.#lis = [];
		const resetAll = () => this.#lis.forEach((x) => x.clear());

		const ul = document.createElement('ul');
		this.#wrap.appendChild(ul);
		for (let i = 0; i < game.numPlayers; i++) {
			if (i === game.playerID) {
				// Current Player
				const li = document.createElement('li');
				ul.appendChild(li);
				li.appendChild(Dom.p(`${game.getPlayerName(i)} - You may not vote for yourself`));
			} else {
				this.#lis.push(new LineItem(ul, game.getPlayerName(i), () => {
					socket.send('vote', { id: i });
				}, resetAll));
			}
		}

		gameDom.appendChild(this.#wrap);
	}
}

class LineItem {
	/** @type {HTMLLIElement} */
	#dom;

	/** @type {HTMLButtonElement} */
	#mainBtn;

	/** @type {[HTMLButtonElement, HTMLButtonElement]} */
	#secondBtns;

	/** @type {() => void} */
	#resetAll;

	/**
	 * @param {HTMLElement} wrapDom
	 * @param {string} name
	 * @param {() => void} vote
	 * @param {() => void} resetAll
	 */
	constructor(wrapDom, name, vote, resetAll) {
		this.#resetAll = resetAll;

		this.#dom = document.createElement('li');
		wrapDom.appendChild(this.#dom);

		this.#mainBtn = Dom.button(name, this.#showConf.bind(this), 'primaryBtn');
		this.#dom.appendChild(this.#mainBtn);

		this.#secondBtns = [
			Dom.button('Confirm Vote', () => { resetAll(); vote(); }, 'hidden secondaryBtn'),
			Dom.button('Cancel', this.clear.bind(this), 'hidden secondaryBtn'),
		];
		this.#secondBtns.forEach((b) => this.#dom.appendChild(b));
	}

	#showConf() {
		this.#resetAll();
		this.#mainBtn.classList.add('hidden');
		this.#secondBtns.forEach((b) => b.classList.remove('hidden'));
	}

	clear() {
		this.#mainBtn.classList.remove('hidden');
		this.#secondBtns.forEach((b) => b.classList.add('hidden'));
	}
}
