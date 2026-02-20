import { router, protectedProcedure } from "../_core/trpc";

export const authRouter = router({
    me: protectedProcedure.query(({ ctx }) => {
        return ctx.user;
    }),
});
