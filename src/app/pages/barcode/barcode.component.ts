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
          readers: [
            // Standard 1D barcodes supported by default Quagga2
            'code_128_reader',
            'ean_reader',
            'ean_8_reader',
            'upc_reader',
            'upc_e_reader',
            'codabar_reader',
            'i2of5_reader',
            '2of5_reader',
            'code_39_reader',
            'code_93_reader',
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
        // Reopen camera after "not found" message
        setTimeout(() => {
          this.productResult = '';
          this.startCamera();
        }, 2000);
      } else {
        const allergens = data.product?.allergens_tags || [];
        if (allergens.length) {
          this.productResult = `Detected code: ${barcode}
Contains allergens: ${allergens.join(', ')}`;
        } else {
          this.productResult = `Detected code: ${barcode}
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
