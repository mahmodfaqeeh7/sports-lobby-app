import React from 'react';
import { Text } from 'react-native';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import { FacilityLocationField } from '../src/features/vendor-onboarding/components/FacilityLocationField';

function buttonWithLabel(renderer: ReactTestRenderer, label: string) {
  return renderer.root.findAll(
    node =>
      node.props.accessibilityRole === 'button' &&
      node.findAllByType(Text).some(text => text.props.children === label),
  )[0];
}

it('stores coordinates only after the user confirms the map pin', () => {
  const onChange = jest.fn();
  const onBlur = jest.fn();
  let renderer: ReactTestRenderer;

  act(() => {
    renderer = create(
      <FacilityLocationField
        value={{ latitude: '', longitude: '' }}
        onChange={onChange}
        onBlur={onBlur}
      />,
    );
  });

  act(() => buttonWithLabel(renderer!, 'Choose on map').props.onPress());
  act(() => {
    renderer!.root.findByProps({ testID: 'facility-location-map' }).props.onPress({
      nativeEvent: {
        coordinate: { latitude: 31.9777777, longitude: 35.8888888 },
      },
    });
  });

  expect(onChange).not.toHaveBeenCalled();

  act(() => buttonWithLabel(renderer!, 'Confirm location').props.onPress());

  expect(onChange).toHaveBeenCalledWith({
    latitude: '31.977778',
    longitude: '35.888889',
  });
  expect(onBlur).toHaveBeenCalledTimes(1);

  act(() => renderer!.unmount());
});
