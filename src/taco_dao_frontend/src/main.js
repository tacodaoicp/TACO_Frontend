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
import AdminTradeView from "./views/AdminTradeView.vue"
import AdminPriceView from "./views/AdminPriceView.vue"
import AdminPriceHistoryView from "./views/AdminPriceHistoryView.vue"
import AdminNeuronView from "./views/AdminNeuronView.vue"
import ChatView from "./views/ChatView.vue"
import ReportsView from "./views/ReportsView.vue"
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
    { path: "/reports", redirect: "/reports/openchat" },
    { path: "/reports/example", component: ReportsView }, // dd* links should remain for historical linking
    { path: "/reports/ddckbtc", component: ReportsView }, // dd* links should remain for historical linking
    { path: "/reports/ddsneed", component: ReportsView }, // dd* links should remain for historical linking
    { path: "/reports/ddmotoko", component: ReportsView }, // dd* links should remain for historical linking
    { path: "/reports/ddgolddao", component: ReportsView }, // dd* links should remain for historical linking
    { path: "/reports/ddsgldt", component: ReportsView }, // dd* links should remain for historical linking
    { path: "/reports/ckbtc", component: ReportsView },
    { path: "/reports/sneed", component: ReportsView },
    { path: "/reports/motoko", component: ReportsView },
    { path: "/reports/golddao", component: ReportsView },
    { path: "/reports/sgldt", component: ReportsView },    
    { path: "/reports/openchat", component: ReportsView },
    { path: "/admin", name: "Admin", component: AdminView },
    { path: "/admin/trade", name: "AdminTrade", component: AdminTradeView },
    { path: "/admin/price", name: "AdminPrice", component: AdminPriceView },
    { path: "/admin/pricehistory", name: "AdminPriceHistory", component: AdminPriceHistoryView },
    { path: "/admin/neuron", name: "AdminNeuron", component: AdminNeuronView },
    { path: "/:pathMatch(.*)*", redirect: "/" },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

const app = createApp(App)

app.use(router).use(createPinia()).use(VueApexCharts).use(VueClickAway).mount('#app')
