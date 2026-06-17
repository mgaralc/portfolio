import * as THREE from 'three/webgpu';

export function createBench(): THREE.Group {
  const group = new THREE.Group();
  const woodMaterial = new THREE.MeshStandardMaterial({
    color: 0x8a5a36,
    roughness: 0.8,
    flatShading: true,
  });

  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.22), woodMaterial);
  seat.position.set(0, 0.22, 0);
  group.add(seat);

  const back = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.22, 0.05), woodMaterial);
  back.position.set(0, 0.33, -0.1);
  group.add(back);

  const legMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a4f5c,
    roughness: 0.7,
    flatShading: true,
  });
  for (const x of [-0.2, 0.2]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, 0.2), legMaterial);
    leg.position.set(x, 0.11, 0);
    group.add(leg);
  }

  return group;
}

export function createHedge(): THREE.Group {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({
    color: 0x4f8f52,
    roughness: 0.85,
    flatShading: true,
  });
  const bushes = [
    { x: -0.18, z: 0, s: 0.16 },
    { x: 0.05, z: 0.05, s: 0.2 },
    { x: 0.22, z: -0.05, s: 0.14 },
  ];
  for (const b of bushes) {
    const bush = new THREE.Mesh(new THREE.IcosahedronGeometry(b.s, 0), material);
    bush.position.set(b.x, b.s * 0.8, b.z);
    group.add(bush);
  }
  return group;
}

export function createBookStack(accentColor: number): THREE.Group {
  const group = new THREE.Group();
  const colors = [accentColor, 0xd6c33b, 0xd64f4f];
  colors.forEach((color, i) => {
    const book = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.06, 0.22),
      new THREE.MeshStandardMaterial({ color, roughness: 0.6, flatShading: true })
    );
    book.position.set(0, 0.03 + i * 0.065, 0);
    book.rotation.y = (i - 1) * 0.15;
    group.add(book);
  });
  return group;
}

export function createSatelliteDish(accentColor: number): THREE.Group {
  const group = new THREE.Group();

  const stand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.04, 0.4, 8),
    new THREE.MeshStandardMaterial({
      color: 0xcfd3da,
      roughness: 0.5,
      metalness: 0.3,
      flatShading: true,
    })
  );
  stand.position.set(0, 0.2, 0);
  group.add(stand);

  const dish = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({
      color: 0xe8e4da,
      roughness: 0.5,
      metalness: 0.2,
      flatShading: true,
      side: THREE.DoubleSide,
    })
  );
  dish.position.set(0, 0.4, 0);
  dish.rotation.x = Math.PI * 0.65;
  group.add(dish);

  const led = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.04, 0.04),
    new THREE.MeshStandardMaterial({
      color: accentColor,
      emissive: accentColor,
      emissiveIntensity: 0.8,
    })
  );
  led.position.set(0, 0.42, 0.18);
  group.add(led);

  return group;
}

export function createServerRack(accentColor: number): THREE.Group {
  const group = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.5, 0.28),
    new THREE.MeshStandardMaterial({ color: 0x3a3f4a, roughness: 0.6, flatShading: true })
  );
  body.position.set(0, 0.25, 0);
  group.add(body);

  for (let i = 0; i < 3; i++) {
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.26, 0.03, 0.01),
      new THREE.MeshStandardMaterial({
        color: accentColor,
        emissive: accentColor,
        emissiveIntensity: 0.7,
      })
    );
    stripe.position.set(0, 0.12 + i * 0.12, 0.145);
    group.add(stripe);
  }

  return group;
}

export function createCrateStack(accentColor: number): THREE.Group {
  const group = new THREE.Group();
  const crateMaterial = new THREE.MeshStandardMaterial({
    color: 0xb98850,
    roughness: 0.8,
    flatShading: true,
  });
  const crates = [
    { x: -0.08, y: 0.15, z: 0, ry: 0.1 },
    { x: 0.12, y: 0.15, z: 0.05, ry: -0.15 },
    { x: 0.0, y: 0.42, z: 0.02, ry: 0.3 },
  ];
  for (const c of crates) {
    const crate = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.26, 0.26), crateMaterial);
    crate.position.set(c.x, c.y, c.z);
    crate.rotation.y = c.ry;
    group.add(crate);
  }

  const stripe = new THREE.Mesh(
    new THREE.BoxGeometry(0.27, 0.04, 0.01),
    new THREE.MeshStandardMaterial({ color: accentColor })
  );
  stripe.position.set(0, 0.42, 0.14);
  group.add(stripe);

  return group;
}

export function createSignpost(accentColor: number): THREE.Group {
  const group = new THREE.Group();

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.025, 0.55, 6),
    new THREE.MeshStandardMaterial({ color: 0x8a5a36, roughness: 0.8, flatShading: true })
  );
  pole.position.set(0, 0.275, 0);
  group.add(pole);

  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(0.26, 0.14, 0.02),
    new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.6, flatShading: true })
  );
  sign.position.set(0.13, 0.45, 0);
  group.add(sign);

  return group;
}

export function createBriefcase(accentColor: number): THREE.Group {
  const group = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.22, 0.1),
    new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.6, flatShading: true })
  );
  body.position.set(0, 0.11, 0);
  group.add(body);

  const handle = new THREE.Mesh(
    new THREE.TorusGeometry(0.05, 0.012, 8, 12, Math.PI),
    new THREE.MeshStandardMaterial({ color: 0x3a3f4a, roughness: 0.5, flatShading: true })
  );
  handle.position.set(0, 0.24, 0);
  handle.rotation.z = Math.PI;
  group.add(handle);

  return group;
}

export function createFenceSegment(): THREE.Group {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({
    color: 0xcfc3a5,
    roughness: 0.8,
    flatShading: true,
  });

  for (const x of [-0.3, 0.3]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.32, 0.04), material);
    post.position.set(x, 0.16, 0);
    group.add(post);
  }
  for (const y of [0.1, 0.22]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.03, 0.03), material);
    rail.position.set(0, y, 0);
    group.add(rail);
  }

  return group;
}

export function createMailbox(accentColor: number): THREE.Group {
  const group = new THREE.Group();

  const post = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 0.35, 6),
    new THREE.MeshStandardMaterial({ color: 0x8a5a36, roughness: 0.8, flatShading: true })
  );
  post.position.set(0, 0.175, 0);
  group.add(post);

  const box = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.13, 0.22),
    new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.6, flatShading: true })
  );
  box.position.set(0, 0.38, 0);
  group.add(box);

  const flag = new THREE.Mesh(
    new THREE.BoxGeometry(0.02, 0.07, 0.02),
    new THREE.MeshStandardMaterial({ color: 0xc1543a, roughness: 0.6 })
  );
  flag.position.set(0.1, 0.4, 0);
  group.add(flag);

  return group;
}

export function createRockCluster(): THREE.Group {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({
    color: 0x8b8d91,
    roughness: 0.95,
    flatShading: true,
  });
  const rocks = [
    { x: -0.12, z: 0, s: 0.14, rot: 0.4 },
    { x: 0.1, z: 0, s: 0.18, rot: 1.1 },
    { x: 0.0, z: 0.12, s: 0.1, rot: 2.0 },
  ];
  for (const r of rocks) {
    const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(r.s, 0), material);
    rock.position.set(r.x, r.s * 0.7, r.z);
    rock.rotation.set(r.rot, r.rot * 0.6, 0);
    group.add(rock);
  }
  return group;
}

export function createBuoy(accentColor: number): THREE.Group {
  const group = new THREE.Group();

  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 10, 8),
    new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.5, flatShading: true })
  );
  ball.position.set(0, 0.12, 0);
  group.add(ball);

  const stripe = new THREE.Mesh(
    new THREE.TorusGeometry(0.12, 0.025, 6, 16),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 })
  );
  stripe.position.set(0, 0.12, 0);
  stripe.rotation.x = Math.PI / 2;
  group.add(stripe);

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.015, 0.18, 6),
    new THREE.MeshStandardMaterial({ color: 0xcfd3da, roughness: 0.6 })
  );
  pole.position.set(0, 0.03, 0);
  group.add(pole);

  return group;
}

export function createPilingPost(): THREE.Group {
  const group = new THREE.Group();

  const post = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.04, 0.45, 8),
    new THREE.MeshStandardMaterial({ color: 0x6b4023, roughness: 0.85, flatShading: true })
  );
  post.position.set(0, 0.225, 0);
  group.add(post);

  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.045, 0.03, 8),
    new THREE.MeshStandardMaterial({ color: 0x4a4f5c, roughness: 0.7, flatShading: true })
  );
  cap.position.set(0, 0.465, 0);
  group.add(cap);

  return group;
}
