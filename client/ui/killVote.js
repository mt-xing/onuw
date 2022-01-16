import Dom from '../dom.js';
import OnuwGame from '../game.js';
import Socket from '../socket.js';

function getSpinnerUrl() {
	const cPath = import.meta.url;
	const split = cPath.split('/');
	const fileName = split[split.length - 1];
	const path = cPath.substring(0, cPath.length - fileName.length);

	return `${path}load.gif`;
}

export default class KillVote {
	/** @type {HTMLElement} */
	#wrap;

	/** @type {LineItem[]} */
	#lis;

	/** @type {number} */
	#pid;

	/** @type {HTMLElement} */
	#selfSpinner;

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
		const lockAll = () => this.#lis.forEach((x) => x.lock());
		this.#pid = game.playerID;

		const ul = document.createElement('ul');
		this.#wrap.appendChild(ul);
		this.#selfSpinner = Dom.p('', 'spinner');
		for (let i = 0; i < game.numPlayers; i++) {
			if (i === game.playerID) {
				// Current Player
				const li = document.createElement('li');
				ul.appendChild(li);
				const p = Dom.p(`${game.getPlayerName(i)} - `);
				p.appendChild(Dom.span('You may not vote for yourself'));
				li.appendChild(p);
				const img = document.createElement('img');
				img.src = getSpinnerUrl();
				this.#selfSpinner.appendChild(img);
				li.appendChild(this.#selfSpinner);
			} else {
				this.#lis.push(new LineItem(ul, game.getPlayerName(i), () => {
					socket.send('vote', { id: i });
					lockAll();
				}, resetAll));
			}
		}

		gameDom.appendChild(this.#wrap);
		if (!getComputedStyle(this.#wrap).transform) {
			// eslint-disable-next-line no-console
			console.error('No style?');
		}
		this.#wrap.style.transform = 'translateX(0)';
	}

	/**
	 * @param {number} pid
	 */
	vote(pid) {
		if (pid === this.#pid) {
			this.#selfSpinner.textContent = '✅';
			return;
		}
		const liIndexPid = pid > this.#pid ? pid - 1 : pid;
		if (liIndexPid >= this.#lis.length) {
			// eslint-disable-next-line no-console
			console.error(`Invalid pid voted: ${pid}`);
			return;
		}
		this.#lis[liIndexPid].voted();
	}
}

class LineItem {
	/** @type {HTMLElement} */
	#dom;

	/** @type {HTMLButtonElement} */
	#mainBtn;

	/** @type {[HTMLButtonElement, HTMLButtonElement]} */
	#secondBtns;

	/** @type {() => void} */
	#resetAll;

	/** @type {HTMLElement} */
	#spinner;

	/** @type {HTMLElement} */
	#done;

	/**
	 * @param {HTMLElement} wrapDom
	 * @param {string} name
	 * @param {() => void} vote
	 * @param {() => void} resetAll
	 */
	constructor(wrapDom, name, vote, resetAll) {
		this.#resetAll = resetAll;

		const li = document.createElement('li');
		this.#dom = li;
		wrapDom.appendChild(li);

		this.#mainBtn = Dom.button(name, this.#showConf.bind(this), 'primaryBtn');
		li.appendChild(this.#mainBtn);

		this.#secondBtns = [
			Dom.button('Confirm Vote', () => { resetAll(); vote(); this.#confirm(); }, 'hidden secondaryBtn'),
			Dom.button('Cancel', this.clear.bind(this), 'hidden secondaryBtn'),
		];
		this.#secondBtns.forEach((b) => li.appendChild(b));

		this.#spinner = Dom.p('', 'spinner');
		const img = document.createElement('img');
		img.src = getSpinnerUrl();
		this.#spinner.appendChild(img);
		li.appendChild(this.#spinner);

		this.#done = Dom.p('', 'done');
		li.appendChild(this.#done);
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

	voted() {
		this.#spinner.textContent = '✅';
	}

	#confirm() {
		this.#done.classList.add('show');
	}

	lock() {
		this.#dom.classList.add('locked');
	}
}
