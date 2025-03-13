import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '@angular/fire/auth';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './nav.component.html',
})
export class NavComponent implements OnInit {
  user: User | null = null;
  avatarUrl = 'https://via.placeholder.com/40';

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe((u) => {
      this.user = u;
      if (this.user?.photoURL) {
        this.avatarUrl = this.user.photoURL;
      } else {
        this.avatarUrl = 'https://avatar.iran.liara.run/public/76';
      }
    });
  }

  goToUserPage() {
    this.router.navigate(['/user']);
  }
}
