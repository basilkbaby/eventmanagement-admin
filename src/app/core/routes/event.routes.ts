import { Routes } from '@angular/router';

export const eventRoutes: Routes = [
  {
    path: 'events',
    children: [
      {
        path: '',
        loadComponent: () => import('../../components/events/event-list/event-list.component').then(m => m.EventListComponent)
      },
      {
        path: 'create',
        loadComponent: () => import('../../components/events/event-form/event-form.component').then(m => m.EventFormComponent)
      },
      {
        path: ':id/edit',
        loadComponent: () => import('../../components/events/event-form/event-form.component').then(m => m.EventFormComponent)
      },
    //   {
    //     path: ':id',
    //     loadComponent: () => import('../components/event-details/event-details.component').then(m => m.EventDetailsComponent)
    //   }
    ]
  }
];