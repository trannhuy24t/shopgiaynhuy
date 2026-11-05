import api from './client';
import type {
  PushStatusDto,
  SubscribePushDto,
  UnsubscribePushDto,
  SendPushTestDto,
} from '../types/push';

export const getVapidPublicKey = async () => {
  const res = await api.get<{ publicKey: string }>('/PushNotification/vapid-public-key');
  return res.data.publicKey;
};

export const getPushStatus = async (endpoint?: string) => {
  const res = await api.get<PushStatusDto>('/PushNotification/status', {
    params: endpoint ? { endpoint } : undefined,
  });
  return res.data;
};

export const subscribePushDevice = async (dto: SubscribePushDto) => {
  const res = await api.post<{ message: string }>('/PushNotification/subscribe', dto);
  return res.data;
};

export const unsubscribePushDevice = async (dto: UnsubscribePushDto) => {
  const res = await api.post<{ message: string }>('/PushNotification/unsubscribe', dto);
  return res.data;
};

export const sendTestPush = async (dto?: SendPushTestDto) => {
  const res = await api.post<{ message: string }>('/PushNotification/test-my-device', dto || {});
  return res.data;
};

export const broadcastPush = async (dto: SendPushTestDto) => {
  const res = await api.post<{ message: string }>('/PushNotification/broadcast', dto);
  return res.data;
};

