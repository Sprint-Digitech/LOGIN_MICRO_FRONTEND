import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AccountService } from '../../../../shell/src/app/shared/services/account.service';
import { NotificationService } from '../../../../shell/src/app/shared/services/notification.service';
import { BehaviorSubject, first, forkJoin, Observable } from 'rxjs';
import { Login } from '../../../../shell/src/app/shared/services/account.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
// Google
import {
  SocialAuthService,
  GoogleLoginProvider,
  SocialUser,
  GoogleSigninButtonModule,
} from '@abacritt/angularx-social-login';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { CommonModule } from '@angular/common';
import { RequiredNemoComponent } from 'required-nemo-fovestta';
import { NemoMessageEmailComponent } from 'nemo-message-email-fovestta';
import { NemoMaxMessageComponent } from 'nemo-max-message-fovestta';
import { PasswordNemoComponent } from 'password-nemo';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatAutocompleteModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatRadioModule,
    MatIconModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatListModule,
    MatDividerModule,
    GoogleSigninButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    RequiredNemoComponent,
    PasswordNemoComponent,
    RouterModule,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'login';
  loginForm: FormGroup;
  user: SocialUser | null = null;
  hidePassword = true;
  loading = false;
  backgroundImage: string =
    "linear-gradient(rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.8)),url('/assets/img/teamless.jpg')";
  submitted = false;
  returnUrl: string = '';
  error = '';
  login$ = new BehaviorSubject<boolean>(false);

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private accountService: AccountService,
    private authService: SocialAuthService,
    private notificationService: NotificationService,
    private http: HttpClient,
    private _snackBar: MatSnackBar
  ) {
    if (this.accountService.userValue) {
      this.router.navigate(['/welcome']);
    }
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: [''],
      rememberMe: [false],
    });
  }

  // convenience getter for easy access to form fields
  get f() {
    return this.loginForm.controls;
  }

  ngOnInit(): void {
    this.authService.authState.subscribe((user) => {
      if (user) {
        this.accountService.GoogleLogin(user.idToken).subscribe(
          (response) => {
            if (response) {
              const email = user.email;
              this.accountService
                .logindetail(`api/Account/GetEmployeeRoleDetail?email=${email}`)
                .pipe(first())
                .subscribe((userDetail) => {
                  if (userDetail) {
                    //checking for companyid
                    if (!userDetail.companyId) {
                      this.router.navigate(['employee/employeeOnboarding']);
                      return;
                    }

                    // DO NOT REMAP srNo!
                    const processedRoles =
                      userDetail.employeeRoleLoginDtos ?? [];
                    const processedMenus = this.processMenus(processedRoles);

                    const finalUser = {
                      ...userDetail,
                      employeeRoleLoginDtos: processedRoles,
                    };

                    sessionStorage.setItem(
                      'menus',
                      JSON.stringify(processedMenus)
                    );
                    sessionStorage.setItem('user', JSON.stringify(finalUser));
                    this.accountService.setUser(finalUser);
                    this.accountService.setMenuData(processedMenus);

                    this.router.navigate(['/welcome']);
                  }
                });
            } else {
              this.router.navigate(['/login']);
            }
          },
          (error) => {
            console.error('Login failed:', error);
          }
        );
      }
    });
  }

  signInWithGoogle(): void {
    this.authService.signIn(GoogleLoginProvider.PROVIDER_ID);
  }

  submit(): void {
    this.submitted = true;
    this.error = '';
    if (this.loginForm.invalid) {
      this.notificationService.showError('Please fill all required fields.');
      return;
    }
    const user: Login = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password,
      rememberMe: this.loginForm.value.rememberMe,
    };
    this.loading = true;

    this.accountService
      .login('api/Account/Login', user)
      .pipe(first())
      .subscribe({
        next: (loginResponse) => {
          const email = loginResponse?.employee?.email;

          forkJoin({
            employeeLoginDetail: this.accountService
              .logindetail(`api/Account/GetEmployeeRoleDetail?email=${email}`)
              .pipe(first()),
          }).subscribe({
            next: (results) => {
              const userDetail = results.employeeLoginDetail;
              if (userDetail !== undefined) {
                //check for companyid
                // if (!userDetail.companyId) {
                //   const fullName = userDetail.firstName?.trim() || '';
                //   let firstName = fullName;
                //   let lastName = '';

                //   if (fullName.includes(' ')) {
                //     const parts = fullName.split(' ');
                //     firstName = parts[0];
                //     lastName = parts.slice(1).join(' ');
                //   }

                //   // const onboardingUser = {
                //   //   ...userDetail,
                //   //   firstName: firstName,
                //   //   lastName: lastName,
                //   // };

                //   // sessionStorage.setItem(
                //   //   'onboardingUser',
                //   //   JSON.stringify(onboardingUser)
                //   // );
                //   // this.router.navigate(['employee/employeeOnboarding'], {
                //   //   state: { userDetail },
                //   // });
                //   this.loading = false;
                //   this.router.navigate(['register/welcome']);
                //   return;
                // }
                const branchId =
                  userDetail.companyBranchId || userDetail.branchID || '';
                // Do not substitute email when employeId is missing; keep it null
                const employeeId = userDetail.employeId ?? null;
                const statusId = userDetail.initialSetupStatusID;
                const processedRoles = userDetail.employeeRoleLoginDtos ?? [];
                const processedMenus = this.processMenus(processedRoles);

                const finalUser = {
                  ...userDetail,
                  employeeRoleLoginDtos: processedRoles,
                  companyBranchId: branchId,
                  employeId: employeeId,
                };

                sessionStorage.setItem('menus', JSON.stringify(processedMenus));
                sessionStorage.setItem('user', JSON.stringify(finalUser));
                this.accountService.setUser(finalUser);
                this.accountService.setMenuData(processedMenus);
                // this.router.navigate(['/register/welcome']);
                this.callInitialSetupStatus(branchId).subscribe({
                  next: (res: any) => {
                    if (res && res.isSetupComplete === false) {
                      this.router.navigate(['/initial-setup'], {
                        replaceUrl: true,
                      });
                    } else {
                      this.router.navigate(['/welcome'], {
                        replaceUrl: true,
                      });
                    }
                    this.loading = false;
                  },
                  error: () => {
                    console.error('Error fetching setup status');
                    this.router.navigate(['/welcome'], {
                      replaceUrl: true,
                    });
                    this.loading = false;
                  },
                });
              } else {
                const msg = 'Invalid credentials!';
                this.error = msg;
                this.notificationService.showError(msg);
                this.loading = false;
              }
            },
            error: (detailError) => {
              const msg = this.handleError(
                detailError,
                'Failed to load user details.'
              );
              this.error = msg;
              this.notificationService.showError(msg);
              this.loading = false;
            },
          });
        },
        error: (loginError) => {
          const msg = this.handleError(
            loginError,
            'Login failed. Please try again.'
          );
          this.error = msg;
          this.notificationService.showError(msg);
          this.loading = false;
        },
      });
  }

  private handleError(
    err: any,
    fallback: string = 'An error occurred'
  ): string {
    try {
      // Check if server is down (status 0 or no status)
      if (err instanceof HttpErrorResponse) {
        if (err.status === 0 || !err.status) {
          return 'Server is down. Please contact support.';
        }
      } else if (
        err?.status === 0 ||
        (!err?.status && err?.error === undefined)
      ) {
        return 'Server is down. Please contact support.';
      }

      if (err?.error?.errors) {
        return typeof err.error.errors === 'string'
          ? err.error.errors
          : fallback;
      }
      if (typeof err?.error === 'string') {
        return err.error;
      }
      if (err?.error?.Error?.Message) {
        return err.error.Error.Message;
      }
      if (err?.error?.message) {
        return err.error.message;
      }
      if (err?.message) {
        return err.message;
      }
    } catch {}
    return fallback;
  }

  private callInitialSetupStatus(branchId: string): Observable<any> {
    const params = { companyBranchId: branchId };

    return this.accountService.step('InitialSetup/Initialstatus', params);
  }

  reloadPage(): void {
    window.location.reload();
  }

  processMenus(menuData: any[]): any[] {
    const menuMap = new Map<number, any>();

    // Collect root menus (menuParentId === null)
    menuData.forEach((menu) => {
      if (!menu.menuParentId) {
        menuMap.set(menu.menuID, {
          menuID: menu.menuID,
          menuName: menu.menuName,
          menuDisplayName: menu.menuDisplayName,
          menuPath: menu.menuPath,
          menuParentId: menu.menuParentId,
          srNo: menu.srNo, // FROM DATABASE, not remapped
          submenu: [],
        });
      }
    });

    // Add submenus under their parent
    menuData.forEach((menu) => {
      if (menu.menuParentId) {
        const parentMenu = menuMap.get(menu.menuParentId);
        if (parentMenu) {
          parentMenu.submenu.push({
            menuID: menu.menuID,
            menuName: menu.menuName,
            menuDisplayName: menu.menuDisplayName,
            menuPath: menu.menuPath,
            menuParentId: menu.menuParentId,
            srNo: menu.srNo, // FROM DATABASE, not remapped
          });
        }
      }
    });

    // Sort root menus by srNo ascending
    const resultMenus = Array.from(menuMap.values());
    resultMenus.sort((a, b) => (a.srNo ?? 0) - (b.srNo ?? 0));

    // Sort submenus by srNo ascending
    resultMenus.forEach((menu) => {
      if (menu.submenu && menu.submenu.length > 0) {
        menu.submenu.sort((a: any, b: any) => (a.srNo ?? 0) - (b.srNo ?? 0));
      }
    });
    return resultMenus;
  }
}
