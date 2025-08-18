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
import AdminArchiveView from "./views/AdminArchiveView.vue"
import AdminTradeView from "./views/AdminTradeView.vue"
import AdminPriceView from "./views/AdminPriceView.vue"
import AdminPriceHistoryView from "./views/AdminPriceHistoryView.vue"
import AdminNeuronView from "./views/AdminNeuronView.vue"
import AdminVotesView from "./views/AdminVotesView.vue"
import AdminRewardsView from "./views/AdminRewardsView.vue"
import AdminDistributionsView from "./views/AdminDistributionsView.vue"
import AdminRewardsBalancesView from "./views/AdminRewardsBalancesView.vue"
import AdminClaimsView from "./views/AdminClaimsView.vue"
import RewardsView from "./views/RewardsView.vue"
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
    { path: "/", name: "Home", component: HomeView, meta: { robots: 'index' } },
    { path: "/dao", name: "Dao", component: DaoView, meta: { robots: 'index' } },
    { path: "/vote", name: "Vote", component: VoteView, meta: { robots: 'index' } },      
    { path: "/sales", name: "Sales", component: SalesView, meta: { robots: 'index' } },
    { path: "/sales/dkp-swap", name: "Sale1", component: SaleDKPSwap, meta: { robots: 'index' } },
    { path: "/info", name: "Info", component: InfoView, meta: { robots: 'index' } },
    { path: "/rewards", name: "Rewards", component: RewardsView, meta: { robots: 'index' } },
    { path: "/chat/oc", name: "ChatOC", component: ChatView, meta: { robots: 'index' } },
    { path: "/chat/sneed", redirect: "/chat/forum", meta: { robots: 'noindex' } }, // keep for historical linking
    { path: "/chat/forum", name: "ChatForum", component: ChatView, meta: { robots: 'index' } },
    { path: "/chat/forum/:id", name: "ChatForumThread", component: ChatView, meta: { robots: 'index' } },
    { path: "/chat", redirect: "/chat/oc", meta: { robots: 'noindex' } },
    { path: "/reports", redirect: "/reports/kongswap", meta: { robots: 'noindex' } },
    { path: "/reports/example", component: ReportsView, meta: { robots: 'index' } },    
    { path: "/reports/ddckbtc", component: ReportsView, meta: { robots: 'noindex' } }, // dd* links should remain for historical linking
    { path: "/reports/ddsneed", component: ReportsView, meta: { robots: 'noindex' } }, // dd* links should remain for historical linking
    { path: "/reports/ddmotoko", component: ReportsView, meta: { robots: 'noindex' } }, // dd* links should remain for historical linking
    { path: "/reports/ddgolddao", component: ReportsView, meta: { robots: 'noindex' } }, // dd* links should remain for historical linking
    { path: "/reports/ddsgldt", component: ReportsView, meta: { robots: 'noindex' } }, // dd* links should remain for historical linking
    { path: "/reports/ckbtc", component: ReportsView, meta: { robots: 'index' } },
    { path: "/reports/sneed", component: ReportsView, meta: { robots: 'index' } },
    { path: "/reports/motoko", component: ReportsView, meta: { robots: 'index' } },
    { path: "/reports/golddao", component: ReportsView, meta: { robots: 'index' } },
    { path: "/reports/sgldt", component: ReportsView, meta: { robots: 'index' } },
    { path: "/reports/openchat", component: ReportsView, meta: { robots: 'index' } },
    { path: "/reports/kongswap", component: ReportsView, meta: { robots: 'index' } },
    { path: "/admin", name: "Admin", component: AdminView, meta: { robots: 'noindex' } },
    { path: "/admin/archives", name: "AdminArchive", component: AdminArchiveView, meta: { robots: 'noindex' } },
    { path: "/admin/trade", name: "AdminTrade", component: AdminTradeView, meta: { robots: 'noindex' } },
    { path: "/admin/price", name: "AdminPrice", component: AdminPriceView, meta: { robots: 'noindex' } },
    { path: "/admin/pricehistory", name: "AdminPriceHistory", component: AdminPriceHistoryView, meta: { robots: 'noindex' } },
    { path: "/admin/neuron", name: "AdminNeuron", component: AdminNeuronView, meta: { robots: 'noindex' } },
    { path: "/admin/votes", name: "AdminVotes", component: AdminVotesView, meta: { robots: 'noindex' } },
    { path: "/admin/rewards", name: "AdminRewards", component: AdminRewardsView, meta: { robots: 'noindex' } },
    { path: "/admin/rewards/balances", name: "AdminRewardsBalances", component: AdminRewardsBalancesView, meta: { robots: 'noindex' } },
    { path: "/admin/distributions", name: "AdminDistributions", component: AdminDistributionsView, meta: { robots: 'noindex' } },
    { path: "/admin/claims", name: "AdminClaims", component: AdminClaimsView, meta: { robots: 'noindex' } },
    { path: "/forum", name: "Forum", component: ForumView, meta: { robots: 'noindex' } },
    { path: "/forum/thread/:id", name: "Thread", component: ThreadView, meta: { robots: 'noindex' } },
    { path: "/names", name: "Names", component: NamesView, meta: { robots: 'noindex' } }, //remove once integrated
    { path: "/:pathMatch(.*)*", redirect: "/" },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

const app = createApp(App)

app.use(router).use(createPinia()).use(VueApexCharts).use(VueClickAway).mount('#app')
