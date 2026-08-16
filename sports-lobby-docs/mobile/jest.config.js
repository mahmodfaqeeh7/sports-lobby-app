module.exports = {
  preset: '@react-native/jest-preset',
  watchman: false,
  transformIgnorePatterns: [
    'node_modules/(?!((@)?react-native|@react-native(-community)?|@react-navigation|lucide-react-native|react-native-svg|react-native-safe-area-context|react-native-screens)/)',
  ],
  transform: {
    '^.+\\.(js|mjs|ts|tsx)$': 'babel-jest',
  },
  moduleNameMapper: {
    '^@react-native-clipboard/clipboard$': '<rootDir>/__mocks__/clipboard.js',
    '^@react-native-community/datetimepicker$': '<rootDir>/__mocks__/datetimepicker.js',
    '^react-native-maps$': '<rootDir>/__mocks__/react-native-maps.js',
    '^react-native-keychain$': '<rootDir>/__mocks__/keychain.js',
    '^react-native-config$': '<rootDir>/__mocks__/react-native-config.js',
    '^react-native-image-picker$': '<rootDir>/__mocks__/react-native-image-picker.js',
  },
};
