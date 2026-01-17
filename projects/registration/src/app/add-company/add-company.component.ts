import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators, } from '@angular/forms';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { AddCompanyDto } from 'src/app/_models/companyDto.model';
import { RepositoryService } from 'src/app/shared/services/repository.service';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { debounceTime, switchMap } from 'rxjs/operators';
import { DateSettingsService } from 'src/app/shared/services/date-settings.service';
import { FormConfig } from '@fovestta2/web-angular';
import { UtilityService } from 'src/app/shared/services/utility.service';

export function notOnlyWhitespace(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const isWhitespace = (control.value || '').trim().length === 0;
    return isWhitespace ? { notOnlyWhitespace: true } : null;
  };
}
export function companyGroupRequiredValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    return control.value === '' ? { required: true } : null;
  };
}
@Component({
  selector: 'app-add-company',
  templateUrl: './add-company.component.html',
  styleUrls: ['./add-company.component.scss'],
})
export class AddCompanyComponent implements OnInit {
  companyData: any;
  addCompanyForm: FormGroup;
  // Logo related properties
  logoFile: File | null = null;
  logoPreview: string | null = null;
  logoError: string = '';
  maxFileSize = 2 * 1024 * 1024; // 2MB in bytes
  allowedFileTypes = ['image/png', 'image/jpeg', 'image/jpg'];
  readonly requiredLogoWidth = 132;
  readonly requiredLogoHeight = 36;
  readonly aspectRatioTolerance = 0.08;
  logoDataUrl: string | null = null;
  companyGroups: any;
  companies: any[] = [];
  companyId: any;
  companyFormConfig!: FormConfig;
  addCompanyFormLoaded: boolean = false;

  get companyNameVal(): FormControl {
    return this.addCompanyForm.get('tCompanyName') as FormControl;
  }
  get industryName(): FormControl {
    return this.addCompanyForm.get('tIndustry') as FormControl;
  }
  get dateFormat(): FormControl {
    return this.addCompanyForm.get('tDateFormat') as FormControl;
  }
  get dateFieldSeperator(): FormControl {
    return this.addCompanyForm.get('tDateFieldSeperator') as FormControl;
  }
  get status(): FormControl {
    return this.addCompanyForm.get('nStatus') as FormControl;
  }
  get companyCode(): FormControl {
    return this.addCompanyForm.get('companyCode') as FormControl;
  }
  get companyGroupId(): FormControl {
    return this.addCompanyForm.get('companyGroupId') as FormControl;
  }

  get timeformat(): FormControl {
    return this.addCompanyForm.get('timeformat') as FormControl;
  }
  get timezone(): FormControl {
    return this.addCompanyForm.get('timezone') as FormControl;
  }

  get adjustForDST(): FormControl {
    return this.addCompanyForm.get('adjustForDST') as FormControl;
  }

  get displayFormat(): FormControl {
    return this.addCompanyForm.get('displayFormat') as FormControl;
  }
  get companylogo(): FormControl {
    return this.addCompanyForm.get('companylogo') as FormControl;
  }

  constructor(
    private companiesData: RepositoryService,
    private CompanyData: RepositoryService,
    private notificationService: NotificationService,
    private router: Router,
    private location: Location,
    private fb: FormBuilder,
    private settingsService: DateSettingsService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {
    this.addCompanyForm = this.fb.group({
      tCompanyName: new FormControl('', [
        Validators.required,
        notOnlyWhitespace(),
        this.checkDuplicateName.bind(this),
      ]),
      tIndustry: new FormControl('', [
        Validators.required,
        notOnlyWhitespace(),
        this.checkDuplicateCode.bind(this),
      ]),
      tDateFormat: new FormControl('', [Validators.required]),
      tDateFieldSeperator: new FormControl('', [Validators.required]),
      nStatus: new FormControl('1'),
      adjustForDST: new FormControl(false),
      // companyCode: new FormControl('', {
      //   validators: [Validators.required],
      //   asyncValidators: [this.companyCodeValidator.bind(this)],
      // }),
      companyCode: new FormControl('', {
        validators: [Validators.required],
        asyncValidators: [this.companyCodeValidator.bind(this)],
      }),
      companyGroupId: new FormControl('', [
        Validators.required,
        companyGroupRequiredValidator(),
      ]),
      timezone: new FormControl('', [Validators.required]),
      timeformat: new FormControl('', [Validators.required]),
      displayFormat: new FormControl('', [Validators.required]),
      companylogo: new FormControl('', [Validators.required]),
    });
    this.updatePreview();
  }

  ngOnInit(): void {
    this.getCompanyGroup();
    this.getCompanies();
    this.updatePreview();
    this.addCompanyForm.valueChanges.subscribe(values => {
      this.selectedDateFormat = values.tDateFormat || 'DD/MM/YYYY';
      this.seprator = values.tDateFieldSeperator || '/';
      this.selectedTimeFormat = values.timeformat || '24-hour';
      this.selectedTimeDateFormat = values.displayFormat || 'HH:mm:ss';
      this.selectedTimezone = this.getTimezoneLabel(values.timezone);

      this.updatePreview();
      this.cdr.detectChanges();
    });

    setTimeout(() => {
      this.initializeFormConfig();
      this.addCompanyFormLoaded = true;
      this.route.params.subscribe(params => {
        this.companyId = params['companyId'];
        if (this.companyId) {
          this.companyFormConfig.formTitle = 'Update Company';
          this.companyFormConfig.submitLabel = 'Update';
          this.getCompanyData();
        } else {
          this.companyFormConfig.formTitle = 'Add Company';
          this.companyFormConfig.submitLabel = 'Submit';
        }
      });
    }, 300);
  }
  getTimezoneLabel(value: string): string {
    const timezoneMap: any = {
      UTC: 'UTC (Coordinated Universal Time)',
      GMT: 'GMT (Greenwich Mean Time)',
      IST: 'IST (Indian Standard Time, UTC+5:30)',
      ICT: 'ICT (Indochina Time, UTC+7:00)',
      BST: 'BST (Bangladesh Standard Time, UTC+6:00)',
      CST: 'CST (China Standard Time, UTC+8:00)',
      SGT: 'SGT (Singapore Time, UTC+8:00)',
    };

    return timezoneMap[value] || value;
  }

  initializeFormConfig() {
    this.companyFormConfig = {
      formTitle: 'Add Company',
      maxColsPerRow: 5,
      sections: [
        {
          fields: [
            {
              name: 'companylogo',
              label: 'Upload Logo File',
              type: 'file',
              accept: 'image/*',
              colSpan: 5,
              hint: 'Upload employee photo (JPG, PNG)',
              validations: [{ type: 'required', message: 'Company Logo is required' }],
              onChange: (event: any) => this.onLogoSelected(event)
            },
          ],
        },

        {
          fields: [
            {
              name: 'tCompanyName',
              label: 'Company Name',
              type: 'text',
              maxLength: 50,
              colSpan: 1,
              validations: [{ type: 'required', message: 'Company Name is required' },
              { type: 'maxLength', value: 50, message: 'Max 50 characters' },
              {
                type: 'pattern',
                value: '^[a-zA-Z\\s]*$',
                message: 'Company Name should contain alphabets only'
              }],
            },
            {
              name: 'companyCode',
              label: 'Company Code',
              type: 'text',
              colSpan: 1,
              validations: [{ type: 'required', message: 'Company Code is required' }],
            },
            {
              name: 'companyGroupId',
              label: 'Company Group',
              type: 'select',
              colSpan: 1,
              options: this.companyGroups?.map((group: any) => ({
                label: group.companyGroupName,
                value: group.id
              })) || [],
              validations: [{ type: 'required', message: 'Company Group is required' }],
            },
            {
              name: 'tIndustry',
              label: 'Industry',
              type: 'text',
              colSpan: 1,
              validations: [{ type: 'required', message: 'Industry is required' }],
            },
          ],
        },
        {
          fields: [
            {
              name: 'tDateFormat',
              label: 'Date Format',
              type: 'select',
              colSpan: 1,
              options: [
                { label: 'DD/MM/YYYY', value: 'DD/MM/YYYY' },
                { label: 'MM/DD/YYYY', value: 'MM/DD/YYYY' },
                { label: 'YYYY/DD/MM', value: 'YYYY/DD/MM' },
                { label: 'DD.MM.YYYY', value: 'DD.MM.YYYY' },
                { label: 'DD-MMM-YYYY', value: 'DD-MMM-YYYY' },
                { label: 'YYYY-DD-MM', value: 'YYYY-DD-MM' },
                { label: 'YYYY/MM/DD', value: 'YYYY/MM/DD' },
                { label: 'DD/MM/YY', value: 'DD/MM/YY' },
              ],
              value: 'DD/MM/YYYY',
              validations: [{ type: 'required', message: 'Please select Date Format' }],
              onChange: (value: string) => {
                this.selectedDateFormat = value;
                this.updatePreview();
              }
            },
            {
              name: 'tDateFieldSeperator',
              label: 'Date Field Separator',
              type: 'select',
              colSpan: 1,
              options: [
                { label: '/', value: '/' },
                { label: '-', value: '-' },
                { label: '.', value: '.' },
              ],
              value: '/',
              validations: [{ type: 'required', message: 'Please select a separator' }],
              onChange: (value: string) => {
                this.seprator = value;
                this.updatePreview();
              }
            },
            {
              name: 'timeformat',
              label: 'Time Format',
              type: 'select',
              colSpan: 1,
              options: [
                { label: '12-hour', value: '12-hour' },
                { label: '24-hour', value: '24-hour' },
              ],
              value: '24-hour',
              validations: [{ type: 'required', message: 'Time Format is required' }],
              onChange: (value: string) => {
                this.selectedTimeFormat = value;
                this.updatePreview();
              }
            },
            {
              name: 'displayFormat',
              label: 'Time Display Format',
              type: 'select',
              colSpan: 1,
              options: [
                { label: 'Hours:Minutes:Seconds', value: 'HH:mm:ss' },
                { label: 'Hours:Minutes', value: 'HH:mm' },
              ],
              value: 'HH:mm:ss',
              validations: [{ type: 'required', message: 'Time Display Format is required' }],
              onChange: (value: string) => {
                this.selectedTimeDateFormat = value;
                this.updatePreview();
              }
            },
            {
              name: 'timezone',
              label: 'Timezone',
              type: 'select',
              colSpan: 1,
              options: [
                { label: 'UTC (Coordinated Universal Time)', value: 'UTC' },
                { label: 'GMT (Greenwich Mean Time)', value: 'GMT' },
                { label: 'IST (Indian Standard Time, UTC+5:30)', value: 'IST' },
                { label: 'ICT (Indochina Time, UTC+7:00)', value: 'ICT' },
                { label: 'BST (Bangladesh Standard Time, UTC+6:00)', value: 'BST' },
                { label: 'CST (China Standard Time, UTC+8:00)', value: 'CST' },
                { label: 'SGT (Singapore Time, UTC+8:00)', value: 'SGT' },
              ],
              value: 'IST',
              validations: [{ type: 'required', message: 'Timezone is required' }],
              onChange: (value: string) => {
                this.selectedTimezone = this.getTimezoneLabel(value);
                this.updatePreview();
              }
            },
            {
              name: 'adjustForDST',
              label: 'Adjust DST',
              type: 'radio',
              layout: 'horizontal',
              colSpan: 1,
              value: '1',
              options: [
                { label: 'Active', value: 'true' },
                { label: 'Inactive', value: 'false' }
              ],
              validations: [{ type: 'required', message: 'Adjust DST is required' }],
            },
            {
              name: 'nStatus',
              label: 'Status',
              type: 'radio',
              layout: 'horizontal',
              colSpan: 1,
              value: '1',
              options: [
                { label: 'Active', value: '1' },
                { label: 'Inactive', value: '0' }
              ],
            },
          ],
        },
      ],

      // Buttons and handlers
      submitLabel: 'Submit',
      resetLabel: 'Reset',
      cancelLabel: 'Cancel',

      onSubmit: (data) => {
        this.sendCompaniesData(data);
      },
      onReset: () => {
      },
      onCancel: () => {
        this.goBack();
      },
    };
  }

  onLogoSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.validateLogo(file);
    }
  }

  async validateLogo(file: File): Promise<void> {
    this.logoError = '';

    // Check file type
    if (!this.allowedFileTypes.includes(file.type)) {
      this.logoError = 'Please select a valid image file (PNG, JPG, JPEG)';
      return;
    }

    // Check file size
    if (file.size > this.maxFileSize) {
      this.logoError = 'File size should be less than 2MB';
      return;
    }

    try {
      const dataUrl = await this.fileToBase64(file);
      const image = await this.loadImage(dataUrl);

      if (!this.isAspectRatioValid(image.width, image.height)) {
        const ratio = (this.requiredLogoWidth / this.requiredLogoHeight).toFixed(2);
        this.logoError = `Logo must maintain ${this.requiredLogoWidth}x${this.requiredLogoHeight}px (≈${ratio}:1 ratio) to fit the sidebar.`;
        this.clearLogoSelection();
        return;
      }

      const resizedDataUrl = this.resizeImage(image, this.requiredLogoWidth, this.requiredLogoHeight);
      this.logoFile = file;
      setTimeout(() => {
        this.logoPreview = resizedDataUrl;
        this.logoDataUrl = resizedDataUrl;
        this.addCompanyForm.patchValue({ companylogo: resizedDataUrl });
        this.addCompanyForm.get('companylogo')?.markAsTouched();
        this.cdr.detectChanges();
      });
    } catch (error) {
      this.notificationService.showError('Failed to process logo file');
      this.logoError = 'Error processing the image file. Please try another logo.';
      this.clearLogoSelection();
    }
  }

  removeLogo(): void {
    this.logoFile = null;
    this.logoPreview = null;
    this.logoError = '';
    this.logoDataUrl = null;
    this.addCompanyForm.patchValue({ companylogo: '' });
    this.addCompanyForm.get('companylogo')?.markAsTouched();
  }

  // Convert file to base64 for API submission
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result as string;
        // Return the complete base64 string with data URL prefix
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  }

  private loadImage(dataUrl: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = dataUrl;
    });
  }

  private resizeImage(image: HTMLImageElement, width: number, height: number): string {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return image.src;
    }
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL('image/png');
  }

  private isAspectRatioValid(width: number, height: number): boolean {
    if (!width || !height) {
      return false;
    }
    const expected = this.requiredLogoWidth / this.requiredLogoHeight;
    const actual = width / height;
    return Math.abs(actual - expected) <= this.aspectRatioTolerance;
  }

  private clearLogoSelection(): void {
    this.logoFile = null;
    this.logoPreview = null;
    this.logoDataUrl = null;
    this.addCompanyForm.patchValue({ companylogo: '' });
    this.addCompanyForm.get('companylogo')?.markAsTouched();
  }
  getCompanies = () => {
    // const apiAddress: string = 'api/Company/CompanyList';
    this.companiesData.getCompany('api/Company/CompanyList').subscribe({
      next: (data: any) => {
        this.companies = data;
      },
    });
  };

  checkDuplicateName(control: AbstractControl) {
    if (!control.value || !this.companies.length) return null; // If no input or no companies, skip validation
    const normalizedName = UtilityService.normalizeStringForComparison(control.value);
    const isDuplicate = this.companies.some(
      (company) =>
        UtilityService.normalizeStringForComparison(company.companyName) === normalizedName
    );
    return isDuplicate ? { nameExists: true } : null; // Return validation error if duplicate
  }

  // Custom validator for duplicate company code
  checkDuplicateCode(control: AbstractControl) {
    if (!control.value || !this.companies) return null;
    const normalizedCode = UtilityService.normalizeStringForComparison(control.value);
    const isDuplicate = this.companies.some(
      (company) =>
        UtilityService.normalizeStringForComparison(company.companyCode) === normalizedCode
    );
    return isDuplicate ? { codeExists: true } : null;
  }

  companyCodeValidator(
    control: AbstractControl
  ): Observable<ValidationErrors | null> {
    return of(control.value).pipe(
      debounceTime(300),
      switchMap((code) => {
        const codeExists = this.companies.some(
          (company: any) => company.companyCode === code
        );
        return codeExists ? of({ codeExists: true }) : of(null);
      })
    );
  }

  getCompanyGroup() {
    this.companiesData.getData('api/CompanyGroup/CompanyGroupList').subscribe({
      next: (data: any[]) => {
        // Filter company groups with status of 1 (active)
        this.companyGroups = data.filter((group) => group.status === 1);
        const companyGroupField = this.companyFormConfig.sections[1].fields.find(
          f => f.name === 'companyGroupId'
        );
        if (companyGroupField) {
          companyGroupField.type = 'select';
          companyGroupField.options = this.companyGroups.map((group: any) => ({
            label: group.companyGroupName,
            value: group.id,
          }));
        }
      },
      error: (error: HttpErrorResponse) => {
        let errorMessage = 'An error occurred';
        if (error.error instanceof ErrorEvent) {
          // Client-side error
          errorMessage = `Error: ${error.error.message}`;
        } else {
          // Server-side error
          errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
        }
        this.notificationService.showError(errorMessage);
        this.notificationService.showError('Failed to load company groups');
      },
    });
  }

  checkCompanyGroupSelection(): boolean {
    const companyGroupId = this.addCompanyForm.get('companyGroupId')?.value;
    if (!companyGroupId) {
      this.notificationService.showError('Please select a Company Group first!');
      return false;
    }
    return true;
  }
  private formatLogoData(logo: string | null | undefined): string | null {
    if (!logo || typeof logo !== 'string') {
      return null;
    }
    const trimmed = logo.trim();
    if (!trimmed) {
      return null;
    }
    const lower = trimmed.toLowerCase();
    if (lower.startsWith('data:') || lower.startsWith('http') || lower.startsWith('/')) {
      return trimmed;
    }
    return `data:image/png;base64,${trimmed}`;
  }
  // Convert display format label to value
  private convertDisplayFormatToValue(label: string): string {
    const displayFormatMap: { [key: string]: string } = {
      'Hours:Minutes:Seconds': 'HH:mm:ss',
      'Hours:Minutes:Second': 'HH:mm:ss',  // Handle typo in API
      'Hours:Minutes': 'HH:mm'
    };
    return displayFormatMap[label] || 'HH:mm:ss';
  }

  // Convert timezone label to value
  private convertTimezoneToValue(label: string): string {
    // Extract the timezone code from the label
    // "IST (Indian Standard Time, UTC+5:30)" -> "IST"
    const match = label?.match(/^([A-Z]+)/);
    return match ? match[1] : 'IST';
  }
  getCompanyData() {
    this.route.params.subscribe((params) => {
      this.companyId = params['companyId'];
    });

    this.CompanyData.getCompanyForUpdate(
      `api/Company/CompanyById?guidCompanyId=${this.companyId}`
    ).subscribe({
      next: (data: any) => {

        // Handle logo data from API
        const formattedLogo = this.formatLogoData(data['companylogo']);
        this.logoPreview = formattedLogo;
        this.logoDataUrl = formattedLogo;
        const displayFormatValue = this.convertDisplayFormatToValue(data['timeDisplayFormat']);
        const timezoneValue = this.convertTimezoneToValue(data['timezone']);
        const statusValue = data['status'] === 1 ? '1' : '0';
        const adjustForDSTValue = data['adjustForDST'] === true ? 'true' : 'false';
        this.addCompanyForm.patchValue({
          tCompanyName: data['companyName'],
          tIndustry: data['industry'],
          tDateFormat: data['dateFormat'],
          tDateFieldSeperator: data['dateFieldSeperator'],
          nStatus: statusValue,
          companyCode: data['companyCode'],
          timeformat: data['timeFormat'],
          adjustForDST: adjustForDSTValue,
          companyGroupId: data['companyGroupId'],
          timezone: timezoneValue,
          displayFormat: displayFormatValue,
          companylogo: formattedLogo || '', // Store the base64 string
          // timezone: data['timezone'],
          // displayFormat: data['timeDisplayFormat'],

        });

        if (this.companyFormConfig?.sections?.length) {
          const section = this.companyFormConfig.sections[2];
          const adjustField = section.fields.find((f: any) => f.name === 'adjustForDST');

          if (adjustField) {
            adjustField.value = adjustForDSTValue;
          }
          this.companyFormConfig.sections.forEach((section: any) => {
            section.fields.forEach((field: any) => {
              const control = this.addCompanyForm.get(field.name);
              if (control) field.value = control.value;
            });
          });
          this.companyFormConfig = { ...this.companyFormConfig };
          this.cdr.detectChanges();
        }
        // Set validators after patching values
        this.addCompanyForm
          .get('tCompanyName')
          ?.setValidators([
            Validators.required,
            this.checkDuplicateName.bind(this),
          ]);
        this.addCompanyForm
          .get('companyCode')
          ?.setValidators([
            Validators.required,
            this.checkDuplicateCode.bind(this),
          ]);
        this.addCompanyForm.get('tCompanyName')?.updateValueAndValidity();
        this.addCompanyForm.get('companyCode')?.updateValueAndValidity();

        // --- Smooth UI refresh ---
        this.addCompanyFormLoaded = false;
        this.cdr.detectChanges();
        setTimeout(() => {
          this.addCompanyFormLoaded = true;
          this.cdr.detectChanges();
        }, 0);
      },
      error: (error: HttpErrorResponse) => {
        let errorMessage = 'An error occurred';
        if (error.error instanceof ErrorEvent) {
          errorMessage = `Error: ${error.error.message}`;
        } else {
          errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
        }
        this.notificationService.showError(errorMessage);
        this.notificationService.showError('Failed to load company data');
      },
    });
  }

  sendCompaniesData(addCompanyFormValue: any) {
    const formValues = { ...addCompanyFormValue };
    const logoBase64 = formValues.companylogo || this.logoDataUrl || '';

    const company: any = {
      companyName: String(formValues.tCompanyName || '').trim(),
      industry: String(formValues.tIndustry || '').trim(),
      dateFormat: formValues.tDateFormat,
      dateFieldSeperator: formValues.tDateFieldSeperator,
      status: formValues.nStatus ? 1 : 0,
      companyCode: String(formValues.companyCode || '').trim(),
      companyGroupId: formValues.companyGroupId,
      timeformat: formValues.timeformat,
      timezone: formValues.timezone,
      adjustForDST: formValues.adjustForDST === 'true',
      TimeDisplayFormat: formValues.displayFormat?.trim().substring(0, 20),
      companylogo: logoBase64, // Send base64 string instead of filename
    };

    if (this.companyId) {
      company.companyId = this.companyId;
    }
    const apiUrl = this.companyId
      ? 'api/Company/CompanyUpdate'
      : 'api/Company/CreateCompany';

    // Choose the right service method
    const apiCall = this.companyId
      ? this.CompanyData.updateCompany(apiUrl, company)
      : this.companiesData.postCompany(apiUrl, company);

    apiCall.subscribe({
      next: (response) => {
        const message = this.companyId
          ? 'Updated Successfully'
          : 'Saved Successfully';

        this.notificationService.showSuccess(message);
        this.notificationService.showSuccess(message);
        localStorage.setItem('dateSeparator', JSON.stringify(company));
        this.addCompanyForm.reset();
        // Reset logo related properties
        this.logoFile = null;
        this.logoPreview = null;
        this.logoError = '';
        this.logoDataUrl = null;
        setTimeout(() => {
          window.location.reload();
        }, 1500);
        this.router.navigate(['company/list']);
      },
      error: (error: HttpErrorResponse) => {
        let errorMessage = 'An error occurred';
        if (error.error instanceof ErrorEvent) {
          errorMessage = `Error: ${error.error.message}`;
        } else {
          errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
        }
        this.notificationService.showError(errorMessage);
        this.notificationService.showError('Failed to save company');
      },
    });
  }
  goBack(): void {
    this.location.back();
  }
  title = 'company-settings';
  activeTab = 'general';

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  selectedDateFormat = 'DD/MM/YYYY';
  selectedTimeFormat = '24-hour';
  selectedTimeDateFormat = 'Hours:Minutes:Seconds';
  selectedTimezone: string = 'IST (Indian Standard Time, UTC+5:30)';
  seprator: string = '/';

  datePreview = '';
  timePreview = '';
  dateTimePreview = '';

  updatePreview() {
    const currentDate = new Date();

    // Default separator fallback
    const separator = this.seprator || '/'; // Use the selected separator, default to '/'
    const dateFormats: { [key: string]: string } = {
      'DD/MM/YYYY': `${this.pad(currentDate.getDate())}${separator}${this.pad(currentDate.getMonth() + 1)}${separator}${currentDate.getFullYear()}`,
      'MM/DD/YYYY': `${this.pad(currentDate.getMonth() + 1)}${separator}${this.pad(currentDate.getDate())}${separator}${currentDate.getFullYear()}`,
      'YYYY/DD/MM': `${currentDate.getFullYear()}${separator}${this.pad(currentDate.getDate())}${separator}${this.pad(currentDate.getMonth() + 1)}`,
      'DD.MM.YYYY': `${this.pad(currentDate.getDate())}${separator}${this.pad(currentDate.getMonth() + 1)}${separator}${currentDate.getFullYear()}`,
      'DD-MMM-YYYY': `${this.pad(currentDate.getDate())}${separator}${this.getMonthName(currentDate.getMonth())}${separator}${currentDate.getFullYear()}`,
      'YYYY-DD-MM': `${currentDate.getFullYear()}${separator}${this.pad(currentDate.getDate())}${separator}${this.pad(currentDate.getMonth() + 1)}`,
      'YYYY/MM/DD': `${currentDate.getFullYear()}${separator}${this.pad(currentDate.getMonth() + 1)}${separator}${this.pad(currentDate.getDate())}`,
      'DD/MM/YY': `${this.pad(currentDate.getDate())}${separator}${this.pad(currentDate.getMonth() + 1)}${separator}${currentDate.getFullYear().toString().slice(-2)}`,
    };
    this.datePreview = dateFormats[this.selectedDateFormat] || '05/03/2025';

    // Format time based on selection
    let hours = currentDate.getHours();
    const minutes = currentDate.getMinutes();
    const seconds = currentDate.getSeconds();
    if (this.selectedTimeFormat === '12-hour') {
      // 12-hour format with AM/PM
      const suffix = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;

      if (this.selectedTimeDateFormat === 'HH:mm') {
        this.timePreview = `${this.pad(hours)}:${this.pad(minutes)} ${suffix}`;
      } else {
        // HH:mm:ss
        this.timePreview = `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)} ${suffix}`;
      }
    } else {
      // 24-hour format
      if (this.selectedTimeDateFormat === 'HH:mm') {
        this.timePreview = `${this.pad(hours)}:${this.pad(minutes)}`;
      } else {
        // HH:mm:ss
        this.timePreview = `${this.pad(hours)}:${this.pad(minutes)}:${this.pad(seconds)}`;
      }
    }

    // Get timezone label - use the current form value or default
    // const timezoneValue = this.addCompanyForm.get('timezone')?.value || 'IST';
    // this.selectedTimezone = this.getTimezoneLabel(timezoneValue);
    this.dateTimePreview = `${this.datePreview} ${this.timePreview} ${this.selectedTimezone}`;
  }

  pad(num: number): string {
    return num < 10 ? '0' + num : num.toString();
  }

  getMonthName(monthIndex: number): string {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return months[monthIndex];
  }
}
// Format date based on selected format with dynamic separator
// const dateFormats: { [key: string]: string } = {
//   'DD/MM/YYYY': `${this.pad(currentDate.getDate())}${separator}${this.pad(
//     currentDate.getMonth() + 1
//   )}${separator}${currentDate.getFullYear()}`,
//   'MM/DD/YYYY': `${this.pad(
//     currentDate.getMonth() + 1
//   )}${separator}${this.pad(
//     currentDate.getDate()
//   )}${separator}${currentDate.getFullYear()}`,
//   'YYYY.DD.MM': `${currentDate.getFullYear()}${separator}${this.pad(
//     currentDate.getDate()
//   )}${separator}${this.pad(currentDate.getMonth() + 1)}`,
//   'DD.MM.YYYY': `${this.pad(currentDate.getDate())}${separator}${this.pad(
//     currentDate.getMonth() + 1
//   )}${currentDate.getFullYear()}`,
//   'YYYY/DD/MM': `${currentDate.getFullYear()}${separator}${this.pad(
//     currentDate.getDate()
//   )}${separator}${this.pad(currentDate.getMonth() + 1)}`,
//   'DD-MM-YYYY': `${this.pad(
//     currentDate.getDate()
//   )}${separator}${this.getMonthName(
//     currentDate.getMonth()
//   )}${separator}${currentDate.getFullYear()}`, // Keeping "-" for month name format
//   'YYYY/MM/DD': `${currentDate.getFullYear()}${separator}${this.pad(
//     currentDate.getMonth() + 1
//   )}${separator}${this.pad(currentDate.getDate())}`,
//   'YYYY-MM-DD': `${currentDate.getFullYear()}${separator}${this.pad(
//     currentDate.getMonth() + 1
//   )}${separator}${this.pad(currentDate.getDate())}`,
//   'DD/MM/YY': `${this.pad(currentDate.getDate())}${separator}${this.pad(
//     currentDate.getMonth() + 1
//   )}${separator}${currentDate.getFullYear().toString().slice(-2)}`,
// };
// let suffix = '';
// if (this.selectedTimeFormat === '12-hour') {
//   suffix = hours >= 12 ? 'PM' : 'AM';
//   hours = hours % 12 || 12; // Convert 24-hour format to 12-hour format
//   this.timePreview = `${this.pad(hours)}:${this.pad(
//     currentDate.getMinutes()
//   )}:${suffix}`;
// } else if (this.selectedTimeDateFormat === 'HH:mm') {
//   suffix = hours >= 12 ? 'PM' : 'AM';
//   hours = hours % 12 || 12; // Convert 24-hour format to 12-hour format
//   this.timePreview = `${this.pad(hours)}:${this.pad(
//     currentDate.getMinutes()
//   )}:${suffix}`;
// }
// else if (this.selectedTimeDateFormat === 'HH:mm:ss') {
//   suffix = hours >= 12 ? 'PM' : 'AM';
//   hours = hours % 12 || 12; // Convert 24-hour format to 12-hour format
//   this.timePreview = `${this.pad(hours)}:${this.pad(
//     currentDate.getMinutes()
//   )}:${suffix}`;
// } else {
//   this.timePreview = `${this.pad(hours)}:${this.pad(
//     currentDate.getMinutes()
//   )}:${this.pad(currentDate.getSeconds())} ${suffix}`;
// }
// this.companiesData
//   .postCompany('api/Company/CreateCompany', company)
//   .subscribe({
//     next: (dataSent) => {
//       console.log('data sent:', dataSent);
//       if (dataSent === null) {
//         this.openSnackBar('Saved Successfully', 'Okay', 'green-snackbar');
