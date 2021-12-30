//@ts-check
import Role from './role';
import { shuffle } from './utils';

const CENTER_SIZE = 3;

/**
 * State of the game
 */
export default class State {

    /**
     * @type {Role[]}
     */
    #centerRoles;

    /**
     * @type {Role[]}
     */
    #playerRoles;

    /**
     * @type {string[]}
     */
    #playerNames;

    /**
     * @param {Role[]} roles 
     */
    constructor(roles, names) {
        if (roles.length !== names.length + CENTER_SIZE) {
            throw new Error('Invalid number of roles selected');
        }
        const r = shuffle(roles);
        this.#centerRoles = r.slice(0, CENTER_SIZE);
        this.#playerRoles = r.slice(CENTER_SIZE);
        this.#playerNames = r.slice();
    }

    /**
     * Swap the roles of two players
     * @param {number} a 
     * @param {number} b 
     */
    swap(a, b) {
        const t = this.#playerRoles[a];
        this.#playerRoles[a] = this.#playerRoles[b];
        this.#playerRoles[b] = t;
    }

    /**
     * Swap the role of a player with the center
     * @param {number} player 
     * @param {number} center Center ID, [0, 2]
     */
    swapCenter(player, center) {
        const t = this.#playerRoles[player];
        this.#playerRoles[player] = this.#centerRoles[center];
        this.#centerRoles[center] = t;
    }

    getPlayer(id) {
        return this.#playerRoles[id];
    }

    getCenter(id) {
        return this.#centerRoles[id];
    }

    getName(id) {
        return this.#playerNames[id];
    }

}
