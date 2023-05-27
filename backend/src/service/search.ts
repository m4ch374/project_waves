import { TRPCError } from "@trpc/server";
import { prisma, trpc } from "../utils/provider";
import { z } from "zod";

const checkInput = (input: Object) => {
  if (Object.values(input).filter(s => s === '').length != 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Input fields cannot be empty",
    })
  }
}

const searchWaves = trpc.procedure.input(
  z.object({
    token: z.string(),
    queryStr: z.string()
  })
).query(async ({ input, ctx }) => {
  checkInput(input);
  const userId = ctx.userId;

  const usr = await prisma.user.findMany().catch(() => {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: "User does not exist - something went wrong.",
    })
  })
  const usrFiltered = usr.filter(item => {
    const itemName = item.name.toLowerCase()
    const inputName = input.queryStr.toLowerCase();
    return itemName.includes(inputName)
  })
  const returnArr = usrFiltered.map(item => {
    return {
      name: (item.id === userId) ? item.name + " (You)" : item.name,
      email: item.email,
      aboutMe: item.aboutMe,
      following: item.friends.includes(userId),
    }
  })

  return {
    users: returnArr
  }
})

const searchRouter = trpc.router({
  search: searchWaves,
})

export default searchRouter