import * as PIXI from 'pixi.js';

import { allUnits } from '../units';
import { app, containerSpells, containerUI } from '../PixiUtils';
import { MAP_WIDTH, MAP_HEIGHT } from '../config';
import { containerPlanningView } from '../PixiUtils';
import { Coords, Faction, UnitSubType, UnitType } from '../commonTypes';
import { turn_phase } from '../Underworld';
import * as CardUI from '../CardUI';
import * as config from '../config';
import * as Unit from '../Unit';
import { targetBlue } from './colors';

let planningViewGraphics: PIXI.Graphics;
let dryRunGraphics: PIXI.Graphics;
export function initPlanningView() {
  planningViewGraphics = new PIXI.Graphics();
  containerPlanningView.addChild(planningViewGraphics);
  dryRunGraphics = new PIXI.Graphics();
  containerUI.addChild(dryRunGraphics);
}
export function updatePlanningView() {
  planningViewGraphics.clear();
  // TODO: Restore planning view for "free movement" refactor
  // for each unit...
  // const unit = window.underworld.getUnitAt(hoverCell);
  // if (unit) {
  // if (
  //   unit.alive &&
  //   unit.unitType === UnitType.AI &&
  //   unit.faction === Faction.ENEMY
  // ) {
  //   if (allUnits[unit.unitSourceId].canInteractWithTarget?.(unit, x, y)) {
  //     const color = Unit.getPlanningViewColor(unit);
  //     // planningViewGraphics.lineStyle(8, color, 0.9);
  //     planningViewGraphics.beginFill(color);
  //     planningViewGraphics.drawCircle(
  //       unit.x,
  //       unit.y,
  //       unit.moveDistance
  //     );
  //     planningViewGraphics.endFill();
  //   }
  // }
  // }
  // For the player, draw their move distance 
  const color = Unit.getPlanningViewColor(window.player.unit);
  planningViewGraphics.lineStyle(2, color, 1);
  planningViewGraphics.beginFill(0x000000, 0);
  planningViewGraphics.drawCircle(
    window.player.unit.x,
    window.player.unit.y,
    window.player.unit.moveDistance
  );
  planningViewGraphics.endFill();
}

export async function syncSpellEffectProjection() {
  if (window.animatingSpells) {
    // Do not change the hover icons when spells are animating
    return;
  }
  const mousePos = window.underworld.getMousePos();
  // Clear the spelleffectprojection in preparation for showing the current ones
  clearSpellEffectProjection();
  if (isOutOfBounds(mousePos)) {
    // Mouse is out of bounds, do not show a hover icon
    return;
  }
  // only show hover target when it's the correct turn phase
  if (window.underworld.turn_phase == turn_phase.PlayerTurns) {

    if (!CardUI.areAnyCardsSelected()) {
      // Do not render if there are no cards selected meaning there is no spell
      return;
    }
    const currentPlayer = window.underworld.players.find(
      (p) => p.clientId === window.clientId,
    );
    if (currentPlayer) {
      // TODO if implement mana...
      // if (!Player.isTargetInRange(currentPlayer, mousePos)) {
      //   // Draw deny icon to show the player they are out of range
      //   Image.create(mousePos.x, mousePos.y, 'deny.png', containerSpells);
      // } else {
      // Dry run cast so the user can see what effect it's going to have
      // getUnitAt corrects to the nearest Unit if there is one, otherwise
      // allow casting right on the mouseTarget
      const target = window.underworld.getUnitAt(mousePos) || mousePos;
      await window.underworld.castCards(
        currentPlayer,
        CardUI.getSelectedCards(),
        target,
        true,
      );
      // }
    }
  }
}

// SpellEffectProjection are images to denote some information, such as the spell or action about to be cast/taken when clicked
export function clearSpellEffectProjection() {
  if (!window.animatingSpells) {
    dryRunGraphics.clear();
    containerSpells.removeChildren();
  }
}

export function drawSwapLine(one: Coords, two: Coords) {
  if (one && two) {
    dryRunGraphics.beginFill(0xffff0b, 0.5);
    dryRunGraphics.lineStyle(3, 0x33ff00);
    dryRunGraphics.moveTo(one.x, one.y);
    dryRunGraphics.lineTo(two.x, two.y);
    dryRunGraphics.drawCircle(two.x, two.y, 10);
    dryRunGraphics.endFill();
  }
}
export function drawDryRunLine(start: Coords, end: Coords) {
  dryRunGraphics.beginFill(0xffff0b, 0.5);
  dryRunGraphics.lineStyle(3, 0x33ff00);
  dryRunGraphics.moveTo(start.x, start.y);
  dryRunGraphics.lineTo(end.x, end.y);
  dryRunGraphics.endFill();
}
export function drawDryRunCircle(target: Coords, radius: number) {
  dryRunGraphics.lineStyle(3, targetBlue, 0.5);
  dryRunGraphics.beginFill(0x000000, 0);
  dryRunGraphics.drawCircle(target.x, target.y, radius);
  dryRunGraphics.endFill();
}

export function isOutOfBounds(target: Coords) {
  return (
    target.x < 0 || target.x >= config.MAP_WIDTH || target.y < 0 || target.y >= config.MAP_HEIGHT
  );
}

const elInspectorTooltip = document.getElementById('inspector-tooltip');
const elInspectorTooltipContainer = document.getElementById(
  'inspector-tooltip-container',
);
const elInspectorTooltipContent = document.getElementById(
  'inspector-tooltip-content',
);
export function updateTooltip() {
  if (
    !(
      elInspectorTooltipContent &&
      elInspectorTooltip &&
      elInspectorTooltipContainer
    )
  ) {
    return;
  }
  const mousePos = window.underworld.getMousePos();
  // Update position of HTML element
  elInspectorTooltip.style.transform = `translate(${app.stage.x + mousePos.x
    }px, ${app.stage.y + mousePos.y}px)`;
  elInspectorTooltipContainer.classList.remove('top');
  elInspectorTooltipContainer.classList.remove('bottom');
  elInspectorTooltipContainer.classList.remove('left');
  elInspectorTooltipContainer.classList.remove('right');
  elInspectorTooltipContainer.classList.add(
    mousePos.y > MAP_HEIGHT / 2 ? 'bottom' : 'top',
  );
  elInspectorTooltipContainer.classList.add(
    mousePos.x > MAP_WIDTH / 2 ? 'right' : 'left',
  );

  // Update information in content
  // show info on unit, pickup, etc clicked
  let text = '';
  // Find unit:
  const unit = window.underworld.getUnitAt(mousePos);
  if (unit) {
    let cards = '';
    if (unit.unitType === UnitType.PLAYER_CONTROLLED) {
      const player = window.underworld.players.find((p) => p.unit === unit);
      if (player) {
        cards =
          'Cards: \n' +
          Object.entries(
            [...player.cards, ...player.cardsSelected].reduce<{
              [card: string]: number;
            }>((acc, card) => {
              if (!acc[card]) {
                acc[card] = 0;
              }
              acc[card]++;
              return acc;
            }, {}),
          )
            .map(([card, amount]) => `${amount} ${card}`)
            .join('\n');
      } else {
        console.error(
          'Could not find player corresponding to player controlled unit',
        );
      }
    }
    text += `\
Unit
${allUnits[unit.unitSourceId].info.description}
Type ${UnitType[unit.unitType]}
SubType ${UnitSubType[unit.unitSubType]}
Faction ${Faction[unit.faction]}
Health ${unit.health}/${unit.healthMax}
Modifiers ${JSON.stringify(unit.modifiers, null, 2)}
${cards}
        `;
  }
  const pickup = window.underworld.getPickupAt(mousePos);
  if (pickup) {
    text += `\
Pickup
${pickup.name}
${pickup.description}
        `;
  }
  const obstacle = window.underworld.getObstacleAt(mousePos);
  if (obstacle) {
    text += `\
${obstacle.name}
${obstacle.description}
        `;
  }
  // Only show tooltip if it has contents
  if (!text) {
    elInspectorTooltip.style.visibility = 'hidden';
  } else {
    elInspectorTooltip.style.visibility = 'visible';
  }
  elInspectorTooltipContent.innerText = text;
}
