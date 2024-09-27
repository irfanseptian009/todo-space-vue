<template>
  <div class="text-black p-4 sm:p-6 md:p-10 border-t-4 bg-gray-100 h-screen">
    <div class="text-center font-bold text-gray-500 text-1xl py-5">
      Create Your Todo List Here 👇
    </div>
    <form
      @submit.prevent="addTodo"
      class="flex flex-col sm:flex-row items-center justify-center w-full"
    >
      <input
        v-model="newTodo"
        placeholder="New Todo"
        class="bg-white shadow-xl text-black px-4 py-2 rounded-md mr-0 sm:mr-2 mb-2 sm:mb-0 w-full sm:w-auto"
      />
      <select
        v-model="newPriority"
        class="bg-white shadow-xl text-black px-4 py-2 rounded-md mr-0 sm:mr-2 mb-2 sm:mb-0 w-full sm:w-auto"
      >
        <option value="Low">Low</option>
        <option value="Medium">Medium</option>
        <option value="High">High</option>
      </select>
      <button
        class="bg-gray-500 hover:bg-gray-600 opacity-60 text-white px-4 py-2 rounded-md shadow-xl w-full sm:w-auto"
      >
        Add
      </button>
    </form>

    <p v-if="error" class="text-red-500 text-center mt-2">{{ error }}</p>

    <ul class="mt-4 bg-gray-50 px-5 py-5 lg:py-10 rounded-lg shadow-xl lg:mx-28">
      <li
        v-for="todo in todos"
        :key="todo.id"
        class="flex flex-col sm:flex-row justify-between bg-gray-50 py-3 px-3 rounded-md shadow-lg items-center mt-2 sm:mx-10 transition-transform transform hover:scale-105"
      >
        <div class="flex items-center w-full sm:w-auto">
          <input
            type="checkbox"
            v-model="todo.completed"
            @change="updateTodo(todo)"
            class="mr-2"
          />
          <span :class="{ 'line-through': todo.completed }" class="flex-grow">
            <template v-if="editId === todo.id">
              <input
                v-model="todo.title"
                class="bg-gray-100 border-black border-2 shadow-md mb-3 p-3 sm:mb-0 text-black px-2 py-1 rounded-md mr-2 w-full sm:w-64"
              />
              <select
                v-model="todo.priority"
                class="bg-white shadow-xl px-4 py-2 rounded-md mr-2 w-full sm:w-auto"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
              <button
                @click="saveEdit(todo)"
                class="bg-gray-500 shadow-xl opacity-60 my-2 hover:bg-green-600 text-white px-2 py-1 text-sm rounded-md mr-2"
              >
                <font-awesome-icon icon="save" /> Save
              </button>
              <button
                @click="cancelEdit"
                class="bg-transparent shadow-xl hover:bg-gray-600 text-black px-2 py-1 text-sm rounded-md"
              >
                <font-awesome-icon icon="times" />
              </button>
            </template>
            <template v-else>
              {{ todo.title }} - Priority :
              <span :class="priorityClass(todo.priority)"> {{ todo.priority }}</span>
            </template>
          </span>
        </div>

        <div class="flex justify-end sm:justify-end w-full sm:w-auto mt-2 sm:mt-0">
          <button
            v-if="editId !== todo.id"
            @click="editTodo(todo.id)"
            class="hover:bg-gray-600 bg-gray-400 mx-2 text-gray-200 px-2 py-1 rounded-md shadow-xl"
          >
            <font-awesome-icon icon="edit" /> Edit
          </button>
          <button
            @click="deleteTodo(todo.id)"
            class="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded-md shadow-xl opacity-65"
          >
            <font-awesome-icon icon="trash-alt" /> Delete
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faEdit, faTrashAlt, faSave, faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

library.add(faEdit, faTrashAlt, faSave, faTimes);

const newTodo = ref("");
const newPriority = ref("Medium");
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
  const trimmedTodo = newTodo.value.trim();

  if (trimmedTodo.length < 3 || trimmedTodo.length > 50) {
    error.value = "Todo title must be between 3 and 50 characters.";
    return;
  }

  if (trimmedTodo === "") {
    error.value = "Todo title cannot be empty";
    return;
  }

  try {
    const { data, error: apiError } = await useFetch("/api/todos", {
      method: "POST",
      body: { title: trimmedTodo, priority: newPriority.value },
    });

    if (apiError.value) {
      error.value = "Failed to add todo: " + apiError.value.message;
      return;
    }

    if (data.value && typeof data.value === "object") {
      todos.value.push(data.value);
      newTodo.value = "";
      newPriority.value = "Medium";
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

const updateTodo = async (todo: {
  id: number;
  completed: boolean;
  title: string;
  priority: string;
}) => {
  try {
    const { error: apiError } = await useFetch("/api/todos", {
      method: "PUT",
      body: {
        id: todo.id,
        completed: todo.completed,
        title: todo.title,
        priority: todo.priority,
      },
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

const saveEdit = async (todo: {
  id: number;
  completed: boolean;
  title: string;
  priority: string;
}) => {
  const trimmedTitle = todo.title.trim();

  if (trimmedTitle.length < 3 || trimmedTitle.length > 50) {
    error.value = "Todo title must be between 3 and 50 characters.";
    return;
  }

  try {
    const { error: apiError } = await useFetch("/api/todos", {
      method: "PUT",
      body: {
        id: todo.id,
        completed: todo.completed,
        title: trimmedTitle,
        priority: todo.priority,
      },
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

const priorityClass = (priority: string) => {
  switch (priority) {
    case "Low":
      return "text-green-500";
    case "Medium":
      return "text-blue-500";
    case "High":
      return "text-red-500";
    default:
      return "text-gray-500";
  }
};

onMounted(fetchTodos);

// Fungsi untuk mengarahkan ke halaman chatbot
const goToChatbot = () => {
  window.location.href = "/TodoChatBot";
};
</script>

<style scoped>
.line-through {
  text-decoration: line-through;
}
.border-red-500 {
  border-color: red;
}
/* Menambahkan efek hover dan transisi */
.transition-transform {
  transition: transform 0.3s ease-in-out;
}
.hover\:scale-105:hover {
  transform: scale(1.05);
}
</style>
