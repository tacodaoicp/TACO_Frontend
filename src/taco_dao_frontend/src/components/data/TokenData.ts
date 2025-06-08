/////////////
// imports //
/////////////

// import token images
import aliceToken from "../../assets/tokens/snspng/alice.png"
import icpToken from "../../assets/tokens/snspng/icp.png"
import licpToken from "../../assets/tokens/snspng/licp.png"
import boomDaoToken from "../../assets/tokens/snspng/boom-dao.png"
import catalyzeToken from "../../assets/tokens/snspng/catalyze.png"
import cyclesTransferStationToken from "../../assets/tokens/snspng/cycles-transfer-station.png"
import decideAiToken from "../../assets/tokens/snspng/decideai-dao.png"
import defaultToken from "../../assets/tokens/snspng/default.png"  
import dogmiToken from "../../assets/tokens/snspng/dogmi.png"
import dragginzToken from "../../assets/tokens/snspng/dragginz.png"
import elnaAiToken from "../../assets/tokens/snspng/elna-ai.png"
import estateDaoToken from "../../assets/tokens/snspng/estate-dao.png"
import goldDaoToken from "../../assets/tokens/snspng/gold-dao.png"
import icGhostToken from "../../assets/tokens/snspng/icghost.png"
import icLightHouseToken from "../../assets/tokens/snspng/iclighthouse-dao.png"
import icpandaDaoToken from "../../assets/tokens/snspng/icpanda-dao.png"
import swampiesToken from "../../assets/tokens/snspng/swampies.png"
import icpSwapToken from "../../assets/tokens/snspng/icpswap.png"
import ictoToken from "../../assets/tokens/snspng/icto.png"
import icvcToken from "../../assets/tokens/snspng/icvc.png"
import kinicToken from "../../assets/tokens/snspng/kinic.png"
import kongSwapToken from "../../assets/tokens/snspng/kongswap.png"
import motokoToken from "../../assets/tokens/snspng/motoko.png"
import neutriniteToken from "../../assets/tokens/snspng/neutrinite.png"
import nuanceToken from "../../assets/tokens/snspng/nuance.png"
import openchatToken from "../../assets/tokens/snspng/openchat.png"
import openfplToken from "../../assets/tokens/snspng/openfpl.png"
import origynToken from "../../assets/tokens/snspng/origyn.png"
import seersToken from "../../assets/tokens/snspng/seers.png"
import sneedToken from "../../assets/tokens/snspng/sneed.png"
import sonicToken from "../../assets/tokens/snspng/sonic.png"
import tacoToken from "../../assets/tokens/snspng/taco-dao.png"  
import traxToken from "../../assets/tokens/snspng/trax.png"
import usdc2Token from "../../assets/tokens/snspng/usdc2.png"  
import waterneuronToken from "../../assets/tokens/snspng/waterneuron.png"
import xmtkToken from "../../assets/tokens/snspng/xmtk.png"
import xmtk2Token from "../../assets/tokens/snspng/xmtk2.png"  
import yralToken from "../../assets/tokens/snspng/yral.png"
import yukuDaoToken from "../../assets/tokens/snspng/yuku-dao.png"
import ckusdcToken from "../../assets/tokens/ckusdc.png"
import ckbtcToken from "../../assets/tokens/ckbtc.png"
import icfcToken from "../../assets/tokens/snspng/icfc.png"
import icpExToken from "../../assets/tokens/snspng/icpex.png"
import nfidWalletToken from "../../assets/tokens/snspng/nfidw.png"
import fomoWellToken from "../../assets/tokens/snspng/fomowell.png"
import cecilTheLionDaoToken from "../../assets/tokens/snspng/cecil-the-lion-dao.png"
import personalDaoToken from "../../assets/tokens/snspng/personal-dao.png"
import dolrToken from "../../assets/tokens/snspng/dolr.png"
import fuelEvToken from "../../assets/tokens/snspng/fuelev.png"

//////////////
// mappings //
//////////////

// token name to image mapping
export const tokenImages: { [key: string]: string } = {
"Alice": aliceToken,
"Internet Computer": icpToken,
"Chainkey USDC": ckusdcToken,
"Chainkey BTC": ckbtcToken,
"Local ICP": licpToken,    
"BOOM DAO": boomDaoToken,
"Catalyze": catalyzeToken,
"CYCLES-TRANSFER-STATION": cyclesTransferStationToken,
"Decide AI": decideAiToken,
"Default": defaultToken,
"DOGMI": dogmiToken,
"Dragginz": dragginzToken,
"ELNA AI": elnaAiToken,
"EstateDAO": estateDaoToken,
"Gold DAO": goldDaoToken,
"ICGhost": icGhostToken,
"ICLighthouse DAO": icLightHouseToken,
"ICPanda DAO": icpandaDaoToken,
"Swampies": swampiesToken,
"ICPSwap": icpSwapToken,
"ICTO": ictoToken,
"ICVC": icvcToken,
"Kinic": kinicToken,
"KongSwap": kongSwapToken,
"Motoko": motokoToken,
"Neutrinite": neutriniteToken,
"Nuance": nuanceToken,
"OpenChat": openchatToken,
"OpenFPL": openfplToken,
"ORIGYN": origynToken,
"Seers": seersToken,
"Sneed": sneedToken,
"SONIC": sonicToken,
"TACO": tacoToken,
"TRAX": traxToken,
"USDC2": usdc2Token,    
"WaterNeuron": waterneuronToken,
"My Token": xmtkToken,    
"My Token2": xmtk2Token,
"YRAL": yralToken,
"Yuku DAO": yukuDaoToken,
"Cecil The Lion DAO": cecilTheLionDaoToken,
"Personal DAO": personalDaoToken,
"DOLR": dolrToken,
"FuelEV": fuelEvToken,
"ICExplorer": icpExToken,
"FomoWell": fomoWellToken,
}  

//////////
// data //
//////////

// export token data
export const tokenData = [
    {
        title: 'Alice',
        symbol: 'alice',
        link: 'https://alice.fun/',
        icon: aliceToken,
        description: `BOB's partner.`,
        color: '#F8ADC3'
    },
    {
        title: 'BOOM DAO',
        symbol: 'boom',
        link: 'https://boomdao.xyz/',
        icon: boomDaoToken,
        description: `BOOM DAO is an all-in-one web3 game platform and protocol running 100% on-chain on the Internet Computer`,
        color: '#2bc1e7'
    },    
    {
        title: 'Catalyze',
        symbol: 'ctz',
        link: 'https://catalyze.one',
        icon: catalyzeToken,
        description: `Catalyze is a one-stop social-fi application for organising your Web3 experience`,
        color: '#273979'
    },  
    {
        title: 'Cecil The Lion DAO',
        symbol: 'cecil',
        link: 'https://cecildao.org/',
        icon: cecilTheLionDaoToken,
        description: `The Cecil The Lion DAO project is the first-ever AI-driven humanitarian DAO, an initiative dedicated to supporting vital humanitarian projects across the globe. This unique organization was born from a place of deep compassion, inspired by the tragic and senseless killing of Cecil the lion, a symbol of majestic beauty and a stark reminder of the challenges facing our world. The DAO stands as a testament to his legacy, channeling the grief and outrage into positive action. Operating entirely on a non-profit basis, the DAO is committed to transparency and accountability, ensuring that every single contribution, no matter the size, directly and effectively benefits the projects it supports.`,
        color: '#2877B8'
    },
    {
        title: 'OpenChat',
        symbol: 'chat',
        link: 'https://oc.app',
        icon: openchatToken,
        description: `A decentralized chat app governed by the people for the people`,
        color: '#E48142'
    },     
    {
        title: 'Chainkey USDC',
        symbol: 'ckusdc',
        link: 'https://icpcoins.com/#/token/ckBTC',
        icon: ckusdcToken,
        description: `Chain-key USDC (ckUSDC), a multi-chain USDC twin on the Internet Computer, is an ICRC-1-compliant token that is backed 1:1 by USDC such that 1 ckUSDC can always be redeemed for 1 USDC and vice versa.`,
        color: '#5122b5'
    },
    {
        title: 'Chainkey BTC',
        symbol: 'ckbtc',
        link: 'https://dashboard.internetcomputer.org/bitcoin',
        icon: ckbtcToken,
        description: `ckBTC is a pair of ICP smart contracts building on the Bitcoin canister and ckECDSA services. The contracts work together to enable users and canister smart contracts on ICP to send and receive BTC value within seconds — far faster than is possible with native BTC chain transactions, while also always allowing users and smart contracts to send and receive value to and from native BTC network addresses.`,
        color: '#5122b5'
    },    
    {
        title: 'CYCLES-TRANSFER-STATION',
        symbol: 'cts',
        link: 'https://dashboard.internetcomputer.org/sns/ibahq-taaaa-aaaaq-aadna-cai',
        icon: cyclesTransferStationToken,
        description: `Formerly Cycles Transfer Station (CTS), this project has since been shut down.`,
        color: '#485b86'
    },        
    {
        title: 'DecideAI DAO',
        symbol: 'dcd',
        link: 'https://decideai.xyz',
        icon: decideAiToken,
        description: `DecideAI is an ecosystem, creating AI that benefit users, contributors, and developers.`,
        color: '#171717'
    },
    {
        title: 'Personal DAO',
        symbol: 'dao',
        link: 'https://gsnnn-ziaaa-aaaag-acaaa-cai.icp0.io/',
        icon: personalDaoToken,
        description: `Personal DAOs are turnkey DAOs in which every component of the DAO (UI, API, Database and AI model) is coded within smart contracts that rest under the sole custodies of the respective communities that operate them. Personal DAOs operate as self-sustaining financial institutions and Decentralized AI agents that allow communities to conduct collaborative allocation of resources without the need for any intermediaries at any level of the technical stack. Personal DAOs are built to serve the role of a readymade lending institution and revenue source for communities, families, and organizations of all nations, but especially developing nations that have been unable to cultivate effective lending institutions due to a combination of political instability, corruption, unreliable judicial systems, underdeveloped infrastructure, unsecured property rights and sheer incompetence from their governments. Property rights to profits, debts, and assets within a Personal DAO are upheld by the Personal DAO protocol itself which is secured by the Internet Computer Protocol. In addition to functioning as a lending institution, Personal DAOs allow communities to allocate resources in a collaborative fashion by allowing them to grow and govern a treasury that may fund community initiatives to increase productive output. Contributions to productive output may come in the form of business ventures, educational campaigns, local infrastructure development projects, and any other objectives that a community might agree on.`,
        color: '#171717'
    },    
    {
        title: 'DOGMI',
        symbol: 'dogmi',
        link: 'https://qu2gy-uqaaa-aaaal-qcv6a-cai.icp0.io',
        icon: dogmiToken,
        description: `DOGMI is an ICP memecoin that aims to bolster the ICP ecosystem through innovative and engaging marketing strategies decided by the community.`,
        color: '#F7CB61'
    },
    {
        title: 'DOLR',
        symbol: 'dolr',
        link: 'https://dolr.ai/',
        icon: dolrToken,
        description: `World’s First AI-Powered Unstoppable Social Cloud`,
        color: '#FF1D6E'
    },    
    {
        title: 'Dragginz',
        symbol: 'dkp',
        link: 'https://.com/',
        icon: dragginzToken,
        description: `A virtual pets game from the creators of Neopets. Non-profit, 100% on-chain. We've got baby dragons, crowdsourced world building, magic spells, and a prince in disguise!`,
        color: '#F13036'
    },
    {
        title: 'ELNA AI',
        symbol: 'elna',
        link: 'https://dapp.elna.ai',
        icon: elnaAiToken,
        description: `Community-driven decentralised AI Agent creation platform on Internet computer`,
        color: '#1ED760'
    },
    {
        title: 'EstateDAO',
        symbol: 'est',
        link: 'https://wbdy5-yyaaa-aaaap-abysq-cai.icp0.io/',
        icon: estateDaoToken,
        description: `A vacation real estate tokenization and rental platform on Internet Computer, enabling users to invest in vacation real estate with investments as low as USD 100.`,
        color: '#404040'
    },
    {
        title: 'OpenFPL',
        symbol: 'fpl',
        link: 'https://openfpl.xyz/',
        icon: openfplToken,
        description: `Decentralised fantasy football`,
        color: '#6FE0A9'
    },
    {
        title: 'FuelEV',
        symbol: 'fuel',
        link: 'https://fuelev.ai/',
        icon: fuelEvToken,
        description: `An electric car tokenization and rental platform on Internet Computer, enabling users to invest in and rent premium electric vehicles.`,
        color: '#00B849'
    },        
    {
        title: 'Gold DAO',
        symbol: 'gldgov',
        link: 'https://www.gold-dao.org',
        icon: goldDaoToken,
        description: `The Gold DAO project represents a groundbreaking fusion of traditional gold and modern blockchain technology, allowing anyone in the world to access physical gold instantaneously, with no dependence upon the banking system. At its core, the project introduces two primary products: the Gold Token (GLDT) - a fungible token allowing fractional gold ownership; and a USD-pegged stablecoin (USDG) - backed by gold (GLDT). These components combine to unlock a reliable alternative to fiat-backed stablecoins and their inflationary underpinnings, eradicating the limitations of traditional gold transacting by enabling instant transferability and liquidity, leveraging blockchain's transparency and efficiency.`,
        color: '#A38943'
    },
    {
        title: 'ICGhost',
        symbol: 'ghost',
        link: 'https://yadjb-mqaaa-aaaan-qaqlq-cai.raw.ic0.app/',
        icon: icGhostToken,
        description: `The First Decentralized Meme Coin on IC`,
        color: '#9CB39D'
    },
    {
        title: 'IC Explorer',
        symbol: 'ice',
        link: 'https://icexplorer.io/',
        icon: icpExToken,
        description: `IC Explorer is an ICP explorer hosted on the Internet Computer that aspires to become the leading on-chain AI data factory in the blockchain ecosystem. We are integrating data from the ICP blockchain, other Web3, and Web2 sources to create a unified, highly scalable analytics platform. This fusion of diverse datasets allows users to seamlessly access, analyze, and query blockchain data in real time.`,
        color: '#B3F8FF'
    },       
    {
        title: 'ICLighthouse DAO',
        symbol: 'icl',
        link: 'https://iclight.io',
        icon: icLightHouseToken,
        description: `Defi infrastructure based on IC.`,
        color: '#6DB5C1'
    },
    {
        title: 'Internet Computer',
        symbol: 'icp',
        link: 'https://internetcomputer.org/',
        icon: icpToken,
        description: `The Internet Computer is a decentralized computing platform that enables developers to build and deploy decentralized applications (dApps) on a secure and scalable blockchain.`,
        color: '#3b00b9',
        isSNS: false,
        decimals: 8,
    },    
    {
        title: 'ICFC',
        symbol: 'icfc',
        link: 'https://icfc.app/',
        icon: icfcToken,
        description: `The ICFC football ecosystem designed to reward fans for their love of football.`,
        color: '#1A79F2'
    },     
    {
        title: 'ICPSwap',
        symbol: 'ics',
        link: 'https://www.icpswap.com',
        icon: icpSwapToken,
        description: `ICPSwap stands as the native, pioneering, and premier Decentralized Exchange (DEX) within the Internet Computer Protocol (ICP) ecosystem, providing an extensive array of financial and market services. Our users and fans may immerse themselves in the ultimate Decentralized Finance (DeFi) experience, featuring a broad spectrum of token standards trading, dedicated staking pools, robust yield farming, innovative Claim features, and more. With ICPSwap, we are nearly exploring every facet of DeFi!`,
        color: '#5E64D7'
    },    
    {
        title: 'ICTO',
        symbol: 'icto',
        link: 'https://icto.app',
        icon: ictoToken,
        description: `ICTO is an innovative new platform allowing any project on Internet Computer to automate token vesting, payroll, locking, and fundraising.`,
        color: '#EBDA89'
    },    
    {
        title: 'ICVC',
        symbol: 'icvc',
        link: 'https://mnc6b-aaaaa-aaaap-qhnrq-cai.icp0.io/',
        icon: icvcToken,
        description: `ICVC DAO is a community governed Web3 venture builder.`,
        color: '#DFE6ED'
    },
    {
        title: 'ICPEx',
        symbol: 'icx',
        link: 'https://icpex.org/',
        icon: icpExToken,
        description: `AI-Driven Decentralized Liquidity Network.`,
        color: '#9992F4'
    }, 
    {
        title: 'Kinic',
        symbol: 'kinic',
        link: 'https://kinic.io/',
        icon: kinicToken,
        description: `The home of portable and verifiable AI. A DAO for push to deploy vector DB, zkML, search, trading bots and much more.`,
        color: '#D93777'
    },
    {
        title: 'KongSwap',
        symbol: 'kong',
        link: 'https://www.kongswap.io/',
        icon: kongSwapToken,
        description: `The one stop token shop - Trade tokens across all chains with ease using KongSwap`,
        color: '#58BA56'
    },
    {
        title: 'Motoko',
        symbol: 'motoko',
        link: 'https://2uktw-yiaaa-aaaah-adwxq-cai.icp0.io/',
        icon: motokoToken,
        description: `A community initiative aiming to drive awareness of the Motoko branding`,
        color: '#983A7F'
    },
    {
        title: 'NFID Wallet',
        symbol: 'nfidw',
        link: 'https://nfid.one/',
        icon: nfidWalletToken,
        description: `Web3's easiest to use, hardest to lose, and only wallet governed by a DAO.`,
        color: '#25786D'
    },      
    {
        title: 'Neutrinite',
        symbol: 'ntn',
        link: 'https://icpcoins.com',
        icon: neutriniteToken,
        description: `Neutrinite SNS DAO for ICPCoins. This platform is dedicated to securely sourcing data from DEXes, DAOs, and other DeFi applications.`,
        color: '#DAAC56'
    },
    {
        title: 'Nuance',
        symbol: 'nua',
        link: 'https://nuance.xyz',
        icon: nuanceToken,
        description: `Nuance is the world's first publishing platform built entirely on-chain. In the same way DeFi has taken the middleman out of finance Nuance does the same for the written word.`,
        color: '#24e8a6'
    },
    {
        title: 'ORIGYN',
        symbol: 'ogy',
        link: 'https://www.origyn.com/',
        icon: origynToken,
        description: `The ORIGYN Protocol has been made possible thanks to the major contribution of the ORIGYN Foundation and embodies its vision of becoming the universal digital standard for certification, traceability, and authentication. Achieving standardization requires neutrality, and as a DAO, the ORIGYN Protocol fulfills this requirement. The ORIGYN Protocol is the most advanced Real World Assets (RWA) infrastructure, enabling the creation of biometric digital certificates stored on the blockchain to prove the authenticity, identity, and ownership of valuable assets. This makes them secure, transparent, and immutable, thus opening infinite possibilities for partners to create their own solutions or markets. We are the building block, an open-source protocol to authenticate, certify, or trace RWA assets in the digital world. The technology has been developed in close collaboration with top industry leaders to ensure the highest level of operational standards for industrial-grade solutions in RWAs. The ORIGYN token (OGY) is a deflationary utility token integral to the ORIGYN ecosystem. It is used to mint digital certificates that authenticate, certify, and trace the ownership of valuable assets. OGY tokens allow for DAO governance participation.`,
        color: '#2C6235'
    },
    {
        title: 'ICPanda',
        symbol: 'panda',
        link: 'https://panda.fans',
        icon: icpandaDaoToken,
        description: `A technical panda fully running on the Internet Computer blockchain, building chain-native infrastructures and practical Web3 apps. About us: https://dmsg.net/panda`,
        color: '#59BF94'
    },
    {
        title: 'Seers AI',
        symbol: 'seer',
        link: 'https://seers.social',
        icon: seersToken,
        description: `Decentralized social network of AI agents: predicting the future, tackling tasks, and driving a new digital economy.`,
        color: '#3C85EC'
    },
    {
        title: 'Sneed',
        symbol: 'sneed',
        link: 'https://4pk43-5qaaa-aaaag-qc44a-cai.icp0.io/',
        icon: sneedToken,
        description: `A 'blank canvas' DAO designed to enable the community to innovate, Sneed offers an accessible, open platform for creative and technological exploration on the Internet Computer Protocol.`,
        color: '#000000'
    },
    {
        title: 'SONIC',
        symbol: 'sonic',
        link: 'https://app.sonic.ooo',
        icon: sonicToken,
        description: `The Open Defi Suite on Internet Computer Blockchain governed by the people for the people.`,
        color: '#75F999'
    },
    {
        title: 'Swampies',
        symbol: 'SWAMP',
        link: 'https://dragginz.io',
        icon: swampiesToken,
        description: `🌿 Meet the Swampies! 🐸✨ Introducing Swampies — adorable, 3D-rendered creatures straight from the mysterious wetlands of Dragginz! These quirky little inhabitants bring the swamps of the Internet Computer (IC) to life, bursting with charm and personality. Each Swampie is a unique NFT, lovingly crafted to live and breathe within the vibrant, immersive world of Dragginz. Whether you're exploring, collecting, or just vibing in the digital marshes, these critters are your must-have companions. 💧 Exclusive to the Internet Computer 🎨 Collectible, tradable, and totally cute 🌍 Living characters in a living world Collect them all. Build your swamp squad. Let the adventure begin.`,
        color: '#80AC53'
    },    
    {
        title: 'TRAX',
        symbol: 'trax',
        link: 'https://trax.so',
        icon: traxToken,
        description: `A decentralised music platform governed by artists and fans.`,
        color: '#BBFD50'
    },
    {
        title: 'Taco Dao',
        symbol: 'taco',
        link: 'https://tacodao.com/',
        icon: tacoToken,
        description: `A Tasty Basket of Trusted Internet Computer Tokens Decided & Allocated via DAO. Fully on-chain, holder-directed curation and allocation.`,
        color: '#FEC800'
    },    
    {
        title: 'FomoWell',
        symbol: 'well',
        link: 'https://fomowell.com/',
        icon: fomoWellToken,
        description: `FomoWell is a fair launch platform for Web3 projects on the ICP blockchain.`,
        color: '#00BC36'
    },       
    {
        title: 'WaterNeuron',
        symbol: 'wtn',
        link: 'https://waterneuron.fi/',
        icon: waterneuronToken,
        description: `WaterNeuron is a liquid staking protocol designed for the Internet Computer network. Staking ICP becomes straightforward and efficient. Learn more: https://docs.waterneuron.fi | https://x.com/waterneuron | https://t.me/waterneuron`,
        color: '#BA2A41'
    },
    {
        title: 'YRAL',
        symbol: 'dolr',
        link: 'https://yral.com',
        icon: yralToken,
        description: `A decentralized short-video social media platform governed by the people for the people`,
        color: '#B91863'
    },
    {
        title: 'Yuku AI',
        symbol: 'yuku',
        link: 'https://yuku.app/',
        icon: yukuDaoToken,
        description: `Yuku AI is a groundbreaking platform at the intersection of AI and Web3, empowering users with decentralized AI agents, immersive 3D spaces, and a dynamic marketplace for AI assets. By combining AI Agent DID, Social and Payment on-chain Protocols, Yuku AI enables seamless collaboration and innovation across digital and real-world ecosystems. It's not just a platform—it's a launchpad for the next era of AI-driven civilization.`,
        color: '#646464'
    },
    {
        title: 'Test Token 1',
        symbol: 'xmtk',
        link: 'https://internetcomputer.org/',
        icon: xmtkToken,
        description: `Test token 1 description`,
        color: '#ff0000'
    },
    {
        title: 'DAO2 Test Token 1',
        symbol: 'test1',
        link: 'https://internetcomputer.org/',
        icon: defaultToken,
        description: `DAO2 Test token 1 description`,
        color: '#00ff00'
    },    
    {
        title: 'Test Token 2',
        symbol: 'xmtk2',
        link: 'https://internetcomputer.org/',
        icon: xmtk2Token,
        description: `Test token 2 description`,
        color: '#0000ff'
    },
    {
        title: 'DAO2 Test Token 2',
        symbol: 'test2',
        link: 'https://internetcomputer.org/',
        icon: defaultToken,
        description: `DAO2 Test token 2 description`,
        color: '#ff0000'
    },
    {
        title: 'Local ICP',
        symbol: 'licp',
        link: 'https://internetcomputer.org/',
        icon: licpToken,
        description: `Local ICP description`,
        color: '#3b00b9'
    },
    {
        title: 'Test USDC',
        symbol: 'usdc2',
        link: 'https://internetcomputer.org/',
        icon: usdc2Token,
        description: `Test USDC description`,
        color: '#00ff00'
    }
]