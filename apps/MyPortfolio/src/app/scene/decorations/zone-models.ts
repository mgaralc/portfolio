// Imported low-poly GLB models (all CC0 / Public Domain, from Quaternius and
// Kenney via poly.pizza - see public/models/CREDITS.md). One thematic "hero"
// model per zone is placed near that room's primitive structure, so each zone
// mixes hand-built primitives with a richer imported centerpiece. Trees are
// handled separately (see TREE_MODELS) since they repeat across the planet.

export interface ModelPlacement {
  /** File under public/models/. */
  file: string;
  /** Largest bounding-box dimension in world units after normalization. */
  size: number;
  lat: number;
  lon: number;
}

export const MODELS_PATH = 'models/';

// Several themed models per zone (room lat/lon for reference: about 45/90,
// education -45/90, tech-museum 45/270, experience -45/270, projects 0/0,
// contact 0/180) so each zone reads as a small, lived-in scene rather than a
// single landmark. All files are CC0 - see public/models/CREDITS.md.
export const ZONE_MODELS: ModelPlacement[] = [
  // Sobre mí - a personal campsite: the explorer, a tent and a campfire.
  { file: 'adventurer.glb', size: 0.95, lat: 38, lon: 108 },
  { file: 'tent.glb', size: 1.0, lat: 52, lon: 95 },
  { file: 'campfire.glb', size: 0.55, lat: 40, lon: 80 },

  // Estudios - schoolyard props: books, a globe, pencils and a column.
  { file: 'book.glb', size: 0.7, lat: -38, lon: 108 },
  { file: 'globe.glb', size: 0.55, lat: -36, lon: 78 },
  { file: 'pencil.glb', size: 0.6, lat: -50, lon: 82 },
  { file: 'column.glb', size: 1.15, lat: -52, lon: 100 },

  // Tecnologías - a workstation: robot, desk and a satellite dish.
  { file: 'robot.glb', size: 0.9, lat: 38, lon: 252 },
  { file: 'desk.glb', size: 0.85, lat: 38, lon: 286 },
  { file: 'satellite-dish.glb', size: 0.9, lat: 52, lon: 262 },

  // Experiencia - a small business block: two office buildings, crates and a
  // car parked on the road that runs through the zone.
  { file: 'office.glb', size: 1.5, lat: -38, lon: 252 },
  { file: 'office.glb', size: 1.15, lat: -52, lon: 262 },
  { file: 'crates.glb', size: 0.8, lat: -36, lon: 286 },
  { file: 'car.glb', size: 0.75, lat: -30, lon: 268 },

  // Proyectos - a workshop/launch: spaceship, a bright idea, a finished chest.
  { file: 'spaceship.glb', size: 1.2, lat: 10, lon: 12 },
  { file: 'lightbulb.glb', size: 0.7, lat: 12, lon: 350 },
  { file: 'chest.glb', size: 0.7, lat: -12, lon: 8 },

  // Contacto - a comms point: package, a signpost and a small crate of letters.
  { file: 'package.glb', size: 0.6, lat: -10, lon: 168 },
  { file: 'post.glb', size: 1.0, lat: 12, lon: 172 },
  { file: 'crates.glb', size: 0.55, lat: -14, lon: 190 },
];

// Trees repeated around the planet, alternating two species for variety.
export type TreeModelPlacement = ModelPlacement;

export const TREE_MODELS: TreeModelPlacement[] = [
  { file: 'tree.glb', size: 1.4, lat: 20, lon: 45 },
  { file: 'pine-tree.glb', size: 1.5, lat: -20, lon: 45 },
  { file: 'tree.glb', size: 1.4, lat: 20, lon: 135 },
  { file: 'pine-tree.glb', size: 1.5, lat: -20, lon: 135 },
  { file: 'tree.glb', size: 1.4, lat: 20, lon: 225 },
  { file: 'pine-tree.glb', size: 1.5, lat: -20, lon: 225 },
  { file: 'tree.glb', size: 1.4, lat: 20, lon: 315 },
  { file: 'pine-tree.glb', size: 1.5, lat: -20, lon: 315 },
];
