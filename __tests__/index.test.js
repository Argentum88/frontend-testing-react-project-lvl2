import '@testing-library/jest-dom';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import app from '@hexlet/react-todo-app-with-backend';
import handlers from '../handlers';

let server;
beforeEach(() => {
  const defaultState = {
    lists: [
      { id: 77, name: 'primary', removable: false },
      { id: 78, name: 'secondary', removable: true },
    ],
    tasks: [
      {
        text: 'secondary task',
        id: 88,
        listId: 78,
        completed: false,
        touched: Date.now(),
      },
    ],
    currentListId: 77,
  };
  server = setupServer(...handlers(defaultState));
  server.listen();

  render(app(defaultState));
});

afterEach(() => {
  server.close();
});

describe('tasks', () => {
  test('see main page', async () => {
    expect(await screen.findByText('Hexlet Todos')).toBeVisible();
  });

  test('work with tasks', async () => {
    userEvent.type(await screen.findByPlaceholderText('Please type text...'), 'primary task');
    userEvent.click(await screen.findByRole('button', { name: 'Add' }));
    expect(await screen.findByText('primary task')).toBeInTheDocument();

    const checkbox = await screen.findByRole('checkbox');
    userEvent.click(checkbox);
    await waitFor(() => {
      expect(checkbox).toBeChecked();
    });

    userEvent.click(await screen.findByRole('button', { name: 'Remove' }));
    expect(await screen.findByText('Tasks list is empty')).toBeInTheDocument();
  });

  test('submit processing', async () => {
    userEvent.type(await screen.findByPlaceholderText('Please type text...'), 'primary task');
    const submit = await screen.findByRole('button', { name: 'Add' });
    userEvent.click(submit);
    await waitFor(() => {
      expect(submit).toBeDisabled();
    });
    await waitFor(() => {
      expect(submit).toBeEnabled();
    });
  });

  test('api error', async () => {
    server.use(
      rest.post('/api/v1/lists/:id/tasks', (req, res, ctx) => res(ctx.status(500))),
    );

    userEvent.type(await screen.findByPlaceholderText('Please type text...'), 'primary task');
    userEvent.click(await screen.findByRole('button', { name: 'Add' }));
    expect(await screen.findByText('Network error')).toBeInTheDocument();
  });
});

describe('lists', () => {
  test('deleting task does not affect other list', async () => {
    userEvent.type(await screen.findByPlaceholderText('Please type text...'), 'primary task');
    userEvent.click(await screen.findByRole('button', { name: 'Add' }));
    expect(await screen.findByText('primary task')).toBeInTheDocument();

    userEvent.click(await screen.findByRole('button', { name: 'Remove' }));
    expect(await screen.findByText('Tasks list is empty')).toBeInTheDocument();

    userEvent.click(await screen.findByRole('button', { name: 'secondary' }));
    expect(await screen.findByText('secondary task')).toBeInTheDocument();
  });

  test('closing task does not affect other list', async () => {
    userEvent.type(await screen.findByPlaceholderText('Please type text...'), 'primary task');
    userEvent.click(await screen.findByRole('button', { name: 'Add' }));
    expect(await screen.findByText('primary task')).toBeInTheDocument();

    const checkbox = await screen.findByRole('checkbox');
    userEvent.click(checkbox);
    await waitFor(() => {
      expect(checkbox).toBeChecked();
    });

    userEvent.click(await screen.findByRole('button', { name: 'secondary' }));
    await waitFor(() => {
      expect(screen.getByRole('checkbox')).not.toBeChecked();
    });
  });

  test('list name is unique', async () => {
    userEvent.type(await screen.findByPlaceholderText('List name...'), 'secondary');
    userEvent.click(await screen.findByText('add list'));
    expect(await screen.findByText('secondary already exists')).toBeInTheDocument();
  });

  test('recreate list', async () => {
    userEvent.click(await screen.findByText('remove list'));
    await waitFor(() => {
      expect(screen.queryByText('secondary')).toBeNull();
    });

    userEvent.type(await screen.findByPlaceholderText('List name...'), 'secondary');
    userEvent.click(await screen.findByText('add list'));
    expect(await screen.findByText('secondary')).toBeInTheDocument();
    expect(await screen.findByText('Tasks list is empty')).toBeInTheDocument();
  });
});
