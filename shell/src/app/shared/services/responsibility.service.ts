import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
@Injectable({
  providedIn: 'root',
})
export class ResponsibilityService {
  constructor(private http: HttpClient) {}

  environment = {
    production: false,
    urlAddress: 'https://localhost:7274',
  };

  private createCompleteRoute = (route: string, envAddress: string) => {
    return `${envAddress}/${route}`;
  };
  public getResponsibilityList = (route: string) => {
    return this.http.get<any[]>(
      this.createCompleteRoute(route, this.environment.urlAddress),
    );
  };
  //getbyId
  public getResponsibilityById = (id: string): Observable<any> => {
    const route = `api/Responsblity/ResponsblityById?ResponsiblityMasterID=${id}`;
    return this.http.get<any>(
      this.createCompleteRoute(route, this.environment.urlAddress),
    );
  };

  // Create new responsibility
  public createResponsibility = (data: any): Observable<any> => {
    const route = 'api/Responsblity/CreateResponsblity';
    return this.http.post<any>(
      this.createCompleteRoute(route, this.environment.urlAddress),
      data,
    );
  };

  // Update responsibility
  public updateResponsibility = (data: any): Observable<any> => {
    const route = 'api/Responsblity/ResponsblityUpdate';
    return this.http.put<any>(
      this.createCompleteRoute(route, this.environment.urlAddress),
      data,
    );
  };
  //delete responsibility
  public deleteResponsibility = (id: string): Observable<any> => {
    const route = `api/Responsblity/DeleteResponsblity?ResponsiblityMasterID=${id}`;
    return this.http.delete<any>(
      this.createCompleteRoute(route, this.environment.urlAddress),
    );
  };
  // Get Responsibility Arch Mapping List
  public getResponsibilityArchMappingList = (): Observable<any[]> => {
    const route = 'api/Responsblity/ResponsiblityArchMappingList';
    return this.http.get<any[]>(
      this.createCompleteRoute(route, this.environment.urlAddress),
    );
  };

  // Delete Responsibility Arch Mapping
  public deleteResponsibilityArchMapping = (id: string): Observable<any> => {
    const route = `api/Responsblity/DeleteResponsiblityArchMapping?ResponsibilityArchMappingID=${id}`;
    return this.http.delete<any>(
      this.createCompleteRoute(route, this.environment.urlAddress),
    );
  };
  // Get Responsibility Arch Mapping By ID
  public getResponsibilityArchMappingById = (id: string): Observable<any> => {
    const route = `api/Responsblity/ResponsiblityArchMappingById?ResponsibilityArchMappingID=${id}`;
    return this.http.get<any>(
      this.createCompleteRoute(route, this.environment.urlAddress),
    );
  };

  // Create Responsibility Arch Mapping
  public createResponsibilityArchMapping = (data: any): Observable<any> => {
    const route = 'api/Responsblity/CreateResponsiblityArchMapping';
    return this.http.post<any>(
      this.createCompleteRoute(route, this.environment.urlAddress),
      data,
    );
  };

  // Update Responsibility Arch Mapping
  public updateResponsibilityArchMapping = (data: any): Observable<any> => {
    const route = 'api/Responsblity/ResponsiblityArchMappingUpdate';
    return this.http.put<any>(
      this.createCompleteRoute(route, this.environment.urlAddress),
      data,
    );
  };
  // Get Employee Responsibility Mapping List
  public getEmployeeResponsibilityMappingList = (): Observable<any[]> => {
    const route = 'api/Responsblity/EmployeeResponsblityMappingList';
    return this.http.get<any[]>(
      this.createCompleteRoute(route, this.environment.urlAddress),
    );
  };

  // Delete Employee Responsibility Mapping
  public deleteEmployeeResponsibilityMapping = (
    id: string,
  ): Observable<any> => {
    const route = `api/Responsblity/DeleteEmployeeResponsblityMapping?EmployeeResponsblityMappingID=${id}`;
    return this.http.delete<any>(
      this.createCompleteRoute(route, this.environment.urlAddress),
    );
  };
  // Get Employee Responsibility Mapping By ID
  public getEmployeeResponsibilityMappingById = (
    id: string,
  ): Observable<any> => {
    const route = `api/Responsblity/EmployeeResponsblityMappingById?EmployeeResponsblityMappingID=${id}`;
    return this.http.get<any>(
      this.createCompleteRoute(route, this.environment.urlAddress),
    );
  };

  // Create Employee Responsibility Mapping
  public createEmployeeResponsibilityMapping = (data: any): Observable<any> => {
    const route = 'api/Responsblity/CreateEmployeeResponsblityMapping';
    return this.http.post<any>(
      this.createCompleteRoute(route, this.environment.urlAddress),
      data,
    );
  };

  // Update Employee Responsibility Mapping
  public updateEmployeeResponsibilityMapping = (data: any): Observable<any> => {
    const route = 'api/Responsblity/EmployeeResponsblityMappingUpdate';
    return this.http.put<any>(
      this.createCompleteRoute(route, this.environment.urlAddress),
      data,
    );
  };
}
