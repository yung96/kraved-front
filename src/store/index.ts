import { configureStore } from "@reduxjs/toolkit"
import { kraevedApi } from "./kraevedApi"

export const store = configureStore({
  reducer: {
    [kraevedApi.reducerPath]: kraevedApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(kraevedApi.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
