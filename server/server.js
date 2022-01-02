import * as io from '../node_modules/socket.io/dist/index.js';
import Broker from './broker.js';
import Communicator from './comms.js';
import OnuwGame from './game.js';
import Role, { Roles } from '../game/role.js';
import { CENTER_SIZE } from '../game/state.js';
import { constructRole } from '../game/rolesIndiv.js';

export default class OnuwServer {
	/**
	 * @type {io.Namespace}
	 */
	#namespace;

	/**
	 * @type {Map<io.Socket, string>}
	 */
	#socketRoom;

	/**
	 * @type {Map<string, OnuwGame>}
	 */
	#games;

	/**
	 * @type {Map<string, Broker>}
	 */
	#setups;

	/**
	 * Create a new server for onuw
	 * @param {io.Namespace} namespace A socket.io namespace for the game to operate on
	 */
	constructor(namespace) {
		this.#namespace = namespace;
		this.#socketRoom = new Map();
		this.#games = new Map();
		this.#setups = new Map();

		namespace.on('connection', (socket) => {
			socket.on('create', this.#createRoom.bind(this, socket));
			socket.on('join', this.#joinRoom.bind(this, socket));
			socket.on('setupStart', this.#enterSetup.bind(this, socket));
			socket.on('setupInfo', this.#setupInfo.bind(this, socket));
			socket.on('setupDone', this.#completeSetup.bind(this, socket));
			socket.on('pick', this.#selectionMade.bind(this, socket));
			socket.on('vote', this.#voteReceived.bind(this, socket));
		});
	}

	/**
	 * Attempt to create a new room
	 * @param {io.Socket} socket
	 * @param {string} roomInfo
	 */
	#createRoom(socket, roomInfo) {
		const getID = () => Math.random().toString(36).substring(2, 7);
		let remainingTries = 50;
		while (remainingTries > 0) {
			const id = getID();
			if (!this.#games.has(id) && !this.#setups.has(id)) {
				socket.join(id);
				/** @type {{name: string}} */
				const { name } = JSON.parse(roomInfo);
				this.#setups.set(id, new Broker(name, socket));
				this.#socketRoom.set(socket, id);

				socket.emit('createYes', JSON.stringify({ id }));

				return;
			}
			remainingTries--;
		}
		socket.emit('createNo', JSON.stringify({ reason: 'Unable to assign a room ID. The server may be suffering from congestion at the moment. Please try again later.' }));
	}

	/**
	 * Join an existing room being setup
	 * @param {io.Socket} socket
	 * @param {string} roomInfo
	 */
	#joinRoom(socket, roomInfo) {
		/** @type {{id: string, name: string}} */
		const { id, name } = JSON.parse(roomInfo);
		const game = this.#setups.get(id);
		if (game === undefined) {
			socket.emit('joinNo', JSON.stringify({ reason: 'This game code does not exist' }));
			return;
		}
		const addResult = game.addPlayer(socket, name);
		switch (addResult) {
		case 'full':
			socket.emit('joinNo', JSON.stringify({ reason: 'This game is full' }));
			break;
		case 'done':
			socket.emit('joinNo', JSON.stringify({ reason: 'This game is no longer accepting more players' }));
			break;
		case 'duplicate':
			socket.emit('joinNo', JSON.stringify({ reason: 'Someone else already has that name' }));
			break;
		default:
			socket.emit('joinYes', JSON.stringify({ playerID: addResult, players: game.players }));
			this.#namespace.to(id).emit('joinNew', JSON.stringify({ playerID: addResult, name }));
			break;
		}
	}

	/**
	 * @param {io.Socket} socket
	 */
	#enterSetup(socket) {
		const room = this.#socketRoom.get(socket);
		const game = this.#setups.get(room ?? '');
		if (game === undefined) {
			return;
		}
		game.startSetup();
		this.#namespace.to(room).emit('setupStart');
	}

	/**
	 * @param {io.Socket} socket
	 * @param {string} info
	 */
	#setupInfo(socket, info) {
		const room = this.#socketRoom.get(socket);
		const game = this.#setups.get(room ?? '');
		if (game === undefined) {
			return;
		}
		/** @type {{roleAdd: Roles[], roleSub: Roles[], roleTime: number, talkTime: number}} */
		const {
			roleAdd, roleSub, roleTime, talkTime,
		} = JSON.parse(info);
		game.roleTime = roleTime;
		game.talkTime = talkTime;
		roleAdd.forEach((role) => game.roles.add(role));
		roleSub.forEach((role) => game.roles.delete(role));

		this.#namespace.to(room).emit('setupInfo', info);
	}

	/**
	 * @param {io.Socket} socket
	 */
	#completeSetup(socket) {
		const room = this.#socketRoom.get(socket);
		const game = this.#setups.get(room ?? '');
		if (game === undefined || room === undefined) {
			return;
		}
		if (game.roles.size - CENTER_SIZE !== game.players.length) {
			return;
		}

		const communicator = new Communicator(game.playerToSocket, this.#namespace.to(room).emit);
		const newGame = new OnuwGame(
			Array.from(game.roles).map((roleID) => constructRole(roleID)),
			game.players,
			game.roleTime,
			game.talkTime,
			communicator,
		);
		this.#games.set(room, newGame);
		this.#setups.delete(room);

		const allInfo = {
			roles: Array.from(game.roles),
			roleTime: game.roleTime,
			talkTime: game.talkTime,
			names: game.players,
		};
		this.#namespace.to(room).emit('setupFinal', JSON.stringify(allInfo));

		for (let playerID = 0; playerID < newGame.state.numPlayers; playerID++) {
			const r = { role: newGame.state.getPlayer(playerID).startingRole.role };
			newGame.comm.sendToPlayer(playerID, 'setupRole', JSON.stringify(r));
		}

		// Kick off the game :D
		setTimeout(() => {
			newGame.play();
		}, 1000);
	}

	/**
	 * @param {io.Socket} socket
	 * @param {string} info
	 */
	#selectionMade(socket, info) {
		const room = this.#socketRoom.get(socket);
		const game = this.#games.get(room ?? '');
		if (game === undefined) {
			return;
		}
		/** @type {{nonce: number, id: number[]}} */
		const { nonce, id } = JSON.parse(info);
		game.comm.processPlayerResponse(nonce, id);
	}

	/**
	 * @param {io.Socket} socket
	 * @param {string} info
	 */
	#voteReceived(socket, info) {
		const room = this.#socketRoom.get(socket);
		const game = this.#games.get(room ?? '');
		if (game === undefined) {
			return;
		}
		/** @type {{id: number}} */
		const { id } = JSON.parse(info);
		game.comm.processPlayerVote(game.comm.socketToPlayer.get(socket) ?? NaN, id);
	}
}
