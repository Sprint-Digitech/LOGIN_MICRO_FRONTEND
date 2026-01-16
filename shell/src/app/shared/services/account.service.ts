import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { AuditLoggingService } from './audit-logging.service';
import { SecureTokenStorageService } from './secure-token-storage.service';

export interface Login {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export class Employee {
  email!: string;
  firstName!: string;
  lastName!: string;
}

export interface LoginResponse {
  employee: Employee;
  token: string;
  errors: string;
}

export interface UserForRegistrationDto {
  firstName: string;
  lastName: string;
  tenantSchema?: string;
  email: string;
  password: string;
  confirmPassword: string;
}
export interface RegistrationResponseDto {
  isSuccessfulRegistration: boolean;
  errros: string[];
}

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  private userSubject$ = new BehaviorSubject<any | null>(
    JSON.parse(sessionStorage.getItem('user') || 'null')
  );
  public user$ = this.userSubject$.asObservable();
  private menuDataSubject = new BehaviorSubject<any[]>(
    JSON.parse(sessionStorage.getItem('menus') || '[]')
  );
  public menuData$ = this.menuDataSubject.asObservable();
  private loginSubject$: BehaviorSubject<any | null>;
  public user: Observable<any | null>;
  private onboardingModeSubject = new BehaviorSubject<boolean>(false);
  public onboardingMode$ = this.onboardingModeSubject.asObservable();

  private activeOnboardingStepSubject = new BehaviorSubject<number>(0);
  public activeOnboardingStep$ =
    this.activeOnboardingStepSubject.asObservable();

  private onboardingHeaderModeSubject = new BehaviorSubject<boolean>(false);
  public onboardingHeaderMode$ =
    this.onboardingHeaderModeSubject.asObservable();
  constructor(
    private router: Router,
    private http: HttpClient,
    private auditLogger: AuditLoggingService,
    private secureTokenStorage: SecureTokenStorageService
  ) {
    this.loginSubject$ = new BehaviorSubject(
      JSON.parse(sessionStorage.getItem('user')!)
    );
    this.user = this.loginSubject$.asObservable();
  }

  environment = {
    production: false,
    urlAddress: 'https://localhost:7274',
  };

  public get userValue() {
    return this.loginSubject$.value;
  }

  login(route: string, body: Login) {
    let url = this.createCompleteRoute(route, this.environment.urlAddress);
    return this.http.post<LoginResponse>(url, body).pipe(
      map((loginUser: any) => {
        // store user details and jwt token in local storage to keep user logged in between page refreshes
        if (loginUser != null && loginUser.employee != null) {
          sessionStorage.setItem('token', JSON.stringify(loginUser.token));
          sessionStorage.setItem(
            'tenantSchema',
            loginUser.employee.tenantSchema
          );
          this.loginSubject$.next(loginUser);
          return loginUser;
        } else {
        }
      })
    );
  }

  step(endpoint: string, params: any): Observable<any> {
    const url = `${this.environment.urlAddress}/api/${endpoint}`;
    return this.http.get(url, { params });
  }

  logindetail(route: string) {
    let url = this.createCompleteRoute(route, this.environment.urlAddress);
    return this.http.get<any>(url).pipe(
      map((loginUser: any) => {
        // store user details and jwt token in local storage to keep user logged in between page refreshes
        if (loginUser != null) {
          sessionStorage.setItem('user', JSON.stringify(loginUser));
          // this.loginSubject$.next(loginUser);
          return loginUser;
        } else {
        }
      })
    );
  }

  private createCompleteRoute = (route: string, envAddress: string) => {
    return `${envAddress}/${route}`;
  };

  public getEmployee = (route: any, params?: any) => {
    return this.http.get<any[]>(
      this.createCompleteRoute(route, this.environment.urlAddress),
      { params }
    );
  };

  public getCompany = (route: string, headers?: HttpHeaders) => {
    const options = headers ? { headers } : {};
    return this.http.get<any[]>(
      this.createCompleteRoute(route, this.environment.urlAddress),
      options
    );
  };

  public update = (route: string, body: any) => {
    let url = this.createCompleteRoute(route, this.environment.urlAddress);
    return this.http.put(url, body);
  };
  public post = (route: string, body: any) => {
    let url = this.createCompleteRoute(route, this.environment.urlAddress);
    return this.http.post(url, body);
  };

  public get = (route: string) => {
    return this.http.get<any[]>(
      this.createCompleteRoute(route, this.environment.urlAddress)
    );
  };

  public delete = (route: string) => {
    return this.http.delete(
      this.createCompleteRoute(route, this.environment.urlAddress)
    );
  };

  public registerUser = (
    route: string,
    body: UserForRegistrationDto,
    customHeaders?: { [key: string]: string }
  ) => {
    const url = this.createCompleteRoute(route, this.environment.urlAddress);

    // Add custom headers if provided
    // Registration requests skip timeout entirely - they can take as long as needed
    let headersMap: { [key: string]: string } = {
      'X-Skip-Timeout': 'true', // Skip timeout interceptor for registration (can take very long)
      'X-Skip-Deduplication': 'true', // Skip request deduplication for registration
      'X-Skip-Retry': 'true', // Skip retry logic for registration (idempotency)
      ...customHeaders,
    };

    // Convert headers object to HttpHeaders
    let httpHeaders = new HttpHeaders();
    Object.keys(headersMap).forEach((key) => {
      httpHeaders = httpHeaders.set(key, headersMap[key]);
    });

    return this.http.post<RegistrationResponseDto>(url, body, {
      headers: httpHeaders,
    });
  };

  GoogleLogin(idToken: string) {
    const url = this.environment.urlAddress;
    return this.http.post(`${url}/api/Account/google-login`, { idToken });
  }

  setUser(user: any) {
    sessionStorage.setItem('user', JSON.stringify(user));
    this.userSubject$.next(user);
  }

  setMenuData(data: any[]) {
    // Create a new array reference to ensure change detection triggers
    const newMenuData = Array.isArray(data) ? [...data] : [];
    sessionStorage.setItem('menus', JSON.stringify(newMenuData));
    console.log(
      'setMenuData: Updating menu observable with',
      newMenuData.length,
      'menus'
    );
    this.menuDataSubject.next(newMenuData);
  }

  getEmployeeLoginDetail(email: string, tenantSchema: string): Observable<any> {
    const url = `${
      this.environment.urlAddress
    }/api/Account/GetEmployeeRoleDetail?email=${encodeURIComponent(email)}`;
    const headers = { 'x-tenant-schema': tenantSchema };

    return this.http.get(url, { headers });
  }

  // Get branches of the company for given tenant
  getBranchesForTenant(tenantSchema: string): Observable<any[]> {
    const url = `${this.environment.urlAddress}/api/CompanyBranch/CompanyBranchList`;
    const headers = { 'x-tenant-schema': tenantSchema };
    return this.http.get<any[]>(url, { headers });
  }
  // Get company info for given tenant
  getCompanyInfoForTenant(tenantSchema: string): Observable<any> {
    const url = `${this.environment.urlAddress}/api/Company/GetCompanyInfo`; // Adjust endpoint accordingly
    const headers = { 'x-tenant-schema': tenantSchema };
    return this.http.get<any>(url, { headers });
  }

  private branchesSubject = new BehaviorSubject<any[]>([]);
  public branches$ = this.branchesSubject.asObservable();

  setBranches(branches: any[]) {
    sessionStorage.setItem('branches', JSON.stringify(branches));
    this.branchesSubject.next(branches);
  }

  private companySubject = new BehaviorSubject<any>(null);
  public company$ = this.companySubject.asObservable();

  setCompany(company: any) {
    sessionStorage.setItem('company', JSON.stringify(company));
    this.companySubject.next(company);
  }

  clearUser() {
    sessionStorage.removeItem('user');
    this.userSubject$.next(null);
  }

  clearMenus() {
    sessionStorage.removeItem('menus');
    this.menuDataSubject.next([]);
  }

  public forgotPassword = (route: any, body: any) => {
    return this.http.post<any[]>(
      this.createCompleteRoute(route, this.environment.urlAddress),
      body,
      { responseType: 'text' as 'json' }
    );
  };

  logout() {
    // Log logout event
    this.auditLogger.logLogout();

    // Clear secure token storage
    this.secureTokenStorage.clearAll();

    sessionStorage.clear();
    // localStorage.clear();
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('tenantSchema');
    localStorage.removeItem('token');
    this.clearMenus();
    this.clearUser();
    this.loginSubject$.next(null);
    this.router.navigate(['/login']);
  }
}
