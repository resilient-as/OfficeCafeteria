// app/index.tsx
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  View
} from 'react-native';

const { width } = Dimensions.get('window');

const LaunchScreen = () => {
  const router = useRouter();

  const forviaLetters = 'FORVIA'.split('');
  const hellaLetters = 'HELLA'.split('');

  const forviaAnimations = useRef(forviaLetters.map(() => new Animated.Value(0))).current;
  const hellaAnimations = useRef(hellaLetters.map(() => new Animated.Value(0))).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    animateLetters(forviaAnimations, () => {
      animateLetters(hellaAnimations, () => {
        fadeInTagline();
      });
    });
  }, []);

  const animateLetters = (animations: Animated.Value[], callback?: () => void) => {
    const anims = animations.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: index * 150,
        useNativeDriver: true,
      })
    );

    Animated.stagger(100, anims).start(() => {
      callback && callback();
    });
  };

  const fadeInTagline = () => {
    Animated.timing(taglineOpacity, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        router.replace('/login'); // Automatically go to login
      }, 1500);
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.textRow}>
        {forviaLetters.map((letter, index) => (
          <Animated.Text
            key={`f-${index}`}
            style={[
              styles.letter,
              {
                opacity: forviaAnimations[index],
                transform: [
                  {
                    translateY: forviaAnimations[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {letter}
          </Animated.Text>
        ))}
      </View>

      <View style={styles.textRow}>
        {hellaLetters.map((letter, index) => (
          <Animated.Text
            key={`h-${index}`}
            style={[
              styles.letter,
              {
                opacity: hellaAnimations[index],
                transform: [
                  {
                    translateY: hellaAnimations[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {letter}
          </Animated.Text>
        ))}
      </View>

      <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
        Your Lunch App
      </Animated.Text>
    </View>
  );
};

export default LaunchScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', // removed blue background
    justifyContent: 'center',
    alignItems: 'center',
  },
  textRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  letter: {
    fontSize: 48,
    color: '#2b4eff', // blue text
    fontWeight: 'bold',
    marginHorizontal: 2,
  },
  tagline: {
    marginTop: 30,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000', // black
  },
});
