export type RoomKind =
  | 'education'
  | 'tech-museum'
  | 'projects'
  | 'experience'
  | 'about'
  | 'contact';

export interface Vector3Like {
  x: number;
  y: number;
  z: number;
}

export interface RoomCameraTarget {
  position: Vector3Like;
  lookAt: Vector3Like;
  /**
   * Camera "up" for this view. For focused rooms it's the zone's surface
   * normal, so the camera rolls to show the (radially upright) structure the
   * right way up instead of tilted/upside-down. Defaults to world up (0,1,0).
   */
  up?: Vector3Like;
}

export interface EducationContent {
  type: 'education';
  studies: {
    title: string;
    school: string;
    period: string;
    description: string;
  }[];
}

export interface TechMuseumContent {
  type: 'tech-museum';
  categories: {
    name: string;
    items: string[];
  }[];
}

export interface ProjectsContent {
  type: 'projects';
  projects: {
    name: string;
    description: string;
    /** Optional external link (repo or live site) shown as a button. */
    link?: { label: string; url: string };
  }[];
}

export interface ExperienceContent {
  type: 'experience';
  roles: {
    role: string;
    company: string;
    period: string;
    description?: string;
  }[];
}

export interface AboutContent {
  type: 'about';
  subtitle: string;
  bio: string;
  highlights: string[];
  facts: string[];
}

export interface ContactContent {
  type: 'contact';
  channels: {
    label: string;
    value: string;
    /** Optional link (mailto:, tel:, https://) making the channel clickable. */
    href?: string;
  }[];
}

export type RoomContent =
  | EducationContent
  | TechMuseumContent
  | ProjectsContent
  | ExperienceContent
  | AboutContent
  | ContactContent;

export interface Room {
  id: string;
  kind: RoomKind;
  title: string;
  /** Short blurb shown on the room's marker card. */
  summary: string;
  /** Single-glyph (emoji) icon shown on the room's marker card. */
  icon: string;
  /** Hex color used both for this room's island region and its UI accents. */
  color: number;
  markerPosition: Vector3Like;
  cameraTarget: RoomCameraTarget;
  content: RoomContent;
}
