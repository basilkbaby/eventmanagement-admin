import { APP_INITIALIZER, ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
import { AutoLoginService } from './core/services/auto-login.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes), 
    provideAnimationsAsync(),
    provideHttpClient(
      withInterceptors([jwtInterceptor]) // Use functional interceptor
    ),
    {
      provide: APP_INITIALIZER,
      useFactory: (autoLogin: AutoLoginService) => () => autoLogin.initializeApp(),
      deps: [AutoLoginService],
      multi: true
    }
  ]
};
