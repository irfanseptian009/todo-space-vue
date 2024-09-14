<template>
  <div class="bg-gray-900 text-white p-10 h-screen">
    <h1 class="text-2xl font-bold mb-4 text-center">Todo List</h1>

    <form @submit.prevent="addTodo" class="flex items-center justify-center">
      <input
        v-model="newTodo"
        placeholder="New Todo"
        class="bg-gray-800 text-white px-4 py-2 rounded-md mr-2"
      />
      <button class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md">
        Add
      </button>
    </form>
    <p v-if="error" class="text-red-500 text-center mt-2">{{ error }}</p>

    <ul class="mt-4">
      <li
        v-for="todo in todos"
        :key="todo.id"
        class="flex justify-between items-center mt-2"
      >
        <div class="flex items-center">
          <input
            type="checkbox"
            v-model="todo.completed"
            @change="updateTodo(todo)"
            class="mr-2"
          />
          <span :class="{ 'line-through': todo.completed }">
            <template v-if="editId === todo.id">
              <input
                v-model="todo.title"
                class="bg-gray-800 text-white px-2 py-1 rounded-md mr-2"
              />
              <button
                @click="saveEdit(todo)"
                class="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded-md mr-2"
              >
                Save
              </button>
              <button
                @click="cancelEdit"
                class="bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded-md"
              >
                Cancel
              </button>
            </template>
            <template v-else>
              {{ todo.title }}
            </template>
          </span>
        </div>
        <div>
          <button
            @click="editTodo(todo.id)"
            class="bg-yellow-500 hover:bg-yellow-600 mx-2 text-white px-2 py-1 rounded-md ml-2"
          >
            Edit
          </button>
          <button
            @click="deleteTodo(todo.id)"
            class="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded-md"
          >
            Delete
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";

const newTodo = ref("");
const todos = ref<any[]>([]);
const error = ref<string | null>(null);
const editId = ref<number | null>(null);

const fetchTodos = async () => {
  const { data, error: fetchError } = await useFetch("/api/todos");

  if (fetchError.value) {
    console.error("Failed to fetch todos:", fetchError.value.message);
    return;
  }

  todos.value = Array.isArray(data.value) ? data.value : [];
};

const addTodo = async () => {
  if (newTodo.value.trim() === "") {
    error.value = "Todo title cannot be empty";
    return;
  }

  try {
    const { data, error: apiError } = await useFetch("/api/todos", {
      method: "POST",
      body: { title: newTodo.value },
    });

    if (apiError.value) {
      error.value = "Failed to add todo: " + apiError.value.message;
      return;
    }

    if (data.value && typeof data.value === "object") {
      todos.value.push(data.value);
      newTodo.value = "";
      error.value = null;
    } else {
      error.value = "Invalid data received from API.";
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      error.value = "Failed to add todo: " + err.message;
    } else {
      error.value = "Failed to add todo: An unknown error occurred";
    }
  }
};
const updateTodo = async (todo: { id: number; completed: boolean; title: string }) => {
  try {
    const { error: apiError } = await useFetch("/api/todos", {
      method: "PUT",
      body: { id: todo.id, completed: todo.completed, title: todo.title },
    });

    if (apiError.value) {
      error.value = "Failed to update todo: " + apiError.value.message;
    }
  } catch (err) {
    error.value =
      "Failed to update todo: " + (err instanceof Error ? err.message : String(err));
  }
};
const editTodo = (id: number) => {
  editId.value = id;
};

const saveEdit = async (todo: { id: number; completed: boolean; title: string }) => {
  try {
    const { error: apiError } = await useFetch("/api/todos", {
      method: "PUT",
      body: { id: todo.id, completed: todo.completed, title: todo.title },
    });

    if (apiError.value) {
      error.value = "Failed to update todo: " + apiError.value.message;
    } else {
      editId.value = null;
    }
  } catch (err) {
    error.value =
      "Failed to update todo: " + (err instanceof Error ? err.message : String(err));
  }
};
const cancelEdit = () => {
  editId.value = null;
};

const deleteTodo = async (id: number) => {
  try {
    await useFetch("/api/todos", {
      method: "DELETE",
      body: { id },
    });

    todos.value = todos.value.filter((todo) => todo.id !== id);
  } catch (err: unknown) {
    error.value =
      "Failed to delete todo: " + (err instanceof Error ? err.message : String(err));
  }
};
onMounted(fetchTodos);
</script>

<style scoped>
.line-through {
  text-decoration: line-through;
}
.border-red-500 {
  border-color: red;
}
</style>
