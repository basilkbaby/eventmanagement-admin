import { Routes } from '@angular/router';
import { UserListComponent } from '../../components/users/users-list/user-list.component';

export const USERS_ROUTES: Routes = [
  {
    path: '',
    component: UserListComponent
  }
];