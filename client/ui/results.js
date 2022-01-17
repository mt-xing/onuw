import { Roles, roleToName, Teams } from '../../game/role.js';
import { constructRole } from '../../game/rolesIndiv.js';
import { assertUnreachable, makeList } from '../../game/utils.js';
import Dom from '../dom.js';
import OnuwGame from '../game.js';

/**
 * @param {HTMLElement} el
 */
function forceDom(el) {
	if (!getComputedStyle(el).transform) {
		// eslint-disable-next-line no-console
		console.info('No transform on element');
	}
}

/**
 * @param {HTMLElement} el
 * @param {number} num
 */
function countUp(el, num) {
	if (num <= 0) { return; }
	let numLeft = num;
	const interval = 800 / num;

	const count = () => {
		numLeft--;
		// eslint-disable-next-line no-param-reassign
		el.textContent = `${(num - numLeft)}`;
		if (numLeft > 0) {
			setTimeout(count, interval);
		}
	};
	count();
}

/**
 * @param {HTMLElement} outerDom
 * @param {number[]} votes
 * @param {Roles[]} playerRoles
 * @param {Teams[]} winTeam
 * @param {OnuwGame} game
 * @param {() => void} [restart]
 */
export default function showResults(outerDom, votes, playerRoles, winTeam, game, restart) {
	const yourRole = constructRole(playerRoles[game.playerID]);

	const dom = document.createElement('main');
	dom.classList.add('results');
	outerDom.appendChild(dom);

	// Game Summary
	const h1 = document.createElement('h1');
	h1.textContent = 'Game Summary';
	dom.appendChild(Dom.section(h1));

	// Final Role
	const finalRoleWrap = Dom.section(Dom.h2('Your Final Role'), 'finalRole');
	const finalRole = Dom.p(yourRole.roleName, 'hidden');
	finalRoleWrap.appendChild(finalRole);

	// Vote Count
	const voteWrap = Dom.section(Dom.h2('Vote Count'));
	const table = document.createElement('table');
	voteWrap.appendChild(table);
	const voteTotals = Array(votes.length).fill(0);
	votes.forEach((v) => voteTotals[v]++);
	const playerIDs = votes.map((_, i) => i);
	/** @type {[HTMLTableCellElement, HTMLParagraphElement, HTMLTableCellElement][]} */
	// eslint-disable-next-line camelcase
	const voteCounts0_votedForBy1_finalRoles2 = voteTotals.map((votesFor, pid) => {
		const tr = document.createElement('tr');

		const voteCount = document.createElement('td');
		voteCount.textContent = '0';
		tr.appendChild(voteCount);

		const nameBox = document.createElement('td');
		nameBox.appendChild(Dom.p(game.getPlayerName(pid)));
		const voted = playerIDs.filter((p) => votes[p] === pid).map((p) => game.getPlayerName(p));
		const vfb = Dom.p(`Voted for by: ${voted.length === 0 ? 'Nobody' : makeList(voted)}`);
		nameBox.appendChild(vfb);
		tr.appendChild(nameBox);

		const finalR = document.createElement('td');
		finalR.textContent = roleToName[playerRoles[pid]];
		finalR.classList.add('hidden');
		tr.appendChild(finalR);

		table.appendChild(tr);
		return [voteCount, vfb, finalR];
	});

	// Win Teams
	const winningTeamsWrap = Dom.section(Dom.h2('Winning Team(s)'), 'winTeams');
	const winningTeams = winTeam.length === 0
		? [Dom.p('No one. Y\'all suck.', 'hidden')]
		: winTeam.map((t) => {
			switch (t) {
			case Teams.WEREWOLF:
				return Dom.p('Werewolves', 'hidden');
			case Teams.VILLAGER:
				return Dom.p('Villagers', 'hidden');
			case Teams.TANNER:
				return Dom.p('Tanner', 'hidden');
			default:
				return assertUnreachable(t);
			}
		});
	winningTeams.forEach((wt) => winningTeamsWrap.appendChild(wt));

	// Verdict
	const verdict = Dom.section(Dom.h2(
		winTeam.some((w) => yourRole.winTeam === w) ? 'You Win 👍' : 'You Lose 👎',
	), 'verdict');

	/**
	 * @param {HTMLElement} section
	 * @param {number} delay
	 */
	const showSection = (section, delay) => setTimeout(() => {
		dom.appendChild(section);
		forceDom(section);
		// eslint-disable-next-line no-param-reassign
		section.style.transform = 'scale(1)';
		dom.scrollTop = section.offsetTop - 20;
	}, delay);
	// Animations:
	// 1) Dom
	// 2) Final role wrap
	// 3) Final role
	// 4) Vote wrap
	// 5) Vote counts
	// 6) Voted for by
	// 7) Final roles
	// 8) Winning teams wrap
	// 9) Winning teams
	// 10) Verdict
	forceDom(dom);
	dom.style.transform = 'translateX(0)';
	showSection(finalRoleWrap, 1000);
	forceDom(finalRole);
	setTimeout(() => { finalRole.classList.add('shown'); }, 2000);
	showSection(voteWrap, 3000);
	setTimeout(() => {
		// eslint-disable-next-line camelcase
		voteCounts0_votedForBy1_finalRoles2.forEach(([vc, _, _a], pid) => {
			countUp(vc, voteTotals[pid]);
		});
	}, 4000);
	setTimeout(() => {
		// eslint-disable-next-line camelcase
		voteCounts0_votedForBy1_finalRoles2.forEach(([_, vfb, _a]) => {
			// eslint-disable-next-line no-param-reassign
			forceDom(vfb); vfb.style.maxHeight = '200px';
		});
	}, 5000);
	setTimeout(() => {
		// eslint-disable-next-line camelcase
		voteCounts0_votedForBy1_finalRoles2.forEach(([_, _a, fr]) => { forceDom(fr); fr.classList.add('shown'); });
	}, 6000);
	showSection(winningTeamsWrap, 7000);
	setTimeout(() => {
		winningTeams.forEach((wt) => { forceDom(wt); wt.classList.add('shown'); });
	}, 8000);
	showSection(verdict, 9000);

	if (game.playerID === 0 && restart !== undefined) {
		// Add restart button
		const w = Dom.section(Dom.button('Play Again?', restart));
		showSection(w, 10000);
	}
}
