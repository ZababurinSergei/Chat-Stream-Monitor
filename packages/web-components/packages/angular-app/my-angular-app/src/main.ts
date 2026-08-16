import { bootstrapApplication, provideProtractorTestingSupport } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import {provideRouter} from '@angular/router';
import routeConfig from './app/app.routes';
import { App } from './app/app';

bootstrapApplication(App, {
        providers: [provideProtractorTestingSupport(), provideRouter(routeConfig)],
}).catch((err) => console.error(err));

