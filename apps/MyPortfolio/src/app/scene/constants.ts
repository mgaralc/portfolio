import type { RoomCameraTarget } from '../rooms/room.model';

export const SPHERE_RADIUS = 5;
export const ROOM_FOCUS_DISTANCE = 2.5;
export const DEFAULT_CAMERA_DISTANCE = SPHERE_RADIUS * 2.4;

export const DEFAULT_CAMERA_TARGET: RoomCameraTarget = {
  position: { x: 0, y: 0, z: DEFAULT_CAMERA_DISTANCE },
  lookAt: { x: 0, y: 0, z: 0 },
};
