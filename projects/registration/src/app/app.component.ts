import {
  HttpErrorResponse,
  HttpClient,
  HttpHeaders,
} from '@angular/common/http';
import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
  FormControl,
  AsyncValidatorFn,
} from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { Router, ActivatedRoute, RouterOutlet } from '@angular/router';
import { NotificationService } from '../../../../shell/src/app/shared/services/notification.service';
import { UtilityService } from '../../../../shell/src/app/shared/services/utility.service';
import { AccountService } from '../../../../shell/src/app/shared/services/account.service';
import { Observable, of, Subject, Subscription } from 'rxjs';
import { map, catchError, takeUntil, finalize } from 'rxjs/operators';
import * as CryptoJS from 'crypto-js';
import { ViewChildren, QueryList } from '@angular/core';
import { MatFormField } from '@angular/material/form-field';
import { Location } from '@angular/common';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
// import { DobValidationComponent } from '../validation/dob-validation/dob-validation.component';
import { MatRadioModule } from '@angular/material/radio';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
// import { ValidationMessagesNemoComponent, ValidationMessagesNemoModule } from 'validation-messages-nemo';
import { NemoPasswordValidatorComponent } from 'nemo-password-validator';
import { PasswordNemoComponent } from 'password-nemo';
import { RequiredNemoComponent } from 'required-nemo-fovestta';
import { NemoMinMessageComponent } from 'nemo-min-message-fovestta';
import { NemoMaxMessageComponent } from 'nemo-max-message-fovestta';
import { NemoMobComponent } from 'nemo-mob-fovestta';
import { NemoDobValiComponent } from 'nemo-dob-vali-fovestta';
import { GoogleSigninButtonModule } from '@abacritt/angularx-social-login';
import { NemoNumericValueComponent } from 'nemo-numeric-value-fovestta';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatStepperModule } from '@angular/material/stepper';
import { MatProgressBarModule } from '@angular/material/progress-bar';
// Import library form components
import {
  FvEntryFieldComponent,
  FvEmailFieldComponent,
  FvPhoneFieldComponent,
  FvPasswordFieldComponent,
  FvDropdownComponent,
} from '@fovestta2/web-angular';
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
    MatStepperModule,
    MatProgressBarModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {}
