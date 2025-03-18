import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '@angular/fire/auth';
import { FormsModule } from '@angular/forms';
import { Firestore, collection, collectionData, orderBy, query } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

interface ScanHistory {
  barcode: string;
  productName: string;
  ingredients: string;
  scanResult: string;
  scanDate: any;
}

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss']
})
export class UserComponent implements OnInit {
  userAllergies: string[] | null = null;
  userName = '';
  userId = '';
  allAllergies = [
    'حليب - Milk',
    'بيض - Eggs',
    'جلوتين (قمح) - Gluten',
    'مكسرات - Nuts',
    'صويا - Soy'
  ];
  scanHistory$: Observable<ScanHistory[]> | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private firestore: Firestore
  ) {}

  ngOnInit() {
    const current = this.authService.getCurrentUser();
    if (!current) {
      this.router.navigate(['/login']);
      return;
    }
    this.userId = current.uid;
    this.userName = current.displayName || current.email || '';
    this.authService.getUserData(current.uid).subscribe((data) => {
      if (data?.allergies) {
        this.userAllergies = data.allergies;
      } else {
        this.userAllergies = [];
      }
    });
    this.loadScanHistory();
  }

  loadScanHistory() {
    const scansRef = collection(this.firestore, 'users/' + this.userId + '/scans');
    const q = query(scansRef, orderBy('scanDate', 'desc'));
    this.scanHistory$ = collectionData(q, { idField: 'id' }) as Observable<ScanHistory[]>;
  }

  logout() {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/']);
    });
  }

  updateAllergies() {
    if (!this.userId || !this.userAllergies) {
      return;
    }
    this.authService.saveAllergies(this.userId, this.userAllergies).subscribe();
  }
}
