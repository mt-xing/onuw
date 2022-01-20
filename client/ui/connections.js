import { makeList } from '../../game/utils.js';
import Dom from '../dom.js';
import Socket from '../socket.js';
import OnuwGame from '../game.js';
import { MAX_ROLES } from '../../game/role.js';

export default class Connections {
	/**
	 * @type {Socket}
	 */
	#socket;

	/**
	 * @type {OnuwGame}
	 */
	#game;

	/**
	 * @type {HTMLElement}
	 */
	#dom;

	/** @type {HTMLElement | undefined} */
	#currScreen;

	/**
	 * @param {Socket} socket
	 * @param {HTMLElement} gameDom
	 */
	constructor(socket, gameDom) {
		this.#dom = gameDom;
		this.#dom.textContent = null;
		this.#socket = socket;
		this.#game = new OnuwGame();

		this.#spawnOpening(gameDom);

		// this.#nameField = Dom.input('text', 'Name');
		// gameDom.appendChild(this.#nameField);

		// this.#idField = Dom.input('text', 'Game ID');
		// gameDom.appendChild(this.#idField);

		// gameDom.appendChild(Dom.button('Create', this.#create.bind(this)));
		// gameDom.appendChild(Dom.button('Join', this.#join.bind(this)));

		socket.off('createYes');
		socket.on('createYes', (msg) => {
			const { id } = JSON.parse(msg);
			this.createYes(id);
		});
		socket.off('createNo');
		socket.on('createNo', (msg) => {
			const { reason } = JSON.parse(msg);
			this.createNo(reason);
		});

		socket.off('joinYes');
		socket.on('joinYes', (msg) => {
			const { playerID, players } = JSON.parse(msg);
			this.joinYes(playerID, players);
		});
		socket.off('joinNo');
		socket.on('joinNo', (msg) => {
			const { reason } = JSON.parse(msg);
			this.joinNo(reason);
		});
		socket.off('joinNew');
		socket.on('joinNew', (msg) => {
			const { playerID, name } = JSON.parse(msg);
			this.joinNew(playerID, name);
		});
	}

	/**
	 * @param {HTMLElement} wrapDom
	 */
	#spawnOpening(wrapDom) {
		const intro = document.createElement('main');
		intro.classList.add('intro');

		const h1 = document.createElement('h1');
		h1.textContent = 'onuw';
		intro.appendChild(h1);

		const div = document.createElement('div');
		div.appendChild(Dom.button('Host Game', this.#create.bind(this)));
		div.appendChild(Dom.button('Join Game', this.#join.bind(this)));
		intro.appendChild(div);

		const footer = document.createElement('footer');
		const xLink = document.createElement('a');
		footer.appendChild(xLink);
		xLink.href = 'https://michaelxing.com';
		xLink.textContent = 'Xing';
		xLink.setAttribute('data-text', 'Xing');
		intro.appendChild(footer);

		wrapDom.appendChild(intro);
		this.#currScreen = intro;
	}

	get game() {
		return this.#game;
	}

	#clearCurr() {
		if (this.#currScreen !== undefined) {
			const c = this.#currScreen;
			this.#currScreen = undefined;

			c.style.transition = 'transform 0.5s ease-in';
			c.style.transform = 'scale(0)translateX(0)';
			c.style.pointerEvents = 'none';
			setTimeout(() => {
				c.parentElement?.removeChild(c);
			}, 500);
		}
	}

	/**
	 * @param {HTMLElement} el
	 */
	#addCurr(el) {
		if (this.#currScreen !== undefined) {
			throw new Error('Current screen has not been cleared');
		}
		this.#currScreen = el;
		this.#dom.appendChild(el);
		if (!getComputedStyle(el).transform) {
			// eslint-disable-next-line no-console
			console.info('No transform on element');
		}
		this.#currScreen.style.transform = 'scale(1)translateX(0)';
	}

	#create() {
		this.#clearCurr();
		const m = document.createElement('main');
		m.classList.add('connection');
		this.#addCurr(m);

		m.appendChild(Dom.h1('Host Game'));
		m.appendChild(Dom.p('Hi there! What\'s your name?'));
		const nameField = Dom.input('text', 'Name');
		nameField.setAttribute('maxlength', '35');
		m.appendChild(nameField);

		let submitting = false;
		const submit = () => {
			if (submitting) { return; }
			if (nameField.value === '') { return; }
			submitting = true;
			btn.disabled = true;
			this.#game.addPlayer(0, nameField.value);
			this.#socket.send('create', { name: nameField.value });
		};
		nameField.addEventListener('change', () => {
			btn.disabled = nameField.value === '';
		});
		nameField.addEventListener('keydown', () => {
			btn.disabled = nameField.value === '';
		});
		nameField.addEventListener('keyup', () => {
			btn.disabled = nameField.value === '';
		});
		nameField.addEventListener('keydown', (e) => { if (e.code === 'Enter') { submit(); } });

		const btn = Dom.button('Continue', submit);
		btn.disabled = true;
		m.appendChild(btn);
	}

	#join() {
		this.#clearCurr();
		const m = document.createElement('main');
		m.classList.add('connection');
		this.#addCurr(m);

		m.appendChild(Dom.h1('Join Game'));
		m.appendChild(Dom.p('Welcome! We\'ll need your name and game ID.'));

		const nameField = Dom.input('text', 'Name');
		const gameField = Dom.input('text', 'Game ID');
		nameField.setAttribute('maxlength', '35');
		gameField.setAttribute('maxlength', '5');
		gameField.setAttribute('minlength', '5');

		let submitting = false;
		const submit = () => {
			if (submitting) { return; }
			if (nameField.value === '' || gameField.value.length < 5) { return; }
			submitting = true;
			btn.disabled = true;
			this.#socket.send('join', { id: gameField.value.toLowerCase(), name: nameField.value });
			this.#game.code = gameField.value.toLowerCase();
		};
		const updateBtn = () => { btn.disabled = nameField.value === '' || gameField.value.length < 5; error.textContent = null; };
		[nameField, gameField].forEach((input) => {
			input.addEventListener('change', updateBtn);
			input.addEventListener('keydown', updateBtn);
			input.addEventListener('keyup', (e) => { if (e.code !== 'Enter') { updateBtn(); } });
			input.addEventListener('keydown', (e) => { if (e.code === 'Enter') { submit(); } });
		});
		m.appendChild(nameField);
		m.appendChild(gameField);

		m.appendChild(Dom.p('Not sure what this is? Ask the person hosting the game.'));

		const btn = Dom.button('Join', submit);
		btn.disabled = true;
		m.appendChild(btn);

		const error = Dom.p('', 'errorCode');
		m.appendChild(error);
		/** @param {string} reason */
		this.joinNo = (reason) => {
			error.textContent = reason;
			submitting = false;
		};
	}

	#hostConfirm() {
		this.#socket.emit('setupStart', '');
	}

	/**
	 * @param {string} id
	 */
	createYes(id) {
		this.#game.playerID = 0;
		this.#game.code = id;
		this.#clearCurr();
		const m = document.createElement('main');
		m.classList.add('connection');
		this.#addCurr(m);

		const div = document.createElement('div');
		m.appendChild(div);
		const s1 = Dom.section(Dom.p('Here\'s your game ID:'));
		div.appendChild(s1);
		const code = document.createElement('code');
		code.textContent = id;
		s1.appendChild(code);
		s1.appendChild(Dom.p('Give this to the other players.'));
		const s2 = Dom.section(Dom.h2('Players'));
		div.appendChild(s2);
		const table = document.createElement('table');
		s2.appendChild(table);

		const playersLeft = Dom.p('Needs 2 more players');
		s2.appendChild(playersLeft);

		/** @param {string} name */
		const addToTable = (name) => {
			const tr = document.createElement('tr');
			table.appendChild(tr);
			const td = document.createElement('td');
			tr.appendChild(td);
			td.textContent = name;
		};
		addToTable(this.#game.getPlayerName(0));

		/**
		 * @param {number} playerID
		 * @param {string} name
		 */
		this.joinNew = (playerID, name) => {
			this.#game.addPlayer(playerID, name);
			addToTable(name);

			const np = this.#game.numPlayers;
			if (this.#game.numPlayers < 3) {
				playersLeft.textContent = np === 2 ? 'Needs 1 more player' : `Needs ${3 - np} more players`;
				btn.disabled = true;
			} else {
				btn.disabled = false;
				playersLeft.textContent = np === (MAX_ROLES - 1)
					? 'Can accommodate 1 more player'
					: `Can accomodate ${MAX_ROLES - np} more players`;
			}
		};

		const btn = Dom.button('Start', () => {
			this.#hostConfirm();
		});
		btn.disabled = true;
		m.appendChild(btn);
	}

	/**
	 * @param {string} reason
	 */
	createNo(reason) {
		this.#clearCurr();
		const m = document.createElement('main');
		m.classList.add('connection');
		this.#addCurr(m);

		m.appendChild(Dom.h1('Error :('));
		m.appendChild(Dom.p(reason));
		this.#game.reset();
	}

	/**
	 * @param {number} playerID
	 * @param {string[]} players
	 */
	joinYes(playerID, players) {
		players.forEach((name, i) => {
			this.#game.addPlayer(i, name);
		});
		this.#game.playerID = playerID;

		this.#clearCurr();
		const m = document.createElement('main');
		m.classList.add('connection');
		this.#addCurr(m);

		m.appendChild(Dom.h2('Players'));
		const table = document.createElement('table');
		m.appendChild(table);

		/** @param {string} name */
		const addToTable = (name) => {
			const tr = document.createElement('tr');
			table.appendChild(tr);
			const td = document.createElement('td');
			tr.appendChild(td);
			td.textContent = name;
		};
		players.forEach(addToTable);

		/**
		 * @param {number} pid
		 * @param {string} name
		 */
		this.joinNew = (pid, name) => {
			this.#game.addPlayer(pid, name);
			addToTable(name);
		};

		const codeWrap = Dom.p('Successfully joined ');
		const code = document.createElement('code');
		code.textContent = this.#game.code ?? '';
		codeWrap.appendChild(code);
		m.appendChild(codeWrap);
		m.appendChild(Dom.p('Waiting for the host to start your game.'));
	}

	/**
	 * @param {string} reason
	 */
	joinNo(reason) {
		// eslint-disable-next-line no-console
		console.error(`Invalid join error before ready. ${reason}`);
	}

	/**
	 * @param {number} playerID
	 * @param {string} name
	 */
	joinNew(playerID, name) {
		// eslint-disable-next-line no-console
		console.error(`Invalid join new before ready. Player ${playerID} with name ${name}`);
	}
}
