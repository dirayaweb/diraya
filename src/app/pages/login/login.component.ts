import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  email = '';
  password = '';
  rememberMe = true; // Default
  errorMessage = '';

  // Toggle password visibility
  showPassword = false;

  constructor(private authService: AuthService, private router: Router) {}

  login() {
    this.errorMessage = '';
    this.authService
      .login(this.email, this.password, this.rememberMe)
      .subscribe({
        next: () => {
          this.router.navigate(['/user']);
        },
        error: (err) => {
          this.errorMessage = err.message || 'Error logging in';
        },
      });
  }

  googleLogin() {
    this.errorMessage = '';
    this.authService.googleSignIn(this.rememberMe).subscribe({
      next: () => {
        this.router.navigate(['/user']);
      },
      error: (err) => {
        this.errorMessage = err.message || 'Error logging in with Google';
      },
    });
  }
}
