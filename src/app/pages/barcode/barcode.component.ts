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

  startCamera(): void {
    this.isCameraActive = true;
    this.scannedResult = '';
    this.errorMsg = '';
    this.resultStatus = null;
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
    console.debug('Scan failure:', error);
  }

  onCamerasFound(devices: MediaDeviceInfo[]): void {
    this.availableDevices = devices;
    if (devices && devices.length) {
      const rearCamera = devices.find((d) =>
        /back|rear|environment/i.test(d.label)
      );
      this.selectedDevice = rearCamera || devices[0];
    } else {
      this.errorMsg = 'No cameras found.';
    }
  }

  onDeviceSelect(event: Event): void {
    const selectEl = event.target as HTMLSelectElement;
    const selectedId = selectEl.value;
    this.selectedDevice = this.availableDevices.find(
      (device) => device.deviceId === selectedId
    );
  }

  fetchProductData(barcode: string): void {
    const url = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;
    this.http.get(url).subscribe({
      next: (data: any) => {
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
      error: () => {
        this.resultStatus = 'notfound';
      },
    });
  }
}
