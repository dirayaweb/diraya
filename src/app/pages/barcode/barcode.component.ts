import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { BarcodeFormat } from '@zxing/library';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-barcode',
  standalone: true,
  imports: [CommonModule, ZXingScannerModule, HttpClientModule],
  templateUrl: './barcode.component.html',
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

  constructor(private http: HttpClient) {}

  // Called when user clicks "Scan Now" button
  startCamera(): void {
    console.log('startCamera() clicked');
    this.isCameraActive = true;
    this.scannedResult = '';
    this.errorMsg = '';
    this.resultStatus = null;
    console.log('isCameraActive set to true, cleared old results');
  }

  // We still keep stopCamera if you want to call it automatically or for debugging
  stopCamera(): void {
    console.log('stopCamera() called, turning camera off');
    this.isCameraActive = false;
  }

  // Called when scanning is successful
  onScanSuccess(decodedText: string): void {
    console.log('onScanSuccess(), decodedText =', decodedText);
    this.scannedResult = decodedText;
    this.fetchProductData(decodedText);

    // Stop camera a fraction of a second after scanning
    setTimeout(() => {
      this.stopCamera();
    }, 300);
  }

  // Called when scanning fails or times out
  onScanFailure(error: any): void {
    console.warn('Scan failure:', error);
  }

  // Fired when ZXing scanner sees available cameras
  onCamerasFound(devices: MediaDeviceInfo[]): void {
    console.log('onCamerasFound(), devices =', devices);
    this.availableDevices = devices;

    if (devices && devices.length) {
      // Attempt to pick rear camera
      const rearCamera = devices.find((d) =>
        /back|rear|environment/i.test(d.label)
      );
      this.selectedDevice = rearCamera || devices[0];
      console.log('Selected device =', this.selectedDevice);
    } else {
      this.errorMsg = 'No cameras found.';
      console.error('No cameras found');
    }
  }

  // If multiple cameras, user can pick in the dropdown
  onDeviceSelect(event: Event): void {
    const selectEl = event.target as HTMLSelectElement;
    const selectedId = selectEl.value;
    console.log('User selected deviceId =', selectedId);
    this.selectedDevice = this.availableDevices.find(
      (device) => device.deviceId === selectedId
    );
    console.log('New selectedDevice =', this.selectedDevice);
  }

  // Called after we decode a barcode. We query OpenFoodFacts
  fetchProductData(barcode: string): void {
    console.log('fetchProductData(), barcode =', barcode);
    const url = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;
    this.http.get(url).subscribe({
      next: (data: any) => {
        console.log('OpenFoodFacts response:', data);
        if (!data || data.status === 0 || !data.product) {
          this.resultStatus = 'notfound';
          return;
        }
        if (
          data.product.allergens_tags &&
          data.product.allergens_tags.length > 0
        ) {
          this.resultStatus = 'unsafe';
        } else {
          this.resultStatus = 'safe';
        }
      },
      error: (err) => {
        console.error('OpenFoodFacts request error:', err);
        this.resultStatus = 'notfound';
      },
    });
  }
}
