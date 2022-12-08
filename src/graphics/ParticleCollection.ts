
import * as particles from '@pixi/particle-emitter'
import { rgb2hex } from '@pixi/utils';
import { easeOutCubic } from '../jmath/Easing';
import { lerp } from '../jmath/math';
import { Vec2 } from '../jmath/Vec';
import * as config from '../config';
import { createHardCircleParticleTexture, createParticleTexture, simpleEmitter } from './Particles';
import { bleedInstantKillProportion } from '../cards/bleed';
import { containerParticlesUnderUnits, containerPlanningView, containerUnits } from './PixiUtils';
import { UnitAction } from '../entity/units';
import { IUnit } from '../entity/Unit';
import Underworld from '../Underworld';
export function makeBleedParticles(position: Vec2, prediction: boolean, proportion: number, resolver?: () => void) {
    if (prediction) {
        // Don't show if just a prediction
        return
    }
    // proportion goes from 0.0 to bleedInstantKillProportion;
    // convert to 0.0 to 1.0
    proportion = lerp(0, 1, proportion / bleedInstantKillProportion);
    if (proportion == 0) {
        // Do not emit particles if proportion is 0 because then bleed did no damage
        if (resolver) {
            resolver();
        }
        return;
    }
    const texture = createParticleTexture();
    if (!texture) {
        console.error('No texture for particles')
        return
    }
    const particleConfig =
        particles.upgradeConfig({
            autoUpdate: true,
            "alpha": {
                "start": 1,
                "end": 1
            },
            "scale": {
                "start": 1.2 * Math.min(1, proportion * 2),
                "end": 0.25,
                "minimumScaleMultiplier": 1
            },
            "color": {
                "start": "#c72828",
                "end": "#870303"
            },
            "speed": {
                "start": 10,
                "end": 0,
                "minimumSpeedMultiplier": 1
            },
            "acceleration": {
                "x": 0,
                "y": 40
            },
            "maxSpeed": 0,
            "startRotation": {
                "min": 90,
                "max": 90
            },
            "noRotation": false,
            "rotationSpeed": {
                "min": 0,
                "max": 0
            },
            "lifetime": {
                "min": 1,
                "max": 1
            },
            "blendMode": "normal",
            "frequency": 0.01,
            "emitterLifetime": 1,
            "maxParticles": 100 * proportion * proportion,
            "pos": {
                "x": 0,
                "y": 0
            },
            "addAtBack": true,
            "spawnType": "circle",
            "spawnCircle": {
                "x": 0,
                "y": 0,
                "r": 10
            }
        }, [texture]);
    simpleEmitter({ x: position.x, y: position.y - config.COLLISION_MESH_RADIUS / 2 }, particleConfig, resolver);

}
export function makeResurrectParticles(position: Vec2, prediction: boolean) {
    if (prediction) {
        // Don't show if just a prediction
        return
    }
    const texture = createParticleTexture();
    if (!texture) {
        console.error('No texture for particles')
        return
    }
    const particleConfig =
        particles.upgradeConfig({
            autoUpdate: true,
            "alpha": {
                "start": 1,
                "end": 0
            },
            "scale": {
                "start": 0.25,
                "end": 0.25,
                "minimumScaleMultiplier": 1
            },
            "color": {
                "start": "#ffffff",
                "end": "#ffffff"
            },
            "speed": {
                "start": 1,
                "end": 1,
                "minimumSpeedMultiplier": 1
            },
            "acceleration": {
                "x": 0,
                "y": -400
            },
            "maxSpeed": 0,
            "startRotation": {
                "min": 90,
                "max": 90
            },
            "noRotation": false,
            "rotationSpeed": {
                "min": 0,
                "max": 0
            },
            "lifetime": {
                "min": 0.81,
                "max": 0.4
            },
            "blendMode": "normal",
            "frequency": 0.004,
            // Matches the resurrect animation duration
            "emitterLifetime": 0.7,
            "maxParticles": 500,
            "pos": {
                "x": 0,
                "y": 0
            },
            "addAtBack": false,
            "spawnType": "rect",
            "spawnRect": {
                "x": -config.COLLISION_MESH_RADIUS / 2,
                "y": 0,
                "w": config.COLLISION_MESH_RADIUS,
                "h": 20
            }

        }, [texture]);
    simpleEmitter(position, particleConfig);

}
// Max final scale should be 1
export function makeBurstParticles(position: Vec2, finalScale: number, prediction: boolean, resolver?: () => void) {
    if (prediction) {
        // Don't show if just a prediction
        if (resolver) {
            // Resolve immediately
            resolver();
        }
        return
    }
    const texture = createHardCircleParticleTexture();
    if (!texture) {
        console.error('No texture for makeScrollDissapearParticles')
        if (resolver) {
            // Resolve immediately
            resolver();
        }
        return
    }
    const rings = 10;
    const millisBetweenRings = 50;
    const lifetime = 0.5;
    for (let ring = 0; ring < rings; ring++) {
        setTimeout(() => {
            // const startColor = 0x0d3f47;
            const startColor = [0.914, 1, 1];
            // const endColor = 0xe9ffff;
            const endColor = [0.051, 0.247, 0.278];
            const lerpValue = ring / rings;
            const cubicLerpValue = easeOutCubic(lerpValue);
            const scale = lerp(finalScale / 10, finalScale, cubicLerpValue);

            // Note: "|| 0" just prevents the compile time warning, the values are set
            // above and will exist
            const color = `#${Math.floor(rgb2hex([
                lerp(startColor[0] || 0, endColor[0] || 0, lerpValue),
                lerp(startColor[1] || 0, endColor[1] || 0, lerpValue),
                lerp(startColor[2] || 0, endColor[2] || 0, lerpValue),
            ])).toString(16)}`;
            const particleConfig =
                particles.upgradeConfig({
                    autoUpdate: true,
                    "alpha": {
                        "start": 1,
                        "end": 1
                    },
                    "scale": {
                        "start": scale,
                        "end": scale,
                        "minimumScaleMultiplier": 1
                    },
                    "color": {
                        "start": color,
                        "end": color,
                    },
                    "speed": {
                        "start": 0,
                        "end": 0,
                        "minimumSpeedMultiplier": 1
                    },
                    "acceleration": {
                        "x": 0,
                        "y": 0
                    },
                    "maxSpeed": 0,
                    "startRotation": {
                        "min": -45,
                        "max": -135
                    },
                    "noRotation": true,
                    "rotationSpeed": {
                        "min": 0,
                        "max": 0
                    },
                    "lifetime": {
                        "min": lifetime,
                        "max": lifetime
                    },
                    "blendMode": "normal",
                    "frequency": 0.001,
                    "emitterLifetime": lifetime - 0.1,
                    "maxParticles": 1,
                    "pos": {
                        "x": 0,
                        "y": 0
                    },
                    "addAtBack": true,
                    "spawnType": "point",
                }, [texture]);
            simpleEmitter(position, particleConfig);
            // Resolve promise, animation is done
            if (resolver && ring == rings - 1) {
                resolver();
            }
        }, ring * millisBetweenRings);
    }
}
export function makeScrollDissapearParticles(position: Vec2, prediction: boolean) {
    if (prediction) {
        // Don't show if just a prediction
        return
    }
    const texture = createParticleTexture();
    if (!texture) {
        console.error('No texture for makeScrollDissapearParticles')
        return
    }
    const particleConfig =
        particles.upgradeConfig({
            autoUpdate: true,
            "alpha": {
                "start": 1,
                "end": 0
            },
            "scale": {
                "start": 0.5,
                "end": 2.0,
                "minimumScaleMultiplier": 1
            },
            "color": {
                "start": "#bd9a71",
                "end": "#573e3d"
            },
            "speed": {
                "start": 100,
                "end": 50,
                "minimumSpeedMultiplier": 1
            },
            "acceleration": {
                "x": 0,
                "y": -100
            },
            "maxSpeed": 0,
            "startRotation": {
                "min": -45,
                "max": -135
            },
            "noRotation": false,
            "rotationSpeed": {
                "min": 0,
                "max": 0
            },
            "lifetime": {
                "min": 0.4,
                "max": 0.8
            },
            "blendMode": "normal",
            "frequency": 0.01,
            "emitterLifetime": 0.5,
            "maxParticles": 500,
            "pos": {
                "x": 0,
                "y": 0
            },
            "addAtBack": false,
            "spawnType": "circle",
            "spawnCircle": {
                "x": 0,
                "y": 0,
                "r": 15
            }
        }, [texture]);
    simpleEmitter(position, particleConfig);
}
export function makeDarkPriestAttackParticles(position: Vec2, prediction: boolean, resolver?: () => void) {
    if (prediction) {
        // Don't show if just a prediction
        return
    }
    const texture = createHardCircleParticleTexture();
    if (!texture) {
        console.error('No texture for particles')
        return
    }
    const particleConfig =
        particles.upgradeConfig({
            autoUpdate: true,
            "alpha": {
                "start": 1,
                "end": 0
            },
            "scale": {
                "start": 0.4,
                "end": 0.3,
                "minimumScaleMultiplier": 1
            },
            "color": {
                "start": "#962d2d",
                "end": "#ffffff"
            },
            "speed": {
                "start": 200,
                "end": 0,
                "minimumSpeedMultiplier": 1
            },
            "acceleration": {
                "x": 0,
                "y": 0
            },
            "maxSpeed": 0,
            "startRotation": {
                "min": -90,
                "max": -90
            },
            "noRotation": false,
            "rotationSpeed": {
                "min": 0,
                "max": 0
            },
            "lifetime": {
                "min": 0.8,
                "max": 0.8
            },
            "blendMode": "normal",
            "frequency": 0.005,
            "emitterLifetime": 0.5,
            "maxParticles": 100,
            "pos": {
                "x": 0,
                "y": 0
            },
            "addAtBack": true,
            "spawnType": "point"
        }, [texture]);
    simpleEmitter({ x: position.x, y: position.y }, particleConfig, resolver);
}
export function makeCorruptionParticles(follow: IUnit, prediction: boolean, underworld: Underworld, resolver?: () => void) {
    if (prediction) {
        // Don't show if just a prediction
        return
    }
    const texture = createParticleTexture();
    if (!texture) {
        console.error('No texture for particles')
        return
    }
    const particleConfig =
        particles.upgradeConfig({
            autoUpdate: true,
            "alpha": {
                "start": 1,
                "end": 0
            },
            "scale": {
                "start": 1,
                "end": 0.2,
                "minimumScaleMultiplier": 1
            },
            "color": {
                "start": "#321d73",
                "end": "#9526cc"
            },
            "speed": {
                "start": 20,
                "end": 0,
                "minimumSpeedMultiplier": 1
            },
            "acceleration": {
                "x": 0,
                "y": 0
            },
            "maxSpeed": 0,
            "startRotation": {
                "min": -90,
                "max": -90
            },
            "noRotation": false,
            "rotationSpeed": {
                "min": 0,
                "max": 0
            },
            "lifetime": {
                "min": 3.5,
                "max": 4
            },
            "blendMode": "normal",
            "frequency": 0.01,
            "emitterLifetime": -1,
            "maxParticles": 500,
            "pos": {
                "x": 0.5,
                "y": 0.5
            },
            "addAtBack": true,
            "spawnType": "circle",
            "spawnCircle": {
                "x": 0,
                "y": 0,
                "r": 15
            }

        }, [texture]);
    const emitter = simpleEmitter({ x: follow.x, y: follow.y }, particleConfig, resolver, containerParticlesUnderUnits);
    if (emitter) {
        underworld.particleFollowers.push({
            emitter,
            target: follow
        })
    } else {
        console.error('Failed to create corruption particle emitter');
    }
}