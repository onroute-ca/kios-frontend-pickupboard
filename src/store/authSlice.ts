import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface AuthState {
  isAuthenticated: boolean;
  authToken: string | null;
  refreshToken: string | null;
  expiresAt: string | null;
  refreshTokenExpiresAt: string | null;
  username: string | null;
  storeId: number | null;
  storeName: string | null;
  plazaId: number | null;
  plazaName: string | null;
  deviceId: string | null;
  pinpadIp: string | null;
  pinpadPort: string | null;
  printerIp: string | null;
  printerPort: string | null;
  kioskSerialNo: string | null;
  idleCarouselTimeout: number | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  authToken: null,
  refreshToken: null,
  expiresAt: null,
  refreshTokenExpiresAt: null,
  username: null,
  storeId: null,
  storeName: null,
  plazaId: null,
  plazaName: null,
  deviceId: null,
  pinpadIp: null,
  pinpadPort: null,
  printerIp: null,
  printerPort: null,
  kioskSerialNo: null,
  idleCarouselTimeout: null,
};

export type LoginSuccessPayload = Omit<AuthState, "isAuthenticated">;

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess: (state, action: PayloadAction<LoginSuccessPayload>) => {
      const {
        authToken,
        refreshToken,
        expiresAt,
        refreshTokenExpiresAt,
        username,
        storeId,
        storeName,
        plazaId,
        plazaName,
        deviceId,
        pinpadIp,
        pinpadPort,
        printerIp,
        printerPort,
        kioskSerialNo,
        idleCarouselTimeout,
      } = action.payload;

      state.isAuthenticated = true;
      state.authToken = authToken;
      state.refreshToken = refreshToken;
      state.expiresAt = expiresAt;
      state.refreshTokenExpiresAt = refreshTokenExpiresAt;
      state.username = username;
      state.storeId = storeId;
      state.storeName = storeName;
      state.plazaId = plazaId;
      state.plazaName = plazaName;
      state.deviceId = deviceId;
      state.pinpadIp = pinpadIp;
      state.pinpadPort = pinpadPort;
      state.printerIp = printerIp;
      state.printerPort = printerPort;
      state.kioskSerialNo = kioskSerialNo;
      state.idleCarouselTimeout = idleCarouselTimeout;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.authToken = null;
      state.refreshToken = null;
      state.expiresAt = null;
      state.refreshTokenExpiresAt = null;
      state.username = null;
      state.storeId = null;
      state.storeName = null;
      state.plazaId = null;
      state.plazaName = null;
      state.deviceId = null;
      state.pinpadIp = null;
      state.pinpadPort = null;
      state.printerIp = null;
      state.printerPort = null;
      state.kioskSerialNo = null;
      state.idleCarouselTimeout = null;

      try {
        sessionStorage.clear();
      } catch (err) {
        console.error("Failed to clear storage on logout:", err);
      }
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;

export default authSlice.reducer;
