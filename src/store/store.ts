import { configureStore, combineReducers } from "@reduxjs/toolkit"
import { persistReducer, persistStore } from "redux-persist"
import storage from "redux-persist/lib/storage"
import logger from "redux-logger"

import { supabaseApi } from "../store/baseApi"
import { screenPlayer } from "./screenPlayerSlice"

const rootReducer = combineReducers({
  [supabaseApi.reducerPath]: supabaseApi.reducer,
  screenPlayer: screenPlayer.reducer,
})

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["screenPlayer"],
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    })
      .concat(supabaseApi.middleware)
      .concat(logger),
})

export const persistor = persistStore(store)

// types
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
