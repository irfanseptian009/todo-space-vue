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

    const priority = body.priority || "Medium"; // Menambahkan priority, default ke "Medium"

    try {
      const newTodo = await prisma.todo.create({
        data: {
          title: body.title,
          priority: priority, // Menambahkan priority pada pembuatan todo
        },
      });

      return newTodo;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw createError({
          statusCode: 500,
          statusMessage: `Failed to create todo: ${error.message}`,
        });
      } else {
        throw createError({
          statusCode: 500,
          statusMessage: "Failed to create todo: Unknown error",
        });
      }
    }
  } else if (method === "PUT") {
    const body = await readBody(event);

    if (!body.id || typeof body.id !== "number") {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid todo ID",
      });
    }

    try {
      const updatedTodo = await prisma.todo.update({
        where: { id: body.id },
        data: {
          title: body.title || undefined,
          completed: body.completed,
          priority: body.priority || undefined, // Mengizinkan pembaruan priority
        },
      });

      return updatedTodo;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw createError({
          statusCode: 500,
          statusMessage: `Failed to update todo: ${error.message}`,
        });
      } else {
        throw createError({
          statusCode: 500,
          statusMessage: "Failed to update todo: Unknown error",
        });
      }
    }
  } else if (method === "DELETE") {
    const body = await readBody(event);

    if (!body.id || typeof body.id !== "number") {
      throw createError({
        statusCode: 400,
        statusMessage: "Invalid todo ID",
      });
    }

    try {
      await prisma.todo.delete({
        where: { id: body.id },
      });

      return { message: "Todo deleted" };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw createError({
          statusCode: 500,
          statusMessage: `Failed to delete todo: ${error.message}`,
        });
      } else {
        throw createError({
          statusCode: 500,
          statusMessage: "Failed to delete todo: Unknown error",
        });
      }
    }
  }
});
