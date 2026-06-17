# Despliegue

El portfolio es una **SPA estática** (Angular). Se compila a archivos estáticos que cualquier hosting de sitios estáticos puede servir.

## Build de producción

```bash
pnpm install
pnpm exec nx build MyPortfolio --configuration=production
```

Salida: **`dist/apps/MyPortfolio/browser`** — esta es la carpeta a publicar.

- Bundle inicial ~74 kB (gzip). Three.js se carga en un *chunk* aparte (~256 kB gzip) solo cuando hace falta.
- `public/` (CV en PDF, `favicon.ico`, `robots.txt`, `_redirects`, `og-image.png`, modelos 3D) se copia tal cual a la raíz del sitio.

## Fallback SPA (importante)

Como es una SPA, el servidor debe devolver `index.html` para cualquier ruta desconocida.
Ya se incluye un `public/_redirects` con `/* /index.html 200` (lo entienden **Netlify** y **Cloudflare Pages**). Para otros hosts, ver abajo.

## Guías rápidas por host

> Carpeta de publicación en todos: `dist/apps/MyPortfolio/browser`
> Comando de build: `pnpm exec nx build MyPortfolio --configuration=production`

### Netlify / Cloudflare Pages
- Build command: el de arriba. Publish directory: `dist/apps/MyPortfolio/browser`.
- El `_redirects` ya gestiona el fallback SPA. Nada más que hacer.

### Vercel
- Framework preset: *Other*. Output directory: `dist/apps/MyPortfolio/browser`.
- Añade un `vercel.json` en la raíz del repo para el fallback:
  ```json
  { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
  ```

### GitHub Pages
- Sirve desde un subdirectorio (`https://usuario.github.io/repo/`), así que hay que ajustar la base:
  ```bash
  pnpm exec nx build MyPortfolio --configuration=production --base-href=/NOMBRE_DEL_REPO/
  ```
- Sube el contenido de `dist/apps/MyPortfolio/browser` a la rama `gh-pages`.
- Para el fallback SPA, copia `index.html` como `404.html` en la salida.

## Tras conocer el dominio: arreglar la vista previa social

En `apps/MyPortfolio/src/index.html`, las etiquetas `og:image` / `twitter:image` usan una ruta relativa (`og-image.png`). LinkedIn y Facebook prefieren **URL absolutas**. Cuando tengas el dominio, cámbialas a la URL completa y añade la del sitio:

```html
<meta property="og:url" content="https://TU-DOMINIO.com/" />
<meta property="og:image" content="https://TU-DOMINIO.com/og-image.png" />
<meta name="twitter:image" content="https://TU-DOMINIO.com/og-image.png" />
```

Valida la vista previa en https://www.linkedin.com/post-inspector/ tras desplegar.

## Rendimiento / móvil

La escena detecta el dispositivo (`scene/quality.ts`) y baja efectos en móviles/equipos modestos (sin bloom, menos partículas, pixel ratio limitado), así que el mundo se ve completo y fluido en cualquier sitio.
