import * as React from 'react';
import renderer, { act } from 'react-test-renderer';

import { ThemedText } from '../ThemedText';

it(`renders correctly`, () => {
  let component: renderer.ReactTestRenderer | undefined;

  act(() => {
    component = renderer.create(<ThemedText>Snapshot test!</ThemedText>);
  });

  const tree = component?.toJSON();

  expect(tree).toEqual(
    expect.objectContaining({
      type: 'Text',
      children: ['Snapshot test!'],
    })
  );
});
