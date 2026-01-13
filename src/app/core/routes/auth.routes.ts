// src/app/auth/auth.routes.ts
import { Routes } from '@angular/router';
import { LoginComponent } from '../../components/auth/login/login.component';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    title: 'Sign In - Event Management'
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];