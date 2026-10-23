jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
// Icon fonts are binary assets that Jest cannot load; icons are decorative.
jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));
