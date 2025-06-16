import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AccountService } from '../app/services/account.service';
import { BehaviorSubject, first } from 'rxjs';
import { Login } from '../app/services/account.service';
import { MatSnackBar } from '@angular/material/snack-bar';
// Google
import { SocialAuthService, GoogleLoginProvider, SocialUser, GoogleSigninButtonModule } from '@abacritt/angularx-social-login';
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
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatListModule,
    MatDividerModule,
    MatCardModule,
    GoogleSigninButtonModule,
    MatProgressSpinnerModule,
    RequiredNemoComponent,
    NemoMessageEmailComponent,
    NemoMaxMessageComponent,
    PasswordNemoComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'login';
   loginForm: FormGroup;
  user: SocialUser | null = null;
  hidePassword = true;
  loading = false;
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
      private http:HttpClient,
      private _snackBar: MatSnackBar,
    ) {

      this.loginForm = this.formBuilder.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8),Validators.maxLength(15),Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$')]],
        rememberMe: [false]
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
              if(response){
                console.log('Login successful:', response);
                console.log('User:', user);
                debugger
                localStorage.setItem('token',JSON.stringify(user))
                this.router.navigate(['/authentication/welcome-user'])
                this.reloadPage();
              }
              else{
                this.router.navigate(['/authentication/login'])
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
            console.log("Login Successfull", response);
            debugger;
            this.router.navigate(['/authentication/welcome-user'])
            const email = response.employee.email;
        }},);
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
}
