import { Routes } from '@angular/router';
import { AuthGuard } from '../guards/auth.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('../../components/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
  },
  // Event Management Routes
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
      {
        path: ':id',
        loadComponent: () => import('../../components/events/event-details/event-details.component').then(m => m.EventDetailsComponent)
      },
      {
        path: 'seatmap/:eventId',
        loadComponent: () => import('../../components/seat-map-admin/seat-map-admin.component').then(m => m.SeatMapAdminComponent)
      }
    ]
  },
  {
    path: 'sections',
    canActivate: [AuthGuard],
    data: { roles: ['SuperAdmin'] },
    loadComponent: () => import('../../components/seat-section-manager/seat-section-manager.component').then(m => m.SeatSectionManagerComponent)
  },
  {
    path: 'orders',
    children: [
      {
        path: '',
        loadComponent: () => import('../../components/tickets/admin-orders/admin-orders.component').then(m => m.AdminOrdersComponent)
      }
    ]
  },
  {
    path: 'users',
    loadChildren: () => import('./users.routes').then(m => m.USERS_ROUTES)
  },
  {
    path: 'coupons',
    loadChildren: () => import('./coupons.routes').then(m => m.Coupons_Routes)
  },
  {
    path: 'discounts',
    loadChildren: () => import('./discounts.routes').then(m => m.DISCOUNTS_ROUTES)
  },
  {
    path: 'settings',
    loadChildren: () => import('./settings.routes').then(m => m.SETTINGS_ROUTES)
  }
];