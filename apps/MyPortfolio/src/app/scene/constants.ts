import type { RoomCameraTarget } from '../rooms/room.model';

export const SPHERE_RADIUS = 5;
// How high above the surface (along the normal) the focus camera sits. Kept low
// relative to ROOM_FOCUS_BACK so the camera sits almost down at ground level and
// looks at the zone nearly head-on (a shallow, near-horizontal view of the
// facade) rather than down at its roof: the downward pitch is
// atan2(ROOM_FOCUS_DISTANCE - STRUCTURE_LOOKAT_LIFT, ROOM_FOCUS_BACK) ~= 6deg.
export const ROOM_FOCUS_DISTANCE = 1.5;
// How far the focus camera pulls back along the structure's front (tangent)
// direction. The dominant term of the focus offset, so the view is mostly
// frontal (see the pitch formula above) and stands a good way back so the whole
// zone - structure plus its foreground info props - fits comfortably in frame.
// Kept larger than the reveal-on-enter detail props' `front` offset so those
// props stay in the foreground, between the camera and the structure.
export const ROOM_FOCUS_BACK = 5.2;
// Sideways pan of the focused view: camera and look-at shift together along the
// zone's "right" tangent, so the whole scene slides left on screen. This recenters
// the structure (and its symmetric info props) inside the VISIBLE area - the left
// ~70% not covered by the open side panel - instead of the raw viewport center,
// which the panel would otherwise crop on the right.
export const ROOM_FOCUS_SIDE = 1.0;
// Effectively zero - just enough to dodge z-fighting with the terrain mesh.
// Structures sit right on the surface (no visible floating gap); each one's
// own height (local Y, which points outward once oriented) is what makes it
// stick up from the ground, not this offset.
export const STRUCTURE_SURFACE_OFFSET = 0.03;
/** Raises the focused camera's look-at point up off the surface so the optical
 * centre sits between the foreground info props and the structure - both read
 * clearly. Also flattens the downward pitch (see ROOM_FOCUS_DISTANCE). */
export const STRUCTURE_LOOKAT_LIFT = 1.0;
export const DEFAULT_CAMERA_DISTANCE = SPHERE_RADIUS * 3.4;

// OrbitControls.update() re-clamps the camera-to-target distance every frame
// (even while `enabled = false`, since that flag only gates input listeners,
// not the update math), so its `minDistance` must be loosened whenever the
// camera flies in closer than this for a focused room - otherwise it gets
// silently pushed back out to ORBIT_MIN_DISTANCE every frame. The room focus
// geometry (ROOM_FOCUS_DISTANCE/BACK/STRUCTURE_LOOKAT_LIFT above) puts the
// camera ~5.2 units from its look-at target, so FOCUS_MIN_DISTANCE must stay
// below that.
export const ORBIT_MIN_DISTANCE = 7;
export const FOCUS_MIN_DISTANCE = 1;

// Mobile focus framing. Phones show the overlay as a bottom sheet (~half the
// screen), so instead of the desktop side-pan we pull the camera further back
// (narrow portrait FOV needs more distance to fit the zone) and push the whole
// view UP along the surface normal, seating the structure in the visible top
// half above the sheet. Tuned by on-device screenshots, not by maths alone.
export const FOCUS_BACK_MOBILE = 6.2;
export const FOCUS_UP_MOBILE = 1.4;
// Layout breakpoint shared with the overlay's CSS bottom-sheet media query.
export const MOBILE_MAX_WIDTH = 700;

// Elevated 3/4 view (looking down at ~30°) instead of a flat equatorial shot,
// so the island reads as a small floating world rather than a flat disc.
const DEFAULT_ELEVATION_RAD = (30 * Math.PI) / 180;
export const DEFAULT_CAMERA_TARGET: RoomCameraTarget = {
  position: {
    x: 0,
    y: DEFAULT_CAMERA_DISTANCE * Math.sin(DEFAULT_ELEVATION_RAD),
    z: DEFAULT_CAMERA_DISTANCE * Math.cos(DEFAULT_ELEVATION_RAD),
  },
  lookAt: { x: 0, y: 0, z: 0 },
  up: { x: 0, y: 1, z: 0 },
};
