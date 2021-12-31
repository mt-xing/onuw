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
