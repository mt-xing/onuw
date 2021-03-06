import Socket from '../socket.js';
import OnuwGame from '../game.js';
import { Roles, roleToName, Teams } from '../../game/role.js';
import Dom from '../dom.js';
import { constructRole } from '../../game/rolesIndiv.js';
import { CENTER_SIZE } from '../../game/state.js';
import { assertUnreachable, makeList, secondsToTime } from '../../game/utils.js';
import Choice from './gameplay/choices.js';
import NightStatus from './gameplay/nightStatus.js';
import MessageLog from './gameplay/messageLog.js';
import BoardStatus from './gameplay/boardStatus.js';
import Timer from './gameplay/timer.js';
import KillVote from './killVote.js';
import showResults from './results.js';

export default class Gameplay {
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
	#outerDom;

	/**
	  * @type {HTMLElement}
	  */
	#dom;

	/** @type {BoardStatus} */
	#boardStatus;

	/** @type {NightStatus} */
	#nightStatus;

	/** @type {MessageLog} */
	#messageLog;

	/** @type {Timer | undefined} */
	#talkTimer;

	/** @type {KillVote | undefined} */
	#killVote;

	/**
	 * @type {Map<number, Choice>}
	 */
	#playerChoices;

	/**
	 * @param {Socket} socket
	 * @param {OnuwGame} game
	 * @param {HTMLElement} gameDom
	 */
	constructor(socket, game, gameDom) {
		Gameplay.#instance = this;

		this.#outerDom = gameDom;
		this.#dom = document.createElement('div');
		this.#outerDom.appendChild(this.#dom);
		this.#dom.classList.add('gameWrap');
		this.#socket = socket;
		this.#game = game;
		this.#playerChoices = new Map();

		if (!getComputedStyle(this.#dom).transform) {
			// eslint-disable-next-line no-console
			console.info('No transform on game dom');
		}
		this.#dom.style.transform = 'scale(1)';
		this.#dom.style.opacity = '1';

		this.#messageLog = new MessageLog(this.#dom);
		this.#boardStatus = new BoardStatus(this.#dom, game.playerNames);
		this.#nightStatus = new NightStatus(this.#dom, game.allRoles, game.roleTime);

		{
			const role = constructRole(this.#game.startingRole);
			this.#messageLog.msg('This is the role you start with:');

			const h2 = document.createElement('h2');
			h2.textContent = role.roleName;
			const div = document.createElement('div');
			div.appendChild(h2);
			div.appendChild(Dom.p(role.description));
			this.#messageLog.msg(div);

			this.#messageLog.msg(role.instructions);
			this.#messageLog.msg('This is the role you will act as at night. You might not end the night as the same role.');

			setTimeout(
				() => {
					this.#messageLog.msg('Good night, all. And good luck.');
					this.#messageLog.sleep();
					this.#boardStatus.hideBoard();
					this.#nightStatus.sleep();
				},
				8000,
			);
		}

		['roleStart', 'msg', 'pickCenters', 'pickChoices', 'pickPlayers', 'timeout', 'wake', 'sleep'].forEach(this.#socket.off.bind(this.#socket));
		this.#socket.on('roleStart', this.#roleStart.bind(this));
		this.#socket.on('msg', this.#msg.bind(this));
		this.#socket.on('pickCenters', this.#pickCenters.bind(this));
		this.#socket.on('pickChoices', this.#pickChoices.bind(this));
		this.#socket.on('pickPlayers', this.#pickPlayers.bind(this));
		this.#socket.on('timeout', this.#timeout.bind(this));
		this.#socket.on('wake', this.#wake.bind(this));
		this.#socket.on('sleep', this.#sleep.bind(this));

		['day', 'time', 'voteReady', 'voteStart', 'voteReceived', 'result'].forEach(this.#socket.off.bind(this.#socket));
		this.#socket.on('day', this.#endOfNight.bind(this));
		this.#socket.on('time', this.#timeSync.bind(this));
		this.#socket.on('voteReady', this.#voteReady.bind(this));
		this.#socket.on('voteStart', this.#voteStart.bind(this));
		this.#socket.on('voteReceived', this.#voteReceived.bind(this));
		this.#socket.on('result', this.#showResults.bind(this));
	}

	/**
	 * @param {string} raw
	 */
	#roleStart(raw) {
		/** @type {{role: string}} */
		const { role } = JSON.parse(raw);
		this.#nightStatus.startRole(role);
	}

	/**
	 * @param {string} raw
	 */
	#msg(raw) {
		/** @type {{msg: string}} */
		const { msg } = JSON.parse(raw);
		this.#messageLog.msg(msg);
	}

	/**
	 * @param {string} raw
	 */
	#pickCenters(raw) {
		/** @type {{nonce: number, num: number}} */
		const { nonce, num } = JSON.parse(raw);
		const heading = `Please select ${num} ${num === 1 ? 'role' : 'roles'} from the center:`;
		/** @type {[string, string | null][]} */
		const choices = Array.from(Array(CENTER_SIZE).keys())
			.map((center) => [`${center}`, null]);
		this.#promptForSomething(nonce, choices, num, heading);
	}

	/**
	 * @param {string} raw
	 */
	#pickChoices(raw) {
		/** @type {{nonce: number, choices: string[]}} */
		const { nonce, choices } = JSON.parse(raw);
		const heading = 'Please select an option:';
		/** @type {[string, string | null][]} */
		const cc = choices.map((choice) => [`${choice}`, null]);
		this.#promptForSomething(nonce, cc, 1, heading);
	}

	/**
	 * @param {string} raw
	 */
	#pickPlayers(raw) {
		/** @type {{nonce: number, num: number, banned: Record<number, string>}} */
		const { nonce, num, banned } = JSON.parse(raw);

		const heading = `Please select ${num} ${num === 1 ? 'player' : 'players'}:`;
		/** @type {[string, string | null][]} */
		const choices = Array.from(Array(this.#game.numPlayers).keys())
			.map((playerID) => [
				`${this.#game.getPlayerName(playerID)}`,
				banned[playerID] === undefined ? null : banned[playerID],
			]);
		this.#promptForSomething(nonce, choices, num, heading);
	}

	/**
	 * @param {number} nonce
	 * @param {[string, string | null][]} choices Choice text and enabled
	 * @param {number} num
	 * @param {string} heading
	 */
	#promptForSomething(nonce, choices, num, heading) {
		const c = new Choice(this.#socket, this.#messageLog, nonce, choices, num, heading);
		this.#playerChoices.set(nonce, c);
	}

	/**
	 * @param {string} raw
	 */
	#timeout(raw) {
		/** @type {{nonce: number}} */
		const { nonce } = JSON.parse(raw);

		const c = this.#playerChoices.get(nonce);
		if (c === undefined) {
			// eslint-disable-next-line no-console
			console.error(`Received invalid timeout with nonce ${nonce}`);
			return;
		}

		c.timeout();
	}

	/**
	 * @param {string} raw
	 */
	#wake(raw) {
		/** @type {{boardInfo: Record<number, string>}} */
		const { boardInfo } = JSON.parse(raw);
		this.#messageLog.msg('Wake up.');
		this.#boardStatus.showBoard(boardInfo);
		this.#messageLog.wake();
		this.#nightStatus.wake();
	}

	#sleep() {
		this.#messageLog.msg('Return to sleep. Good night.');
		this.#boardStatus.hideBoard();
		this.#messageLog.sleep();
		this.#nightStatus.sleep();
	}

	/**
	 * @param {string} raw
	 */
	#endOfNight(raw) {
		/** @type {{boardInfo: Record<number, string>}} */
		const { boardInfo } = JSON.parse(raw);
		this.#boardStatus.showBoard(boardInfo);
		this.#messageLog.wake();
		this.#nightStatus.wake();
		this.#messageLog.msg('Everybody, wake up.');
		this.#messageLog.msg('Good morning!');

		this.#talkTimer = new Timer(this.#game.talkTime, (timerEl) => {
			const d = document.createElement('div');
			const h2 = document.createElement('h2');
			h2.textContent = 'Time Remaining';
			d.appendChild(h2);
			d.appendChild(timerEl);
			this.#messageLog.msg(d);
		});

		this.#messageLog.msg(Dom.button('I\'m ready to vote', (ev) => {
			this.#socket.emit('voteReady', '');
			// @ts-ignore
			// eslint-disable-next-line no-param-reassign
			ev.currentTarget.disabled = true;
		}, 'readyVoteBtn'));
	}

	/**
	 * @param {string} raw
	 */
	#timeSync(raw) {
		/** @type {{time: number}} */
		const { time } = JSON.parse(raw);

		if (this.#talkTimer === undefined) {
			// eslint-disable-next-line no-console
			console.error('Received time sync but timer is undefined');
		} else {
			this.#talkTimer.timeSync(time);
		}
	}

	/**
	 * @param {string} raw
	 */
	#voteReady(raw) {
		/** @type {{id: number}} */
		const { id } = JSON.parse(raw);
		this.#boardStatus.voteReady(id);
	}

	#voteStart() {
		this.#dom.style.transition = 'transform 0.5s ease-in';
		this.#dom.style.transform = 'scale(0)';
		this.#dom.style.border = '1px black solid';
		setTimeout(() => { this.#dom.parentElement?.removeChild(this.#dom); }, 500);
		this.#killVote = new KillVote(this.#outerDom, this.#socket, this.#game);
	}

	/**
	 * @param {string} raw
	 */
	#voteReceived(raw) {
		/** @type {{playerID: number}} */
		const { playerID } = JSON.parse(raw);
		this.#killVote?.vote(playerID);
	}

	/**
	 * @param {string} raw
	 */
	#showResults(raw) {
		/** @type {{votes: number[], playerRoles: Roles[], winTeam: Teams[]}} */
		const { votes, playerRoles, winTeam } = JSON.parse(raw);

		if (this.#killVote !== undefined) {
			this.#killVote.animateOut();
			this.#killVote = undefined;
		}
		showResults(this.#outerDom, votes, playerRoles, winTeam, this.#game, () => {
			this.#socket.emit('restart', '');
		});
	}

	/** @type {Gameplay | undefined} */
	static #instance;

	/**
	 * Remove the game element from the board, if present
	 */
	static remove() {
		if (this.#instance !== undefined) {
			for (const el of this.#instance.#outerDom.getElementsByTagName('main')) {
				el.style.transition = 'transform 0.5s ease-in';
				el.style.transform = 'translateX(0)scale(0)';
			}

			setTimeout(() => {
				const i = this.#instance;
				if (i === undefined) { return; }
				for (const el of i.#outerDom.getElementsByTagName('main')) {
					el.parentElement?.removeChild(el);
				}
				this.#instance = undefined;
			}, 500);
		}
	}
}
