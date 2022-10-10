import { Spell } from './index';
import * as Unit from '../entity/Unit'
import { CardCategory, UnitType } from '../types/commonTypes';

const id = 'protection';
const spell: Spell = {
  card: {
    id,
    category: CardCategory.Blessings,
    manaCost: 20,
    healthCost: 0,
    expenseScaling: 1,
    probability: 10,
    thumbnail: 'unknown.png',
    description: 'Protects yourself and allies from being effected by the spell you are about to cast.  Will protect 1 allied unit (including self) per use.  Prioritizes protecting yourself, then ally wizards, then other allies.  Multiple stacks of this spell will protect multiple people.  This spell must be cast AFTER an ally is targeted by a previous spell.',
    effect: async (state, card, quantity, underworld, prediction) => {
      const allies = [
        // Prioritize self over all other allies
        state.casterUnit,
        ...Unit.livingUnitsInSameFaction(state.casterUnit, underworld)
          .sort((a, b) => {
            // Prioritize PLAYER_CONTROLLED allies over AI controlled allies
            return a.unitType == UnitType.PLAYER_CONTROLLED && b.unitType == UnitType.PLAYER_CONTROLLED ? 0 :
              a.unitType == UnitType.PLAYER_CONTROLLED ? -1 : 1
          })];
      let excludeTarget: Unit.IUnit;
      // For all the allies, find the first ally that matches a target
      allyLoop: {
        for (let ally of allies) {
          for (let unit of state.targetedUnits) {
            if (unit == ally) {
              excludeTarget = unit;
              // Only remove 1 target per use of this card
              break allyLoop;
            }
          }
        }
      }
      // Remove target
      state.targetedUnits = state.targetedUnits.filter(u => u !== excludeTarget);

      return state;
    },
  },
};
export default spell;
