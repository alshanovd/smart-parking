import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { parkingRouter } from './parking';

export const appRouter = router({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),
  parking: parkingRouter,
});

export type AppRouter = typeof appRouter;
