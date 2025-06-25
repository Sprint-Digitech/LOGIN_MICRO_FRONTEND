import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, map } from 'rxjs';


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
    employee: Employee,
    token: string,
    errors: string
}

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  private loginSubject$: BehaviorSubject<any | null>;
  public user: Observable<any | null>;
  constructor(
    private router: Router,
    private http: HttpClient,
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

  GoogleLogin(idToken: string) {
    const url = this.environment.urlAddress;
    return this.http.post(`${url}/api/Account/google-login`, { idToken });
  }
}
