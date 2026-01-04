import { configureStore } from '@reduxjs/toolkit'
import { supabaseApi } from '../store/baseApi'
import logger from 'redux-logger'
import { screenPlayer } from './screenPlayerSlice'


export const store = configureStore({
  reducer: {
    // Add your reducers here
    supabaseApi: supabaseApi.reducer,
    screenPlayer: screenPlayer.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
    .concat(supabaseApi.middleware)
    .concat(logger), // ,

    
})
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch