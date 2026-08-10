import React from 'react';
import {act, create, ReactTestRenderer} from 'react-test-renderer';
import App from '../App';

beforeEach(() => {
  globalThis.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      text: () => Promise.resolve('[]'),
    } as Response),
  );
});

afterEach(() => {
  jest.resetAllMocks();
});

it('renders the customer app shell', async () => {
  let renderer: ReactTestRenderer | undefined;

  await act(async () => {
    renderer = create(<App />);
  });

  const tree = renderer?.toJSON();

  expect(tree).toBeTruthy();

  await act(async () => {
    renderer?.unmount();
  });
});
