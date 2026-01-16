import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  HostListener,
  ChangeDetectionStrategy,
} from '@angular/core';
import {
  NavigationEnd,
  Router,
  RouterOutlet,
  RouterModule,
} from '@angular/router';
import { Subscription, lastValueFrom } from 'rxjs';
import { AccountService } from './shared/services/account.service';
import { GlobalSearchService } from './shared/services/global-search.service';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { LoaderComponent } from './loader/loader/loader.component';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    CommonModule,
    RouterModule,
    MatTooltipModule,
    MatIconModule,
    FormsModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatButtonModule,
    LoaderComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  loginUser: boolean = false;
  user?: any | null;
  isExpanded = true;
  name: string = '';
  companies: string = '';
  menus: any[] = [];
  companyName: any;
  openSubmenus: Set<number> = new Set();

  // Onboarding state
  onboardingMode = false;
  onboardingHeaderMode = false;
  activeOnboardingStep = 0;
  sidebarMenuItems = [
    'Get Started',
    'Personal Info',
    'Educational Qualif.',
    'Employment History',
    'Family Info',
    'Statutory Compliance',
    'Medical Information',
    'Decl. & Agr',
    'Review & Submit',
    'Completed',
  ];
  currentTime: string = '';
  clockInterval: any;

  readonly defaultSidebarLogo = 'assets/img/fovesta1.png';

  menuIcons: { [key: string]: string } = {
    Employee: 'badge',
    Reports: 'add_chart',
    Settings: 'settings',
    Loan: 'account_balance_wallet',
    Loans: 'account_balance_wallet',
    Salary: 'currency_rupee',
    Reimbursement: 'savings',
    'Attendance & Leave': 'calendar_month',
    ALMS: 'calendar_month',
    Bonus: 'assets/img/rewarded_ads.png',
    Master: 'assets/img/kid_star.png',
    userRolesAndPermissions: 'add_moderator',
    'User Roles & Permissions': 'add_moderator',
    EmployeeSelfService: 'man_4',
    'Employee Self Service': 'man_4',
    'ESS Portal': 'man_4',
    Gratuity: 'work_history',
    Arrear: 'assets/img/currency_rupee_circle.png',
    Dashboard: 'dashboard',
  };

  private subscriptions = new Subscription();

  globalSearchTerm = '';
  isGlobalSearchOpen = false;
  globalEmployeeResults: any[] = [];
  isSearchingEmployees = false;

  private readonly emptyUserDetails = {
    name: '',
    email: '',
    role: '',
    department: '',
    designation: '',
  };

  userDetails = { ...this.emptyUserDetails };

  constructor(
    private router: Router,
    private accountService: AccountService,
    private cdr: ChangeDetectorRef,
    private globalSearchService: GlobalSearchService
  ) {}

  get userInitials(): string {
    const source = (this.userDetails.name || this.name || '').trim();
    if (!source) {
      return '?';
    }
    const parts = source.split(/\s+/).filter(Boolean);
    if (!parts.length) {
      return '?';
    }
    const firstInitial = parts[0]?.charAt(0) ?? '';
    const lastInitial =
      parts.length > 1 ? parts[parts.length - 1]?.charAt(0) ?? '' : '';
    const initials = `${firstInitial}${lastInitial}`.trim() || firstInitial;
    return initials.toUpperCase() || '?';
  }

  ngOnInit() {
    this.hydrateUserDetailsFromSession();

    // Check if user exists in sessionStorage on initialization
    const storedUser = sessionStorage.getItem('user');
    const storedToken = sessionStorage.getItem('token');
    if (storedUser && storedToken) {
      try {
        const user = JSON.parse(storedUser);
        if (user) {
          this.loginUser = true;
          this.user = user;
          this.setUserDetails(user);
          this.companyName = user.companyName || '';
          // Ensure initial render uses stored state
          const storedExpanded = localStorage.getItem('sidebarExpanded');
          if (storedExpanded !== null) {
            this.isExpanded = JSON.parse(storedExpanded);
          }
          this.cdr.detectChanges();
        }
      } catch (error) {
        console.warn('Failed to parse user from sessionStorage', error);
        this.loginUser = false;
      }
    }

    // Reactive user subscription
    this.subscriptions.add(
      this.accountService.user$.subscribe((user) => {
        this.user = user;
        if (user) {
          this.setUserDetails(user);
          this.companyName = user.companyName || '';
          this.loginUser = true;
          // Ensure initial render uses stored state
          const storedExpanded = localStorage.getItem('sidebarExpanded');
          if (storedExpanded !== null) {
            this.isExpanded = JSON.parse(storedExpanded);
          }
        } else {
          this.setUserDetails(null);
          this.companyName = '';
          this.loginUser = false;
        }
        this.cdr.detectChanges();
      })
    );

    // Reactive menu subscription
    this.subscriptions.add(
      this.accountService.menuData$.subscribe((menus) => {
        console.log(
          'AppComponent: Menu data updated',
          menus?.length || 0,
          'menus'
        );
        this.menus = menus || [];
        const currentUrl = this.router.url;
        this.expandMenuForCurrentUrl(currentUrl);
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      })
    );

    // Reactive company subscription (optional)
    this.subscriptions.add(
      this.accountService.company$.subscribe((company) => {
        if (company) {
          this.companyName = company.companyName || this.companyName;
          this.cdr.detectChanges();
        }
      })
    );

    // Onboarding Mode subscription (Sidebar)
    this.subscriptions.add(
      this.accountService.onboardingMode$.subscribe((mode) => {
        this.onboardingMode = mode;
        this.cdr.detectChanges();
      })
    );

    // Onboarding Header Mode subscription
    this.subscriptions.add(
      this.accountService.onboardingHeaderMode$.subscribe((mode) => {
        this.onboardingHeaderMode = mode;
        if (mode) {
          this.startClock();
        } else {
          this.stopClock();
        }
        this.cdr.detectChanges();
      })
    );

    this.subscriptions.add(
      this.accountService.activeOnboardingStep$.subscribe((step) => {
        this.activeOnboardingStep = step;
        this.cdr.detectChanges();
      })
    );

    this.getCompanies();

    if (localStorage.getItem('sidebarExpanded') === null) {
      localStorage.setItem('sidebarExpanded', JSON.stringify(this.isExpanded));
    }

    this.subscriptions.add(
      this.router.events.subscribe((event) => {
        if (event instanceof NavigationEnd) {
          this.globalSearchTerm = '';
          this.globalSearchService.emit('');
        }
      })
    );
  }

  async onGlobalSearch(): Promise<void> {
    const term = this.globalSearchTerm.trim();
    const isSalaryProcessPage = this.router.url.includes('salaryprocess');

    if (!term) {
      this.globalSearchService.emit('');
      this.globalEmployeeResults = [];
      this.isGlobalSearchOpen = false;
      this.cdr.markForCheck();
      return;
    }

    if (isSalaryProcessPage) {
      this.globalSearchService.emit(term);
      this.isGlobalSearchOpen = false;
      this.globalEmployeeResults = [];
      this.isSearchingEmployees = false;
      this.cdr.markForCheck();
      return;
    }

    this.isSearchingEmployees = true;
    this.globalEmployeeResults = [];
    this.isGlobalSearchOpen = true;
    this.cdr.markForCheck();

    const params: Record<string, string> = {
      SearchTerm: term,
    };

    try {
      const result = await lastValueFrom(
        this.accountService.getEmployee(
          'api/Employee/EmployeeBasicDetailList',
          params
        )
      );

      const employees = Array.isArray(result) ? result : [];
      this.globalEmployeeResults = employees.map((employee) =>
        this.normalizeEmployee(employee)
      );
      this.isGlobalSearchOpen = true;
    } catch (error) {
      this.globalEmployeeResults = [];
      this.isGlobalSearchOpen = false;
    } finally {
      this.isSearchingEmployees = false;
      this.cdr.markForCheck();
    }
  }

  openGlobalSearchResults(): void {
    if (this.globalEmployeeResults.length) {
      this.isGlobalSearchOpen = true;
      this.cdr.markForCheck();
    }
  }

  onHeaderInput(value: string): void {
    this.globalSearchTerm = value;
    const term = value.trim();
    this.globalSearchService.emit(term);

    if (this.router.url.includes('salaryprocess')) {
      this.isGlobalSearchOpen = false;
      this.globalEmployeeResults = [];
      this.isSearchingEmployees = false;
      this.cdr.markForCheck();
      return;
    }

    if (!term) {
      this.globalEmployeeResults = [];
      this.isGlobalSearchOpen = false;
      this.isSearchingEmployees = false;
      this.cdr.markForCheck();
    }
  }

  closeGlobalSearch(): void {
    this.isGlobalSearchOpen = false;
  }

  clearGlobalSearch(): void {
    this.globalSearchTerm = '';
    this.globalEmployeeResults = [];
    this.isGlobalSearchOpen = false;
    this.globalSearchService.emit('');
  }

  navigateToEmployee(employee: any): void {
    if (!employee) return;

    const normalized = this.normalizeEmployee(employee);
    const employeeId = normalized.employeeId;

    if (employeeId) {
      this.router.navigate(['/employee/employee-profile', employeeId], {
        queryParams: { search: this.globalSearchTerm.trim() },
      });
    }

    this.isGlobalSearchOpen = false;
    this.globalEmployeeResults = [];
    this.globalSearchTerm = '';
    this.globalSearchService.emit('');
    this.cdr.markForCheck();
  }

  private normalizeEmployee(employee: any) {
    if (!employee || typeof employee !== 'object') {
      return {};
    }

    const employeeId =
      employee.employeeId ||
      employee.EmployeeId ||
      employee.id ||
      employee.employeId ||
      employee.employeeid ||
      '';

    const employeeCode =
      employee.employeeCode || employee.EmployeeCode || employee.code || '';

    const firstName =
      employee.employeeFirstName || employee.firstName || employee.name || '';

    const middleName = employee.employeeMiddleName || employee.middleName || '';

    const lastName = employee.employeeLastName || employee.lastName || '';

    const department = employee.departmentName || employee.department || '';

    const designation = employee.designationName || employee.designation || '';

    return {
      ...employee,
      employeeId,
      employeeCode,
      employeeFirstName: firstName,
      employeeMiddleName: middleName,
      employeeLastName: lastName,
      departmentName: department,
      designationName: designation,
    };
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // @HostListener('document:click', ['$event'])
  // onClickOutside(event: MouseEvent) {
  //   const target = event.target as HTMLElement;
  //   if (!target.closest('.sidebar') && !target.closest('.submenu')) {
  //     this.openSubmenus.clear();
  //     this.cdr.detectChanges();
  // }
  // }
  @HostListener('document:click', ['$event'])
  handleDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.menu-item') && !target.closest('.submenu')) {
      this.openSubmenus.clear();
    }

    if (!target.closest('.app-header__search')) {
      this.closeGlobalSearch();
    }

    this.cdr.detectChanges();
  }

  hasSubmenu(menuItem: any): boolean {
    return menuItem.submenu && menuItem.submenu.length > 0;
  }

  expandMenuForCurrentUrl(url: string) {
    this.openSubmenus.clear();
    for (const menu of this.menus) {
      if (menu.submenu && menu.submenu.length > 0) {
        if (menu.submenu.find((sub: any) => sub.menuPath === url)) {
          this.openSubmenus.add(menu.menuID);
          break;
        }
      } else if (menu.menuPath === url) {
        this.openSubmenus.add(menu.menuID);
        break;
      }
    }
  }

  isSubmenuOpen(menuID: number): boolean {
    return this.openSubmenus.has(menuID);
  }

  toggleSubmenu(menuID: number) {
    if (this.openSubmenus.has(menuID)) {
      this.openSubmenus.delete(menuID);
    } else {
      this.openSubmenus.clear(); // Only one submenu open at a time
      this.openSubmenus.add(menuID);
    }
    this.cdr.detectChanges();
    const el = document.querySelector(`#menu-${menuID}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  getMenuIcon(menuName: string): string {
    // Try exact match first
    if (this.menuIcons[menuName]) {
      return this.menuIcons[menuName];
    }
    // Try case-insensitive match
    const lowerName = menuName.toLowerCase();
    for (const key in this.menuIcons) {
      if (key.toLowerCase() === lowerName) {
        return this.menuIcons[key];
      }
    }
    return 'menu';
  }

  isMaterialIcon(menuName: string): boolean {
    const icon = this.getMenuIcon(menuName);
    return !icon?.includes('assets/');
  }

  onMenuClick(event: Event, menuItem: any) {
    event.stopPropagation();
    if (!this.isExpanded) {
      this.isExpanded = true;
    }
    if (this.hasSubmenu(menuItem)) {
      event.preventDefault();
      this.toggleSubmenu(menuItem.menuID);

      // Use requestAnimationFrame to ensure DOM is updated after toggleSubmenu
      requestAnimationFrame(() => {
        const menuItemElement = document.getElementById(
          `menu-${menuItem.menuID}`
        );
        if (menuItemElement) {
          const rect = menuItemElement.getBoundingClientRect();
          // Always align submenu top edge with menu item top edge (matching the design)
          // For fixed positioning, use getBoundingClientRect().top directly
          let topPosition = rect.top;

          const windowHeight = window.innerHeight;
          const minTopMargin = 5; // Minimum margin from viewport top
          const bottomMargin = 20; // Minimum margin from viewport bottom

          // Ensure submenu doesn't go above viewport (edge case)
          if (topPosition < minTopMargin) {
            topPosition = minTopMargin;
          }

          // Calculate available height from submenu top to bottom of viewport
          const availableHeight = windowHeight - topPosition - bottomMargin;

          // Set the left position to be right next to the sidebar
          const sidebarWidth = this.isExpanded ? 180 : 60;
          const leftPosition = sidebarWidth + 2; // Gap from sidebar

          document.documentElement.style.setProperty(
            '--submenu-top',
            `${topPosition}px`
          );
          document.documentElement.style.setProperty(
            '--submenu-left',
            `${leftPosition}px`
          );
          document.documentElement.style.setProperty(
            '--submenu-max-height',
            `${availableHeight}px`
          );
          this.cdr.detectChanges();
        }
      });
    }
  }

  shouldApplyContentClass(): boolean {
    return (
      !this.router.url.includes('/login') &&
      !this.router.url.includes('/forgot-password')
    );
  }

  toggleMenu() {
    this.isExpanded = !this.isExpanded;
    if (!this.isExpanded) {
      this.openSubmenus.clear();
    }
    localStorage.setItem('sidebarExpanded', JSON.stringify(this.isExpanded));
  }

  logout(): void {
    console.log('AppComponent: Logout requested');
    // The service handles clearing all storage and navigating to login
    this.accountService.logout();
    this.setUserDetails(null);
    this.cdr.detectChanges();
  }

  isAnySubmenuActive(item: any): boolean {
    if (!this.isExpanded || !item.submenu) return false;
    return item.submenu.some((sub: any) =>
      this.router.isActive(sub.menuPath, false)
    );
  }

  getCompanies = () => {
    this.accountService.get('api/Company/CompanyList').subscribe({
      next: (data: any) => {
        const logo = data?.[0]?.companylogo;
        this.companies = this.resolveCompanyLogo(logo);
      },
    });
  };

  get sidebarLogo(): string {
    return this.companies || this.defaultSidebarLogo;
  }

  get sidebarLogoAlt(): string {
    return this.companyName ? `${this.companyName} logo` : 'Fovesta Logo';
  }

  getSubmenuTopPosition(event: MouseEvent, menuID: number): number {
    const element = document.getElementById('menu-' + menuID);
    if (!element) return 0;
    const rect = element.getBoundingClientRect();
    return rect.top;
  }

  onSubmenuWheel(event: WheelEvent) {
    const submenu = event.currentTarget as HTMLElement;
    if (!submenu) return;

    const deltaY = event.deltaY;
    const scrollTop = submenu.scrollTop;
    const scrollHeight = submenu.scrollHeight;
    const clientHeight = submenu.clientHeight;

    // Check if content actually overflows (needs scrolling)
    const needsScrolling = scrollHeight > clientHeight;
    if (!needsScrolling) {
      // No scrolling needed - prevent page scroll
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    // Check scroll boundaries with small tolerance for rounding
    const isAtTop = scrollTop <= 1;
    const isAtBottom = scrollTop >= scrollHeight - clientHeight - 1;
    const isScrollingDown = deltaY > 0;
    const isScrollingUp = deltaY < 0;

    // If we can scroll in the requested direction, allow submenu scroll but prevent page scroll
    if ((isScrollingDown && !isAtBottom) || (isScrollingUp && !isAtTop)) {
      // Allow browser to scroll submenu naturally, but prevent event from bubbling to page
      event.stopPropagation();
    } else {
      // At scroll limit or trying to scroll in wrong direction - prevent all scrolling
      event.preventDefault();
      event.stopPropagation();
    }
  }

  onSubmenuItemClick(menuID: number) {
    // Close the submenu when a submenu item is clicked
    this.openSubmenus.delete(menuID);
    this.cdr.detectChanges();
  }

  private resolveCompanyLogo(logo: string | null | undefined): string {
    if (!logo || typeof logo !== 'string') {
      return '';
    }
    const trimmed = logo.trim();
    if (!trimmed) {
      return '';
    }
    const lower = trimmed.toLowerCase();
    if (
      lower.startsWith('data:') ||
      lower.startsWith('http') ||
      lower.startsWith('/')
    ) {
      return trimmed;
    }
    return `data:image/png;base64,${trimmed}`;
  }

  private hydrateUserDetailsFromSession(): void {
    const storedUser = sessionStorage.getItem('user');
    if (!storedUser) {
      this.setUserDetails(null);
      return;
    }
    try {
      const parsedUser = JSON.parse(storedUser);
      this.setUserDetails(parsedUser);
    } catch (error) {
      console.warn('Failed to parse user from sessionStorage', error);
      this.setUserDetails(null);
    }
  }

  private setUserDetails(userData: any | null | undefined): void {
    if (!userData || typeof userData !== 'object') {
      this.userDetails = { ...this.emptyUserDetails };
      this.name = '';
      this.cdr.markForCheck();
      return;
    }

    const displayName = this.getDisplayName(userData);
    const role = this.extractPrimaryRole(userData);
    const email =
      userData.email ||
      userData.employeeEmail ||
      userData.loginEmail ||
      userData.userEmail ||
      '';
    const department = userData.departmentName || userData.department || '';
    const designation = userData.designationName || userData.designation || '';

    this.userDetails = {
      name: displayName,
      email: typeof email === 'string' ? email.trim() : '',
      role: role,
      department: department,
      designation: designation,
    };

    this.name = displayName;
    this.cdr.markForCheck();
  }

  private getDisplayName(userData: any): string {
    const nameParts = [
      userData.firstName ||
        userData.employeeFirstName ||
        userData.employeeName ||
        '',
      userData.middleName || userData.employeeMiddleName || '',
      userData.lastName || userData.employeeLastName || '',
    ]
      .map((part: string) => (typeof part === 'string' ? part.trim() : ''))
      .filter(Boolean);

    if (nameParts.length) {
      return nameParts.join(' ');
    }

    const fallback =
      userData.displayName ||
      userData.userName ||
      userData.email ||
      userData.loginname ||
      '';

    return typeof fallback === 'string' ? fallback.trim() : '';
  }

  private extractPrimaryRole(userData: any): string {
    const roles = Array.isArray(userData?.employeeRoleLoginDtos)
      ? userData.employeeRoleLoginDtos
      : [];

    const primaryRole =
      roles.find((role: any) => role?.isPrimary) || roles[0] || null;

    const roleName =
      primaryRole?.roleName ||
      primaryRole?.roleDescription ||
      primaryRole?.name ||
      userData.roleName ||
      userData.role ||
      '';

    return typeof roleName === 'string' ? roleName.trim() : '';
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    // Prevent infinite loop by checking if already set to default
    if (img.src && !img.src.includes('fovesta1.png')) {
      img.src = 'assets/img/fovesta1.png';
    } else {
      // If default also fails, hide the image
      img.style.display = 'none';
    }
  }

  // Onboarding Helpers
  startClock() {
    if (this.clockInterval) return;
    this.updateClock();
    this.clockInterval = setInterval(() => this.updateClock(), 1000);
  }

  stopClock() {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
      this.clockInterval = null;
    }
  }

  updateClock() {
    const now = new Date();
    this.currentTime = now.toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZoneName: 'short',
    });
    this.cdr.detectChanges();
  }

  isStepCompleted(index: number): boolean {
    return index < this.activeOnboardingStep;
  }
}
