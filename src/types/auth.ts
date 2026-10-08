export interface LoginPayload {
  password?: string;
  username?: string;
  deviceType: string;
}

export interface LoginResponse {
  username: string;
  plazaId: number;
  plazaName: string;
  posStoreId: string | number | null;
  storeName: string | null;
  deviceId: string;
  accessToken: string;
  refreshToken: string;
  accessTokenExpiry: string;
  refreshTokenExpiry: string;
  pinpadIp: string | null;
  pinpadPort: string | null;
  printerIp: string | null;
  printerPort: string | null;
  kioskSerialNo: string | null;
  idleCarouselTimeout: number | null;
}
