import { makeList } from '../../game/utils.js';
import Dom from '../dom.js';
import Socket from '../socket.js';
import OnuwGame from '../game.js';

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

		intro.appendChild(Dom.p('Not an unlicensed rip-off of One Night Ultimate Werewolf. It\'s, uh... something else.'));
		const boardGame = Dom.p('But on a completely unrelated note you can support the creators of One Night Ultimate Werewolf by buying it ');
		const boardGameLink = document.createElement('a');
		boardGameLink.textContent = 'here';
		boardGameLink.href = 'https://beziergames.com/collections/all-games/products/one-night-ultimate-werewolf';
		boardGameLink.target = '_blank';
		boardGame.appendChild(boardGameLink);
		boardGame.appendChild(document.createTextNode('.'));
		intro.appendChild(boardGame);
		const git = Dom.p('This game is open source! Check it out on ');
		const gitLink = document.createElement('a');
		gitLink.textContent = 'GitHub';
		gitLink.href = 'https://github.com/mt-xing/onuw';
		gitLink.target = '_blank';
		git.appendChild(gitLink);
		git.appendChild(document.createTextNode('.'));
		intro.appendChild(git);

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
			// TODO animate properly
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
		nameField.addEventListener('change', () => {
			btn.disabled = nameField.value === '';
		});
		nameField.addEventListener('keydown', () => {
			btn.disabled = nameField.value === '';
		});
		nameField.addEventListener('keyup', () => {
			btn.disabled = nameField.value === '';
		});
		m.appendChild(nameField);

		const btn = Dom.button('Continue', () => {
			this.#game.addPlayer(0, nameField.value);
			this.#socket.send('create', { name: nameField.value });
			btn.disabled = true;
		});
		btn.disabled = true;
		m.appendChild(btn);
	}

	#join() {
		// if (this.#nameField.value === '') {
		// 	alert('Enter your name');
		// 	return;
		// }
		// if (this.#nameField.value.length > 50) {
		// 	alert('bruh why');
		// 	return;
		// }
		// if (this.#idField.value === '') {
		// 	alert('Enter a valid game ID');
		// 	return;
		// }
		// this.#socket.send('join', { id: this.#idField.value.toLowerCase(),
		// name: this.#nameField.value });

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
		const updateBtn = () => { btn.disabled = nameField.value === '' || gameField.value.length < 5; };
		[nameField, gameField].forEach((input) => {
			input.addEventListener('change', updateBtn);
			input.addEventListener('keydown', updateBtn);
			input.addEventListener('keyup', updateBtn);
		});
		m.appendChild(nameField);
		m.appendChild(gameField);

		m.appendChild(Dom.p('Not sure what this is? Ask the person hosting the game.'));

		const btn = Dom.button('Join', () => {
			this.#socket.send('join', { id: gameField.value.toLowerCase(), name: nameField.value });
			btn.disabled = true;
		});
		btn.disabled = true;
		m.appendChild(btn);
	}

	#hostConfirm() {
		this.#socket.emit('setupStart', '');
	}

	/**
	 * @param {string} id
	 */
	createYes(id) {
		this.#dom.textContent = null;
		this.#dom.appendChild(Dom.p(`New game id: ${id}`));
		this.#dom.appendChild(Dom.button('Start Game', this.#hostConfirm.bind(this)));
		this.#game.playerID = 0;
	}

	/**
	 * @param {string} reason
	 */
	createNo(reason) {
		this.#dom.appendChild(Dom.p(reason));
		this.#game.reset();
	}

	/**
	 * @param {number} playerID
	 * @param {string[]} players
	 */
	joinYes(playerID, players) {
		this.#dom.textContent = null;
		this.#dom.appendChild(Dom.p(
			`You are player ${playerID}, with these other players: ${makeList(players.map((name, i) => `${name} as player ${i}`))}`,
		));
		players.forEach((name, i) => {
			this.#game.addPlayer(i, name);
		});
		this.#game.playerID = playerID;
	}

	/**
	 * @param {string} reason
	 */
	joinNo(reason) {
		this.#dom.appendChild(Dom.p(reason));
	}

	/**
	 * @param {number} playerID
	 * @param {string} name
	 */
	joinNew(playerID, name) {
		this.#dom.appendChild(Dom.p(`${name} joined as player ${playerID}`));
		this.#game.addPlayer(playerID, name);
	}
}
