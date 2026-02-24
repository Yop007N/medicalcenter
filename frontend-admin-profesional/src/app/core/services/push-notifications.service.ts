import { Injectable, inject } from '@angular/core';
import { Platform } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { ApiClientService } from '../api/api-client.service';
import { API_ENDPOINTS } from '../api/api-endpoints';

export interface NotificationData {
  type: string;
  entityId?: number;
  entityType?: string;
  action?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PushNotificationsService {
  private platform = inject(Platform);
  private apiClient = inject(ApiClientService);
  private router = inject(Router);

  private tokenSubject = new BehaviorSubject<string | null>(null);
  token$ = this.tokenSubject.asObservable();

  private permissionGranted = false;

  async initialize(): Promise<void> {
    if (this.platform.is('capacitor')) {
      await this.initializeNative();
    } else {
      await this.initializeWeb();
    }
  }

  private async initializeNative(): Promise<void> {
    // Request permission
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      console.warn('Push notification permission not granted');
      return;
    }

    this.permissionGranted = true;

    // Register with native push service
    await PushNotifications.register();

    // Listen for registration success
    PushNotifications.addListener('registration', async (token: Token) => {
      console.log('Push registration success, token:', token.value);
      this.tokenSubject.next(token.value);
      await this.registerTokenWithServer(token.value);
    });

    // Listen for registration errors
    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Push registration error:', error);
    });

    // Listen for incoming notifications
    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('Push notification received:', notification);
      this.handleNotificationReceived(notification);
    });

    // Listen for notification actions
    PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
      console.log('Push notification action performed:', notification);
      this.handleNotificationAction(notification);
    });

    // Initialize local notifications for in-app notifications
    await this.initializeLocalNotifications();
  }

  private async initializeWeb(): Promise<void> {
    // Web push using service worker
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      this.permissionGranted = permission === 'granted';

      if (this.permissionGranted && 'serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();

          if (subscription) {
            // Already subscribed
            console.log('Web push subscription exists');
          }
        } catch (error) {
          console.error('Web push initialization error:', error);
        }
      }
    }
  }

  private async initializeLocalNotifications(): Promise<void> {
    try {
      const permStatus = await LocalNotifications.checkPermissions();
      if (permStatus.display !== 'granted') {
        await LocalNotifications.requestPermissions();
      }

      // Listen for local notification actions
      LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
        console.log('Local notification action:', notification);
        const data = notification.notification.extra as NotificationData;
        if (data) {
          this.navigateToEntity(data);
        }
      });
    } catch (error) {
      console.error('Local notifications initialization error:', error);
    }
  }

  private async registerTokenWithServer(token: string): Promise<void> {
    try {
      await firstValueFrom(
        this.apiClient.post(API_ENDPOINTS.notifications.registerDevice, {
          token,
          platform: this.platform.is('ios') ? 'ios' : 'android'
        })
      );
      console.log('Device registered with server');
    } catch (error) {
      console.error('Failed to register device with server:', error);
    }
  }

  private handleNotificationReceived(notification: PushNotificationSchema): void {
    // Show local notification when app is in foreground
    if (this.platform.is('capacitor')) {
      LocalNotifications.schedule({
        notifications: [
          {
            id: Date.now(),
            title: notification.title || 'Medical Services',
            body: notification.body || '',
            extra: notification.data
          }
        ]
      });
    }
  }

  private handleNotificationAction(action: ActionPerformed): void {
    const data = action.notification.data as NotificationData;
    if (data) {
      this.navigateToEntity(data);
    }
  }

  private navigateToEntity(data: NotificationData): void {
    switch (data.type) {
      case 'appointment':
        if (data.entityId) {
          this.router.navigate(['/appointments', data.entityId]);
        } else {
          this.router.navigate(['/appointments']);
        }
        break;
      case 'appointment_reminder':
        if (data.entityId) {
          this.router.navigate(['/appointments', data.entityId]);
        }
        break;
      case 'medical_record':
        if (data.entityId) {
          this.router.navigate(['/medical-records', data.entityId]);
        }
        break;
      case 'payment':
        if (data.entityId) {
          this.router.navigate(['/payments', data.entityId]);
        }
        break;
      case 'budget':
        if (data.entityId) {
          this.router.navigate(['/budgets', data.entityId]);
        }
        break;
      default:
        this.router.navigate(['/dashboard']);
    }
  }

  // Schedule a local notification (for appointment reminders)
  async scheduleAppointmentReminder(
    appointmentId: number,
    title: string,
    body: string,
    scheduledTime: Date
  ): Promise<void> {
    if (!this.platform.is('capacitor')) {
      console.log('Local notifications only available on native');
      return;
    }

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: appointmentId,
            title,
            body,
            schedule: { at: scheduledTime },
            extra: {
              type: 'appointment_reminder',
              entityId: appointmentId
            }
          }
        ]
      });
      console.log('Appointment reminder scheduled for:', scheduledTime);
    } catch (error) {
      console.error('Failed to schedule notification:', error);
    }
  }

  // Cancel a scheduled notification
  async cancelNotification(notificationId: number): Promise<void> {
    if (!this.platform.is('capacitor')) {
      return;
    }

    try {
      await LocalNotifications.cancel({ notifications: [{ id: notificationId }] });
      console.log('Notification cancelled:', notificationId);
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    }
  }

  // Get all pending notifications
  async getPendingNotifications(): Promise<any[]> {
    if (!this.platform.is('capacitor')) {
      return [];
    }

    try {
      const result = await LocalNotifications.getPending();
      return result.notifications;
    } catch (error) {
      console.error('Failed to get pending notifications:', error);
      return [];
    }
  }

  isPermissionGranted(): boolean {
    return this.permissionGranted;
  }

  getToken(): string | null {
    return this.tokenSubject.value;
  }
}
