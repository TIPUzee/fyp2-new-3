import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { PatientAuth } from "./guards/patient-auth.guard";
import { DoctorAuth } from "./guards/doctor-auth.guard";
import { AdminAuth } from "./guards/admin-auth.guard";
import { NoLoginAuth } from "./guards/no-login-auth.guard";
import { provideHttpClient, withFetch } from "@angular/common/http";

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(routes), provideAnimations(), PatientAuth, DoctorAuth, AdminAuth, NoLoginAuth,
        provideHttpClient(withFetch())
    ],
};
