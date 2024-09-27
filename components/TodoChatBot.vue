<template>
  <div class="h-full overflow-y-auto">
    <div
      class="flex flex-col text-yellow-500 font-extrabold bg-gray-400 p-5 lg:mx-10 lg:p-7 shadow-md rounded-b-3xl mx-4"
    >
      Todo Chat-Bot
      <p class="text-xs text-gray-200 font-normal">
        You can interact with Ai-bot TodoList, helping you with anything you need.
      </p>
    </div>
    <div class="flex flex-col">
      <div class="flex-grow p-8 lg:px-72">
        <div class="flex-grow p-4 rounded-2xl shadow-xl mb-8">
          <!-- Tampilkan pesan dari user dan model -->
          <div
            v-for="(message, index) in messages"
            :key="index"
            :class="[
              'flex mb-4',
              message.role === 'user' ? 'justify-end' : 'justify-start',
            ]"
          >
            <div
              :class="[
                'p-4 max-w-xs lg:max-w-lg lg:mx-10',
                message.role === 'user'
                  ? 'bg-gray-400 text-white shadow-lg rounded-br-3xl rounded-l-3xl'
                  : 'bg-gray-100 text-gray-700 shadow-lg rounded-bl-3xl rounded-r-3xl',
              ]"
            >
              {{ message.text }}
            </div>
          </div>
          <!-- Tampilkan loading indicator -->
          <div v-if="isLoading" class="flex justify-center my-4">
            <div class="flex items-center">
              <span class="text-gray-500">Loading...</span>
              <svg
                class="animate-spin ml-2 h-5 w-5 text-gray-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                ></path>
              </svg>
            </div>
          </div>
        </div>

        <!-- Input pesan dan tombol kirim -->
        <div
          class="flex p-4 bg-gray-00 border-t rounded-xl shadow-xl gap-2 border-gray-300"
        >
          <input
            v-model="input"
            @keypress.enter="sendMessage"
            placeholder="Type your message..."
            class="flex-grow p-3 border text-black bg-white border-gray-300 rounded-lg focus:outline-none focus:ring-2 shadow-sm focus:ring-gray-500"
            :disabled="isLoading"
          />
          <button
            @click="sendMessage"
            class="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
            :disabled="isLoading"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { useRuntimeConfig } from "#app";

// Definisi tipe pesan (Message)
interface Message {
  role: "user" | "model";
  text: string;
}

const input = ref<string>(""); // State untuk input pesan
const messages = ref<Message[]>([]); // State untuk daftar pesan
const isLoading = ref<boolean>(false); // State untuk loading

// Konteks untuk chatbot
const ChatbotContext: string = `Anda adalah seorang asisten virtual yang cerdas dan berempati. Tugas Anda adalah membantu pengguna mengatur waktu dan meningkatkan produktivitasnya. Saat pengguna meminta rekomendasi todo list, prioritaskan tugas-tugas yang paling penting dan mendesak. Gunakan teknik manajemen waktu seperti metode Eisenhower atau Pomodoro untuk memberikan saran yang efektif. Sesuaikan rekomendasi dengan gaya hidup dan preferensi pengguna. setiap mengetik pertama kali jawab dengan memperkenalkan kamu bahwa kamu seorang dukungan chatbot untuk sebuah Todolist membantu pengguna mengatur waktu dan meningkatkan produktivitasnya. `;
const history = messages.value.map((message) => ({
  role: message.role,
  parts: [{ text: message.text }],
}));

// Mengambil environment variables dari runtimeConfig
const config = useRuntimeConfig();

// Fungsi untuk mengirim pesan
async function sendMessage() {
  if (input.value.trim() === "" || isLoading.value) return; // Cegah input jika sedang loading

  isLoading.value = true; // Set status loading ke true
  // Tambahkan pesan user ke daftar pesan
  messages.value.push({ role: "user", text: input.value });
  const userMessage = input.value;
  input.value = "";

  try {
    const response = await fetchGenerativeAIResponse(userMessage);
    const cleanedResponse = response.replace(/\*/g, ""); // Bersihkan karakter yang tidak diperlukan

    // Tambahkan respon model ke daftar pesan
    messages.value.push({ role: "model", text: cleanedResponse });
  } catch (error) {
    console.error("Error:", error);
  } finally {
    isLoading.value = false; // Set status loading ke false setelah respon diterima
  }
}

// Fungsi untuk memanggil API Google Generative AI
async function fetchGenerativeAIResponse(userInput: string): Promise<string> {
  if (!config.public.apiKey) {
    console.error("API key is missing. Please check your environment variables.");
    throw new Error("API key not defined. Check your environment variables.");
  }

  try {
    // Import library Google Generative AI
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(config.public.apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Sesuaikan history jika tidak ada pesan sebelumnya
    const adjustedHistory =
      history.length > 0
        ? history
        : [{ role: "user", parts: [{ text: ChatbotContext }] }];
    const chat = model.startChat({ history: adjustedHistory });

    // Kirim pesan ke model AI dan ambil hasilnya
    const result = await chat.sendMessage(userInput);
    return result.response.text();
  } catch (error) {
    console.error("Error in API call:", error);
    throw error;
  }
}
</script>
