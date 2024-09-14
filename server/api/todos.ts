// server/api/todos.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  const method = getMethod(event);

  if (method === "GET") {
    return await prisma.todo.findMany();
  } else if (method === "POST") {
    const body = await readBody(event);

    if (!body.title || typeof body.title !== "string") {
      throw createError({
        statusCode: 400,
        statusMessage: "Title is required",
      });
    }

    const newTodo = await prisma.todo.create({
      data: {
        title: body.title,
      },
    });

    return newTodo;
  } else if (method === "PUT") {
    const body = await readBody(event);

    if (!body.id || typeof body.id !== "number") {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid todo ID",
      });
    }

    const updatedTodo = await prisma.todo.update({
      where: { id: body.id },
      data: {
        title: body.title || undefined,
        completed: body.completed,
      },
    });

    return updatedTodo;
  } else if (method === "DELETE") {
    const body = await readBody(event);

    if (!body.id || typeof body.id !== "number") {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid todo ID",
      });
    }

    await prisma.todo.delete({
      where: { id: body.id },
    });

    return { message: "Todo deleted" };
  }
});
