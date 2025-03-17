import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user.component.html',
})
export class UserComponent implements OnInit {
  userAllergies: string[] | null = null;
  userName = '';
  userId = '';

  // Full allergy list for user to choose from
  allAllergies = [
    'حليب - Milk',
    'بيض - Eggs',
    'جلوتين (قمح) - Gluten',
    'مكسرات - Nuts',
    'صويا - Soy',
  ];

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    const current = this.authService.getCurrentUser();
    if (!current) {
      // If no user, redirect or show error
      this.router.navigate(['/login']);
      return;
    }

    this.userId = current.uid;
    this.userName = current.displayName || current.email || '';

    // Fetch user data (allergies)
    this.authService.getUserData(current.uid).subscribe((data) => {
      if (data?.allergies) {
        this.userAllergies = data.allergies;
      } else {
        this.userAllergies = [];
      }
    });
  }

  logout() {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/']);
    });
  }

  updateAllergies() {
    if (!this.userId || !this.userAllergies) return;
    this.authService.saveAllergies(this.userId, this.userAllergies).subscribe({
      next: () => {
        // Possibly show a success message
      },
      error: (err) => {
        // show error
        console.error('Error saving allergies:', err);
      },
    });
  }
}
