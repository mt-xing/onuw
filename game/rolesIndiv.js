import Role, { Roles } from './role.js';
import { assertUnreachable } from './utils.js';
import {
	ApprenticeSeerWake, DrunkWake, InsomniacWake, MasonWake, MinionWake, MysticWolfWake,
	ParanormalInvestigatorWake,
	RevealerWake, RobberWake, SeerWake, SentinelWake, TroublemakerWake, VillageIdiotWake,
	WerewolfWake, WitchWake,
} from './wakesIndiv.js';

// #region Werewolves

export class Werewolf extends Role {
	constructor() {
		super(
			Roles.WEREWOLF,
			'The bad guy',
			'You will see who else started as a werewolf. Work together to fool the villagers.',
			[WerewolfWake],
		);
	}
}

export class MysticWolf extends Role {
	constructor() {
		super(
			Roles.MYSTIC_WOLF,
			'The transcendent bad guy',
			'You will see the other werewolves. You may also look at another player\'s card to help you fool the villagers.',
			[WerewolfWake, MysticWolfWake],
		);
	}
}

export class DreamWolf extends Role {
	constructor() {
		super(
			Roles.DREAM_WOLF,
			'The sleepy bad guy',
			'You did not wake up in time for the werewolf roll call. You do not know the other werewolves (but they know you).',
			null,
		);
	}
}

export class Minion extends Role {
	constructor() {
		super(
			Roles.MINION,
			'You\'re a huge werewolf stan',
			'You will see the other werewolves. You need to protect them, even if it costs you your life.',
			[MinionWake],
		);
	}
}
// #endregion

// #region Villagers
export class Sentinel extends Role {
	constructor() {
		super(
			Roles.SENTINEL,
			'Protector',
			'You may choose one other player to guard. That player\'s role will no longer be touched (may not be swapped, changed, and even the player themselves may not look at it)',
			[SentinelWake],
		);
	}
}

export class Mason extends Role {
	constructor() {
		super(
			Roles.MASON,
			'Twins',
			'There are exactly two masons. You will get to see each other. If you do not see the other mason, the other mason started in the center.',
			[MasonWake],
		);
	}
}

export class Seer extends Role {
	constructor() {
		super(
			Roles.SEER,
			'Transcendent, or just a cheater',
			'You may choose to either view two roles from the center or one other player\'s role.',
			[SeerWake],
		);
	}
}

export class ApprenticeSeer extends Role {
	constructor() {
		super(
			Roles.APPRENTICE_SEER,
			'Transcendent, but only kinda',
			'You may view one role from the center.',
			[ApprenticeSeerWake],
		);
	}
}

export class ParanormalInvestigator extends Role {
	constructor() {
		super(
			Roles.PARANORMAL_INVESTIGATOR,
			'Something about curiosity and cats?',
			'You may look at the roles of up to two other players. If you see a werewolf or tanner, you become one.',
			[ParanormalInvestigatorWake],
		);
	}
}

export class Robber extends Role {
	constructor() {
		super(
			Roles.ROBBER,
			'Stealer of roles',
			'You may steal (and view) one other player\'s role, taking on their role and giving them yours',
			[RobberWake],
		);
	}
}

export class Witch extends Role {
	constructor() {
		super(
			Roles.WITCH,
			'Does some magic or something, idk',
			'You may view one role from the center. If you do, you must swap it with any player of your choice.',
			[WitchWake],
		);
	}
}

export class Troublemaker extends Role {
	constructor() {
		super(
			Roles.TROUBLEMAKER,
			'Screws with people',
			'You may exchange the roles of two other players.',
			[TroublemakerWake],
		);
	}
}

export class VillageIdiot extends Role {
	constructor() {
		super(
			Roles.VILLAGE_IDIOT,
			'Big dumb',
			'You may cycle the roles of ALL other players either clockwise or counterclockwise',
			[VillageIdiotWake],
		);
	}
}

export class Drunk extends Role {
	constructor() {
		super(
			Roles.DRUNK,
			'You have no idea what you\'re doing',
			'You must pick a role from the center to exchange with your own. You do not get to see your new role.',
			[DrunkWake],
		);
	}
}

export class Insomniac extends Role {
	constructor() {
		super(
			Roles.INSOMNIAC,
			'You can\'t fall asleep. Don\'t we all?',
			'You get to wake up in the night and see your own role.',
			[InsomniacWake],
		);
	}
}

export class Revealer extends Role {
	constructor() {
		super(
			Roles.REVEALER,
			'Never learned how to keep your hands to yourself',
			'You may reveal one other player\'s role. If it\'s on the villager team, it will also be revealed to all other players.',
			[RevealerWake],
		);
	}
}

export class Hunter extends Role {
	constructor() {
		super(
			Roles.HUNTER,
			'Bringing others down with you',
			'If you die, the person you voted for dies too. You do not wake up during the night.',
			null,
		);
	}
}

export class Villager extends Role {
	constructor() {
		super(
			Roles.VILLAGER,
			'Just a villager',
			'You don\'t do anything. This role sucks. Tell the game host to stop picking this role.',
			null,
		);
	}
}
// #endregion

export class Tanner extends Role {
	constructor() {
		super(
			Roles.TANNER,
			'2meirl4meirl',
			'You want to die. You win if and only if you are killed. You do not wake up during the night.',
			null,
		);
	}
}
/**
 * Factory to construct a role object from a role ID
 * @param {Roles} role Role ID
 * @returns {Role}
 */
export function constructRole(role) {
	switch (role) {
	case Roles.WEREWOLF:
		return new Werewolf();
	case Roles.MYSTIC_WOLF:
		return new MysticWolf();
	case Roles.DREAM_WOLF:
		return new DreamWolf();
	case Roles.MINION:
		return new Minion();
	case Roles.SENTINEL:
		return new Sentinel();
	case Roles.MASON:
		return new Mason();
	case Roles.SEER:
		return new Seer();
	case Roles.APPRENTICE_SEER:
		return new ApprenticeSeer();
	case Roles.PARANORMAL_INVESTIGATOR:
		return new ParanormalInvestigator();
	case Roles.ROBBER:
		return new Robber();
	case Roles.WITCH:
		return new Witch();
	case Roles.TROUBLEMAKER:
		return new Troublemaker();
	case Roles.VILLAGE_IDIOT:
		return new VillageIdiot();
	case Roles.DRUNK:
		return new Drunk();
	case Roles.INSOMNIAC:
		return new Insomniac();
	case Roles.REVEALER:
		return new Revealer();
	case Roles.HUNTER:
		return new Hunter();
	case Roles.VILLAGER:
		return new Villager();
	case Roles.TANNER:
		return new Tanner();
	default:
		return assertUnreachable(role);
	}
}
