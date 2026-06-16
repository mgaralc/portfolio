import { Room, RoomContent, RoomKind } from './room.model';
import { ROOM_FOCUS_DISTANCE, SPHERE_RADIUS } from '../scene/constants';
import {
  scaleAlongDirection,
  sphericalToCartesian,
} from '../scene/spherical-utils';

function buildRoom(
  id: string,
  kind: RoomKind,
  title: string,
  shortLabel: string,
  latitudeDeg: number,
  longitudeDeg: number,
  content: RoomContent
): Room {
  const markerPosition = sphericalToCartesian(
    SPHERE_RADIUS,
    latitudeDeg,
    longitudeDeg
  );
  const cameraPosition = scaleAlongDirection(
    markerPosition,
    SPHERE_RADIUS,
    SPHERE_RADIUS + ROOM_FOCUS_DISTANCE
  );

  return {
    id,
    kind,
    title,
    shortLabel,
    markerPosition,
    cameraTarget: {
      position: cameraPosition,
      lookAt: markerPosition,
    },
    content,
  };
}

// Latitude/longitude are chosen so both rooms sit on the hemisphere that
// already faces the default camera (front-center is lat=0, lon=90).
export const ROOMS: Room[] = [
  buildRoom('education', 'education', 'Formación', 'Aula', 15, 65, {
    type: 'education',
    institution: 'Universidad de Ejemplo',
    degree: 'Grado en Ingeniería Informática',
    period: '2018 - 2022',
    description:
      'Contenido de relleno: aquí irá el detalle real de la formación académica.',
  }),
  buildRoom(
    'tech-museum',
    'tech-museum',
    'Museo de tecnologías',
    'Museo',
    -15,
    115,
    {
      type: 'tech-museum',
      technologies: [
        { name: 'TypeScript', level: 'advanced' },
        { name: 'Angular', level: 'advanced' },
        { name: 'Three.js', level: 'intermediate' },
        { name: 'Node.js', level: 'intermediate' },
        { name: 'WebGPU', level: 'basic' },
      ],
    }
  ),
];
