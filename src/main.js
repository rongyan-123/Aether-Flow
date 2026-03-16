import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import Ai_Input from "@/components/Ai_Input.vue";
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import Information_Input from "./components/Information_Input.vue";

const app = createApp(App);
const pinia = createPinia();

pinia.use(piniaPluginPersistedstate);
app.component("Ai_Input", Ai_Input);
app.component("Information_Input", Information_Input);
app.use(pinia);

app.use(router).mount("#app"); //注意mount一定要放在最后

export { pinia };
