import { configureStore, combineReducers, type Action } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import storagePkg from "redux-persist/lib/storage";
import authReducer from "./authSlice";

const storage = (storagePkg as { default?: typeof storagePkg }).default || storagePkg;

const persistConfig = {
  key: "root",
  version: 1,
  storage,
  whitelist: ["auth"],
};

const appReducer = combineReducers({
  auth: authReducer,
});

const rootReducer = (state: ReturnType<typeof appReducer> | undefined, action: Action) => {
  if (action.type === "auth/logout") {
    state = undefined;
  }
  return appReducer(state, action);
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

// Enable refetchOnFocus and refetchOnReconnect behaviors
setupListeners(store.dispatch);

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
