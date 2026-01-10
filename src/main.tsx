import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { persistor, store } from './store/store'
import { Provider } from 'react-redux'
import { PersistGate } from "redux-persist/integration/react"
import { AuthProvider } from './contexts/AuthContext.tsx'

const container = document.getElementById('root')

if (container) {
  const root = createRoot(container)

  root.render(
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </PersistGate>
    </Provider>,
  )
} else {
  throw new Error(
    "Root element with ID 'root' was not found in the document. Ensure there is a corresponding HTML element with the ID 'root' in your HTML file.",
  )
}
