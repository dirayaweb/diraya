import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '@angular/fire/auth';

declare var bootstrap: any;

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss']
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

  dismissOffcanvas() {
    const offcanvasElement = document.getElementById('offcanvasNavbar');
    if (offcanvasElement) {
      let bsOffcanvas = bootstrap.Offcanvas.getInstance(offcanvasElement);
      if (!bsOffcanvas) {
        bsOffcanvas = new bootstrap.Offcanvas(offcanvasElement);
      }
      bsOffcanvas.hide();
    }
  }
}
