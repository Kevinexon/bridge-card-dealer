import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'stolik',
  },
  {
    path: 'stolik',
    loadComponent: () => import('./main-page/feature/table/table').then((c) => c.Table),
  },
  {
    path: '**',
    redirectTo: 'stolik',
  },
];
