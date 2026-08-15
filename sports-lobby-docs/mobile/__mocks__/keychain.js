const store = new Map();

module.exports = {
  ACCESSIBLE: {WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WhenUnlockedThisDeviceOnly'},
  setGenericPassword: jest.fn(async (username, password, options = {}) => {
    store.set(options.service || 'default', {username, password});
    return true;
  }),
  getGenericPassword: jest.fn(async (options = {}) => store.get(options.service || 'default') || false),
  resetGenericPassword: jest.fn(async (options = {}) => store.delete(options.service || 'default')),
};
