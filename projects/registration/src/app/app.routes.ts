import { Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { WelcomeComponent } from './welcome/welcome.component';
import { RegisterFormComponent } from './register-form/register-form.component';
import { InitialSetupComponent } from './initial-setup/initial-setup.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { CompanyGroupComponent } from './company-group/company-group.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { CompanyGroupAddComponent } from './company-group-add/company-group-add.component';
import { CompaniesComponent } from './companies/companies.component';
import { AddCompanyComponent } from './add-company/add-company.component';
import { CompanyDetailsComponent } from './company-details/company-details.component';
import { AddBranchComponent } from './add-branch/add-branch.component';
import { BranchDetailsComponent } from './branch-details/branch-details.component';
import { WorkspaceComponent } from './workspace/workspace.component';
import { AddExistingCompanyComponent } from './add-existing-company/add-existing-company.component';
import { MenuMasterComponent } from './menu-master/menu-master.component';
import { AddMenuMasterComponent } from './add-menu-master/add-menu-master.component';
import { RolesComponent } from './roles/roles.component';
import { RolesAddComponent } from './roles-add/roles-add.component';
import { MenuRoleMappingComponent } from './menu-role-mapping/menu-role-mapping.component';
import { EditMenuRoleMappingComponent } from './edit-menu-role-mapping/edit-menu-role-mapping.component';
import { ResponsibilityListComponent } from './responsibility-list/responsibility-list.component';
import { AddResponsibilityArchMappingListComponent } from './add-responsibility-arch-mapping-list/add-responsibility-arch-mapping-list.component';
import { AddResponsibilityListComponent } from './add-responsibility-list/add-responsibility-list.component';
import { AddResponsibilityMappingListComponent } from './add-responsibility-mapping-list/add-responsibility-mapping-list.component';
import { ResponsibilityArchMappingListComponent } from './responsibility-arch-mapping-list/responsibility-arch-mapping-list.component';
import { ResponsibilityMappingListComponent } from './responsibility-mapping-list/responsibility-mapping-list.component';

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
      { path: 'reset', component: ResetPasswordComponent },
      { path: 'company/companyGroup', component: CompanyGroupComponent },
      {
        path: 'company/updateCompanyGroup/:id',
        component: CompanyGroupAddComponent,
      },
      { path: 'company/list', component: CompaniesComponent },
      {
        path: 'company/update/:companyId',
        component: AddCompanyComponent,
      },
      {
        path: 'company/details/:companyId',
        component: CompanyDetailsComponent,
      },

      {
        path: 'company/addBranch/:companyId',
        component: AddBranchComponent,
      },
      {
        path: 'company/updateBranch/:companyId/:id',
        component: AddBranchComponent,
      },
      {
        path: 'company/branchDetails/:companyId/:id',
        component: BranchDetailsComponent,
      },
      {
        path: 'company/workspace',
        component: WorkspaceComponent,
      },
      {
        path: 'company/add-existing-company',
        component: AddExistingCompanyComponent,
      },
      {
        path: 'MenuMaster/MenuMasterList',
        component: MenuMasterComponent,
      },
      { path: 'MenuMaster/addMenuMaster', component: AddMenuMasterComponent },
      {
        path: 'MenuMaster/updateMenuMaster/:menuID',
        component: AddMenuMasterComponent,
      },
      {
        path: 'MenuMaster/MenuRoleMapping',
        component: MenuRoleMappingComponent,
      },
      {
        path: 'MenuMaster/addMenuRoleMapping',
        component: EditMenuRoleMappingComponent,
      },
      { path: 'userRolesAndPermissions/roles', component: RolesComponent },
      {
        path: 'userRolesAndPermissions/addRoles',
        component: RolesAddComponent,
      },
      {
        path: 'userRolesAndPermissions/updateRoles/:roleID',
        component: RolesAddComponent,
      },
      {
        path: 'userRolesAndPermissions/updateRoles/:roleID',
        component: RolesAddComponent,
      },
      {
        path: 'responsibility/responsibility-list',
        component: ResponsibilityListComponent,
      },
      {
        path: 'addResponsibilityList',
        component: AddResponsibilityListComponent,
      },
      {
        path: 'updateResponsibilityList',
        component: AddResponsibilityListComponent,
      },
      {
        path: 'archResponsibilityMappingList',
        component: ResponsibilityArchMappingListComponent,
      },
      {
        path: 'addArchResponsibilityMappingList',
        component: AddResponsibilityArchMappingListComponent,
      },
      {
        path: 'updateArchResponsibilityMappingList',
        component: AddResponsibilityArchMappingListComponent,
      },
      {
        path: 'mappingResponsibilityList',
        component: ResponsibilityMappingListComponent,
      },
      {
        path: 'addMappingResponsibilityList',
        component: AddResponsibilityMappingListComponent,
      },
      {
        path: 'updateMappingResponsibilityList',
        component: AddResponsibilityMappingListComponent,
      },
    ],
  },
];
