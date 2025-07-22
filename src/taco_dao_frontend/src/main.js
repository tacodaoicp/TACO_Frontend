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
import AdminVotesView from "./views/AdminVotesView.vue"
import ChatView from "./views/ChatView.vue"
import ReportsView from "./views/ReportsView.vue"
import ForumView from "./views/ForumView.vue"
import ThreadView from "./views/ThreadView.vue"
import NamesView from "./views/NamesView.vue"
import ProposalsView from "./views/ProposalsView.vue"
import ProposalView from "./views/ProposalView.vue"
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
    { path: "/reports", redirect: "/reports/ddgolddao" },
    { path: "/reports/example", component: ReportsView },    
    { path: "/reports/ddckbtc", component: ReportsView },
    { path: "/reports/ddsneed", component: ReportsView },
    { path: "/reports/ddmotoko", component: ReportsView },
    { path: "/reports/ddgolddao", component: ReportsView },
    { path: "/admin", name: "Admin", component: AdminView },
    { path: "/admin/trade", name: "AdminTrade", component: AdminTradeView },
    { path: "/admin/price", name: "AdminPrice", component: AdminPriceView },
      { path: "/admin/pricehistory", name: "AdminPriceHistory", component: AdminPriceHistoryView },
    { path: "/admin/neuron", name: "AdminNeuron", component: AdminNeuronView },
    { path: "/admin/votes", name: "AdminVotes", component: AdminVotesView },
    { path: "/forum", name: "Forum", component: ForumView },
    { path: "/forum/thread/:id", name: "Thread", component: ThreadView },
    { path: "/names", name: "Names", component: NamesView },
    { path: "/proposals", name: "Proposals", component: ProposalsView },
    { path: "/proposal/:id", name: "Proposal", component: ProposalView },
    { path: "/:pathMatch(.*)*", redirect: "/" },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

const app = createApp(App)

app.use(router).use(createPinia()).use(VueApexCharts).use(VueClickAway).mount('#app')
