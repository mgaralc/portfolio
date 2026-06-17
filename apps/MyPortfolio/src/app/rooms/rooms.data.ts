import { Room, RoomContent, RoomKind } from './room.model';
import {
  ROOM_FOCUS_BACK,
  ROOM_FOCUS_DISTANCE,
  ROOM_FOCUS_SIDE,
  SPHERE_RADIUS,
  STRUCTURE_LOOKAT_LIFT,
} from '../scene/constants';
import { sphericalToCartesian, surfaceFront } from '../scene/spherical-utils';

function buildRoom(
  id: string,
  kind: RoomKind,
  title: string,
  summary: string,
  icon: string,
  color: number,
  latitudeDeg: number,
  longitudeDeg: number,
  content: RoomContent
): Room {
  const markerPosition = sphericalToCartesian(
    SPHERE_RADIUS,
    latitudeDeg,
    longitudeDeg
  );

  // The structure stands radially upright (see scene/orientation.ts), so a
  // purely radial camera would look straight down at its roof. Pull the camera
  // out along the surface normal and back along the structure's front (the
  // same tangent it faces) for an elevated 3/4 view of the facade, and lift
  // the look-at point up the structure's height (also along the normal).
  const normal = {
    x: markerPosition.x / SPHERE_RADIUS,
    y: markerPosition.y / SPHERE_RADIUS,
    z: markerPosition.z / SPHERE_RADIUS,
  };
  const front = surfaceFront(markerPosition);
  // "Right" tangent = normal x front (same basis the detail props use for their
  // `lateral` axis). Panning camera + look-at together along it slides the whole
  // scene sideways on screen without changing the framing - used to dodge the
  // side panel (see ROOM_FOCUS_SIDE).
  const right = {
    x: normal.y * front.z - normal.z * front.y,
    y: normal.z * front.x - normal.x * front.z,
    z: normal.x * front.y - normal.y * front.x,
  };

  return {
    id,
    kind,
    title,
    summary,
    icon,
    color,
    markerPosition,
    cameraTarget: {
      position: {
        x: markerPosition.x + normal.x * ROOM_FOCUS_DISTANCE + front.x * ROOM_FOCUS_BACK + right.x * ROOM_FOCUS_SIDE,
        y: markerPosition.y + normal.y * ROOM_FOCUS_DISTANCE + front.y * ROOM_FOCUS_BACK + right.y * ROOM_FOCUS_SIDE,
        z: markerPosition.z + normal.z * ROOM_FOCUS_DISTANCE + front.z * ROOM_FOCUS_BACK + right.z * ROOM_FOCUS_SIDE,
      },
      lookAt: {
        x: markerPosition.x + normal.x * STRUCTURE_LOOKAT_LIFT + right.x * ROOM_FOCUS_SIDE,
        y: markerPosition.y + normal.y * STRUCTURE_LOOKAT_LIFT + right.y * ROOM_FOCUS_SIDE,
        z: markerPosition.z + normal.z * STRUCTURE_LOOKAT_LIFT + right.z * ROOM_FOCUS_SIDE,
      },
      // Camera rolls so "up" is the zone's surface normal -> structure shown
      // upright and front-on regardless of where the zone sits on the planet.
      up: normal,
    },
    content,
  };
}

// The 6 rooms sit at the vertices of a regular octahedron inscribed in the
// sphere - the most even possible spread of 6 points - rotated 45° off the
// world axes so no vertex lands exactly on a pole (which would make the
// structure anchors' lookAt-based orientation degenerate). That leaves
// lat=±45°/lon∈{90,270} and lat=0°/lon∈{0,180}, each room's color region
// wrapping a clean 1/6 wedge of the planet. "Sobre mí" sits near the default
// camera's front-center (lat≈30, lon≈90) as a welcome; "Contacto" sits on
// the far side, as a small reward for exploring the whole planet.
export const ROOMS: Room[] = [
  buildRoom(
    'about',
    'about',
    'Sobre mí',
    'Quién soy y qué me motiva',
    '👋',
    0xe8c547,
    45,
    90,
    {
      type: 'about',
      subtitle: 'Ciberseguridad · Desarrollo de Software',
      bio: 'Especialista junior en ciberseguridad con una base sólida como desarrollador de software. Cuento con la certificación CC de ISC2 y una Especialización en Ciberseguridad (MEDAC) —pentesting, análisis de vulnerabilidades y forense digital— respaldada por experiencia real en desarrollo web full stack (Angular, TypeScript y Java) en proyectos de gran escala del sector financiero. Sigo creciendo en 42 Málaga. Me motiva proteger y construir software fiable y seguro, y aportar desde el primer día en equipos exigentes.',
      highlights: [
        'Enfoque en ciberseguridad',
        'Pentesting y forense digital',
        'Desarrollo web full stack',
        'Resolución de problemas',
        'Aprendizaje continuo',
      ],
      facts: [
        '🗣️ Español (nativo) · Inglés (B2)',
        '🌍 Disponibilidad para viajar y reubicación',
        '🚗 Carnet de conducir y vehículo propio',
        '🎂 19/05/2004',
      ],
    }
  ),
  buildRoom(
    'education',
    'education',
    'Estudios',
    'Mi formación académica',
    '🎓',
    0x3fae5b,
    -45,
    90,
    {
      type: 'education',
      studies: [
        {
          title: 'Especialización en Ciberseguridad',
          school: 'MEDAC',
          period: '2025 - 2026',
          description:
            'Ciberseguridad en entornos de las TI: diagnóstico de seguridad, identificación de vulnerabilidades, análisis de riesgos, pentesting, análisis forense digital y normativa.',
        },
        {
          title: '42 Málaga (Fundación Telefónica)',
          school: 'Programación de software',
          period: 'En curso',
          description:
            'Programa internacional de aprendizaje autónomo y evaluación por pares. Formación intensiva en C, Python, Linux y buenas prácticas, con especialización progresiva en ciberseguridad.',
        },
        {
          title: 'CC — Certificado en Ciberseguridad',
          school: 'ISC2',
          period: '',
          description:
            'Certificación internacional en fundamentos de ciberseguridad: gestión de riesgos, controles de seguridad, cumplimiento normativo, protección de datos y respuesta ante incidentes.',
        },
        {
          title: 'Grado Superior en Desarrollo de Aplicaciones Web',
          school: 'CPIFP Alan Turing',
          period: '2023 - 2025',
          description:
            'Desarrollo full stack con Java, JavaScript/TypeScript, HTML, CSS, MySQL, Angular y React. Buenas prácticas, control de versiones y metodologías ágiles.',
        },
        {
          title: 'Grado Medio en Microinformática y Redes',
          school: 'CES Lope de Vega',
          period: '2021 - 2023',
          description:
            'Sistemas, redes y soporte informático, con fundamentos de ciberseguridad: pentesting básico, cortafuegos y legislación en seguridad.',
        },
      ],
    }
  ),
  buildRoom(
    'tech-museum',
    'tech-museum',
    'Tecnologías',
    'Herramientas y lenguajes que uso',
    '💻',
    0x3b6fd6,
    45,
    270,
    {
      type: 'tech-museum',
      categories: [
        {
          name: 'Ciberseguridad / OSINT',
          items: [
            'Nmap',
            'Wireshark',
            'Metasploit',
            'OWASP ZAP',
            'Shodan',
            'Google Dorking',
            'Volatility',
            'Autopsy',
          ],
        },
        { name: 'Lenguajes', items: ['Python', 'Java', 'C', 'MySQL'] },
        {
          name: 'Desarrollo Web',
          items: [
            'Angular',
            'React',
            'RxJS',
            'TypeScript',
            'JavaScript',
            'SCSS/HTML',
            'Patrón Facade',
          ],
        },
        {
          name: 'Entornos / Herramientas',
          items: [
            'Linux',
            'Windows',
            'Git/GitHub',
            'AWS',
            'Máquinas virtuales',
            'Tor Browser',
            'Prompt Engineering',
          ],
        },
      ],
    }
  ),
  buildRoom(
    'experience',
    'experience',
    'Experiencia',
    'Mi recorrido profesional',
    '💼',
    0x9b4fd6,
    -45,
    270,
    {
      type: 'experience',
      roles: [
        {
          role: 'Desarrollador Web',
          company: 'NTT Data — Málaga, España',
          period: '03/2024 - 05/2025',
          description:
            'Desarrollo de aplicaciones de gran escala para el sector financiero (Banco Santander) con Angular, TypeScript, RxJS y Java. Implementé funcionalidades dentro de arquitecturas complejas, resolví incidencias y colaboré en equipos multidisciplinares con metodología ágil (Scrum) y control de versiones (Git).',
        },
        {
          role: 'Técnico Informático (Erasmus)',
          company: 'Computer Expert — Viena, Austria',
          period: '03/2023 - 06/2023',
          description:
            'Soporte técnico, instalación y configuración de hardware y software, y atención directa a clientes en un entorno internacional y en inglés.',
        },
        {
          role: 'Técnico Informático (Erasmus)',
          company: 'Merel d.o.o — Maribor, Eslovenia',
          period: '07/2022 - 08/2022',
          description: 'Mantenimiento y reparación de equipos informáticos en un entorno internacional.',
        },
      ],
    }
  ),
  buildRoom(
    'projects',
    'projects',
    'Proyectos',
    'Ideas que se convierten en soluciones',
    '🚀',
    0xe0903c,
    0,
    0,
    {
      type: 'projects',
      projects: [
        {
          name: 'Portfolio 3D interactivo',
          description:
            'Este portfolio: un planeta low-poly explorable en 3D. Construido con Angular y Three.js sobre WebGPU (con fallback a WebGL2) y optimizado para móvil mediante niveles de calidad adaptativos.',
        },
        {
          name: 'Proyectos en 42 Málaga',
          description:
            'Conjunto de proyectos en C, Python y Linux bajo la metodología de aprendizaje autónomo y evaluación por pares de 42, con foco en algoritmia, pensamiento lógico y ciberseguridad.',
          link: { label: 'Ver repositorio', url: 'https://github.com/mgaralc/42' },
        },
        {
          name: 'La Bandera Café',
          description:
            'Web real en producción para una cafetería-bar de Córdoba, usada a diario por el negocio. Sitio rápido y minimalista hecho con Astro: carta, contacto y ubicación con mapa integrado.',
          link: { label: 'Visitar web', url: 'https://labanderacafe.com' },
        },
      ],
    }
  ),
  buildRoom(
    'contact',
    'contact',
    'Contacto',
    'Cómo ponerte en contacto conmigo',
    '✉️',
    0x3ec9c0,
    0,
    180,
    {
      type: 'contact',
      channels: [
        { label: 'Email', value: 'mgaralc4@gmail.com', href: 'mailto:mgaralc4@gmail.com' },
        { label: 'Teléfono', value: '601 20 03 75', href: 'tel:+34601200375' },
        {
          label: 'LinkedIn',
          value: 'in/miguel-garcia-alcala',
          href: 'https://www.linkedin.com/in/miguel-garcia-alcala',
        },
        { label: 'GitHub', value: 'github.com/mgaralc', href: 'https://github.com/mgaralc' },
        { label: 'CV', value: 'Descargar PDF ↓', href: '/CV_Miguel_Garcia.pdf' },
      ],
    }
  ),
];
