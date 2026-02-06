import { Stack } from 'expo-router';
import { ToastProvider } from '../src/context/ToastContext';

export default function RootLayout() {
  return (
    <ToastProvider>
      <Stack>
        <Stack.Screen
          name="index"
          options={{ headerShown: false }}
        />
      </Stack>
    </ToastProvider>
  );
}
