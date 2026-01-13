import { Routes } from '@angular/router';
import { PublicLayoutComponent } from './components/common/public-layout/public-layout.component';
import { AuthenticatedLayoutComponent } from './components/common/authenticated-layout/authenticated-layout.component';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // PUBLIC ROUTES (no header/sidebar)
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      {
        path: 'auth',
        loadChildren: () => import('./core/routes/auth.routes').then(m => m.AUTH_ROUTES)
      },
      {
        path: '',
        redirectTo: 'auth/login',
        pathMatch: 'full'
      }
    ]
  },
  
  // AUTHENTICATED ROUTES (with header/sidebar)
  {
    path: 'admin',
    component: AuthenticatedLayoutComponent,
    canActivate: [AuthGuard],
    loadChildren: () => import('./core/routes/admin.routes').then(m => m.ADMIN_ROUTES)
  },
  
  // Fallback route - redirect to login
  {
    path: '**',
    redirectTo: 'auth/login'
  }
];