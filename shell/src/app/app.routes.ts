import { Routes } from '@angular/router';

export const routes: Routes = [
     {
        path:"login",
        loadComponent: () => import ('../../../projects/login/src/app/app.component').then(m => m.AppComponent)
    }
];
