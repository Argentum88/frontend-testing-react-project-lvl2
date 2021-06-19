import '@testing-library/jest-dom';

import {
  act,
  render,
  screen,
  waitFor,
} from '@testing-library/react';

import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import app from '@hexlet/react-todo-app-with-backend';
import handlers from '../handlers';

describe('tasks', () => {
  const defaultState = {
    lists: [
      { id: 77, name: 'primary', removable: false },
    ],
    tasks: [],
    currentListId: 77,
  };

  let server;
  beforeEach(() => {
    server = setupServer(...handlers(defaultState));
    server.listen();
  });

  afterEach(() => {
    server.close();
  });

  test('see main page', async () => {
    render(app(defaultState));
    expect(await screen.findByText('Hexlet Todos')).toBeVisible();
  });

  test('work with tasks', async () => {
    const { container } = render(app(defaultState));

    userEvent.type(await screen.findByPlaceholderText('Please type text...'), 'new task');
    userEvent.click(await screen.findByRole('button', { name: 'Add' }));
    expect(await screen.findByText('new task')).toBeInTheDocument();

    userEvent.click(await screen.findByRole('checkbox'));
    await waitFor(() => {
      const completedTask = container.querySelector('s');
      expect(completedTask.textContent).toBe('new task');
    });

    userEvent.click(await screen.findByRole('button', { name: 'Remove' }));
    expect(await screen.findByText('Tasks list is empty')).toBeInTheDocument();
  });

  test('submit processing', async () => {
    render(app(defaultState));

    userEvent.type(await screen.findByPlaceholderText('Please type text...'), 'new task');
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
    render(app(defaultState));
    server.use(
      rest.post('/api/v1/lists/:id/tasks', (req, res, ctx) => {
        return res(ctx.status(500));
      }),
    );

    userEvent.type(await screen.findByPlaceholderText('Please type text...'), 'new task');
    userEvent.click(await screen.findByRole('button', { name: 'Add' }));
    expect(await screen.findByText('Network error')).toBeInTheDocument();
  });
});

describe('lists', () => {
  const defaultState = {
    lists: [
      { id: 77, name: 'primary', removable: false },
      { id: 78, name: 'secondary', removable: true },
    ],
    tasks: [
      {
        text: 'primary task',
        id: 88,
        listId: 77,
        completed: false,
        touched: Date.now(),
      },
      {
        text: 'secondary task',
        id: 89,
        listId: 78,
        completed: false,
        touched: Date.now(),
      },
    ],
    currentListId: 77,
  };

  let server;
  beforeEach(() => {
    server = setupServer(...handlers(defaultState));
    server.listen();
  });

  afterEach(() => {
    server.close();
  });

  test('deleting task does not affect other list', async () => {
    render(app(defaultState));
    expect(await screen.findByText('primary task')).toBeInTheDocument();
    userEvent.click(await screen.findByRole('button', { name: 'Remove' }));
    expect(await screen.findByText('Tasks list is empty')).toBeInTheDocument();

    userEvent.click(await screen.findByRole('button', { name: 'secondary' }));
    expect(await screen.findByText('secondary task')).toBeInTheDocument();
  });

  test('closing task does not affect other list', async () => {
    const { container } = render(app(defaultState));
    expect(await screen.findByText('primary task')).toBeInTheDocument();
    userEvent.click(await screen.findByRole('checkbox'));
    await waitFor(() => {
      const completedTask = container.querySelector('s');
      expect(completedTask.textContent).toBe('primary task');
    });

    userEvent.click(await screen.findByRole('button', { name: 'secondary' }));
    await waitFor(() => {
      expect(container.querySelector('s')).toBeNull();
    });
  });

  test('list name is unique', async () => {
    render(app(defaultState));
    userEvent.type(await screen.findByPlaceholderText('List name...'), 'secondary{enter}');
    expect(await screen.findByText('secondary already exists')).toBeInTheDocument();
  });

  test('recreate list', async () => {
    const { container } = render(app(defaultState));
    userEvent.click(container.querySelector('.link-danger'));
    await waitFor(() => {
      expect(screen.queryByText('secondary')).toBeNull();
    });

    await act(async () => {
      userEvent.type(await screen.findByPlaceholderText('List name...'), 'secondary{enter}');
    });
    expect(await screen.findByText('Tasks list is empty')).toBeInTheDocument();
  });
});
