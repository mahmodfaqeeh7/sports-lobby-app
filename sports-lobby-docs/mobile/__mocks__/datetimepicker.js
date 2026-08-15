const React = require('react');
const { View } = require('react-native');

const DateTimePicker = props => React.createElement(View, props);

module.exports = DateTimePicker;
module.exports.default = DateTimePicker;
module.exports.DateTimePickerAndroid = {
  open: jest.fn(),
  dismiss: jest.fn(),
};
