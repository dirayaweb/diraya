import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { OpenfoodfactsService, Product } from './openfoodfacts.service';

describe('OpenfoodfactsService', () => {
  let service: OpenfoodfactsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [OpenfoodfactsService],
    });
    service = TestBed.inject(OpenfoodfactsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch product data by barcode', () => {
    const mockResponse: Product = {
      status: 1,
      product: {
        product_name: 'Test Bar',
        ingredients_text: 'Sugar, Cocoa',
        allergens_tags: ['en:milk'],
      },
    };

    service.getProduct('1234567890').subscribe((res) => {
      expect(res.status).toBe(1);
      expect(res.product?.product_name).toBe('Test Bar');
      expect(res.product?.allergens_tags).toContain('en:milk');
    });

    const req = httpMock.expectOne(
      'https://world.openfoodfacts.org/api/v0/product/1234567890.json'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should handle status 0 (product not found)', () => {
    const mockResponse = { status: 0 };
    service.getProduct('000').subscribe((res) => {
      expect(res.status).toBe(0);
      expect(res.product).toBeUndefined();
    });
    const req = httpMock.expectOne(
      'https://world.openfoodfacts.org/api/v0/product/000.json'
    );
    req.flush(mockResponse);
  });

  it('should propagate network errors', () => {
    service.getProduct('123').subscribe({
      next: () => fail('should have errored'),
      error: (err) => expect(err.status).toBe(500),
    });
    const req = httpMock.expectOne(
      'https://world.openfoodfacts.org/api/v0/product/123.json'
    );
    req.error(new ErrorEvent('Network down'), { status: 500 });
  });
});
