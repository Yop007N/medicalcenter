import { TestBed } from '@angular/core/testing';
import { ConnectivityService } from './connectivity.service';
import { IonicModule, ToastController } from '@ionic/angular';

describe('ConnectivityService', () => {
  let service: ConnectivityService;
  let toastControllerSpy: jasmine.SpyObj<ToastController>;

  beforeEach(() => {
    const toastSpy = jasmine.createSpyObj('ToastController', ['create']);
    toastSpy.create.and.returnValue(Promise.resolve({
      present: () => Promise.resolve()
    } as any));

    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot()],
      providers: [
        ConnectivityService,
        { provide: ToastController, useValue: toastSpy }
      ]
    });

    service = TestBed.inject(ConnectivityService);
    toastControllerSpy = TestBed.inject(ToastController) as jasmine.SpyObj<ToastController>;
  });

  describe('initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with navigator.onLine status', () => {
      expect(service.isOnline()).toBe(navigator.onLine);
    });
  });

  describe('isOnline', () => {
    it('should return current online status', () => {
      const status = service.isOnline();
      expect(typeof status).toBe('boolean');
    });
  });

  describe('online$', () => {
    it('should emit current online status', (done) => {
      service.online$.subscribe(isOnline => {
        expect(typeof isOnline).toBe('boolean');
        done();
      });
    });
  });

  describe('checkConnection', () => {
    it('should return observable of online status', (done) => {
      service.checkConnection().subscribe(isOnline => {
        expect(typeof isOnline).toBe('boolean');
        done();
      });
    });
  });
});
