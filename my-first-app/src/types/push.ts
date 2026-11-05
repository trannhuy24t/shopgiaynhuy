export interface PushStatusDto {
  isSupported: boolean;
  vapidPublicKey: string;
  subscribedDevicesCount: number;
  isDeviceSubscribed: boolean;
}

export interface SubscribePushDto {
  endpoint: string;
  keys?: {
    p256dh: string;
    auth: string;
  };
  p256dh?: string;
  auth?: string;
  deviceDescription?: string;
}

export interface UnsubscribePushDto {
  endpoint: string;
}

export interface SendPushTestDto {
  title?: string;
  content?: string;
  url?: string;
}

