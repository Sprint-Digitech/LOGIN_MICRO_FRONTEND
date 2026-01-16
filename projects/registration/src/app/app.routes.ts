import { Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { WelcomeComponent } from './welcome/welcome.component';
import { RegisterFormComponent } from './register-form/register-form.component';
import { InitialSetupComponent } from './initial-setup/initial-setup.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { CompanyGroupComponent } from './company-group/company-group.component';

export const routes: Routes = [
  {
    path: '',
    component: AppComponent, // 1. Load the Registration App Frame
    children: [
      {
        path: 'register', // Default path (matches /register)
        component: RegisterFormComponent, // <--- Shows the form!
      },
      {
        path: 'welcome', // 2. Match 'welcome'
        component: WelcomeComponent,
      },
      {
        path: 'initial-setup',
        component: InitialSetupComponent,
      },
      { path: 'forgot-password', component: ForgotPasswordComponent },
      { path: 'company/companyGroup', component: CompanyGroupComponent },
    ],
  },
];
