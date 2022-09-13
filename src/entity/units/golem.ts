import type { UnitSource } from './index';
import { UnitSubType } from '../../types/commonTypes';
import { action } from './actions/golemAction';
import * as config from '../../config'

const unit: UnitSource = {
  id: 'Golem',
  info: {
    description: 'A simple but persistant creature that will pursue its enemies and attack them if within arm\'s reach.',
    image: 'units/gruntIdle',
    subtype: UnitSubType.MELEE,
  },
  unitProps: {
    staminaMax: config.UNIT_BASE_STAMINA,
    attackRange: 10 + config.COLLISION_MESH_RADIUS * 2,
    manaMax: 0,
    healthMax: 2,
    damage: 3,
  },
  spawnParams: {
    probability: 100,
    unavailableUntilLevelIndex: 0,
  },
  animations: {
    idle: 'units/gruntIdle',
    hit: 'units/gruntHit',
    attack: 'units/gruntAttack',
    die: 'units/gruntDeath',
    walk: 'units/gruntWalk',
  },
  sfx: {
    death: 'golemDeath'
  },
  action,
};

export default unit;