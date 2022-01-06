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

	#nameField;

	#idField;

	/**
	 * @param {Socket} socket
	 * @param {HTMLElement} gameDom
	 */
	constructor(socket, gameDom) {
		this.#dom = gameDom;
		this.#dom.textContent = null;
		this.#socket = socket;
		this.#game = new OnuwGame();

		this.#nameField = Dom.input('text', 'Name');
		gameDom.appendChild(this.#nameField);

		this.#idField = Dom.input('text', 'Game ID');
		gameDom.appendChild(this.#idField);

		gameDom.appendChild(Dom.button('Create', this.#create.bind(this)));
		gameDom.appendChild(Dom.button('Join', this.#join.bind(this)));

		socket.on('createYes', (msg) => {
			const { id } = JSON.parse(msg);
			this.createYes(id);
		});
		socket.on('createNo', (msg) => {
			const { reason } = JSON.parse(msg);
			this.createNo(reason);
		});

		socket.on('joinYes', (msg) => {
			const { playerID, players } = JSON.parse(msg);
			this.joinYes(playerID, players);
		});
		socket.on('joinNo', (msg) => {
			const { reason } = JSON.parse(msg);
			this.joinNo(reason);
		});
		socket.on('joinNew', (msg) => {
			const { playerID, name } = JSON.parse(msg);
			this.joinNew(playerID, name);
		});
	}

	get game() {
		return this.#game;
	}

	#create() {
		if (this.#nameField.value === '') {
			alert('Enter your name');
			return;
		}
		this.#game.addPlayer(0, this.#nameField.value);
		this.#socket.send('create', { name: this.#nameField.value });
	}

	#join() {
		if (this.#nameField.value === '') {
			alert('Enter your name');
			return;
		}
		if (this.#idField.value === '') {
			alert('Enter a valid game ID');
			return;
		}
		this.#socket.send('join', { id: this.#idField.value, name: this.#nameField.value });
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
