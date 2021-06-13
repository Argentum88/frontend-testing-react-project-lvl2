import '@testing-library/jest-dom';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import app from '@hexlet/react-todo-app-with-backend';
import handlers from '../task-handlers';

const defaultState = {
  lists: [
    { id: 1, name: 'primary', removable: false },
    { id: 2, name: 'secondary', removable: true },
  ],
  tasks: [],
  currentListId: 1,
};

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('see main page', async () => {
  render(app(defaultState));
  expect(await screen.findByText('Hexlet Todos')).toBeVisible();
});

test('work with tasks', async () => {
  const { container } = render(app(defaultState));

  await userEvent.type(await screen.findByPlaceholderText('Please type text...'), 'new task');
  await userEvent.click(await screen.findByRole('button', { name: 'Add' }));
  expect(await screen.findByText('new task')).toBeInTheDocument();

  await userEvent.click(await screen.findByRole('checkbox'));
  await waitFor(() => {
    const completedTask = container.querySelector('s');
    expect(completedTask.textContent).toBe('new task');
  });

  await userEvent.click(await screen.findByRole('button', { name: 'Remove' }));
  expect(await screen.findByText('Tasks list is empty')).toBeInTheDocument();
});
