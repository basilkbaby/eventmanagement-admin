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
    path: 'orders',
    children: [
      {
        path: '',
        loadComponent: () => import('../../components/tickets/admin-orders/admin-orders.component').then(m => m.AdminOrdersComponent)
      },
      {
        path: 'scan',
        loadComponent: () => import('../../components/tickets/ticket-scan/ticket-scan.component').then(m => m.TicketScanComponent)
      },
      {
        path: ':id',
        loadComponent: () => import('../../components/tickets/ticket-details/ticket-details.component').then(m => m.TicketDetailsComponent)
      }
    ]
  },
  
  // Event-specific tickets
  {
    path: 'events/:eventId/tickets',
    loadComponent: () => import('../../components/tickets/ticket-list/ticket-list.component').then(m => m.TicketListComponent)
  },
  {
    path: 'venues',
    children: [
      {
        path: '',
        loadComponent: () => import('../../components/venue/venues-list/venues-list.component').then(m => m.VenuesListComponent)
      },
      {
        path: 'create',
        loadComponent: () => import('../../components/venue/venue-form/venue-form.component').then(m => m.VenueFormComponent)
      },
      {
        path: 'edit/:id',
        loadComponent: () => import('../../components/venue/venue-form/venue-form.component').then(m => m.VenueFormComponent)
      },
      {
        path: 'seating/:id',
        loadComponent: () => import('../../components/venue/seating-plan/seating-plan.component').then(m => m.SeatingPlanComponent)
      },
      {
        path: 'sectioneditor',
        loadComponent: () => import('../../components/events/seats/seat-section-editor/seat-section-editor.component').then(m => m.SeatSectionEditorComponent)
      },      
      {
        path: 'sectionview',
        loadComponent: () => import('../../components/events/seats/seat-section-view/seat-section-view.component').then(m => m.SeatSectionViewComponent)
      },
      {
        path: 'seateditor/:sectionId',
        loadComponent: () => import('../../components/events/seats/seat-editor/seat-editor.component').then(m => m.SeatEditorComponent)
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
    path: 'reports',
    loadChildren: () => import('./reports.routes').then(m => m.REPORTS_ROUTES)
  },
  {
    path: 'settings',
    loadChildren: () => import('./settings.routes').then(m => m.SETTINGS_ROUTES)
  }
];