import '@testing-library/jest-dom';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import _ from 'lodash';
import app from '@hexlet/react-todo-app-with-backend';

const getNextId = () => Number(_.uniqueId());

const defaultState = {
  lists: [
    { id: 1, name: 'primary', removable: false },
    { id: 2, name: 'secondary', removable: true },
  ],
  tasks: [],
  currentListId: 1,
};

let tasks = [];
const server = setupServer(
  rest.post('/api/v1/lists/:id/tasks', (req, res, ctx) => {
    const { text } = req.body;
    const task = {
      text,
      listId: Number(req.params.id),
      id: getNextId(),
      completed: false,
      touched: Date.now(),
    };
    tasks.push(task);
    return res(
      ctx.status(201),
      ctx.json(task),
    );
  }),
  rest.patch('/api/v1/tasks/:id', (req, res, ctx) => {
    const taskId = Number(req.params.id);
    const { completed } = req.body;
    const task = tasks.find((t) => t.id === taskId);
    task.completed = completed;
    task.touched = Date.now();
    return res(
      ctx.status(201),
      ctx.json(task),
    );
  }),
  rest.delete('/api/v1/tasks/:id', (req, res, ctx) => {
    const taskId = Number(req.params.id);
    tasks = tasks.filter((t) => t.id !== taskId);
    return res(
      ctx.status(204),
    );
  }),
);

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
