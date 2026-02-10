import { Injectable } from "@angular/core";
import { Router, CanActivate, ActivatedRouteSnapshot } from "@angular/router";
import { AuthService } from "./auth.service";

@Injectable({
  providedIn: "root",
})
export class RoleGuard implements CanActivate {
  constructor(
    private router: Router,
    private authService: AuthService,
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const currentUser = this.authService.currentUserValue;
    const requiredRoles = route.data["roles"] as string[];

    if (currentUser && requiredRoles.includes(currentUser.role)) {
      return true;
    }

    // User doesn't have required role, redirect to dashboard
    this.router.navigate(["/dashboard"]);
    return false;
  }
}
