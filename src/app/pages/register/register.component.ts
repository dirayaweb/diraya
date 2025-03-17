import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  username = '';
  email = '';
  password = '';
  selectedAllergies: string[] = [];
  allergies = [
    'حليب - Milk',
    'بيض - Eggs',
    'جلوتين (قمح) - Gluten',
    'مكسرات - Nuts',
    'صويا - Soy',
  ];
  errorMessage = '';
  step2Google = false; // Once user logs in with Google, we show allergies selection

  // Toggle password visibility
  showPassword = false;

  constructor(private authService: AuthService, private router: Router) {}

  register() {
    this.errorMessage = '';
    this.authService
      .register(this.email, this.password, this.username, this.selectedAllergies)
      .subscribe({
        next: () => {
          this.router.navigate(['/user']);
        },
        error: (err) => {
          this.errorMessage = err.message || 'حدث خطأ أثناء إنشاء الحساب';
        },
      });
  }

  googleRegister() {
    this.errorMessage = '';
    // Sign in with Google as "register" flow
    this.authService.googleSignIn(true).subscribe({
      next: () => {
        // Now user is signed in with Google, optionally show allergies selection
        this.step2Google = true;
      },
      error: (err) => {
        this.errorMessage = err.message || 'حدث خطأ أثناء التسجيل مع Google';
      },
    });
  }

  saveGoogleAllergies() {
    this.errorMessage = '';
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.errorMessage = 'لا يوجد مستخدم مسجل.';
      return;
    }
    this.authService.saveAllergies(user.uid, this.selectedAllergies).subscribe({
      next: () => {
        this.router.navigate(['/user']);
      },
      error: (err) => {
        this.errorMessage = err.message || 'خطأ في حفظ الحساسية.';
      },
    });
  }
}
