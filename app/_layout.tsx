// App/_layout.tsx
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';


export default function Layout() {
  const [fontsLoaded] = useFonts({
    Poppins: require('../assets/fonts/UnifrakturMaguntia-Regular.ttf'),
  });
  if (!fontsLoaded) return null;
  return (
    <Stack
      screenOptions={{
        headerShown: false, // 👈 Hide header for all screens
      }}
    />
  );
}
