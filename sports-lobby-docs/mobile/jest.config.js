module.exports = {
  preset: '@react-native/jest-preset',
  watchman: false,
  transformIgnorePatterns: [
    'node_modules/(?!((@)?react-native|@react-native(-community)?|lucide-react-native|react-native-svg|react-native-safe-area-context)/)',
  ],
  transform: {
    '^.+\\.(js|mjs|ts|tsx)$': 'babel-jest',
  },
  moduleNameMapper: {
    '^@react-native-clipboard/clipboard$': '<rootDir>/__mocks__/clipboard.js',
  },
};
