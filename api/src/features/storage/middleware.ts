import { jwt } from 'hono/jwt'
import { MiddlewareHandler } from 'hono';

export const authMiddleware = (token: string): MiddlewareHandler => {
  return jwt({ secret: token })
};
