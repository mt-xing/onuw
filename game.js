import Role from './role';
import State from './state';

export default class OnuwGame {
	/**
	 * @type {State}
	 */
	state;

	/**
	 * @param {Role[]} roles
	 * @param {string[]} names
	 */
	constructor(roles, names) {
		this.state = new State(roles, names);
	}

	/**
	 * Async factory method
	 * @param {() => Promise<string[]>} getNames
	 * @param {() => Promise<Role[]>} getRoles
	 * @returns {Promise<OnuwGame>}
	 */
	static async newGame(getNames, getRoles) {
		const names = await getNames();
		const roles = await getRoles();
		return new OnuwGame(roles, names);
	}
}
