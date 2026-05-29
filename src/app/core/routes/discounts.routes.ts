import { Routes } from '@angular/router';

export const DISCOUNTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../../components/discounts/discounts-list/discounts-list.component').then(
        m => m.DiscountsListComponent
      )
  }
];
