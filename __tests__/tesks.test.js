import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import app from '@hexlet/react-todo-app-with-backend'

test('example', () => {
  render(app);
  expect(1).toBe(1);
});
