import type { Group } from 'three/webgpu';
import type { RoomKind } from '../../rooms/room.model';
import { createEducationStructure } from './education-structure';
import { createTechMuseumStructure } from './tech-museum-structure';
import { createProjectsStructure } from './projects-structure';
import { createExperienceStructure } from './experience-structure';
import { createAboutStructure } from './about-structure';
import { createContactStructure } from './contact-structure';

export const STRUCTURE_FACTORIES: Record<
  RoomKind,
  (accentColor: number) => Group
> = {
  education: createEducationStructure,
  'tech-museum': createTechMuseumStructure,
  projects: createProjectsStructure,
  experience: createExperienceStructure,
  about: createAboutStructure,
  contact: createContactStructure,
};
