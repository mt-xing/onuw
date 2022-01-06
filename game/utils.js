// @ts-check

/**
 * Shuffle an array.
 *
 * Makes a shallow copy
 * @param {any[]} a
 */
export function shuffle(a) {
	const arr = a.slice();
	let m = arr.length;
	while (m) {
		const i = Math.floor(Math.random() * m);
		m--;
		const t = arr[m];
		arr[m] = arr[i];
		arr[i] = t;
	}
	return arr;
}

/**
 * Turn an array into a string list, with proper commas
 * @param {any[]} lst List of objects
 * @returns {string}
 */
export function makeList(lst) {
	if (lst.length === 0) {
		return '';
	}
	if (lst.length === 2) {
		return `${lst[0]} and ${lst[1]}`;
	}
	return lst.reduce((a, x, i) => {
		if (i === 0) {
			return x;
		}
		if (i === lst.length - 1) {
			return `${a}, and ${x}`;
		}
		return `${a}, ${x}`;
	});
}

/**
 * @param {string} str
 * @returns {string}
 */
export function toTitleCase(str) {
	return str.replace(
		/\w\S*/g,
		(word) => word.charAt(0).toUpperCase() + word.substring(1).toLowerCase(),
	);
}

/**
 * Assert a code path is unreachable
 * @param {never} never Something that should never have a value
 * @returns {never}
 */
export function assertUnreachable(never) {
	throw new Error(`This should be unreachable, but got ${never}`);
}

/**
 * Convert seconds to a time string
 * @param {number} sec Seconds
 * @returns {string}
 */
export function secondsToTime(sec) {
	const min = Math.floor(sec / 60);
	const s = sec % 60;
	/**
	 * @param {number} p
	 * @returns {string}
	 */
	const padToTwo = (p) => {
		if (p >= 10) { return `${p}`; }
		if (p > 0) { return `0${p}`; }
		if (p === 0) { return '00'; }
		throw new Error(`Invalid time ${p}`);
	};
	return `${padToTwo(min)}:${padToTwo(s)}`;
}
