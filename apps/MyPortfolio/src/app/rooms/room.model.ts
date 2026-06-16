export type RoomKind = 'education' | 'tech-museum';

export interface Vector3Like {
  x: number;
  y: number;
  z: number;
}

export interface RoomCameraTarget {
  position: Vector3Like;
  lookAt: Vector3Like;
}

export interface EducationContent {
  type: 'education';
  institution: string;
  degree: string;
  period: string;
  description: string;
}

export interface TechMuseumContent {
  type: 'tech-museum';
  technologies: {
    name: string;
    level: 'basic' | 'intermediate' | 'advanced';
  }[];
}

export type RoomContent = EducationContent | TechMuseumContent;

export interface Room {
  id: string;
  kind: RoomKind;
  title: string;
  shortLabel: string;
  markerPosition: Vector3Like;
  cameraTarget: RoomCameraTarget;
  content: RoomContent;
}
