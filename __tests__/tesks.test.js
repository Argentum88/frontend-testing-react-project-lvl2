import '@testing-library/jest-dom';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import app from '@hexlet/react-todo-app-with-backend';

const defaultState = {
  lists: [
    { id: 1, name: 'primary', removable: false },
    { id: 2, name: 'secondary', removable: true },
  ],
  tasks: [],
  currentListId: 1,
};

test('see main page', async () => {
  render(app(defaultState));
  expect(await screen.findByText('Hexlet Todos')).toBeVisible();
});
