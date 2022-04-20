import { add, magnitude, multiply, Vec2 } from '../Vec';
import { distance, similarTriangles } from "../math";
import { findWherePointIntersectLineSegmentAtRightAngle, LineSegment } from "./collisionMath";
import * as config from '../config';
import { getNormalVectorOfLineSegment, PolygonLineSegment } from '../Polygon';

export type Circle = {
    radius: number;
} & Vec2;
export function isCircleIntersectingCircle(c1: Circle, c2: Circle): boolean {
    return distance(c1, c2) <= c1.radius + c2.radius;
}
// Given a position ("from"), inside a circle, move the circle away from the position "from",
// until "from" is at the edge of the cricle.
// The circle moves in the vector of "from" to circle
export function moveAwayFrom(circle: Circle, from: Vec2) {
    const bigA = from.x - circle.x;
    const bigB = from.y - circle.y;
    const bigC = Math.sqrt(bigA * bigA + bigB * bigB);
    // little "a" and little "b" represent the normalized vector of movement
    const a = bigA / bigC;
    const b = bigB / bigC;
    const moveDistance = circle.radius - bigC;
    // Simply multiply the normalized vector of movement (a,b)
    // against the move distance to determine the final position
    circle.x -= a * moveDistance;
    circle.y -= b * moveDistance;
}
// Returns a new coordinate represending "startPos" moved "distance" along "normalizedVector"
// Pure Function
export function moveAlongVector(startPos: Vec2, normalizedVector: Vec2, distance: number): Vec2 {
    return {
        x: startPos.x + normalizedVector.x * distance,
        y: startPos.y + normalizedVector.y * distance,
    }
}
// Get a normalized vector and distance between two points
// (this distance is a bonus since it needs to be calculated anyway, might as well return it)
// Pure Function
export function normalizedVector(point1: Vec2, point2: Vec2): { vector: Vec2 | undefined, distance: number } {
    const bigA = point2.x - point1.x;
    const bigB = point2.y - point1.y;
    const bigC = Math.sqrt(bigA * bigA + bigB * bigB);
    if (bigC === 0) {
        return { vector: undefined, distance: 0 }
    }
    // little "a" and little "b" represent the normalized vector of movement
    const a = bigA / bigC;
    const b = bigB / bigC;
    // Return the normalized vector and the distance between the two points
    return { vector: { x: a, y: b }, distance: bigC };
}

// move moves a mover towards the destination but will consider
// collisions with circles and eventaully lines.  Collisions may cause
// both colliders to move
// mover may not end up at destination if it collides
export function moveWithCollisions(mover: Circle, destination: Vec2, circles: Circle[], lines: PolygonLineSegment[]) {
    // Determine if the mover intersects with any "circles" as
    // it travels from mover to destination
    // We do this by adding mover.radius to the other circle's radius
    // and testing for intersection between that circle at the line segment
    // of mover's movement

    const originalPosition = { x: mover.x, y: mover.y };
    // Actually move the mover
    mover.x = destination.x;
    mover.y = destination.y;
    // for (let other of circles) {
    //     // Do not repel self from self
    //     if (mover !== other) {
    //         // If the mover now intersects with another circle...
    //         if (isCircleIntersectingCircle(mover, other)) {
    //             // Prevent the mover from moving through other circles
    //             // This turns out to be the best solution to prevent
    //             // units from ending up inside walls or out of the level
    //             // If, alternatively, movers could "push" other units,
    //             // that is when they get pushed through walls. This is better
    //             // to just make it so you can't move through other units
    //             repelCircles(mover, originalPosition, other, true);
    //         }
    //     }
    // }
    for (let line of lines) {
        repelCircleFromLine(mover, originalPosition, line);
    }
}
// repelCircles moves two intersecting circles away from each other
// relative to their distance from each other and radius.
// mover: the circle that is initiating movement
// originalPosition: the original position of mover, mover should already be moved to the destination that may cause collision
// other: the circle that mover may be colliding with
// otherIsFixed: true if other should not be moved when collision occurs.  In that case only mover is moved due to the collision
// Note: this function is only meant to handle small increments of movements, this function
// will not account for the case where the destination does not intersect
// a circle but the mover would travel through a circle on it's way to destination.  This is by design.
function repelCircles(mover: Circle, originalPosition: Vec2, other: Circle, otherIsFixed: boolean = false) {
    // Repel, so they don't intersect
    // Circles should move mover.radius/2 + other.radius/2 away from each others
    // positions
    let { vector, distance } = normalizedVector(mover, other);
    if (!vector) {
        // If vector is undefined, then mover and other are
        // equal, in which case we should determien the vector from the 
        // mover's start point:
        vector = normalizedVector(originalPosition, other).vector;
    }
    if (vector) {
        const overlap = mover.radius + other.radius - distance;
        // Prevent "pulling" circles towards each other, this function
        // will only repel if they are intersecting (which would mean "overlap"
        // would be a non-zero positive number)
        if (overlap > 0) {
            if (otherIsFixed) {
                const moverPos = moveAlongVector(mover, vector, -overlap);
                mover.x = moverPos.x;
                mover.y = moverPos.y;
            } else {
                const otherPos = moveAlongVector(other, vector, overlap);
                other.x = otherPos.x;
                other.y = otherPos.y;
            }
        }
    } else {
        // If vector is still undefined after trying both the new point and the start point
        // then we need not calculate any collision or movement because the mover isn't moving
        // --
        // return early
        return
    }
}
// repelCircleFromLine calculates the final destination of the mover when possibly intersecting
// with fixed line segments.
// Note: this function is only meant to handle small increments of movements, this function
// will not account for the case where the destination does not intersect
// a line but the mover would travel through a linesegment on it's way to destination.  This is by design.
function repelCircleFromLine(mover: Circle, originalPosition: Vec2, line: PolygonLineSegment) {
    // The radius used for the line points makes up the different between a regular unit collision radius and the units physicsMover's radius
    // The units physicsMover's radius is small so that units can "squeeze" past each other, but I want the full unit size to collide
    // with walls (lines and their verticies).
    const margin = 0;
    const totalRepelDistance = config.COLLISION_MESH_RADIUS * config.NON_HEAVY_UNIT_SCALE;
    const radius = totalRepelDistance - mover.radius;
    // Test for intersection with the line segment
    const repelVector = multiply(line.polygon.inverted ? -1 : 1, getNormalVectorOfLineSegment(line));
    window.unitOverlayGraphics.lineStyle(4, 0xff0000, 1);
    const midPoint = add(line.p1, similarTriangles(line.p2.x - line.p1.x, line.p2.y - line.p1.y, distance(line.p1, line.p2), distance(line.p1, line.p2) / 2))
    window.unitOverlayGraphics.moveTo(midPoint.x, midPoint.y);
    window.unitOverlayGraphics.lineTo(midPoint.x + repelVector.x, midPoint.y + repelVector.y);
    const rightAngleIntersectionWithLineFromMoverCenterPoint = findWherePointIntersectLineSegmentAtRightAngle(mover, line);
    if (rightAngleIntersectionWithLineFromMoverCenterPoint
        && distance(rightAngleIntersectionWithLineFromMoverCenterPoint, mover) <= totalRepelDistance) {

        window.unitOverlayGraphics.moveTo(mover.x, mover.y);
        const newLocationRelative = similarTriangles(repelVector.x, repelVector.y, magnitude(repelVector), totalRepelDistance);
        const newLocation = add(rightAngleIntersectionWithLineFromMoverCenterPoint, newLocationRelative);
        window.unitOverlayGraphics.lineStyle(5, 0xff00ff, 1);
        window.unitOverlayGraphics.moveTo(mover.x, mover.y);
        mover.x = newLocation.x;
        mover.y = newLocation.y;
        window.unitOverlayGraphics.lineTo(mover.x, mover.y);
        window.unitOverlayGraphics.drawCircle(mover.x, mover.y, 2);
        window.unitOverlayGraphics.lineStyle(5, 0xff0000, 1);
        window.unitOverlayGraphics.drawCircle(line.p1.x, line.p1.y, 2);
        window.unitOverlayGraphics.lineStyle(5, 0x00ff00, 1);
        window.unitOverlayGraphics.drawCircle(line.p2.x, line.p2.y, 2);

        // circle intersects line
        // repelCircles(mover, originalPosition, { ...rightAngleIntersectionWithLineFromMoverCenterPoint, radius }, true);
        // window.unitOverlayGraphics.drawCircle(mover.x, mover.y, mover.radius);
        // window.unitOverlayGraphics.drawCircle(rightAngleIntersectionWithLineFromMoverCenterPoint.x, rightAngleIntersectionWithLineFromMoverCenterPoint.y, radius);
    }
    // Test for intersection with the line segment endpoints
    // if (distance(line.p1, mover) <= totalRepelDistance) {
    //     repelCircles(mover, originalPosition, { ...line.p1, radius }, true);
    //     // window.unitOverlayGraphics.lineStyle(2, 0xff0000, 1);
    //     // window.unitOverlayGraphics.drawCircle(mover.x, mover.y, mover.radius);
    // }
    // if (distance(line.p2, mover) <= totalRepelDistance) {
    //     repelCircles(mover, originalPosition, { ...line.p2, radius }, true);
    //     // window.unitOverlayGraphics.lineStyle(2, 0x0000ff, 1);
    //     // window.unitOverlayGraphics.drawCircle(mover.x, mover.y, mover.radius);
    // }
}
export const testables = {
    repelCircles,
    repelCircleFromLine
}