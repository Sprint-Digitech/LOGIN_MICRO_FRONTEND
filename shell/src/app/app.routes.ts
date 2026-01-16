import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('../../../projects/login/src/app/app.component').then(
        (m) => m.AppComponent
      ),
  },
  {
    path: '',
    loadChildren: () =>
      import('../../../projects/registration/src/app/app.routes').then(
        (m) => m.routes
      ),
  },
];
