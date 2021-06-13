import '@testing-library/jest-dom';

import { render, screen } from '@testing-library/react';
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

const tasks = [];
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
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('see main page', async () => {
  render(app(defaultState));
  expect(await screen.findByText('Hexlet Todos')).toBeVisible();
});

test('work with tasks', async () => {
  render(app(defaultState));

  await userEvent.type(await screen.findByPlaceholderText('Please type text...'), 'new task1');
  await userEvent.click(await screen.findByRole('button', { name: 'Add' }));
  expect(await screen.findByText('new task1')).toBeVisible();

  await userEvent.type(await screen.findByPlaceholderText('Please type text...'), 'new task2');
  await userEvent.click(await screen.findByRole('button', { name: 'Add' }));
  expect(await screen.findByText('new task1')).toBeVisible();
  expect(await screen.findByText('new task2')).toBeVisible();
});
