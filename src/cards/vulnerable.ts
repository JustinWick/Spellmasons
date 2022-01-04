import type * as Unit from '../Unit';
import * as Image from '../Image';
import type { Spell } from '.';
import { MANA_BASE_COST, MANA_MULTIPLIER_NONE } from '../config';

const id = 'vulnerable';
const spell: Spell = {
  card: {
    id,
    thumbnail: 'vulnerable.png',
    probability: 5,
    description: `
Makes the target(s) take double damage whenever they receive damage
in the future.
    `,
    manaCost: MANA_BASE_COST * 10,
    manaMultiplier: MANA_MULTIPLIER_NONE,
    effect: async (state, dryRun) => {
      if (dryRun) {
        return state;
      }
      for (let target of state.targets) {
        const unit = window.underworld.getUnitAt(target);
        if (unit) {
          addTo(unit);
        }
      }
      return state;
    },
  },
  events: {
    onDamage: (unit, amount, damageDealer) => {
      // Magnify positive damage
      if (amount > 0) {
        return amount * 2;
      } else {
        return amount;
      }
    },
  },
  subsprites: {
    vulnerable: {
      imageName: 'vulnerable.png',
      alpha: 1.0,
      anchor: {
        x: 0,
        y: 0,
      },
      scale: {
        x: 0.5,
        y: 0.5,
      },
    },
  },
};

function addTo(unit: Unit.IUnit) {
  // Add event
  unit.onDamageEvents.push(id);

  // Add subsprite image
  Image.addSubSprite(unit.image, id);
}
export default spell;
