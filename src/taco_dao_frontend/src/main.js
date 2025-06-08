import { createPinia } from 'pinia'
import { createApp } from 'vue'
import { createRouter, createWebHistory } from "vue-router"
import './index.scss'
import 'font-awesome/css/font-awesome.min.css'
import App from './App.vue'
import HomeView from "./views/HomeView.vue"
import DaoView from "./views/DaoView.vue"
import VoteView from "./views/VoteView.vue"
import SalesView from "./views/SalesView.vue"
import SaleDKPSwap from "./components/sales/SaleDKPSwap.vue"
import InfoView from "./views/InfoView.vue"
import AdminView from "./views/AdminView.vue"
import ChatView from "./views/ChatView.vue"
import VueApexCharts from 'vue3-apexcharts'
import VueClickAway from "vue3-click-away"
import 'animate.css'

const routes = [
    { path: "/", name: "Home", component: HomeView },
    { path: "/dao", name: "Dao", component: DaoView },
    { path: "/vote", name: "Vote", component: VoteView },      
    { path: "/sales", name: "Sales", component: SalesView },
    { path: "/sales/dkp-swap", name: "Sale1", component: SaleDKPSwap },
    { path: "/info", name: "Info", component: InfoView },
    { path: "/chat/oc", name: "ChatOC", component: ChatView },
    { path: "/chat/sneed", name: "ChatSneed", component: ChatView },
    { path: "/chat", redirect: "/chat/oc" },
    { path: "/admin", name: "Admin", component: AdminView },
    { path: "/:pathMatch(.*)*", redirect: "/" },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

const app = createApp(App)

app.use(router).use(createPinia()).use(VueApexCharts).use(VueClickAway).mount('#app')