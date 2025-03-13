import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

declare let Quagga: any;

@Component({
  selector: 'app-barcode',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './barcode.component.html',
})
export class BarcodeComponent implements OnInit, OnDestroy {
  productResult = '';
  errorMsg = '';
  isLoading = false;
  isCameraActive = false;

  ngOnInit() {}

  startCamera() {
    this.errorMsg = '';
    this.productResult = '';
    if (!Quagga?.init) {
      this.errorMsg = 'Quagga library not loaded.';
      return;
    }

    this.isCameraActive = true;
    Quagga.init(
      {
        inputStream: {
          type: 'LiveStream',
          constraints: {
            facingMode: 'environment',
          },
        },
        decoder: {
          // EAN and CODE128 are popular for typical products
          readers: [
            'ean_reader',
            'code_128_reader',
            'upc_reader',
            'upc_e_reader',
          ],
        },
      },
      (err: any) => {
        if (err) {
          this.errorMsg = 'Unable to initialize camera.';
          return;
        }
        Quagga.start();
      }
    );

    Quagga.onDetected((result: any) => {
      const code = result.codeResult?.code;
      if (code) {
        this.stopCamera();
        this.callOpenFoodFactsAPI(code);
      }
    });
  }

  stopCamera() {
    this.isCameraActive = false;
    if (Quagga) {
      Quagga.stop();
      Quagga.offDetected(() => {});
    }
  }

  async callOpenFoodFactsAPI(barcode: string) {
    this.isLoading = true;
    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`
      );
      if (!response.ok) {
        throw new Error('API error.');
      }
      const data = await response.json();
      if (!data || data.status === 0) {
        this.productResult = `Product "${barcode}" not found.`;
      } else {
        const allergens = data.product?.allergens_tags || [];
        if (allergens.length) {
          this.productResult = `Detected barcode: ${barcode}
Contains allergens: ${allergens.join(', ')}`;
        } else {
          this.productResult = `Detected barcode: ${barcode}
No major allergens found.`;
        }
      }
    } catch (err: any) {
      this.errorMsg = 'Error fetching product info.';
    }
    this.isLoading = false;
  }

  ngOnDestroy() {
    this.stopCamera();
  }
}
