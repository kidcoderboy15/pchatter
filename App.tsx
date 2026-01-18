import { StatusBar } from 'expo-status-bar';
import RootNavigator from './src/navigation/RootNavigator';
import { ToastProvider } from './src/context/ToastContext';

export default function App() {
  return (
    <ToastProvider>
      <RootNavigator />
      <StatusBar style="auto" />
    </ToastProvider>
  );
}
