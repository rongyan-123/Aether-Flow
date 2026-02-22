import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import Ai_Input from "@/components/Ai_Input.vue";
import { createPinia } from "pinia";

const app = createApp(App);

app.component("Ai_Input", Ai_Input);

app.use(router).mount("#app");

const pinia = createPinia();
app.use(pinia);
