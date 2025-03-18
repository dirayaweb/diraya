import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import {
  Firestore,
  collection,
  collectionData,
  orderBy,
  query,
  deleteDoc,
  doc,
} from '@angular/fire/firestore';
import { Observable, Subscription } from 'rxjs';

interface ScanHistory {
  id?: string; // Document ID from Firestore
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
  styleUrls: ['./user.component.scss'],
})
export class UserComponent implements OnInit, OnDestroy {
  userAllergies: string[] | null = null;
  userName = '';
  userId = '';
  allAllergies = [
    'حليب - Milk',
    'بيض - Eggs',
    'جلوتين (قمح) - Gluten',
    'مكسرات - Nuts',
    'صويا - Soy',
  ];
  scanHistory$: Observable<ScanHistory[]> | null = null;
  allScans: ScanHistory[] = [];
  displayScans: ScanHistory[] = [];
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;
  scanHistorySubscription: Subscription | null = null;

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
    const scansRef = collection(
      this.firestore,
      'users/' + this.userId + '/scans'
    );
    const q = query(scansRef, orderBy('scanDate', 'desc'));
    this.scanHistory$ = collectionData(q, { idField: 'id' }) as Observable<
      ScanHistory[]
    >;
    this.scanHistorySubscription = this.scanHistory$.subscribe((scans) => {
      this.allScans = scans;
      this.totalPages =
        Math.ceil(this.allScans.length / this.itemsPerPage) || 1;
      this.currentPage = 1; // Reset to first page when new data arrives
      this.updatePage();
    });
  }

  updatePage() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.displayScans = this.allScans.slice(start, end);
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePage();
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePage();
    }
  }

  logout() {
    if (confirm('Are you sure you want to logout?')) {
      this.authService.logout().subscribe(() => {
        this.router.navigate(['/']);
      });
    }
  }

  updateAllergies() {
    if (!this.userId || !this.userAllergies) {
      return;
    }
    this.authService.saveAllergies(this.userId, this.userAllergies).subscribe();
  }

  async clearHistory() {
    if (!this.userId) return;
    if (confirm('Are you sure you want to clear your scan history?')) {
      const deletePromises = this.allScans.map((scan) => {
        if (scan.id) {
          const docRef = doc(
            this.firestore,
            'users/' + this.userId + '/scans',
            scan.id
          );
          return deleteDoc(docRef);
        }
        return Promise.resolve();
      });
      await Promise.all(deletePromises);
      // Clear local arrays after deletion
      this.allScans = [];
      this.updatePage();
    }
  }

  ngOnDestroy() {
    if (this.scanHistorySubscription) {
      this.scanHistorySubscription.unsubscribe();
    }
  }
}
