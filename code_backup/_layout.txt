import { Stack } from 'expo-router';
import { useAuthGuard } from '../hooks/useAuthGuard'; // adjust path as needed

export default function AuthenticatedLayout() {
  useAuthGuard(); // 🔐 protects everything in (authenticated) group

  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
