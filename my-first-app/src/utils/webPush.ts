import { getVapidPublicKey, subscribePushDevice, unsubscribePushDevice } from '../api/pushNotification';

// Chuyển Base64URL sang Uint8Array (chuẩn bắt buộc của PushManager)
export function urlB64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Kiểm tra trình duyệt và thiết bị có hỗ trợ Web Push không
export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

// Lấy quyền hiện tại của thông báo ('default' | 'granted' | 'denied')
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission;
}

// Đăng ký Service Worker
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushSupported()) return null;

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    await navigator.serviceWorker.ready;
    return registration;
  } catch (err) {
    console.error('Không thể đăng ký Service Worker:', err);
    return null;
  }
}

// Lấy subscription hiện tại trên trình duyệt (nếu có)
export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;

  try {
    const reg = await navigator.serviceWorker.ready;
    return await reg.pushManager.getSubscription();
  } catch (err) {
    console.warn('Lỗi khi lấy PushSubscription hiện tại:', err);
    return null;
  }
}

// Phát hiện tên thiết bị / trình duyệt
function getDeviceDescription(): string {
  if (typeof navigator === 'undefined') return 'Thiết bị không xác định';
  const ua = navigator.userAgent;
  let browser = 'Trình duyệt';
  if (ua.includes('Edg/')) browser = 'Microsoft Edge';
  else if (ua.includes('Chrome/')) browser = 'Google Chrome';
  else if (ua.includes('Firefox/')) browser = 'Mozilla Firefox';
  else if (ua.includes('Safari/')) browser = 'Apple Safari';

  let os = 'Thiết bị';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Mac OS')) os = 'macOS';

  return `${browser} trên ${os}`;
}

// Đăng ký nhận thông báo đẩy trên thiết bị này
export async function subscribeCurrentDevice(): Promise<{
  success: boolean;
  message: string;
  subscription?: PushSubscription;
}> {
  if (!isPushSupported()) {
    return {
      success: false,
      message: 'Trình duyệt hoặc thiết bị của bạn không hỗ trợ tính năng thông báo đẩy (Web Push).',
    };
  }

  // 1. Yêu cầu quyền thông báo từ người dùng
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return {
      success: false,
      message:
        permission === 'denied'
          ? 'Bạn đã từ chối quyền thông báo. Vui lòng bật lại quyền thông báo trong cài đặt trình duyệt (biểu tượng khóa hoặc chuông trên thanh địa chỉ).'
          : 'Chưa được cấp quyền gửi thông báo.',
    };
  }

  // 2. Đăng ký Service Worker
  const reg = await registerServiceWorker();
  if (!reg) {
    return {
      success: false,
      message: 'Không thể kích hoạt Service Worker trên trình duyệt.',
    };
  }

  try {
    // 3. Lấy VAPID Public Key từ Backend
    const vapidKey = await getVapidPublicKey();
    if (!vapidKey) {
      return {
        success: false,
        message: 'Backend chưa cấu hình VAPID Key để gửi thông báo.',
      };
    }

    // 4. Đăng ký với Push Service của Google/Apple/Mozilla
    let subscription = await reg.pushManager.getSubscription();
    if (!subscription) {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(vapidKey) as unknown as BufferSource,
      });
    }

    const subJson = subscription.toJSON();
    const endpoint = subJson.endpoint || subscription.endpoint;
    const p256dh = subJson.keys?.p256dh;
    const auth = subJson.keys?.auth;

    if (!endpoint || !p256dh || !auth) {
      return {
        success: false,
        message: 'Không tạo được mã bảo mật định danh thiết bị Push (thiếu endpoint/keys).',
      };
    }

    // 5. Gửi lưu vào Backend
    await subscribePushDevice({
      endpoint,
      keys: { p256dh, auth },
      deviceDescription: getDeviceDescription(),
    });

    return {
      success: true,
      message: 'Đã kích hoạt thông báo đẩy thành công! Bạn sẽ nhận được thông báo ngay cả khi đóng web.',
      subscription,
    };
  } catch (err: any) {
    console.error('Lỗi khi kích hoạt Push Notification:', err);
    return {
      success: false,
      message: err?.response?.data?.message || err?.message || 'Không thể đăng ký thông báo đẩy.',
    };
  }
}

// Hủy nhận thông báo đẩy trên thiết bị này
export async function unsubscribeCurrentDevice(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const sub = await getCurrentSubscription();
    if (sub) {
      const endpoint = sub.endpoint;
      await sub.unsubscribe();
      try {
        await unsubscribePushDevice({ endpoint });
      } catch (e) {
        // Bỏ qua lỗi backend nếu sub đã hủy trên trình duyệt
      }
    }
    return {
      success: true,
      message: 'Đã hủy nhận thông báo đẩy trên thiết bị này.',
    };
  } catch (err: any) {
    console.error('Lỗi khi hủy Push Notification:', err);
    return {
      success: false,
      message: err?.message || 'Không thể hủy thông báo đẩy.',
    };
  }
}
