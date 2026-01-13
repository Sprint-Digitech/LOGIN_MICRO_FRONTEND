import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators as NgValidators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AccountService } from '../../../../shell/src/app/shared/services/account.service';
import { BehaviorSubject, first, forkJoin } from 'rxjs';
import { Login } from '../../../../shell/src/app/shared/services/account.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
// Google
import {
  SocialAuthService,
  GoogleLoginProvider,
  SocialUser,
  GoogleSigninButtonModule,
} from '@abacritt/angularx-social-login';
import { HttpClient } from '@angular/common/http';

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
    RouterOutlet,
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
  backgroundImage: string = "url('/assets/img/teamless.jpg')";
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
    private http: HttpClient,
    private _snackBar: MatSnackBar
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [NgValidators.required, NgValidators.email]],
      password: [
        '',
        [
          NgValidators.required,
          NgValidators.minLength(8),
          NgValidators.maxLength(15),
          NgValidators.pattern(
            '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$'
          ),
        ],
      ],
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
              console.log('Login successful:', response);
              console.log('User:', user);
              debugger;
              localStorage.setItem('token', JSON.stringify(user));
              this.router.navigate(['/authentication/welcome-user']);
              this.reloadPage();
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
    const user: Login = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password,
      rememberMe: false,
    };

    this.loading = true;
    this.accountService
      .login('api/Account/Login', user)
      .pipe(first())
      .subscribe({
        next: (response) => {
          console.log('Login Successfull', response);
          // debugger;
          // this.router.navigate(['/authentication/welcome-user'])
          this.openSnackBar('Login Successful', 'Close', 'success-snackbar');
          const email = response.employee.email;
          // Use forkJoin to call both APIs in parallel if needed,
          // or just the second API if it depends on the first's success.
          // In this case, the second API depends on the first's response,
          // so we're keeping it sequential but demonstrating forkJoin's structure.
          forkJoin({
            employeeLoginDetail: this.accountService
              .logindetail(`api/Account/GetEmployeeRoleDetail?email=${email}`)
              .pipe(first()),
            // You can add more API calls here if they are independent of each other
            // For example: anotherApiCall: this.anotherService.getSomeData()
          }).subscribe({
            next: (results) => {
              const userDetail = results.employeeLoginDetail;
              console.log('Raw response:', userDetail);

              if (userDetail !== undefined) {
                this.loading = false; // <<< UNCOMMENTED: Set loading to false on success
                // this.reloadPage();
                const processedMenus = this.processMenus(
                  userDetail.employeeRoleLoginDtos
                );
              } else {
                this.error = 'Invalid credentials!';
                this.loading = false; // Set loading to false if userDetail is undefined
              }
            },
            error: (detailError) => {
              console.error(
                'Error fetching employee login detail:',
                detailError
              );
              this.error = 'Failed to load user details.';
              this.loading = false; // Set loading to false on error
            },
          });
        },
      });
  }

  reloadPage(): void {
    window.location.reload();
  }
  openSnackBar(message: string, action: string, className: string) {
    this._snackBar.open(message, action, {
      duration: 1500,
      verticalPosition: 'bottom',
      panelClass: [className],
    });
  }

  processMenus(menuData: any[]) {
    let menuMap = new Map();

    menuData.forEach((menu) => {
      if (!menu.menuParentId) {
        // It's a parent menu
        menuMap.set(menu.menuID, {
          icon: 'menu',
          label: menu.menuDisplayName,
          route: menu.menuPath,
          expanded: false,
          submenu: [],
        });
      }
    });

    // Add submenus to their parent menu
    menuData.forEach((menu) => {
      if (menu.menuParentId) {
        const parentMenu = menuMap.get(menu.menuParentId);
        if (parentMenu) {
          parentMenu.submenu.push({
            label: menu.menuDisplayName,
            route: menu.menuPath,
          });
        }
      }
    });

    return Array.from(menuMap.values());
  }
}
