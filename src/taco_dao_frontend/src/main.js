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
import PortfolioHistoryView from "./views/PortfolioHistoryView.vue"
import AdminNeuronView from "./views/AdminNeuronView.vue"
import AdminVotesView from "./views/AdminVotesView.vue"
import AdminRewardsView from "./views/AdminRewardsView.vue"
import AdminDistributionsView from "./views/AdminDistributionsView.vue"
import AdminRewardsBalancesView from "./views/AdminRewardsBalancesView.vue"
import AdminAlarmView from "./views/AdminAlarmView.vue"
import AdminClaimsView from "./views/AdminClaimsView.vue"
import AdminNNSView from "./views/AdminNNSView.vue"
import RewardsView from "./views/RewardsView.vue"
import ChatView from "./views/ChatView.vue"
import ReportsView from "./views/ReportsView.vue"
import ForumView from "./views/ForumView.vue"
import ThreadView from "./views/ThreadView.vue"
import NamesViewDemo from "./views/NamesViewDemo.vue"
import ProposalsView from "./views/ProposalsView.vue"
import ProposalView from "./views/ProposalView.vue"
import WalletView from "./views/WalletView.vue"
import WalletViewDemo from "./views/WalletViewDemo.vue"
// import WizardViewDemo from "./views/WizardViewDemo.vue"
import NNSVoteView from "./views/NNSVoteView.vue"
import NNSVoteViewDemo from "./views/NNSVoteViewDemo.vue"
import NNSPropView from "./views/NNSPropView.vue"
import NNSPropViewDemo from "./views/NNSPropViewDemo.vue"
import SystemView from "./views/SystemView.vue"
import VueApexCharts from 'vue3-apexcharts'
import VueClickAway from "vue3-click-away"
import 'animate.css'

const routes = [
    { path: "/", name: "Home", component: HomeView, meta: { robots: 'index' } },
    { path: "/dao", name: "Dao", component: DaoView, meta: { robots: 'index' } },
    { path: "/vote", name: "Vote", component: VoteView, meta: { robots: 'index' } },      
    { path: "/system", name: "System", component: SystemView, meta: { robots: 'index' } },
    { path: "/sales", name: "Sales", component: SalesView, meta: { robots: 'index' } },
    { path: "/sales/dkp-swap", name: "Sale1", component: SaleDKPSwap, meta: { robots: 'index' } },
    { path: "/info", name: "Info", component: InfoView, meta: { robots: 'index' } },
    { path: "/wallet", name: "Wallet", component: WalletView, meta: { robots: 'index' } },
    { path: "/walletdemo", name: "WalletDemo", component: WalletViewDemo, meta: { robots: 'noindex' } },
    // { path: "/wizarddemo", name: "WizardDemo", component: WizardViewDemo, meta: { robots: 'noindex' } },
    { path: "/rewards", name: "Rewards", component: RewardsView, meta: { robots: 'noindex' } },
    { path: "/chat/oc", name: "ChatOC", component: ChatView, meta: { robots: 'index' } },
    { path: "/chat/sneed", redirect: "/chat/forum", meta: { robots: 'noindex' } }, // keep for historical linking
    { path: "/chat/forum", name: "ChatForum", component: ChatView, meta: { robots: 'index' } },
    { path: "/chat/forum/:id", name: "ChatForumThread", component: ChatView, meta: { robots: 'noindex' } },
    { path: "/chat", redirect: "/chat/oc", meta: { robots: 'noindex' } },
    { path: "/reports", component: ReportsView, meta: { robots: 'index' } },
    { path: "/reports/example", component: ReportsView, meta: { robots: 'noindex' } },    
    { path: "/reports/ddckbtc", component: ReportsView, meta: { robots: 'noindex' } }, // dd* links should remain for historical linking
    { path: "/reports/ddsneed", component: ReportsView, meta: { robots: 'noindex' } }, // dd* links should remain for historical linking
    { path: "/reports/ddmotoko", component: ReportsView, meta: { robots: 'noindex' } }, // dd* links should remain for historical linking
    { path: "/reports/ddgolddao", component: ReportsView, meta: { robots: 'noindex' } }, // dd* links should remain for historical linking
    { path: "/reports/ddsgldt", component: ReportsView, meta: { robots: 'noindex' } }, // dd* links should remain for historical linking
    { path: "/reports/ckbtc", component: ReportsView, meta: { robots: 'noindex' } },
    { path: "/reports/sneed", component: ReportsView, meta: { robots: 'noindex' } },
    { path: "/reports/motoko", component: ReportsView, meta: { robots: 'noindex' } },
    { path: "/reports/golddao", component: ReportsView, meta: { robots: 'noindex' } },
    { path: "/reports/sgldt", component: ReportsView, meta: { robots: 'noindex' } },
    { path: "/reports/openchat", component: ReportsView, meta: { robots: 'noindex' } },
    { path: "/reports/kongswap", component: ReportsView, meta: { robots: 'noindex' } },
    { path: "/reports/neutrinite", component: ReportsView, meta: { robots: 'noindex' } },
    { path: "/reports/clown", component: ReportsView, meta: { robots: 'noindex' } },
    { path: "/reports/dkp", component: ReportsView, meta: { robots: 'noindex' } },
    { path: "/admin", name: "Admin", component: AdminView, meta: { robots: 'noindex' } },
    { path: "/admin/archives", name: "AdminArchive", component: AdminArchiveView, meta: { robots: 'noindex' } },
    { path: "/admin/trade", name: "AdminTrade", component: AdminTradeView, meta: { robots: 'noindex' } },
    { path: "/admin/price", name: "AdminPrice", component: AdminPriceView, meta: { robots: 'noindex' } },
    { path: "/admin/pricehistory", name: "AdminPriceHistory", component: AdminPriceHistoryView, meta: { robots: 'noindex' } },
    { path: "/portfolio_history", name: "PortfolioHistory", component: PortfolioHistoryView, meta: { robots: 'noindex' } },
    { path: "/admin/neuron", name: "AdminNeuron", component: AdminNeuronView, meta: { robots: 'noindex' } },
    { path: "/admin/votes", name: "AdminVotes", component: AdminVotesView, meta: { robots: 'noindex' } },
    { path: "/admin/rewards", name: "AdminRewards", component: AdminRewardsView, meta: { robots: 'noindex' } },
    { path: "/admin/rewards/balances", name: "AdminRewardsBalances", component: AdminRewardsBalancesView, meta: { robots: 'noindex' } },
    { path: "/admin/distributions", name: "AdminDistributions", component: AdminDistributionsView, meta: { robots: 'noindex' } },
    { path: "/admin/alarm", name: "AdminAlarm", component: AdminAlarmView, meta: { robots: 'noindex' } },
    { path: "/admin/claims", name: "AdminClaims", component: AdminClaimsView, meta: { robots: 'noindex' } },
    { path: "/admin/nns", name: "AdminNNS", component: AdminNNSView, meta: { robots: 'noindex' } },
    { path: "/forum", name: "Forum", component: ForumView, meta: { robots: 'noindex' } },
    { path: "/forum/thread/:id", name: "Thread", component: ThreadView, meta: { robots: 'noindex' } },
    { path: "/namesdemo", name: "NamesDemo", component: NamesViewDemo, meta: { robots: 'noindex' } }, //remove once integrated
    { path: "/nnsvote/:id", name: "NNSVote", component: NNSVoteView, meta: { robots: 'noindex' } },
    { path: "/nnsvotedemo/:id", name: "NNSVoteDemo", component: NNSVoteViewDemo, meta: { robots: 'noindex' } },
    { path: "/nnsprop/:id", name: "NNSProp", component: NNSPropView, meta: { robots: 'noindex' } },
    { path: "/nnspropdemo/:id", name: "NNSPropDemo", component: NNSPropViewDemo, meta: { robots: 'noindex' } },
    { path: "/:pathMatch(.*)*", redirect: "/" },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

const app = createApp(App)

app.use(router).use(createPinia()).use(VueApexCharts).use(VueClickAway).mount('#app')
