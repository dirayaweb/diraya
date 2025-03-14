import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { BarcodeFormat } from '@zxing/library';

@Component({
  selector: 'app-barcode',
  standalone: true,
  imports: [CommonModule, ZXingScannerModule],
  templateUrl: './barcode.component.html',
})
export class BarcodeComponent {
  isCameraActive = false;
  scannedResult = '';
  errorMsg = '';

  // List of available devices
  availableDevices: MediaDeviceInfo[] = [];
  // Instead of a deviceId (string), we store the selected device as a MediaDeviceInfo
  selectedDevice: MediaDeviceInfo | undefined = undefined;

  // Allowed barcode formats – you can adjust these as needed
  allowedFormats = [
    BarcodeFormat.QR_CODE,
    BarcodeFormat.CODE_128,
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E,
  ];

  startCamera(): void {
    this.isCameraActive = true;
    this.scannedResult = '';
    this.errorMsg = '';
  }

  stopCamera(): void {
    this.isCameraActive = false;
  }

  onScanSuccess(decodedText: string): void {
    console.log('Scan success:', decodedText);
    // Optionally stop the camera after a successful scan
    setTimeout(() => {
      this.scannedResult = decodedText;
      this.stopCamera();
    }, 300);
  }

  onScanFailure(error: any): void {
    // Log failures for debugging (these occur often when no code is detected)
    console.debug('Scan failure:', error);
  }

  onCamerasFound(devices: MediaDeviceInfo[]): void {
    this.availableDevices = devices;
    console.log('Cameras found:', devices);
    if (devices && devices.length) {
      // Auto-select a "rear" camera if available
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
    // Find the MediaDeviceInfo object by matching the deviceId
    this.selectedDevice = this.availableDevices.find(
      (device) => device.deviceId === selectedId
    );
  }
}
