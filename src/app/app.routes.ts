import { Routes } from '@angular/router';
import { PatientAuth } from "./guards/patient-auth.guard";
import { DoctorAuth } from "./guards/doctor-auth.guard";
import { NoLoginAuth } from "./guards/no-login-auth.guard";
import { AdminAuth } from "./guards/admin-auth.guard";

export const routes: Routes = [
    {
        path: 'd',
        canActivate: [DoctorAuth],
        loadComponent: () => import('./d/d.component').then(x => x.DComponent),
        children: [
            {
                path: 'dash',
                redirectTo: '',
            },
            {
                path: '',
                loadComponent: () => import('./d/dash/dash.component').then(x => x.DashComponent),
                children: [
                    {
                        path: '',
                        redirectTo: 'pa',
                        pathMatch: 'full',
                    },
                    {
                        path: 'p',
                        loadComponent: () => import('./d/dash/profile/profile.component').then(x => x.ProfileComponent),
                        data: { animation: 'profile' },
                    },
                    {
                        path: 'p-preview',
                        loadComponent: () => import('./d/dash/profile-preview/profile-preview.component').then(x => x.ProfilePreviewComponent),
                        data: { animation: 'previewProfile' },
                    },
                    {
                        path: 'pa',
                        loadComponent: () => import('./d/dash/pending-appointments/pending-appointments.component').then(
                            x => x.PendingAppointmentsComponent),
                        data: { animation: 'pendingAppointments' },
                    },
                    {
                        path: 'ca',
                        loadComponent: () => import('./d/dash/completed-appointments/completed-appointments.component').then(
                            x => x.CompletedAppointmentsComponent),
                        data: { animation: 'completedAppointments' },
                    },
                    {
                        path: 't',
                        loadComponent: () => import('./d/dash/transactions/transactions.component').then(x => x.TransactionsComponent),
                        data: { animation: 'transactions' },
                    },
                    {
                        path: 'w',
                        loadComponent: () => import('./d/dash/withdraw/withdraw.component').then(x => x.WithdrawComponent),
                        data: { animation: 'withdraw' },
                    },
                    {
                        path: '**',
                        loadComponent: () => import('./d/dash/page-not-found/page-not-found.component').then(x => x.PageNotFoundComponent),
                        data: { animation: 'pageNotFound' },
                    },
                ],
            },
        ],
    },
    {
        path: 'p',
        canActivate: [PatientAuth],
        loadComponent: () => import('./p/p.component').then(x => x.PComponent),
        children: [
            {
                path: 'dash',
                redirectTo: '',
            },
            {
                path: '',
                loadComponent: () => import('./p/dash/dash.component').then(x => x.DashComponent),
                children: [
                    {
                        path: '',
                        redirectTo: 'a',
                        pathMatch: 'full',
                    },
                    {
                        path: 'p',
                        loadComponent: () => import('./p/dash/profile/profile.component').then(x => x.ProfileComponent),
                        data: { animation: 'profile' },
                    },
                    {
                        path: 'doctor',
                        loadComponent: () => import('./p/dash/doctor-details/doctor-details.component').then(x => x.DoctorDetailsComponent),
                        data: { animation: 'doctor' },
                    },
                    {
                        path: 'book',
                        loadComponent: () => import('./p/dash/book/book.component').then(x => x.BookComponent),
                        data: { animation: 'book' },
                    },
                    {
                        path: 'chat',
                        loadComponent: () => import('./p/dash/chat/chat.component').then(x => x.ChatComponent),
                        data: { animation: 'chat' },
                    },
                    {
                        path: 'pay',
                        loadComponent: () => import('./p/dash/pay/pay.component').then(x => x.PayComponent),
                        data: { animation: 'pay' },
                    },
                    {
                        path: 'doctors',
                        loadComponent: () => import('./p/dash/doctors/doctors.component').then(x => x.DoctorsComponent),
                        data: { animation: 'doctors' },
                    },
                    {
                        path: 'suggested-doctors',
                        loadComponent: () => import('./p/dash/suggested-doctors/suggested-doctors.component').then(x => x.SuggestedDoctorsComponent),
                        data: { animation: 'suggested' },
                    },
                    {
                        path: 'a',
                        loadComponent: () => import('./p/dash/appointments/appointments.component').then(x => x.AppointmentsComponent),
                        data: { animation: 'appointments' },
                    },
                    {
                        path: 'trans',
                        loadComponent: () => import('./p/dash/transactions/transactions.component').then(x => x.TransactionsComponent),
                        data: { animation: 'transactions' },
                    },
                    {
                        path: 'w',
                        loadComponent: () => import('./p/dash/withdraw/withdraw.component').then(x => x.WithdrawComponent),
                        data: { animation: 'withdraw' },
                    },
                    {
                        path: '**',
                        loadComponent: () => import('./p/dash/page-not-found/page-not-found.component').then(x => x.PageNotFoundComponent),
                        data: { animation: 'pageNotFound' },
                    },
                ],
            },
        ],
    },
    {
        path: 'a',
        canActivate: [AdminAuth],
        loadComponent: () => import('./a/a.component').then(x => x.AComponent),
        children: [
            {
                path: 'home',
                redirectTo: '',
                pathMatch: 'full',
            },
            {
                path: '',
                loadComponent: () => import('./a/home/home.component').then(x => x.HomeComponent),
                data: { animation: 'home' },
            },
            {
                path: 'p',
                loadComponent: () => import('./a/patients/patients.component').then(x => x.PatientsComponent),
                data: { animation: 'p' },
            },
            {
                path: 'd',
                loadComponent: () => import('./a/all-doctors/all-doctors.component').then(x => x.AllDoctorsComponent),
                data: { animation: 'd' },
                children: [
                    {
                        path: 'p',
                        loadComponent: () => import('./p/dash/doctor-details/doctor-details.component').then(x => x.DoctorDetailsComponent),
                        data: { animation: 'doctor-details-profile' },
                    },
                ],
            },
            {
                path: 'appo',
                loadComponent: () => import('./a/appointments/appointments.component').then(x => x.AppointmentsComponent),
                data: { animation: 'all-appointments' },
            },
            {
                path: 'd-w',
                loadComponent: () =>
                    import('././a/doctor-withdrawals/doctor-withdrawals.component').then(x => x.DoctorWithdrawalsComponent),
                data: { animation: 'doctor-withdrawals' },
            },
            {
                path: 'p-w',
                loadComponent: () =>
                    import('././a/patient-withdrawals/patient-withdrawals.component').then(x => x.PatientWithdrawalsComponent),
                data: { animation: 'patient-withdrawals' },
            },
            {
                path: 's-c',
                loadComponent: () => import('././a/all-specialization-categories/all-specialization-categories.component').then(
                    x => x.AllSpecializationCategoriesComponent),
                data: { animation: 'specialization-categories' },
            },
            {
                path: 'spec',
                loadComponent: () => import('./a/doctors-specializations/doctors-specializations.component').then(
                    x => x.DoctorsSpecializationsComponent),
                data: { animation: 'specializations' },
            },
            {
                path: 'spec-disease-map',
                loadComponent: () =>
                    import('./a/specialization-category-and-disease-mapping/specialization-category-and-disease-mapping.component').then(
                        x => x.SpecializationCategoryAndDiseaseMappingComponent,
                    ),
                data: { animation: 'specialization-and-disease-mapping' },
            },
            {
                path: 'l',
                loadComponent: () => import('././a/all-languages/all-languages.component').then(x => x.AllLanguagesComponent),
                data: { animation: 'languages' },
            },
            {
                path: '**',
                loadComponent: () => import('./a/page-not-found/page-not-found.component').then(x => x.PageNotFoundComponent),
                data: { animation: 'pageNotFound' },
            },
        ],
    }, {
        path: '',
        loadComponent: () => import('./g/g.component').then(x => x.GComponent),
        children: [
            {
                path: '',
                redirectTo: 'home',
                pathMatch: 'full',
            },
            {
                path: 'home',
                loadComponent: () => import('./g/home/home.component').then(x => x.HomeComponent),
            },
            {
                path: 'login',
                loadComponent: () => import('./g/login/login.component').then(x => x.LoginComponent),
                data: { animation: 'login' },
                canActivate: [NoLoginAuth]
            },
            {
                path: 'regis',
                loadComponent: () => import('./g/regis/regis.component').then(x => x.RegisComponent),
            },
            {
                path: 'regis/mail',
                loadComponent: () => import('./g/regis-email/regis-email.component').then(x => x.RegisEmailComponent),
            },
            {
                path: 'reset',
                loadComponent: () => import('./g/reset/reset.component').then(x => x.ResetComponent),
            },
            {
                path: 'reset/mail',
                loadComponent: () => import('./g/reset-email/reset-email.component').then(x => x.ResetEmailComponent),
            },
            {
                path: 'reset/pass',
                loadComponent: () => import('./g/reset-new-pass/reset-new-pass.component').then(x => x.ResetNewPassComponent),
            },
            {
                path: 'about',
                loadComponent: () => import('./g/about/about.component').then(x => x.AboutComponent),
            },
            {
                path: 'faq',
                loadComponent: () => import('./g/faq/faq.component').then(x => x.FaqComponent),
            },
            {
                path: 'disclaimer',
                loadComponent: () => import('./g/disclaimer/disclaimer.component').then(x => x.DisclaimerComponent),
            },
            {
                path: 'm/d',
                loadComponent: () => import('./g/disease/disease.component').then(x => x.DiseaseComponent),
                children: [
                    {
                        path: 'a',
                        loadComponent: () => import('./g/disease/advance/advance.component').then(x => x.AdvanceComponent),
                        children: [
                            {
                                path: 'i',
                                loadComponent: () => import('./g/disease/advance/options/options.component').then(x => x.OptionsComponent),
                            },
                            {
                                path: 'r',
                                loadComponent: () => import('./g/disease/advance/results/results.component').then(x => x.ResultsComponent),
                            },
                        ],
                    },
                ],
            },
            {
                path: 'm/t',
                loadComponent: () => import('./g/tumor/tumor.component').then(x => x.TumorComponent),
                children: [
                    {
                        path: 'i',
                        loadComponent: () => import('./g/tumor/inputs/inputs.component').then(x => x.InputsComponent),
                    },
                    {
                        path: 'r',
                        loadComponent: () => import('./g/tumor/results/results.component').then(x => x.ResultsComponent),
                    },
                ],
            },
            {
                path: '**',
                loadComponent: () => import('./g/page-not-found/page-not-found.component').then(x => x.PageNotFoundComponent),
            },
        ],
    },
];
