import { createPinia } from 'pinia'
import { createApp } from 'vue'
import { createRouter, createWebHistory } from "vue-router"
import './index.scss'
import 'font-awesome/css/font-awesome.min.css'
import App from './App.vue'
import VueApexCharts from 'vue3-apexcharts'
import VueClickAway from "vue3-click-away"
import 'animate.css'

// Lazy-loaded views - reduces initial bundle size significantly
const HomeView = () => import("./views/HomeView.vue")
const DaoView = () => import("./views/DaoView.vue")
const VoteView = () => import("./views/VoteView.vue")
const SalesView = () => import("./views/SalesView.vue")
const SaleDKPSwap = () => import("./components/sales/SaleDKPSwap.vue")
const InfoView = () => import("./views/InfoView.vue")
const AdminView = () => import("./views/AdminView.vue")
const AdminArchiveView = () => import("./views/AdminArchiveView.vue")
const AdminTradeView = () => import("./views/AdminTradeView.vue")
const AdminPriceView = () => import("./views/AdminPriceView.vue")
const AdminPriceHistoryView = () => import("./views/AdminPriceHistoryView.vue")
const PortfolioHistoryView = () => import("./views/PortfolioHistoryView.vue")
const AdminNeuronView = () => import("./views/AdminNeuronView.vue")
const AdminVotesView = () => import("./views/AdminVotesView.vue")
const AdminRewardsView = () => import("./views/AdminRewardsView.vue")
const AdminDistributionsView = () => import("./views/AdminDistributionsView.vue")
const AdminRewardsBalancesView = () => import("./views/AdminRewardsBalancesView.vue")
const AdminAlarmView = () => import("./views/AdminAlarmView.vue")
const AdminClaimsView = () => import("./views/AdminClaimsView.vue")
const AdminNNSView = () => import("./views/AdminNNSView.vue")
const RewardsView = () => import("./views/RewardsView.vue")
const PerformanceView = () => import("./views/PerformanceView.vue")
const ChatView = () => import("./views/ChatView.vue")
const ReportsView = () => import("./views/ReportsView.vue")
const ForumView = () => import("./views/ForumView.vue")
const ThreadView = () => import("./views/ThreadView.vue")
const NamesViewDemo = () => import("./views/NamesViewDemo.vue")
const ProposalsView = () => import("./views/ProposalsView.vue")
const ProposalView = () => import("./views/ProposalView.vue")
const WalletView = () => import("./views/WalletView.vue")
const WalletViewDemo = () => import("./views/WalletViewDemo.vue")
const NNSVoteView = () => import("./views/NNSVoteView.vue")
const NNSVoteViewDemo = () => import("./views/NNSVoteViewDemo.vue")
const NNSPropView = () => import("./views/NNSPropView.vue")
const NNSPropViewDemo = () => import("./views/NNSPropViewDemo.vue")
const SystemView = () => import("./views/SystemView.vue")
const TestPropView = () => import("./views/TestPropView.vue")

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
    { path: "/performance", name: "Performance", component: PerformanceView, meta: { robots: 'index' } },
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
    { path: "/reports/ntn", component: ReportsView, meta: { robots: 'noindex' } },
    { path: "/reports/cicp", component: ReportsView, meta: { robots: 'noindex' } },
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
    { path: "/test_prop", name: "TestProp", component: TestPropView, meta: { robots: 'noindex' } },
    { path: "/:pathMatch(.*)*", redirect: "/" },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

const app = createApp(App)

app.use(router).use(createPinia()).use(VueApexCharts).use(VueClickAway).mount('#app')
