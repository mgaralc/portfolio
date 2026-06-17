import type { Object3D } from 'three/webgpu';
import type { RoomKind } from '../../rooms/room.model';
import { makeLabelTexture } from './sign-textures';
import { makeTechBoardTexture } from './tech-board';
import { createSign, createWavingPerson } from './detail-props';

export interface ZoneDetail {
  object: Object3D;
  /** Tangent offset (world units) sideways and toward the focus camera. */
  lateral: number;
  front: number;
  /** Turn this prop to face the focus camera head-on (signs) rather than
   * standing on a fixed surface tangent (the seated person / flags). */
  faceCamera?: boolean;
}

const sign = (
  lateral: number,
  front: number,
  title: string,
  subtitle = '',
  bg = '#1b294a',
  fg = '#ffffff',
  width = 0.6
): ZoneDetail => ({
  object: createSign(makeLabelTexture(title, subtitle, bg, fg), width),
  lateral,
  front,
  faceCamera: true,
});

// A category placard for the Technologies zone: header + grid of logo/text
// tiles, drawn at the texture's own aspect so nothing gets stretched.
const techBoard = (
  lateral: number,
  front: number,
  category: string,
  items: string[],
  accent: string,
  width = 0.74
): ZoneDetail => {
  const { texture, aspect } = makeTechBoardTexture(category, items, accent);
  return {
    object: createSign(texture, width, width * aspect),
    lateral,
    front,
    faceCamera: true,
  };
};

// Builds the props that appear only while a given zone is open. Layout is in
// tangent units: `lateral` spreads sideways, `front` pushes toward the camera
// (foreground), so the signs read clearly without hiding the structure.
export function buildZoneDetails(kind: RoomKind): ZoneDetail[] {
  switch (kind) {
    case 'about':
      // "Me" standing and waving on one side, a warm welcome sign on the other -
      // off-center so neither hides the cottage between them.
      return [
        // faceCamera keeps the avatar upright (up = zone normal, like the house)
        // and turned toward the viewer, instead of leaning with its own tangent.
        { object: createWavingPerson(0x3b6fd6), lateral: -0.85, front: 1.05, faceCamera: true },
        sign(0.85, 1.05, '¡Hola!', 'Soy Miguel García', '#7a5a1f', '#fff', 0.7),
      ];

    case 'education': {
      const bg = '#22324f';
      const cols = [-1.5, -0.75, 0, 0.75, 1.5];
      const items = [
        ['ISC2', 'Cert. CC'],
        ['42 Málaga', 'Programación'],
        ['MEDAC', 'Ciberseguridad'],
        ['Alan Turing', 'Desarrollo Web'],
        ['Lope de Vega', 'Microinf. y Redes'],
      ];
      return items.map(([t, s], i) => sign(cols[i], 1.2, t, s, bg));
    }

    case 'tech-museum': {
      // One placard per category, lined up facing the focus camera. Logos are
      // drawn for the techs we have art for; the rest fall back to text chips.
      // Symmetric layout: two boards | building | two boards, with a clear gap
      // in the middle so the structure stays visible. The whole scene is panned
      // left (ROOM_FOCUS_SIDE) so this stays centered in the visible area.
      const accent = '#5aa0ff';
      const cols = [-1.55, -0.75, 0.75, 1.55];
      const front = 1.3;
      return [
        techBoard(cols[0], front, 'Lenguajes', ['Python', 'Java', 'C', 'MySQL'], accent),
        techBoard(cols[1], front, 'Web', ['Angular', 'React', 'TypeScript', 'JavaScript', 'RxJS'], accent),
        techBoard(cols[2], front, 'Ciberseguridad', ['Nmap', 'Wireshark', 'Metasploit', 'Shodan'], accent),
        techBoard(cols[3], front, 'Entornos', ['Linux', 'Windows', 'Git/GitHub', 'AWS'], accent),
      ];
    }

    case 'experience': {
      const bg = '#3c2a55';
      return [
        sign(-1.1, 1.2, 'NTT Data', 'Banco Santander · 24-25', bg),
        sign(0, 1.4, 'Computer Expert', 'Viena · 2023', bg),
        sign(1.1, 1.2, 'Merel d.o.o', 'Maribor · 2022', bg),
      ];
    }

    case 'projects': {
      const bg = '#5a3a1f';
      return [
        sign(-1.1, 1.2, 'Portfolio 3D', 'Angular · Three.js', bg),
        sign(0, 1.4, 'La Bandera Café', 'Astro · En producción', bg),
        sign(1.1, 1.2, '42 Málaga', 'C · Python', bg),
      ];
    }

    case 'contact': {
      const bg = '#13534f';
      return [
        sign(0, 1.4, 'Email', 'mgaralc4@gmail.com', bg, '#ffffff', 0.85),
        sign(-1.05, 1.2, 'Teléfono', '601 20 03 75', bg),
        sign(1.05, 1.2, 'LinkedIn', '/in/miguel-garcia-alcala', bg, '#ffffff', 0.85),
      ];
    }

    default:
      return [];
  }
}
