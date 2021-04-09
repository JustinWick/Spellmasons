import { removeModifier } from '../Unit';
import type { Spell } from '.';
const id = 'purify';
// Removes all modifiers (buffs and curses)
const spell: Spell = {
  card: {
    id,
    thumbnail: 'images/spell/purify.png',
    probability: 10,
    effect: (state, dryRun) => {
      if (dryRun) {
        return state;
      }
      for (let target of state.targets) {
        const unit = window.game.getUnitAt(target.x, target.y);
        if (unit) {
          for (let modifier of Object.keys(unit.modifiers)) {
            removeModifier(unit, modifier);
          }
        }
      }
      return state;
    },
  },
};
export default spell;
