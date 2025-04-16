import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Product {
  status: number;
  product?: {
    product_name?: string;
    ingredients_text?: string;
    allergens_tags?: string[];
  };
}

@Injectable({
  providedIn: 'root',
})
export class OpenfoodfactsService {
  constructor(private http: HttpClient) {}

  getProduct(barcode: string): Observable<Product> {
    const url = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;
    return this.http.get<Product>(url);
  }
}
