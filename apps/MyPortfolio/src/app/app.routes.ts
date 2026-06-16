import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./scene-host/scene-host.component').then(
        (m) => m.SceneHostComponent
      ),
  },
];
