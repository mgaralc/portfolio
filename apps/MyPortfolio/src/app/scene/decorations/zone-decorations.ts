import type { Group } from 'three/webgpu';
import {
  createBench,
  createHedge,
  createBookStack,
  createSatelliteDish,
  createServerRack,
  createCrateStack,
  createSignpost,
  createBriefcase,
  createFenceSegment,
  createMailbox,
  createRockCluster,
  createBuoy,
  createPilingPost,
} from './props';

export interface ZoneDecorationPlacement {
  /** Which room's accent color this decoration is tinted with. */
  roomId: string;
  lat: number;
  lon: number;
  factory: (accentColor: number) => Group;
}

// 3 small thematic props per room, placed a short distance from that room's
// own structure (see rooms/rooms.data.ts for each room's lat/lon) so every
// zone of the planet feels decorated, not just a single landmark floating
// in otherwise-empty terrain.
export const ZONE_DECORATIONS: ZoneDecorationPlacement[] = [
  // Sobre mí (about) - lat 45, lon 90
  { roomId: 'about', lat: 55, lon: 75, factory: createMailbox },
  { roomId: 'about', lat: 38, lon: 65, factory: () => createFenceSegment() },
  { roomId: 'about', lat: 30, lon: 100, factory: () => createHedge() },

  // Estudios (education) - lat -45, lon 90
  { roomId: 'education', lat: -55, lon: 75, factory: () => createBench() },
  { roomId: 'education', lat: -35, lon: 65, factory: createBookStack },
  { roomId: 'education', lat: -30, lon: 105, factory: () => createHedge() },

  // Tecnologías (tech-museum) - lat 45, lon 270
  { roomId: 'tech-museum', lat: 55, lon: 255, factory: createSatelliteDish },
  { roomId: 'tech-museum', lat: 35, lon: 245, factory: createServerRack },
  { roomId: 'tech-museum', lat: 30, lon: 285, factory: createCrateStack },

  // Experiencia (experience) - lat -45, lon 270
  { roomId: 'experience', lat: -55, lon: 255, factory: createBriefcase },
  { roomId: 'experience', lat: -35, lon: 245, factory: createCrateStack },
  { roomId: 'experience', lat: -30, lon: 285, factory: createSignpost },

  // Proyectos (projects) - lat 0, lon 0
  { roomId: 'projects', lat: 15, lon: 345, factory: createCrateStack },
  { roomId: 'projects', lat: -15, lon: 15, factory: createSignpost },
  { roomId: 'projects', lat: 15, lon: 25, factory: () => createBench() },

  // Contacto (contact) - lat 0, lon 180
  { roomId: 'contact', lat: 15, lon: 165, factory: () => createRockCluster() },
  { roomId: 'contact', lat: -15, lon: 195, factory: createBuoy },
  { roomId: 'contact', lat: 15, lon: 200, factory: () => createPilingPost() },
];
