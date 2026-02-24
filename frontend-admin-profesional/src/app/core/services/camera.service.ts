import { Injectable, inject } from '@angular/core';
import { Platform, ActionSheetController } from '@ionic/angular/standalone';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Observable, from, switchMap } from 'rxjs';
import { ApiClientService } from '../api/api-client.service';
import { API_ENDPOINTS } from '../api/api-endpoints';

export interface CapturedPhoto {
  filepath: string;
  webviewPath: string;
  base64Data?: string;
  blob?: Blob;
}

@Injectable({
  providedIn: 'root'
})
export class CameraService {
  private platform = inject(Platform);
  private actionSheetController = inject(ActionSheetController);
  private apiClient = inject(ApiClientService);

  // Take a photo using camera or gallery
  async capturePhoto(): Promise<CapturedPhoto | null> {
    const actionSheet = await this.actionSheetController.create({
      header: 'Seleccionar Imagen',
      buttons: [
        {
          text: 'Cámara',
          icon: 'camera-outline',
          data: { source: CameraSource.Camera }
        },
        {
          text: 'Galería',
          icon: 'image-outline',
          data: { source: CameraSource.Photos }
        },
        {
          text: 'Cancelar',
          icon: 'close-outline',
          role: 'cancel'
        }
      ]
    });

    await actionSheet.present();
    const result = await actionSheet.onDidDismiss<{ source?: CameraSource }>();
    const source = result.data?.source;

    if (result.role === 'cancel' || !source) {
      return null;
    }

    return this.takePhoto(source);
  }

  // Direct method to take photo from camera
  async takePhotoFromCamera(): Promise<CapturedPhoto | null> {
    return this.takePhoto(CameraSource.Camera);
  }

  // Direct method to pick from gallery
  async pickFromGallery(): Promise<CapturedPhoto | null> {
    return this.takePhoto(CameraSource.Photos);
  }

  private async takePhoto(source: CameraSource): Promise<CapturedPhoto | null> {
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: source,
        quality: 80,
        width: 1024,
        height: 1024,
        correctOrientation: true,
        allowEditing: false
      });

      return await this.processPhoto(photo);
    } catch (error) {
      console.error('Error taking photo:', error);
      return null;
    }
  }

  private async processPhoto(photo: Photo): Promise<CapturedPhoto> {
    // For web, we can use the webPath directly
    if (!this.platform.is('capacitor')) {
      return {
        filepath: photo.path || '',
        webviewPath: photo.webPath || ''
      };
    }

    // For native, save to filesystem
    const fileName = `photo_${Date.now()}.${photo.format}`;
    const savedFile = await this.savePicture(photo, fileName);

    return savedFile;
  }

  private async savePicture(photo: Photo, fileName: string): Promise<CapturedPhoto> {
    // Convert photo to base64 format
    const base64Data = await this.readAsBase64(photo);

    // Write the file to the data directory
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data
    });

    // Get the platform-specific file path
    if (this.platform.is('hybrid')) {
      // On hybrid (Capacitor), use Capacitor.convertFileSrc for display
      return {
        filepath: savedFile.uri,
        webviewPath: (window as any).Capacitor?.convertFileSrc(savedFile.uri) || savedFile.uri,
        base64Data
      };
    } else {
      // On web, use webPath directly
      return {
        filepath: savedFile.uri,
        webviewPath: `data:image/${photo.format};base64,${base64Data}`,
        base64Data
      };
    }
  }

  private async readAsBase64(photo: Photo): Promise<string> {
    if (this.platform.is('hybrid')) {
      // Read the file on native platforms
      const file = await Filesystem.readFile({
        path: photo.path!
      });
      return file.data as string;
    } else {
      // Fetch the photo, read as a blob, then convert to base64 format
      const response = await fetch(photo.webPath!);
      const blob = await response.blob();

      return await this.convertBlobToBase64(blob);
    }
  }

  private convertBlobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix
        resolve(result.split(',')[1]);
      };
      reader.readAsDataURL(blob);
    });
  }

  // Upload photo to server
  uploadPhoto(photo: CapturedPhoto, entityType: string, entityId: number): Observable<any> {
    return from(this.prepareFormData(photo, entityType, entityId)).pipe(
      switchMap(formData =>
        this.apiClient.post(API_ENDPOINTS.files.upload, formData)
      )
    );
  }

  private async prepareFormData(
    photo: CapturedPhoto,
    entityType: string,
    entityId: number
  ): Promise<FormData> {
    const formData = new FormData();

    if (photo.base64Data) {
      // Convert base64 to blob
      const blob = this.base64ToBlob(photo.base64Data, 'image/jpeg');
      const fileName = `photo_${Date.now()}.jpg`;
      formData.append('file', blob, fileName);
    } else if (photo.webviewPath) {
      // Fetch from web path
      const response = await fetch(photo.webviewPath);
      const blob = await response.blob();
      const fileName = `photo_${Date.now()}.jpg`;
      formData.append('file', blob, fileName);
    }

    formData.append('entity_type', entityType);
    formData.append('entity_id', entityId.toString());

    return formData;
  }

  private base64ToBlob(base64: string, contentType: string): Blob {
    const byteCharacters = atob(base64);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);

      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: contentType });
  }

  // Delete a local photo
  async deletePhoto(filepath: string): Promise<void> {
    try {
      await Filesystem.deleteFile({
        path: filepath,
        directory: Directory.Data
      });
    } catch (error) {
      console.error('Error deleting photo:', error);
    }
  }

  // Check camera permissions
  async checkPermissions(): Promise<boolean> {
    try {
      const permissions = await Camera.checkPermissions();
      return permissions.camera === 'granted' && permissions.photos === 'granted';
    } catch (error) {
      console.error('Error checking camera permissions:', error);
      return false;
    }
  }

  // Request camera permissions
  async requestPermissions(): Promise<boolean> {
    try {
      const permissions = await Camera.requestPermissions({
        permissions: ['camera', 'photos']
      });
      return permissions.camera === 'granted' && permissions.photos === 'granted';
    } catch (error) {
      console.error('Error requesting camera permissions:', error);
      return false;
    }
  }
}
