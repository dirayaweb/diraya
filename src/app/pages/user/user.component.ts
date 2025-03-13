import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user.component.html',
})
export class UserComponent implements OnInit {
  userAllergies: string[] | null = null;
  userName = '';

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    const current = this.authService.getCurrentUser();
    if (current) {
      this.userName = current.displayName || current.email || '';
      this.authService.getUserData(current.uid).subscribe((data) => {
        if (data?.allergies) {
          this.userAllergies = data.allergies;
        } else {
          this.userAllergies = [];
        }
      });
    }
  }

  logout() {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/']);
    });
  }
}
