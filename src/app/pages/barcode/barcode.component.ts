import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { BarcodeFormat } from '@zxing/library';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import {
  Firestore,
  collection,
  doc,
  setDoc,
  Timestamp,
} from '@angular/fire/firestore';

@Component({
  selector: 'app-barcode',
  standalone: true,
  imports: [CommonModule, ZXingScannerModule, HttpClientModule],
  templateUrl: './barcode.component.html',
  styleUrls: ['./barcode.component.scss'],
})
export class BarcodeComponent {
  isCameraActive = false;
  scannedResult = '';
  errorMsg = '';
  availableDevices: MediaDeviceInfo[] = [];
  selectedDevice: MediaDeviceInfo | undefined;
  allowedFormats = [
    BarcodeFormat.QR_CODE,
    BarcodeFormat.CODE_128,
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E,
  ];
  resultStatus: 'safe' | 'unsafe' | 'notfound' | null = null;

  // New properties to hold product details
  productName: string | null = null;
  ingredientsText: string | null = null;
  allergens: string[] = [];

  // Video constraints to help mobile camera focus
  videoConstraints = {
    facingMode: { exact: 'environment' },
    advanced: [{ focusMode: 'continuous' }],
  };

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private firestore: Firestore
  ) {}

  startCamera(): void {
    this.isCameraActive = true;
    this.scannedResult = '';
    this.errorMsg = '';
    this.resultStatus = null;
    // Reset product details on each new scan
    this.productName = null;
    this.ingredientsText = null;
    this.allergens = [];
  }

  stopCamera(): void {
    this.isCameraActive = false;
  }

  onScanSuccess(decodedText: string): void {
    this.scannedResult = decodedText;
    this.fetchProductData(decodedText);
    setTimeout(() => {
      this.stopCamera();
    }, 300);
  }

  onScanFailure(error: any): void {
    // Handle scan failure if needed
  }

  onCamerasFound(devices: MediaDeviceInfo[]): void {
    this.availableDevices = devices;
    if (devices && devices.length) {
      this.selectedDevice = devices[0];
    } else {
      this.errorMsg = 'No cameras found.';
    }
  }

  onDeviceSelect(event: Event): void {
    // Implement device selection if needed
  }

  fetchProductData(barcode: string): void {
    const url = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;
    this.http.get(url).subscribe({
      next: (data: any) => {
        if (!data || data.status === 0 || !data.product) {
          this.resultStatus = 'notfound';
          this.productName = null;
          this.ingredientsText = null;
          this.allergens = [];
          this.saveScan(barcode, null, null, 'notfound');
          return;
        }
        const allergens = data.product.allergens_tags || [];
        this.productName = data.product.product_name || 'Unknown';
        this.ingredientsText = data.product.ingredients_text || 'No details';
        this.allergens = allergens;
        if (allergens.length > 0) {
          this.resultStatus = 'unsafe';
          this.saveScan(
            barcode,
            this.productName,
            this.ingredientsText,
            'unsafe'
          );
        } else {
          this.resultStatus = 'safe';
          this.saveScan(
            barcode,
            this.productName,
            this.ingredientsText,
            'safe'
          );
        }
      },
      error: () => {
        this.resultStatus = 'notfound';
        this.productName = null;
        this.ingredientsText = null;
        this.allergens = [];
        this.saveScan(barcode, null, null, 'notfound');
      },
    });
  }

  saveScan(
    barcode: string,
    productName: string | null,
    ingredients: string | null,
    status: string
  ): void {
    const user = this.authService.getCurrentUser();
    if (!user) return;
    const colRef = collection(this.firestore, `users/${user.uid}/scans`);
    const docRef = doc(colRef);
    const dataToSave = {
      barcode,
      productName,
      ingredients,
      scanResult: status,
      scanDate: Timestamp.now(),
    };
    setDoc(docRef, dataToSave);
  }
}
