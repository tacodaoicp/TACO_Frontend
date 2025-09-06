<template>

  <div class="standard-view">

    <!-- header bar -->
    <HeaderBar />

    <!-- scroll container - app util class -->
    <div class="scroll-y-container h-100">

      <!-- container -->
      <div class="d-flex flex-column align-items-center h-100 mx-0 mx-sm-3 mx-md-5">

        <!-- taco container -->
        <div class="taco-container
                    taco-container--l1
                    d-flex flex-column gap-0 w-100 p-0 flex-grow-1 mt-2"
          style="max-width: 1600px;">   
          
          <!-- report explorer -->
          <div class="taco-report-explorer">

            <!-- hamburger menu for small screens -->
            <div class="taco-report-explorer__hamburger-menu shadow"
            @click="toggleReportMenuOnMobile">

              <!-- icon -->
              <i class="fa-light fa-bars taco-report-explorer__hamburger-menu__icon"></i>

            </div>
            
            <!-- left -->
            <div v-show="showReportMenuOnMobile || !isMobile" class="taco-report-explorer__left">
              
              <!-- title container -->
              <div class="taco-report-explorer__title-container">
                
                <!-- title -->
                <h2 class="taco-report-explorer__title
                          space-mono-semibold">Browse Reports</h2>

                <!-- disclaimer -->
                <a href="#" 
                  @click="reshownDisclaimerLocally()" 
                  class="taco-text-blue-to-light-blue text-center d-inline-block w-100 small">
                  Reports Disclaimer
                </a>
                
              </div>
              
              <!-- reports list container -->
              <div class="taco-report-explorer__list-container">
                
                <!-- reports list -->
                <ul class="taco-report-explorer__list">

                  <!-- neutrinite - report item -->
                  <li class="taco-report-explorer__list-item" @click="toggleReportMenuOnMobile(); router.push('/reports/neutrinite')">
                    
                    <!-- report -->
                    <div class="taco-report-explorer__list-report"
                    :class="{ 'taco-report-explorer__list-report--active': reportId === 8 }">
                      
                      <!-- report title icon -->              
                      <div class="taco-report-explorer__list-report__icon"
                          :style="{ backgroundImage: `url(${neutriniteIconUrl})` }"></div>            
                      
                      <!-- report title container -->
                      <div class="taco-report-explorer__list-report__title-container">
                        
                        <!-- report title -->
                        <span class="taco-report-explorer__list-report__title">DUE DILIGENCE PROCESS Neutrinite (NTN) & Compounding Stream ICP (cICP)</span>
                        
                      </div>
                      
                    </div>
                    
                  </li>
                  
                  <!-- kong swap - report item -->
                  <li class="taco-report-explorer__list-item" @click="toggleReportMenuOnMobile(); router.push('/reports/kongswap')">
                    
                    <!-- report -->
                    <div class="taco-report-explorer__list-report"
                    :class="{ 'taco-report-explorer__list-report--active': reportId === 7 }">
                      
                      <!-- report title icon -->              
                      <div class="taco-report-explorer__list-report__icon"
                          :style="{ backgroundImage: `url(${kongSwapIconUrl})` }"></div>            
                      
                      <!-- report title container -->
                      <div class="taco-report-explorer__list-report__title-container">
                        
                        <!-- report title -->
                        <span class="taco-report-explorer__list-report__title">DUE DILIGENCE PROCESS KongSwap (KONG)</span>
                        
                      </div>
                      
                    </div>
                    
                  </li>

                  <!-- open chat - report item -->
                  <li class="taco-report-explorer__list-item" @click="toggleReportMenuOnMobile(); router.push('/reports/openchat')">
                    
                    <!-- report -->
                    <div class="taco-report-explorer__list-report"
                    :class="{ 'taco-report-explorer__list-report--active': reportId === 6 }">
                      
                      <!-- report title icon -->              
                      <div class="taco-report-explorer__list-report__icon"
                          :style="{ backgroundImage: `url(${openChatIconUrl})` }"></div>            
                      
                      <!-- report title container -->
                      <div class="taco-report-explorer__list-report__title-container">
                        
                        <!-- report title -->
                        <span class="taco-report-explorer__list-report__title">DUE DILIGENCE PROCESS OpenChat (CHAT)</span>
                        
                      </div>
                      
                    </div>
                    
                  </li>

                  <!-- wrapped gold dao - report item -->
                  <li class="taco-report-explorer__list-item" @click="toggleReportMenuOnMobile(); router.push('/reports/sgldt')">
                    
                    <!-- report -->
                    <div class="taco-report-explorer__list-report"
                    :class="{ 'taco-report-explorer__list-report--active': reportId === 5 }">
                      
                      <!-- report title icon -->              
                      <div class="taco-report-explorer__list-report__icon"
                          :style="{ backgroundImage: `url(${sgldtIconUrl})` }"></div>            
                      
                      <!-- report title container -->
                      <div class="taco-report-explorer__list-report__title-container">
                        
                        <!-- report title -->
                        <span class="taco-report-explorer__list-report__title">DUE DILIGENCE PROCESS GLDT Wrapper (sGLDT)</span>
                        
                      </div>
                      
                    </div>
                    
                  </li>

                  <!-- gold dao - report item -->
                  <li class="taco-report-explorer__list-item" @click="toggleReportMenuOnMobile(); router.push('/reports/golddao')">
                    
                    <!-- report -->
                    <div class="taco-report-explorer__list-report"
                    :class="{ 'taco-report-explorer__list-report--active': reportId === 4 }">
                      
                      <!-- report title icon -->              
                      <div class="taco-report-explorer__list-report__icon"
                          :style="{ backgroundImage: `url(${goldDaoIconUrl})` }"></div>            
                      
                      <!-- report title container -->
                      <div class="taco-report-explorer__list-report__title-container">
                        
                        <!-- report title -->
                        <span class="taco-report-explorer__list-report__title">DUE DILIGENCE PROCESS Gold DAO (GOLDAO) & Gold Token (GLDT)</span>
                        
                      </div>
                      
                    </div>
                    
                  </li>                  
                  
                  <!-- motoko - report item -->
                  <li class="taco-report-explorer__list-item" @click="toggleReportMenuOnMobile(); router.push('/reports/motoko')">
                    
                    <!-- report -->
                    <div class="taco-report-explorer__list-report"
                    :class="{ 'taco-report-explorer__list-report--active': reportId === 3 }">
                      
                      <!-- report title icon -->              
                      <div class="taco-report-explorer__list-report__icon"
                          :style="{ backgroundImage: `url(${motokoIconUrl})` }"
                          style="background-color: lightgray;"></div>            
                      
                      <!-- report title container -->
                      <div class="taco-report-explorer__list-report__title-container">
                        
                        <!-- report title -->
                        <span class="taco-report-explorer__list-report__title">DUE DILIGENCE PROCESS Motoko DAO (MOTOKO)</span>
                        
                      </div>
                      
                    </div>
                    
                  </li>

                  <!-- sneed - report item -->
                  <li class="taco-report-explorer__list-item" @click="toggleReportMenuOnMobile(); router.push('/reports/sneed')">
                    
                    <!-- report -->
                    <div class="taco-report-explorer__list-report"
                    :class="{ 'taco-report-explorer__list-report--active': reportId === 2 }">
                      
                      <!-- report title icon -->              
                      <div class="taco-report-explorer__list-report__icon"
                          :style="{ backgroundImage: `url(${sneedIconUrl})` }"></div>            
                      
                      <!-- report title container -->
                      <div class="taco-report-explorer__list-report__title-container">
                        
                        <!-- report title -->
                        <span class="taco-report-explorer__list-report__title">DUE DILIGENCE PROCESS Sneed (SNEED)</span>
                        
                      </div>
                      
                    </div>
                    
                  </li>                     
                    
                  <!-- ckbtc - report item -->
                  <li class="taco-report-explorer__list-item" @click="toggleReportMenuOnMobile(); router.push('/reports/ckbtc')">
                    
                    <!-- report -->
                    <div class="taco-report-explorer__list-report"
                    :class="{ 'taco-report-explorer__list-report--active': reportId === 1 }">
                      
                      <!-- report title icon -->              
                      <div class="taco-report-explorer__list-report__icon"
                          :style="{ backgroundImage: `url(${ckBtcIconUrl})` }"></div>            
                      
                      <!-- report title container -->
                      <div class="taco-report-explorer__list-report__title-container">
                        
                        <!-- report title -->
                        <span class="taco-report-explorer__list-report__title">DUE DILIGENCE PROCESS CHAIN-KEY BITCOIN (ckBTC)</span>
                        
                      </div>
                      
                    </div>
                    
                  </li>           
                  
                </ul>
                
              </div>
              
            </div>
            
            <!-- right -->
            <div class="taco-report-explorer__right">

              <!-- example report -->
              <div v-if="reportId === 0" class="taco-report-explorer__report-container">

                <!-- inner -->
                <div class="taco-report-explorer__report-container__inner">
                
                  <!-- report header -->
                  <div class="taco-report-explorer__report-header">
                    
                    <!-- report title -->
                    <h2 class="taco-report-explorer__report-header__title">Title</h2>

                    <!-- report metadata continer -->
                    <div class="taco-report-explorer__report-header__metadata-container">

                      <!-- report metadata -->
                      <span class="taco-report-explorer__report-header__metadata">
                        <i class="fa-solid fa-luchador-mask"></i> 
                        <span> Written by </span>
                        <a href="#" target="_blank" class="taco-text-blue-to-light-blue">author</a> 
                        <span> and </span>
                        <a href="#" target="_blank" class="taco-text-blue-to-light-blue">author</a>
                        <span class="small"> MM/YYYY</span>
                      </span>

                    </div>        
                    
                  </div>

                  <!-- report body -->
                  <div class="taco-report-explorer__report-body">
                    
                    <!-- heading 1 -->
                    <h3 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h1">
                      Heading 1
                      <i class="fa-solid fa-circle-info" 
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Tooltip text"></i>
                    </h3>

                    <!-- heading 2 -->
                    <h4 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h2 mt-4">
                      Heading 2
                      <i class="fa-solid fa-circle-info" 
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Tooltip text"></i>
                    </h4>    
                    
                    <!-- heading 3 -->
                    <h4 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h3">
                      Heading 3
                      <i class="fa-solid fa-circle-info" 
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Tooltip text"></i>
                    </h4>    
                    
                    <!-- heading 4 -->
                    <h4 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h4">
                      Heading 4
                      <i class="fa-solid fa-circle-info" 
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Tooltip text"></i>
                    </h4>    
                    
                    <!-- heading 5 -->
                    <h4 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h5">
                      Heading 5
                      <i class="fa-solid fa-circle-info" 
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Tooltip text"></i>
                    </h4>    
                    
                    <!-- heading 6 -->
                    <h4 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h6">
                      Heading 6
                      <i class="fa-solid fa-circle-info" 
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Tooltip text"></i>
                    </h4>                        
                    
                    <!-- paragraph -->
                    <p>
                      Lorem ipsum dolor sit amet consectetur adipisicing elit. Cumque labore molestias mollitia modi? Sed magni quasi in vitae dicta iste neque porro, asperiores doloremque repellat vero magnam quisquam voluptate pariatur? Tempora, libero distinctio at facere sint, mollitia totam, blanditiis dolorem eius hic fugit! Earum aut nostrum exercitationem corporis sed temporibus deleniti, nesciunt velit laborum nam ipsam minima minus non tenetur?
                    </p>

                    <!-- unordered list -->
                    <ul>
                      <li>list item 1</li>
                      <li>list item 2</li>
                      <li>list item 3</li>
                    </ul>

                    <!-- ordered list -->
                    <ol>
                      <li>list item 1</li>
                      <li>list item 2</li>
                      <li>list item 3</li>
                    </ol>                        

                    <!-- horizontal rule -->
                    <hr>
                    <span class="small">^ that's a horizontal rule</span><br><br>

                    <!-- link -->
                    <a href="#" target="_blank">This is a link</a>

                    <br><br>
                    
                    <!-- quote -->
                    <div class="taco-report-explorer__report-quote">
                      <blockquote cite="#">
                        <p>
                          This is a blockquote.
                        </p>
                      </blockquote>
                      <p>—author, <cite><a href="#" target="_blank" class="taco-text-blue-to-light-blue">source</a></cite></p>
                    </div>

                    <br>
                    
                    <!-- image -->
                    <img class="taco-report-explorer__report-img" src="https://placehold.co/300x200/EEE/31343C.png" alt="">
                    
                  </div>

                  <!-- report footer -->
                  <div class="taco-report-explorer__report-footer">
                    
                    <!-- left -->
                    <div class="taco-report-explorer__report-footer__left">
                      
                      ❤️🌮
                      
                    </div>
                    
                    <!-- center -->
                    <div class="taco-report-explorer__report-footer__center text-center">
                      
                      &copy;2025 Taco Dao
                      
                    </div>
                    
                    <!-- right -->
                    <div class="taco-report-explorer__report-footer__right">
                      
                      <!-- link group -->
                      <span class="d-flex flex-column align-items-end">

                        <span class="text-end">something here</span>

                        <span class="d-flex gap-2">

                          <a href="#" class="taco-text-blue-to-light-blue text-end" target="_blank">link 1</a>                        

                          <a href="#" class="taco-text-blue-to-light-blue text-end" target="_blank">link 2</a>

                        </span>
                        
                      </span>

                     <!-- link group -->
                      <span class="d-flex flex-column align-items-end">

                        <span class="text-end">something else</span>

                        <span class="d-flex gap-2">

                          <a href="#" class="taco-text-blue-to-light-blue text-end" target="_blank">link 1</a>                        

                          <a href="#" class="taco-text-blue-to-light-blue text-end" target="_blank">link 2</a>

                        </span>
                        
                      </span>                      
                      
                    </div>
                    
                  </div>

                </div>
                
              </div>              

              <!-- ckbtc dd report -->
              <div v-if="reportId === 1" class="taco-report-explorer__report-container">

                <!-- inner -->
                <div class="taco-report-explorer__report-container__inner">
                
                  <!-- report header -->
                  <div class="taco-report-explorer__report-header">
                    
                    <!-- report title -->
                    <h2 class="taco-report-explorer__report-header__title">DUE DILIGENCE PROCESS CHAIN-KEY BITCOIN (ckBTC)</h2>

                    <!-- report metadata continer -->
                    <div class="taco-report-explorer__report-header__metadata-container">

                      <!-- report metadata -->
                      <span class="taco-report-explorer__report-header__metadata">
                        <i class="fa-solid fa-luchador-mask"></i> 
                        <span> Written by </span>
                        <span>manilpwn</span>
                        <span> and </span>
                        <span>TrickyVik</span>
                        <span class="small"> 06/2025</span>
                      </span>

                    </div>        
                    
                  </div>

                  <!-- report body -->
                  <div class="taco-report-explorer__report-body">
                    
                    <!-- heading -->
                    <h3 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h1">
                      Team Background
                      <i class="fa-solid fa-circle-info" 
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Assess the founding team's transparency, credibility, experience, and any past contributions to the ICP ecosystem"></i>
                    </h3>
                    
                    <!-- paragraph -->
                    <p>
                      Chain-key Bitcoin (ckBTC) is developed and maintained by the DFINITY Foundation, the primary organization behind the Internet Computer Protocol (ICP). DFINITY is led by Dominic Williams, an experienced technologist and entrepreneur in blockchain, decentralized computing, and cryptography. The foundation employs a large team of expert developers, cryptographers, and researchers globally.
                    </p>

                    <hr>

                    <!-- heading -->
                    <h3 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h1">
                      Token Utility
                      <i class="fa-solid fa-circle-info" 
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Examine the token's purpose and functionality within its ecosystem to ensure it provides tangible value and practical use cases"></i>
                    </h3>                  
                    
                    <!-- paragraph -->
                    <p>
                      Chain-key Bitcoin (ckBTC) serves as a multi-chain twin of Bitcoin, enabling BTC to be used seamlessly within the ICP ecosystem. It retains full 1:1 backing with native BTC, secured via cryptographic techniques and managed by the Network Nervous System (NNS).
                    </p>

                    <!-- paragraph -->
                    <p>
                      Primary utilities include:
                    </p>                  

                    <!-- unordered list -->
                    <ul>
                      <li>
                        <p>Facilitation of DeFi applications</p>
                      </li>
                      <li>
                        <p>Integration of Bitcoin into smart contracts and dApps</p>
                      </li>
                      <li>
                        <p>Instant, low-cost transactions on ICP compared to native Bitcoin network fees and times</p>
                      </li>
                    </ul>  
                    
                    <hr>
                    
                    <!-- heading -->
                    <h3 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h1">
                      Ecosystem Alignment
                      <i class="fa-solid fa-circle-info" 
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Evaluate the token's synergy with other ICP projects, including any existing collaborations and suitability for inclusion in the Salsa Season rewards program"></i>
                    </h3>

                    <!-- paragraph -->
                    <p>
                      Programmable bitcoin is a unique value proposition. Integration of ckBTC can impact broader ICP adoption, facilitating enhanced liquidity and user engagement.
                    </p>

                    <!-- paragraph -->
                    <p>
                      OpenChat uses ckBTC for tipping and Odin.Fun is a popular memecoin platform with ckBTC being the primary mode of payment.
                    </p>

                    <!-- paragraph -->
                    <p>
                      Including ckBTC in the TACO DAO portfolio means that Salsa Season rewards program participants will gain exposure to BTC.
                    </p>

                    <hr>

                    <!-- heading -->
                    <h3 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h1">
                      Technology
                      <i class="fa-solid fa-circle-info" 
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Review the project's technical foundation, focusing on code quality, scalability, and how effectively it leverages ICP's capabilities"></i>
                    </h3>

                    <!-- paragraph -->
                    <p>
                      ICP's Chain-Key Technology allows smart contracts to securely sign Bitcoin transactions without any single node accessing private keys. This enables ckBTC to hold and manage Bitcoin addresses directly on-chain.
                    </p>
                    
                    <!-- paragraph -->
                    <p>
                      ICP's network security depends on validators who are paid in ICP tokens and the governance of ICP token holders.
                    </p>
                    
                    <!-- paragraph -->
                    <p>
                      <a href="https://wiki.internetcomputer.org/wiki/Chain-key_Bitcoin" target="_blank">ckBTC utilises the ckBTC Minter</a>, a canister controlled by the NNS and operating on the 'pzp6e…' subnet (more information on this in Security Risks). Principal ID's inform the Minter about an increase in the BTC balance as a result of their BTC address, and the Minter then mints ckBTC of identical value. Later, ckBTC can be burned in the Minter for an equivalent amount of BTC.
                    </p>
                    
                    <!-- paragraph -->
                    <p>
                      <a href="https://internetcomputer.org/docs/references/ckbtc-reference" target="_blank">A minimum ckBTC burn</a> (in other words BTC withdrawal) amount of 0.001 BTC, or 100,000 satoshi, and; a Know-Your-Transaction fee of 0.00002 BTC, or 2,000 satoshi.
                    </p>

                    <!-- heading -->
                    <h3 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h2 mt-4">
                      Liquidity:
                    </h3>

                    <!-- paragraph -->
                    <p>
                      As per <a href="https://swaprunner.com" target="_blank">SwapRunner</a> on the 1st of June 2025, a single transaction of:
                    </p>

                    <!-- unordered list -->
                    <ul>
                      <li>
                        <p>20000 ICP ($98739.32) will result in a trade to 0.75197956 ckBTC ($78761.20). 20.23% lost to price impact</p>
                      </li>
                      <li>
                        <p>10000 ICP ($49369.66) will result in a trade to 0.4307592 ckBTC ($45117.07). 8.614% lost to price impact</p>
                      </li>
                      <li>
                        <p>1000 ICP ($4936.97) will result in a trade to 0.04672558 ckBTC ($4893.97). 0.871% lost to price impact</p>
                      </li>
                      <li>
                        <p>250 ICP ($1234.24) will result in a trade to 0.01174256 ckBTC ($1229.90). 0.352% lost to price impact</p>
                      </li>
                    </ul>

                    <!-- paragraph -->
                    <p>
                      As can be seen, liquidity for ckBTC remains limited. If liquidity is not recycled, and there are no 'sells' between the DAO's 'buys', the effective slippage rate will be identical regardless of whether multiple small transactions or one large one take place.
                    </p>

                    <hr>

                    <!-- headings -->
                    <h3 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h1">
                      Competitors
                      <i class="fa-solid fa-circle-info" 
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Identify similar projects and assess the token's differentiators alongside the perceived competitive positioning within its niche"></i>
                    </h3>                            

                    <!-- unordered list -->
                    <ul>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>Wrapped Bitcoin is the Ethereum network's 1:1 tokenised version of Bitcoin. In the WBTC system, one party sends BTC to a custodian, who agrees to mint a token that is backed 1:1 by the held Bitcoin. This token, now holding an exact value pair with the BTC, can interface with the Ethereum network and all it has to offer.</p>
                        
                      </li>

                      <!-- list item -->
                      <li>
                        
                        <!-- paragraph -->
                        <p>When BTC is deposited onto BTC addresses controlled by the ICP network, no one individual is now 'owning' the BTC and agreeing to mint a tokenised version of it in return. Instead, the ICP Network's various nodes split parts of the private key between themselves, cryptographically ensuring the existence of reserves and removing the necessity of human trust that a system such as WBTC employs. In WBTC, a custodian is simply holding the existing BTC and creating a token backed by it, creating a single point of failure: legitimacy of the custodian. WBTC can theoretically lose all value because its reserves can vanish or become compromised.</p>
                        
                        <!-- paragraph -->
                        <p>
                          
                          <!-- link -->
                          <a class="taco-report-explorer__report-link taco-text-blue-to-light-blue" href="https://chainspect.app/compare/ethereum-vs-icp" target="_blank">Faster settlement times are seen on ICP, specifically</a>:
                        
                        </p>

                        <!-- ordered list -->
                        <ol>

                          <!-- list item -->
                          <li>

                            <!-- paragraph -->
                            <p>Ethereum's real-time TPS (transactions per second) is 1.75% that of ICP</p>

                          </li>

                          <!-- list item -->
                          <li>

                            <!-- paragraph -->
                            <p>Ethereum's block time is 25x that of ICP</p>

                          </li>

                        </ol>
                      
                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>Lighting Network represents a novel solution to the crypto 'trilemma' - the battle between security, scalability, and decentralisation. Lightning works by creating a channel between two individuals that essentially creates a locked figure of BTC belonging to both parties, in which infinite transactions of virtually any size can occur without causing an actual transaction on the BTC blockchain. Heavy fees are avoided, and extremely small payments can take place. Only two blockchain transactions occur: opening the channel with the initial figures, and closing it with the updated figures.</p>

                        <!-- paragraph -->
                        <p>ckBTC also uses two transactions, both 'leaving' and 'entering' the BTC blockchain. The main difference lies in utility. Lighting can only serve as a peer-to-peer transaction system. It cannot interface with any other system: there exists no DeFi, no smart contracts, no voting, and none of the other unique features available on other blockchains. ckBTC allows direct integration of BTC with ICP's ecosystem.</p>

                      </li>

                    </ul>

                    <hr>

                    <!-- heading -->
                    <h3 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h1">
                      Security Risks
                      <i class="fa-solid fa-circle-info" 
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Investigate perceived vulnerabilities, any audit reports, and adherence to security and regulatory standards"></i>
                    </h3>                            

                    <!-- paragraph -->
                    <p>
                      Trail of Bits, an organization specializing in high-end security research, scanned the ckBTC codebase. <a href="https://medium.com/dfinity/taking-security-seriously-two-top-icp-features-assessed-by-trail-of-bits-4a0023ab1e68" target="_blank">The verdict was very positive and there were no medium or high-severity findings</a>. The audit focused on preventing double-spending, denial-of-service attacks, and ensuring the ckBTC Minter could not be manipulated into signing invalid transactions or burning tokens improperly.
                    </p>

                    <!-- paragraph -->
                    <p>
                      BitcoinLayers, a research initiative documenting Bitcoin scaling solutions, <a href="https://www.bitcoinlayers.org/layers/internetcomputer" target="_blank">provided the following risk ratings</a>:
                    </p>

                    <!-- unordered list -->
                    <ul>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>BTC Custody: High Risk</p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>Data Availability: High Risk</p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>Network Operators: Medium Risk</p>

                      </li>

                      <li>

                        <!-- paragraph -->
                        <p>Finality Guarantees: Medium Risk</p>

                      </li>

                    </ul>

                    <!-- paragraph -->
                    <p>
                      While this may seem bad, it is worth noting that virtually all other layer-solutions score 'very high' or 'critical' on many of these tags, and that only Bitcoin native solutions (such as Lightning) score as 'low risk'. When it comes to Bitcoin layers that allow interfacing with other systems, ICP is among the top in terms of safety.
                    </p>
                    
                    <!-- paragraph -->
                    <p>
                      The 'pzp6e…' subnet managing the ckBTC smart contract module has 34 node operators who have undergone a KYB process to ICP governance and are publicly known. If nodes for this subnet go offline, and a backup of the state is not regularly made, holders would lose access to their ckBTC. It would require 10 nodes to collude to take over the ckBTC subnet.
                    </p>
                    
                    <!-- paragraph -->
                    <p>
                      When a user deposits or withdraws bitcoin, the Bitcoin Checker Canister checks whether <a href="https://wiki.internetcomputer.org/wiki/Bitcoin_Checker_Canister" target="_blank">the bitcoin address is associated with any illicit activities on the SDN list of the OFAC</a>. If it is, deposits are quarantined and withdrawals are rejected.
                    </p>
                    
                    <!-- back to top link -->
                    <a href="#" @click.prevent="scrollToTop" class="taco-report-explorer__report-link text-center w-100 d-inline-block mt-2">Back to top</a>
                    
                  </div>

                  <!-- report footer -->
                  <div class="taco-report-explorer__report-footer">
                    
                    <!-- left -->
                    <div class="taco-report-explorer__report-footer__left">
                      
                      ❤️🌮
                      
                    </div>
                    
                    <!-- center -->
                    <div class="taco-report-explorer__report-footer__center text-center">
                      
                      &copy;2025 Taco Dao
                      
                    </div>
                    
                    <!-- right -->
                    <div class="taco-report-explorer__report-footer__right">
                      
                      <!-- link group -->
                      <span class="d-flex flex-column align-items-end">

                        <span class="text-end">#13 Add Token</span>

                        <span class="d-flex gap-2">

                          <a href="https://nns.ic0.app/proposal/?u=lacdn-3iaaa-aaaaq-aae3a-cai&proposal=13" class="taco-text-blue-to-light-blue text-end" target="_blank">NNS</a>                        

                          <a href="https://tacodao.com/chat/forum/13" class="taco-text-blue-to-light-blue text-end">Taco Forum</a>

                        </span>
                        
                      </span>
                      
                    </div>
                    
                  </div>

                </div>
                
              </div>   
              
              <!-- sneed dd report -->
              <div v-if="reportId === 2" class="taco-report-explorer__report-container">

                <!-- inner -->
                <div class="taco-report-explorer__report-container__inner">
                
                  <!-- report header -->
                  <div class="taco-report-explorer__report-header">
                    
                    <!-- report title -->
                    <h2 class="taco-report-explorer__report-header__title">DUE DILIGENCE PROCESS Sneed DAO (SNEED)</h2>

                    <!-- report metadata continer -->
                    <div class="taco-report-explorer__report-header__metadata-container">

                      <!-- report metadata -->
                      <span class="taco-report-explorer__report-header__metadata">
                        <i class="fa-solid fa-luchador-mask"></i> 
                        <span> Written by </span>
                        <span>manilpwn</span>
                        <span> and </span>
                        <span>TrickyVik</span>
                        <span class="small"> 06/2025</span>
                      </span>

                    </div>        
                    
                  </div>

                  <!-- report body -->
                  <div class="taco-report-explorer__report-body">
                    
                    <!-- heading -->
                    <h3 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h1">
                      Team Background
                      <i class="fa-solid fa-circle-info" 
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Assess the founding team's transparency, credibility, experience, and any past contributions to the ICP ecosystem"></i>
                    </h3>
                    
                    <!-- paragraph -->
                    <p>
                      SNS-1 was the original SNS DAO for ICP, launched in 2022 as a framework and test run to experiment with decentralized governance over dApps. It served as a blank slate, and a community gathered, putting forth multiple ideas on how best to utilise the technology, debating what direction should be taken. The only project created during this period was ICPCoins, an index of the eponymous tokens circulating around the ecosystem.
                    </p>

                    <!-- paragraph -->
                    <p>
                      On June 11th, 2023, Adam Powell took over SNS-1 by purchasing a majority stake. His takeover turned the DAO from one containing multiple directions to one with a single, unified direction: creating a video game. With that, the blank slate experiment came to an abrupt end. Sneed DAO was created to continue where SNS-1 left off.                      
                    </p>
                    
                    <!-- paragraph -->
                    <p>
                      Sneed DAO is arguably the most sovereign DAO of the SNS DAOs, operating without any identifiable central leadership.
                    </p>
                    
                    <!-- paragraph -->
                    <p>
                      One of the core contributors, Snassy, is doxxed and brings over two decades of professional development experience to the project. In the last 16 years, he worked at Intentional Software (later acquired by Microsoft), and then at Microsoft itself, where he served as a Principal Engineer and Principal Engineering Manager across both the Office and Windows divisions. He left Microsoft in 2024 to be a Web3 builder full-time.
                    </p>
                    
                    <!-- paragraph -->
                    <p>
                      In direct messages on Discord, he shared that the core contributor group consists of five members, including himself. The remaining members are anonymous; two are developers with experience comparable to his own, while the other two are non-developers. He is actively recruiting additional talent.                      
                    </p>                    

                    <hr>

                    <!-- heading -->
                    <h3 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h1">
                      Token Utility
                      <i class="fa-solid fa-circle-info" 
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Examine the token's purpose and functionality within its ecosystem to ensure it provides tangible value and practical use cases"></i>
                    </h3>  
                    
                    <!-- paragraph -->
                    <p>
                      The SNEED token serves as the governance token for Sneed DAO, enabling members to submit and vote on proposals that are implemented if approved.
                    </p>      
                    
                    <!-- paragraph -->
                    <p>
                      SNEED is deflationary, <a href="https://github.com/solidstate-auditing/audits-public/blob/main/defi-vectors.md" target="_blank">with a unique tokenomics model known as the Recursive Liquidity Loop (RLL)</a>. The RLL burns or distributes SNEED rewards from liquidity pools (LPs), stakes ICP rewards in an 8-year neuron, and distributes the resulting maturity rewards to governance members.
                    </p>      
                    
                    <!-- paragraph -->
                    <p>
                      <a href="https://app.sneeddao.com/sneedlock" target="_blank">SneedLock 2.0 enables users to lock tokens and liquidity pool positions for predefined durations</a>. It exists primarily to build trust between teams and communities by ensuring that locked assets remain inaccessible until the lock expires. Prior to SneedLock, teams had to blackhole LP positions to signal commitment - permanently forfeiting access to both the tokens and any LP rewards. SneedLock offers a more flexible alternative. It is planned for SneedLock to charge fees that will go to the Sneed DAO.                      
                    </p>  
                    
                    <!-- paragraph -->
                    <p>
                      <a href="https://swaprunner.com/help" target="_blank">SwapRunner is a DEX aggregator that enables users to split trade orders between ICPSwap and KongSwap to optimize execution</a>. A planned Time-Distributed Trading feature will enable users to break down large trades into smaller ones over time. <a href="https://swaprunner.com/help/rewards" target="_blank">SwapRunner includes a rewards system that lets project teams sponsor specific achievements</a>, offering users incentives for completing various trading activities. Fees from sponsored achievements go to the Sneed DAO.
                    </p>  
                    
                    <!-- paragraph -->
                    <p>
                      Both the SneedLock and SwapRunner canisters will be under DAO control when ready.
                    </p>  
                    
                    <!-- paragraph -->
                    <p>
                      <a href="https://app.sneeddao.com/hub" target="_blank">Sneed Hub serves as an explorer for SNS DAOs</a>, providing key information and links for each project. Its forum feature enables users to create discussion threads tied to SNS proposals, and - if they hotkey their SNS neurons - they can upvote or downvote posts using their voting power.
                    </p>  
                    
                    <!-- paragraph -->
                    <p>
                      Snassy has pointed out that, as a blank canvas, Sneed DAO can serve as an on-ramp for projects too small to launch their own SNS. By first acquiring SNEED tokens, teams or individuals can contribute their projects to the Sneed DAO, with the expectation that their previously acquired tokens will gain value as the Sneed ecosystem expands.
                    </p>                      
                    
                    <hr>

                    <!-- heading -->
                    <h3 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h1">
                      Ecosystem Alignment
                      <i class="fa-solid fa-circle-info" 
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Evaluate the token's synergy with other ICP projects, including any existing collaborations and suitability for inclusion in the Salsa Season rewards program."></i>
                    </h3>  

                    <!-- paragraph -->
                    <p>
                      SNEED was created in October 2023 and transitioned to an SNS DAO in January 2024. The original Sneed token was an implementation of Dfinity's ICRC1 standard, developed by the Sneed community to enable the direct addition of the token logo into the token canister. This implementation has been forked to create SNOGE, TENDIES, Insane Clown Protocol, Windoge98, Motokowifhat, Pepe, Internet Doge, and ALIEN.
                    </p>   
                    
                    <!-- paragraph -->
                    <p>
                      When the SNEED transitioned to an SNS DAO, SneedSwap was developed to convert old tokens to new tokens. SneedSwap has been forked to SNS-ify DOGMI.
                    </p>   
                    
                    <!-- paragraph -->
                    <p>
                      Sneed DAO has had and maintains several partnerships:
                    </p>    
                    
                    <!-- unordered list -->
                    <ul>
                      
                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          ICPSwap: Partnered for Sneedlock, which has been used by many teams, currently resulting in a grand total of $840 across 22 different projects, for an average of $38.18 per project. Also used to provide prices to SwapRunner.
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          KongSwap: Used to provide prices to SwapRunner.
                        </p>
                        
                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          FomoWell: Collaborated with Sneed DAO to integrate an automatic SneedLock feature for launched tokens.
                        </p>
                        
                      </li>
                      
                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Neutrinite DAO & NeuronPool: Collaborating on the Recursive Liquidity Loop.
                        </p>
                        
                      </li>
                      
                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Catalyze: Collaborated to create an NFT-gated chat room.
                        </p>
                        
                      </li>
                      
                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          OpenChat: Sneed was the first token to be added for tipping.
                        </p>
                        
                      </li>
                      
                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Bitcoin Labs: Collaborated on dApps such as the Sneedlock Explorer.
                        </p>
                        
                      </li>
                      
                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          ELNA AI: Partnered to build a Mr. Sneed AI agent.
                        </p>
                        
                      </li>
                      
                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Taco DAO: Partnered to work on future projects. Sneed community members have expressed interest in having Sneed DAO participate in Salsa Season. Integrating SwapRunner achievements into Salsa Season is a viable option. Snassy is Taco DAO's lead developer.
                        </p>
                        
                      </li>                      

                    </ul>

                    <hr>

                    <!-- heading -->
                    <h3 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h1">
                      Community
                      <i class="fa-solid fa-circle-info" 
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Assess the size and engagement of the token's community to gauge long-term adoption potential"></i>
                    </h3>  

                    <!-- paragraph -->
                    <p>
                      The official Discord server has 728 members, and the OpenChat community has 4093 members.
                    </p>  

                    <!-- paragraph -->
                    <p>
                      Diamond Club is an exclusive Discord channel gated by NFTs, consisting of those who were either airdropped a membership for holding more than 1 SNEED on the drop date, or those who have purchased entry. 3% of the royalty from a sale is immediately transferred to the DAO's treasury. There are 186 members as of June 2025 in the Diamond Club. This figure contains many well known ICP community members and the chat is active with discussions.
                    </p>  
                    
                    <!-- paragraph -->
                    <p>
                      SNOGE is the official memecoin of the Sneed DAO, as decided by Motion Proposals #94 and #147. The creator of SNOGE hosts spaces on X to discuss the ICP ecosystem, and has hosted individuals such as Snassy and the TACO team.
                    </p>                      
                    
                    <hr>

                    <!-- heading -->
                    <h3 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h1">
                      Technology
                      <i class="fa-solid fa-circle-info" 
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Review the project's technical foundation, focusing on code quality, scalability, and how effectively it leverages ICP's capabilities"></i>
                    </h3>  

                    <!-- paragraph -->
                    <p>
                      The SNS framework is regularly updated and vetted by the Network Nervous System (NNS) community, which oversees the entire ICP ecosystem. This vigilance ensures the adherence of SNEED's governance framework to the most rigorous standards of security and efficiency.
                    </p>  

                    <!-- paragraph -->
                    <p>
                      The core infrastructure of the RLL consists of the 8 year ICP NNS Neuron, ICP Neuron Vector, and ICP Splitter Vector. The ICP Neuron Vector controls the 8 year Neuron and manages maturity collection. The ICP Splitter Vector distributes ICP to the Treasury, Neuron Vector, and SNEED Buyback Vector in fixed proportions.
                    </p>  
                    
                    <!-- paragraph -->
                    <p>
                      The token management of the RLL consists of the SNEED Buyback Vector, SNEED Splitter Vector, Sneed DAO Treasury, Sneed DeFi Canister, SNEED Burn Address, and RLL Distribution Canister. The SNEED Buyback Vector purchases SNEED from the market using ICP. The SNEED Splitter Vector distributes SNEED to the Treasury, DeFi Canister, and Burn Address in fixed proportions. The SNEED DeFi Canister distributes ICP to the ICP Splitter Vector and tokens to RLL Distribution.The SNEED Burn Address permanently removes SNEED from circulation. The RLL Distribution Canister distributes tokens to DAO voting members.
                    </p>  
                    
                    <!-- paragraph -->
                    <p>
                      Currently, the main revenue source for the RLL is the SNEED/ICP provision rewards from ICPSwap.
                    </p>                      
                    
                    <hr>

                    <!-- anon container -->
                    <div class="d-flex flex-wrap" style="gap: 1rem 3rem;">

                      <!-- left -->
                      <div>

                        <!-- heading -->
                        <h3 class="taco-report-explorer__report-heading
                                  taco-report-explorer__report-heading--h1">
                          Tokenomics
                          <i class="fa-solid fa-circle-info" 
                            data-bs-toggle="tooltip" 
                            data-bs-placement="top" 
                            title="Analyse the supply and distribution of the token; any inflationary/deflationary mechanisms; and any incentive structures, to ensure sustainability and fair distribution"></i>
                        </h3>

                        <!-- unordered list -->
                        <ul>

                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              Initial Total Supply: 10,000
                            </p>
                            
                          </li>

                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>

                              <!-- link -->
                              <a href="https://app.sneeddao.com/sneedlock" target="_blank">
                                Current Total Supply (08/06/25): 9948.925
                              </a>

                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              Circulating Supply: 7,386.945
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              Burn per transaction: 0.00001
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              Holders:
                            </p>

                            <!-- unordered list -->
                            <ul style="list-style-type: disc">

                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Top - 16.53% (Treasury)
                                </p>

                              </li>

                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Second - 10.17% (ICPSwap Pool)
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Third - 5.02% (Sneed Team Neuron)
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Mean of Top 25 - 2.62%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Median of Top 25 - 1.09%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Mode of Top 25 - 1%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Top 25 Total - 65.56%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Mean of Top 100 - 0.85%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Median of Top 100 - 0.285%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Mode of Top 100 - 0.50, 0.16%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Top 100 Total - 85%
                                </p>
                                
                              </li>                          

                            </ul>
                            
                          </li>                      

                        </ul>

                      </div>

                      <!-- center -->
                      <div>

                        <!-- heading -->
                        <h3 class="taco-report-explorer__report-heading
                                  taco-report-explorer__report-heading--h1">
                          Market Metrics
                          <i class="fa-solid fa-circle-info" 
                            data-bs-toggle="tooltip" 
                            data-bs-placement="top" 
                            title="Review key indicators such as trading volume and historical market performance."></i>
                        </h3>

                        <!-- unordered list -->
                        <ul>

                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              All Time High (USD): 279.02
                            </p>
                            
                          </li>

                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              All Time High (ICP): 69.21
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              All Time Low (USD): 38.96
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              All Time Low (ICP): 6.43
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              As of 08/06/25(USD): 72.37
                            </p>
                            
                          </li>                      

                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              As of 08/06/25 (ICP): 13.65
                            </p>

                          </li>

                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              Change from ATH USD: -74.06%
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              Change from ATL USD: 85.75%
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              USD Volume 24H as of 08/06/25: 2010
                            </p>
                            
                          </li>

                        </ul>

                      </div>

                      <!-- right -->
                      <div>

                        <!-- heading -->
                        <h3 class="taco-report-explorer__report-heading
                                  taco-report-explorer__report-heading--h1">
                          Liquidity
                        </h3>

                        <!-- paragraph -->
                        <p>
                          As per <a href="https://swaprunner.com" target="_blank">SwapRunner</a> on the 8th of June 2025, a single transaction of:
                        </p>

                        <!-- unordered list -->
                        <ul>

                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              20000 ICP ($106425.90) will result in a trade to 729.76 SNEED ($53728.54). 49.51% lost to price impact
                            </p>
                            
                          </li>

                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              10000 ICP ($53258.27) will result in a trade to 488.91 SNEED ($35996.36). 32.41% lost to price impact
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              1000 ICP ($5325.83) will result in a trade to 68.86 SNEED ($5069.83). 4.81% lost to price impact
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              250 ICP ($1331.46) will result in a trade to 17.82 SNEED ($1310.14). 1.60% lost to price impact
                            </p>
                            
                          </li>

                        </ul>

                        <!-- paragraph -->
                        <p>
                          As can be seen, liquidity for SNEED remains limited. If liquidity is not recycled, and there are no 'sells' between the DAO's 'buys', the effective slippage rate will be identical regardless of whether multiple small transactions or one large one take place.
                        </p>

                      </div>                      

                    </div>

                    <hr>

                    <!-- headings -->
                    <h3 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h1">
                      Competitors
                      <i class="fa-solid fa-circle-info" 
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Identify similar projects and assess the token's differentiators alongside the perceived competitive positioning within its niche"></i>
                    </h3>

                    <!-- paragraph -->
                    <p>
                      While there are numerous DAOs present on the ICP ecosystem, many either have a definitive purpose behind them, or are highly centralized.
                    </p>

                    <!-- paragraph -->
                    <p>
                      In terms of sovereignty and the extent to which collective intelligence and governance is planned to be executed, TACO and SNEED are subjectively the two most on-track DAOs.
                    </p>
                    
                    <!-- paragraph -->
                    <p>
                      SNEED has no current DAO competitor who directly presents a 'blank slate' for collective leadership, nor plans to do so.
                    </p>

                    <hr>
                   
                    <!-- heading -->
                    <h3 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h1">
                      Security Risks
                      <i class="fa-solid fa-circle-info" 
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Investigate perceived vulnerabilities, any audit reports, and adherence to security and regulatory standards"></i>
                    </h3> 
                    
                    <!-- paragraph -->
                    <p>
                      <a href="https://github.com/icsneed/sneed_sns_dapp/tree/main/audit" target="_blank">SneedSwap was audited by RIVVIR Tech, LLC.</a> The initial audit had 6 High Severity and 8 Medium Severity findings, all of which were addressed in the follow-up.
                    </p>
                    
                    <!-- paragraph -->
                    <p>
                      The RLL relies on Neutrinite's DeFi Vectors, <a href="https://github.com/solidstate-auditing/audits-public/blob/main/defi-vectors.md" target="_blank">which was audited by Solidstate</a>. All findings scored Strong or Sufficient.
                    </p>                    

                    <hr>
                    
                    <!-- back to top link -->
                    <a href="#" @click.prevent="scrollToTop" class="taco-report-explorer__report-link text-center w-100 d-inline-block mt-2">Back to top</a>
                    
                  </div>

                  <!-- report footer -->
                  <div class="taco-report-explorer__report-footer">
                    
                    <!-- left -->
                    <div class="taco-report-explorer__report-footer__left">
                      
                      ❤️🌮
                      
                    </div>
                    
                    <!-- center -->
                    <div class="taco-report-explorer__report-footer__center text-center">
                      
                      &copy;2025 Taco Dao
                      
                    </div>
                    
                    <!-- right -->
                    <div class="taco-report-explorer__report-footer__right">
                      
                      <!-- link group -->
                      <span class="d-flex flex-column align-items-end">

                        <span class="text-end">#18 Add Token</span>

                        <span class="d-flex gap-2">

                          <a href="https://nns.ic0.app/proposal/?u=lacdn-3iaaa-aaaaq-aae3a-cai&proposal=18" class="taco-text-blue-to-light-blue text-end" target="_blank">NNS</a>                        

                          <a href="https://tacodao.com/chat/forum/18" class="taco-text-blue-to-light-blue text-end">Taco Forum</a>

                        </span>
                        
                      </span>

                      <!-- link group -->
                      <span class="d-flex flex-column align-items-end">

                        <span class="text-end">#15 Motion to Discuss</span>

                        <span class="d-flex gap-2">

                          <a href="https://nns.ic0.app/proposal/?u=lacdn-3iaaa-aaaaq-aae3a-cai&proposal=15" class="taco-text-blue-to-light-blue text-end" target="_blank">NNS</a>                        

                          <a href="https://tacodao.com/chat/forum/15" class="taco-text-blue-to-light-blue text-end">Taco Forum</a>

                        </span>
                        
                      </span>
                      
                      <!-- link group -->
                      <span class="d-flex flex-column align-items-end">

                        <span class="text-end">#12 Motion to Discuss</span>

                        <span class="d-flex gap-2">

                          <a href="https://nns.ic0.app/proposal/?u=lacdn-3iaaa-aaaaq-aae3a-cai&proposal=12" class="taco-text-blue-to-light-blue text-end" target="_blank">NNS</a>                        

                          <a href="https://tacodao.com/chat/forum/12" class="taco-text-blue-to-light-blue text-end">Taco Forum</a>

                        </span>
                        
                      </span>                      
                      
                    </div>
                    
                  </div>

                </div>
                
              </div>   
              
              <!-- motoko dd report -->
              <div v-if="reportId === 3" class="taco-report-explorer__report-container">

                <!-- inner -->
                <div class="taco-report-explorer__report-container__inner">
                
                  <!-- report header -->
                  <div class="taco-report-explorer__report-header">
                    
                    <!-- report title -->
                    <h2 class="taco-report-explorer__report-header__title">DUE DILIGENCE PROCESS Motoko DAO (MOTOKO)</h2>

                    <!-- report metadata continer -->
                    <div class="taco-report-explorer__report-header__metadata-container">

                      <!-- report metadata -->
                      <span class="taco-report-explorer__report-header__metadata">
                        <i class="fa-solid fa-luchador-mask"></i> 
                        <span> Written by </span>
                        <span>manilpwn</span>
                        <span> and </span>
                        <span>TrickyVik</span>
                        <span class="small"> 06/2025</span>
                      </span>

                    </div>        
                    
                  </div>

                  <!-- report body -->
                  <div class="taco-report-explorer__report-body pt-3">

                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph fst-italic">
                      Much information herein is out of date as it has been announced that the Toko NFT Marketplace will establish its own SNS DAO instead of transitioning under Motoko DAO. This page will be updated when more details are available.
                    </p>
                    
                    <!-- heading -->
                    <h3 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h1">
                      Team Background
                      <i class="fa-solid fa-circle-info" 
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Assess the founding team's transparency, credibility, experience, and any past contributions to the ICP ecosystem"></i>
                    </h3>
                    
                    <!-- paragraph -->
                    <p>
                      Motoko Ghosts is a collection of 10, 000 uniquely illustrated NFTs created by Jon Ball of Poked Studio. They established a visual identity around Motoko, a programming language designed by DFINITY for writing smart contracts on ICP.
                    </p>

                    <!-- paragraph -->
                    <p>
                      Before the creation of the Motoko DAO, <a href="https://x.com/sonic_ooo/status/1745314196034588816?t=p9K9YrK2DF2OD_cPX2QYTA" target="_blank">10,000 $MOTOKO tokens were minted and airdropped 1:1 to Motoko Ghosts NFT holders</a>. Community member AccumulatingICP and the Sonic team collaborated on this, with DFINITY being involved in the process & decision making, and Jon Ball giving the greenlight to proceed.
                    </p>
                    
                    <!-- paragraph -->
                    <p>
                      Motoko DAO was created to give the Motoko Ghosts community a structure to collectively steer the direction of the Motoko Ghosts brand. An ICPSwap LP was used to give existing holders of $MOTOKO the ability to convert their tokens to SNS governance tokens. Four custodians were designated to execute this transition: Bug Slayer, AccumulatingICP, RemCodes, and BobbyO.
                    </p>
                    
                    <!-- paragraph -->
                    <p>
                      The founders of Dragginz, Adam Powell and Donna Powell, are involved as investors and advisors. The Dragginz team has committed to working on the Toko NFT Maker & Marketplace (Toko) until it is ready to transition under Motoko DAO. The Powells previously created Neopets, a 1999 online video game which within less than a decade accrued 140 million accounts. They went on to form Meteor Games after selling Neopets, which, among other projects, created a Facebook game named Island Paradise, which at its peak claimed 6.8 million monthly users. Adam Powell has contributed ICP to several SNS launches, and the Powells are vocal contributors to the broader ICP ecosystem.
                    </p>
                    
                    <!-- paragraph -->
                    <p>
                      Approved governance proposals have appointed six $MOTOKO team hires:
                    </p>

                    <!-- unordered list -->
                    <ul>
                      
                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          <a href="https://app.sneeddao.com/proposal?proposalid=224&sns=ko36b-myaaa-aaaaq-aadbq-cai" target="_blank">Proposal ID 224 appointed VingTheory as Frontend Developer</a>. He created the ICpxy NFT collection and has worked with Poked Studio. He is working on the Motoko Mining dApp and the Motoko MMO.
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          <a href="https://app.sneeddao.com/proposal?proposalid=225&sns=ko36b-myaaa-aaaaq-aadbq-cai" target="_blank">Proposal ID 225 appointed Enoch as Backend Developer</a>. He has worked on numerous projects including Motoko Pals, Tswaanda Africa, and has contributed to IC-Websocket Motoko. He is also DevRel and Instructor at ICP HUB South Africa. He is working on the Motoko MMO.
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          <a href="https://app.sneeddao.com/proposal?proposalid=227&sns=ko36b-myaaa-aaaaq-aadbq-cai" target="_blank">Proposal ID 227 appointed AccumulatingICP as Product Manager</a>. He has worked as a Technical Writer at InfinitySwap, done marketing for Finny, is currently Product Manager & doing marketing for ToolKit, and has a Named Neuron for Due Diligence on SNS Decentralisation Swaps.
                        </p>

                      </li>
                      
                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          <a href="https://app.sneeddao.com/proposal?proposalid=228&sns=ko36b-myaaa-aaaaq-aadbq-cai" target="_blank">Proposal ID 228 appointed Mohammed as Graphic Designer</a>. He has 3 years of experience in this field.
                        </p>

                      </li>
                      
                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          <a href="https://app.sneeddao.com/proposal?proposalid=229&sns=ko36b-myaaa-aaaaq-aadbq-cai" target="_blank">Proposal ID 229 appointed MyArtbar as 3D Animation Artist</a>. He is creator and lead artist for multiple ICP NFT collections including MotokoPals, Puzzle, Offspring, and Space Odyssey.
                        </p>

                      </li>
                      
                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          <a href="https://app.sneeddao.com/proposal?proposalid=233&sns=ko36b-myaaa-aaaaq-aadbq-cai" target="_blank">Proposal ID 233 appointed Jay Nolan as Content Creator</a>. He has created content tailored to the Internet Computer and the Motoko DAO.
                        </p>

                      </li>

                    </ul>                    

                    <hr>

                    <!-- heading -->
                    <h3 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h1">
                      Token Utility
                      <i class="fa-solid fa-circle-info" 
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Examine the token's purpose and functionality within its ecosystem to ensure it provides tangible value and practical use cases"></i>
                    </h3>  
                    
                    <!-- paragraph -->
                    <p>
                      The MOTOKO token serves as the governance token for Motoko DAO, enabling members to submit and vote on proposals that are implemented if approved.
                    </p>  
                    
                    <!-- paragraph -->
                    <p>
                      The Motoko DAO controls the canisters of the Motoko Ghosts and Motoko Pals NFT collections. There is a planned collection of 3D Motoko Ghosts that will be paired 1:1 with the current 2D Motoko Ghosts.
                    </p>  
                    
                    <!-- paragraph -->
                    <p>
                      <a href="https://motoko-1.gitbook.io/motoko-mining/" target="_blank">Motoko Mining will be a platform that allows users to stake their Motoko Ghost</a>, burn $MOTOKO, and have a chance to earn $MOTOKO and a “fuel asset” that will be leveraged in the Motoko MMO. Details for the MMO have not been announced yet, but it will be a combination of PvE & PvP where users level up their Motoko Ghost & compete for $MOTOKO.
                    </p>  
                    
                    <!-- paragraph -->
                    <p>
                      Toko is an NFT Maker & Marketplace planned to be launched this year. The progress that has been completed so far includes account creation, the upload of assets of any filetype, the ability to add tags to assets, the design of the majority of the system, and its wireframe. <a href="https://x.com/dragginzgame/status/1920435166507413664" target="_blank">A video sneak peek of NFT Maker has been shared</a>. The plan for the MVP includes tools for creators to launch simple collections and a marketplace with the basic features of listing, buying, royalties, and transfers.
                    </p>  
                    
                    <!-- paragraph -->
                    <p>
                      Adam has stated that Toko may be under NNS control, with development being done by and royalties going to Motoko DAO.
                    </p>  

                    <!-- paragraph -->
                    <p>
                      Toko will be funded by an optional minting fee - a small percentage of each claim and sale going to the DAO. Creators will be able to adjust this percentage or remove it completely. While these values will be fixed upon creation, creators can set predefined ranges which they can adjust between post-creation. Adam has stated that Motoko DAO may receive all fees from secondary sales.
                    </p>                      
                    
                    <!-- paragraph -->
                    <p>
                      Toko will be built with a focus on creator control and flexibility. This includes creators being able to adjust how many NFTs can ever be minted, how many times they can be transferred, whether royalties taper off over time, allocating % of each sale to fund cycles that keep NFTs usable, and claim rules. Additional planned concepts include splitting and merging NFTs, weighted layer-based NFT generation, as well as mass imports of existing NFT collections.
                    </p>  
                    
                    <!-- paragraph -->
                    <p>
                      <a href="https://x.com/dragginzgame/status/1932136841127272613" target="_blank">Donna has explored potential use cases spanning music, merchandise, events, writing, real-world art, charities, and gaming</a>:
                    </p>

                    <!-- unordered list -->
                    <ul>
                      
                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Exclusive content.
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Dynamic NFTs that evolve over time based on engagement or ownership duration.
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Royalty routing that splits payments transparently and instantly.
                        </p>

                      </li>
                      
                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Fan club access to private Discords, early tour dates, and voting on future releases.
                        </p>

                      </li>
                      
                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Claiming merchandise via NFTs prior to conventions and shows to prevent overproduction and reduce the shipping footprint.
                        </p>

                      </li>
                      
                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Gamified experiences.
                        </p>

                      </li>   
                      
                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Proof of Origin.
                        </p>

                      </li>   
                      
                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          NFT tickets that are non-transferable and burned upon entry to remove scalping, or, alternatively, royalties on resales.
                        </p>

                      </li>   
                      
                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Proof of Attendance.
                        </p>

                      </li>   
                      
                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Serialized writing and publishing.
                        </p>

                      </li>  
                      
                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          NFTs tied to real-world art events and physical artwork as certificates of authenticity
                        </p>

                      </li>  
                      
                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Transparent donation flows for charitable causes, including Proof of Donation NFTs.
                        </p>

                      </li>  
                      
                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          In-game NFTs with cross-IP utility and custom logic for interactive gameplay.
                        </p>

                      </li>                        

                    </ul>   
                    
                    <!-- paragraph -->
                    <p>
                      There are also plans to release official Motoko Ghosts merchandise this year, including a Motoko Merch line, toys, plushies, and trading cards. The legal and financial structure - such as how proceeds will be routed to the DAO treasury - is still under discussion, but Donna has noted that conversations with the DFINITY Foundation have already taken place regarding this merchandise being present at official DFINITY events.
                    </p>
                    
                    <hr>

                    <!-- heading -->
                    <h3 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h1">
                      Ecosystem Alignment
                      <i class="fa-solid fa-circle-info" 
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Evaluate the token's synergy with other ICP projects, including any existing collaborations and suitability for inclusion in the Salsa Season rewards program."></i>
                    </h3>  

                    <!-- paragraph -->
                    <p>
                      Motoko DAO aligns closely with the broader ICP ecosystem by promoting the Motoko programming language - not just as a tool for smart contract development, but as a cultural brand. Subjectively speaking, Motoko Ghosts are cute and lend themselves easily to merchandisable formats like plushies.
                    </p>

                    <!-- paragraph -->
                    <p>
                      With ICP often praised for its technical superiority, building out a world-class NFT standard on this stack makes natural sense.
                    </p>
                    
                    <!-- paragraph -->
                    <p>
                      While Dragginz is a separate project, the Dragginz team has clarified that strong NFT infrastructure is a prerequisite for the Dragginz game itself, and that work on Toko does not represent a shift away from Dragginz development.
                    </p>
                    
                    <!-- paragraph -->
                    <p>
                      This due diligence process was the first to be initiated by a community member rather than the TACO DAO team. <a href="https://forum.dfinity.org/t/commission-due-diligence-report-on-motoko-token-for-taco-dao/50192" target="_blank">The proposal came from long-time active member CryptoMyth</a>.
                    </p>
                    
                    <!-- paragraph -->
                    <p>
                      During the writing of this due diligence, <a href="https://x.com/MotokoGhosts/status/1936132191907459228" target="_blank">Motoko Ghosts held a meme contest on X in collaboration with Windoge98</a>.
                    </p>                    

                    <hr>

                    <!-- heading -->
                    <h3 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h1">
                      Community
                      <i class="fa-solid fa-circle-info" 
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Assess the size and engagement of the token's community to gauge long-term adoption potential"></i>
                    </h3>  

                    <!-- paragraph -->
                    <p>
                      The Motoko DAO Community Discord server has 1.45k members, the Toko Discord server has 81 members, and the OpenChat community has 360 members.
                    </p>  

                    <!-- paragraph -->
                    <p>
                      On X, MotokoGhosts has 1997 followers and TokoMarket_ has 300 followers.
                    </p>                      
                    
                    <hr>

                    <!-- heading -->
                    <h3 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h1">
                      Technology
                      <i class="fa-solid fa-circle-info" 
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Review the project's technical foundation, focusing on code quality, scalability, and how effectively it leverages ICP's capabilities"></i>
                    </h3>  

                    <!-- paragraph -->
                    <p>
                      <a href="https://forum.dfinity.org/t/why-support-boom-evolving-into-mimic/44176" target="_blank">Mimic is an open-source, schema-based query and data modelling language for handling complex data</a>. It was originally developed for Dragginz and is now being used for Toko. For now, Mimic does not have the necessary documentation to make it accessible.
                    </p>  

                    <!-- paragraph -->
                    <p>
                      <a href="https://forum.dfinity.org/t/migrating-existing-nfts-to-the-motoko-marketplace/43389/19" target="_blank">Adam has outlined the creation of the “NextGenNFT” standard</a>, an ambitious evolution of NFTs designed to meet the emotional and technological demands of digital experiences in 2030. It will use Plutchik's Wheel of Emotions - a psychological model identifying eight primary emotions (Joy, Trust, Fear, Surprise, Sadness, Disgust, Anger, Anticipation) - as a framework to create emotionally responsive NFTs.
                    </p>  
                    
                    <!-- paragraph -->
                    <p>
                      This is intended to support modular interactions and to scale across a range of applications, including gaming, AR/VR, and live streaming.
                    </p>  
                    
                    <!-- paragraph -->
                    <p>
                      Current NFT standards are limited to static metadata and basic ownership mechanics, lacking native support for dynamic, interactive, or emotionally responsive features. The proposed NextGenNFT standard introduces 23 components to address these gaps:
                    </p>   
                    
                    <!-- unordered list -->
                    <ul>
                      
                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          NFT Name: Mutable title (e.g., “Wedding Day” to “10th Anniversary”).
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Description: Mutable text for narrative evolution.
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          ID: Immutable unique identifier.
                        </p>

                      </li>
                      
                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Issuer: Immutable entity that minted the NFT.
                        </p>

                      </li>
                      
                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Asset: Mutable content that can adapt to context.
                        </p>

                      </li>
                      
                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Attributes: Mutable key-value pairs for dynamic metadata (e.g., “mood: happy”).
                        </p>

                      </li>   
                      
                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Immutable Part: Defines unchangeable fields.
                        </p>

                      </li>   
                      
                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Royalties: Built-in creator compensation for secondary sales.
                        </p>

                      </li>   
                      
                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Dynamic Metadata: Mechanism to update mutable fields.
                        </p>

                      </li>   
                      
                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Conditional Logic: Restricts access/perks based on conditions.
                        </p>

                      </li>  
                      
                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Execution Logic: Automates actions (e.g., transfers on death).
                        </p>

                      </li>  
                      
                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Ownership Structure: Supports multiple co-owners.
                        </p>

                      </li>  
                      
                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Context Handler: Adapts asset to environment (e.g., VR vs. mobile).
                        </p>

                      </li>    
                      
                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Encryption Layer: Secures sensitive data (e.g., biometrics).
                        </p>

                      </li>    

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Pricing Engine: Dynamically adjusts value based on demand.
                        </p>

                      </li>    

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Sentiment Interface: Responds to user emotions (e.g., glows for Joy).
                        </p>

                      </li>    

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Oracle Support: Integrates real-time data (e.g., weather).
                        </p>

                      </li>    

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Generative Module: Creates unique content at minting.
                        </p>

                      </li>    

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Soulbound Status: Locks NFT to a wallet.
                        </p>

                      </li>    

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Transferable but Non-Sellable Status: Allows gifting but not selling.
                        </p>

                      </li>    

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Self-Destruct Settings: Enables expiration/burning (e.g., post-event).
                        </p>

                      </li>    

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Revocability Status: Allows issuer to cancel NFT.
                        </p>

                      </li>    

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Social Impact Metrics: Tracks engagement/impact (e.g., boycott success).
                        </p>

                      </li>    

                    </ul>                       
                    
                    <hr>

                    <!-- anon container -->
                    <div class="d-flex flex-wrap" style="gap: 1rem 3rem;">

                      <!-- left -->
                      <div>

                        <!-- heading -->
                        <h3 class="taco-report-explorer__report-heading
                                  taco-report-explorer__report-heading--h1">
                          Tokenomics
                          <i class="fa-solid fa-circle-info" 
                            data-bs-toggle="tooltip" 
                            data-bs-placement="top" 
                            title="Analyse the supply and distribution of the token; any inflationary/deflationary mechanisms; and any incentive structures, to ensure sustainability and fair distribution"></i>
                        </h3>

                        <!-- unordered list -->
                        <ul>

                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              Initial Total Supply: 10,000
                            </p>
                            
                          </li>

                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>

                              <!-- link -->
                              <a href="https://app.sneeddao.com/sneedlock" target="_blank">
                                Current Total Supply (22/06/25): 54,660,973
                              </a>

                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              Circulating Supply: 42,259,439
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              Burn per transaction: 0.1
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              Holders:
                            </p>

                            <!-- unordered list -->
                            <ul style="list-style-type: disc">

                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Top - 22.68% (Treasury)
                                </p>

                              </li>

                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Second - 16.46%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Third - 3.6%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Mean of Top 25 - 2.5324%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Median of Top 25 - 0.69%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Mode of Top 25 - 0.55%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Top 25 Total - 63.31%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Mean of Top 100 - 0.7762%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Median of Top 100 - 0.2%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Mode of Top 100 - 0.18%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Top 100 Total - 77.62%
                                </p>
                                
                              </li>                          

                            </ul>
                            
                          </li>                      

                        </ul>

                        <!-- paragraph -->
                        <p>
                          Inflationary mechanisms do exist in the forms of APY from staking rewards. For a 1 year old neuron with a 3 month dissolve delay, a staker will earn 25% APY. This is a significant amount for a small dissolve delay (when compared to ICP's max of 8 years) and over 40% of the total supply is staking without dissolving, though not all neurons are at that rate. This is planned to decrease to 0% over the course of 4 years.
                        </p>

                      </div>

                      <!-- center -->
                      <div>

                        <!-- heading -->
                        <h3 class="taco-report-explorer__report-heading
                                  taco-report-explorer__report-heading--h1">
                          Market Metrics
                          <i class="fa-solid fa-circle-info" 
                            data-bs-toggle="tooltip" 
                            data-bs-placement="top" 
                            title="Review key indicators such as trading volume and historical market performance."></i>
                        </h3>

                        <!-- unordered list -->
                        <ul>

                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              All Time High (USD): 334.11
                            </p>
                            
                          </li>

                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              All Time High (ICP): 27.39
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              All Time Low (USD): 0.00122
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              All Time Low (ICP): 0.0022
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              As of 18/06/25(USD): 0.0942
                            </p>
                            
                          </li>                      

                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              As of 18/06/25 (ICP): 0.0187
                            </p>

                          </li>

                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              Change from ATH USD: -99.972%
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              Change from ATL USD: 7621.311%
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              USD Volume 24H as of 18/06/25: 16436
                            </p>
                            
                          </li>

                        </ul>

                        <!-- paragraph -->
                        <p>
                          $MOTOKO's supply changed in January 2025, explaining the vast majority of the price changes. Therefore we can approximate ATH and ATL to get a more accurate figure of the data
                        </p>

                        <!-- paragraph -->
                        <p>
                          All Time High (USD): ~ 0.0611
                        </p>

                        <!-- paragraph -->
                        <p>
                          This means that the actual dollar value ATH is not the true ATH, and the true ATH adjusted for supply changes is June 9th's 0.1237 USD.
                        </p>

                        <!-- paragraph -->
                        <p>
                          Actual Change from ATH USD: ~ 23.848%
                        </p>   

                      </div>

                      <!-- right -->
                      <div>

                        <!-- heading -->
                        <h3 class="taco-report-explorer__report-heading
                                  taco-report-explorer__report-heading--h1">
                          Liquidity
                        </h3>

                        <!-- paragraph -->
                        <p>
                          As per <a href="https://swaprunner.com" target="_blank">SwapRunner</a> on the 18th of June 2025, a single transaction of:
                        </p>

                        <!-- unordered list -->
                        <ul>

                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              20000 ICP ($100817.27) will result in a trade to 717209.30 MOTOKO ($67469.52). 33.077% lost to price impact
                            </p>
                            
                          </li>

                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              10000 ICP ($50408.63) will result in a trade to 421841.63 MOTOKO ($39683.61). 21.276% lost to price impact
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              1000 ICP ($5040.86) will result in a trade to 51562.78 MOTOKO ($4850.63). 3.774% lost to price impact
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              250 ICP ($1260.22) will result in a trade to 13226.93 MOTOKO ($1242.83). 1.38% lost to price impact
                            </p>
                            
                          </li>

                        </ul>

                        <!-- paragraph -->
                        <p>
                          As can be seen, liquidity for MOTOKO remains limited. If liquidity is not recycled, and there are no 'sells' between the DAO's 'buys', the effective slippage rate will be identical regardless of whether multiple small transactions or one large one take place.
                        </p>

                      </div>                      

                    </div>

                    <hr>

                    <!-- headings -->
                    <h3 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h1">
                      Competitors
                      <i class="fa-solid fa-circle-info" 
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Identify similar projects and assess the token's differentiators alongside the perceived competitive positioning within its niche"></i>
                    </h3>

                    <!-- paragraph -->
                    <p>
                      Motoko Ghosts originally launched without DAO control, and during this period, <a href="https://motoko-backdoor-report.gitbook.io/motoko-backdoor-report" target="_blank">the NFT canister contained a backdoor</a>. This vulnerability was exploited through a series of timed upgrades and wallet transfers that extracted thousands of ICP via dormant NFTs. The issue was later investigated, the backdoor removed, the code verified, and control handed to the Motoko DAO.
                    </p>

                    <!-- paragraph -->
                    <p>
                      In assessing the competitive landscape, <a href="https://x.com/dragginzgame/status/1932136841127272613" target="_blank">Donna has noted the following</a>:
                    </p>
                    
                    <!-- paragraph -->
                    <p>
                      “The existing NFT landscape on the Internet Computer is a mess. There is little to no support for existing collections. Many creators have had their NFTs stop working completely because they ran out of cycles even though they paid marketplace fees that were supposed to cover exactly that. On top of that, there's been security issues, missing assets, and no real way to fix anything when it goes wrong.”
                    </p>

                    <!-- paragraph -->
                    <p>
                      Motoko DAO aims to address these gaps by prioritizing canister maintainability, long-term creator control, and technical flexibility.
                    </p>   
                    
                    <!-- paragraph -->
                    <p>
                      The $CLOUD memecoin has positioned itself as a brand-awareness vehicle for the Internet Computer, citing the alignment between its name and ICP's positioning as a decentralized cloud. Its visibility is supported by community advocate BobbyO, who promotes $CLOUD and creates educational content around ICP. Similarly, $MOTOKO leverages the name of the Internet Computer's native programming language to elevate ecosystem visibility. While $CLOUD leans on association and influencer marketing, Motoko DAO's strategy centers around development, community creation, and physical goods — offering a more infrastructure-anchored approach to ICP branding.
                    </p>   
                    
                    <!-- paragraph -->
                    <p>
                      Google trends show NFT interest is one-fiftieth what it was in January 2022. Over the course of 2022, trading volume in NFTs on OpenSea, one of the largest NFT marketplaces, witnessed a <a href="https://web.archive.org/web/20220829170925/https://fortune.com/2022/08/29/nfts-opensea-crypto-winter-bubble-blockchain-web3/" target="_blank">99% decline</a> from its ATH. While recently the volume of new users has seen OpenSea <a href="https://www.msn.com/en-us/money/markets/opensea-reports-highest-monthly-user-count-since-2023-are-nfts-back/ar-AA1GlZlu" target="_blank">reach highs not seen since 2023</a>, the monthly volume of $81 million still far underperforms the $5 billion seen in January 2022.
                    </p>   
                    
                    <!-- paragraph -->
                    <p>
                      The most significant competitors to $MOTOKO will be those best poised to compete with its main product, that being Toko. The two most noteworthy marketplaces are OpenSea and Rarible.
                    </p>   
                    
                    <!-- paragraph -->
                    <p>
                      OpenSea is an exchange that allows for a wide variety of NFT collections from static images to music to be minted on chain by anybody, with some creator flexibility regarding fees. However, NFT creators are at risk of being <a href="https://nftevening.com/what-is-opensea/" target="_blank">deplatformed by the owners of the site due to the lack of community control</a>. While OpenSea operates under a peer-to-peer transaction system, the owners of OpenSea can theoretically prevent a creator from successfully listing on the platform (<a href="https://www.cryptopolitan.com/game-developers-hit-opensea-nft-delisting/" target="_blank">and has done so</a>).
                    </p>   
                    
                    <!-- paragraph -->
                    <p>
                      Rarible utilises a governance token of its own, $RARI, which avoids the centralisation issues posed by OpenSea, and while Rarible still does have some policies on what is considered acceptable to list, it is a form of self-regulation voted upon by governance holders rather than one imposed by executives. Rarible utilises a significant transaction fee - 2.5% - for both buyers and sellers. Rarible also allows for direct fiat transactions to be used in the minting of NFTs.
                    </p>   
                    
                    <!-- paragraph -->
                    <p>
                      Toko differs from these two large competitors by focusing on a far greater level of creator control, both in terms of creation and cost, by allowing for creators to pick and choose from a wide variety of tools, while also having royalties be entirely flexible. Toko marketplace has made no statements regarding the possibility for direct fiat transactions to occur, which may lead to some loss of market share due to the perceived difficulty some may have in accessing the ICP blockchain in general.
                    </p>                       

                    <hr>
                   
                    <!-- heading -->
                    <h3 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h1">
                      Security Risks
                      <i class="fa-solid fa-circle-info" 
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Investigate perceived vulnerabilities, any audit reports, and adherence to security and regulatory standards"></i>
                    </h3> 
                    
                    <!-- paragraph -->
                    <p>
                      Motoko Mining is currently under audit.
                    </p>
                    
                    <!-- paragraph -->
                    <p>
                      It is worth noting that virtually everything purported by the Motoko DAO team is either speculative, promised, theoretical, or otherwise non-tangible, and the only created project so far is the Motoko Ghosts NFT collection (which predated the DAO), and the DAO's most significant asset is its ownership of other NFT-controlling canisters. Additionally, the DAO has made agreements with certain NFT creators to have control end up in the DAO's hands, that have yet to be followed through.
                    </p>   

                    <!-- paragraph -->
                    <p>
                      Subjectively speaking the largely unlaunched nature of Motoko DAO's projects would ordinarily engender caution, though it is worth noting the connections and trust Motoko DAO has earned from large figures. The Powells have expressed significant interest in the Toko marketplace, and it was after they joined as advisors that the idea was actually brought into existence. <a href="https://x.com/dragginzgame/status/1932136841127272613" target="_blank">It was their Dragginz twitter account that posted a fleshed-out version of the concept</a>. The Dragginz Team are creating the Toko marketplace themselves and 'donating' it to the DAO for no explicit financial gain. This suggests existing significant financial and technical backing of the visions proposed by Motoko DAO.
                    </p>

                    <hr>
                    
                    <!-- back to top link -->
                    <a href="#" @click.prevent="scrollToTop" class="taco-report-explorer__report-link text-center w-100 d-inline-block mt-2">Back to top</a>
                    
                  </div>

                  <!-- report footer -->
                  <div class="taco-report-explorer__report-footer">
                    
                    <!-- left -->
                    <div class="taco-report-explorer__report-footer__left">
                      
                      ❤️🌮
                      
                    </div>
                    
                    <!-- center -->
                    <div class="taco-report-explorer__report-footer__center text-center">
                      
                      &copy;2025 Taco Dao
                      
                    </div>
                    
                    <!-- right -->
                    <div class="taco-report-explorer__report-footer__right">

                      <!-- link group -->
                      <span class="d-flex flex-column align-items-end">

                        <span class="text-end">#45 Add Token</span>

                        <span class="d-flex gap-2">

                          <a href="https://nns.ic0.app/proposal/?u=lacdn-3iaaa-aaaaq-aae3a-cai&proposal=45" class="taco-text-blue-to-light-blue text-end" target="_blank">NNS</a>                        

                          <a href="https://tacodao.com/chat/forum/45" class="taco-text-blue-to-light-blue text-end">Taco Forum</a>

                        </span>
                        
                      </span>   
                      
                      <!-- link group -->
                      <span class="d-flex flex-column align-items-end">

                        <span class="text-end">#37 Motion to Discuss</span>

                        <span class="d-flex gap-2">

                          <a href="https://nns.ic0.app/proposal/?u=lacdn-3iaaa-aaaaq-aae3a-cai&proposal=37" class="taco-text-blue-to-light-blue text-end" target="_blank">NNS</a>                        

                          <a href="https://tacodao.com/chat/forum/37" class="taco-text-blue-to-light-blue text-end">Taco Forum</a>

                        </span>
                        
                      </span>                         
                      
                      <!-- link group -->
                      <span class="d-flex flex-column align-items-end">

                        <span class="text-end">#14 Motion to Research</span>

                        <span class="d-flex gap-2">

                          <a href="https://nns.ic0.app/proposal/?u=lacdn-3iaaa-aaaaq-aae3a-cai&proposal=14" class="taco-text-blue-to-light-blue text-end" target="_blank">NNS</a>                        

                          <a href="https://tacodao.com/chat/forum/14" class="taco-text-blue-to-light-blue text-end">Taco Forum</a>

                        </span>
                        
                      </span>                      
                      
                    </div>
                    
                  </div>

                </div>
                
              </div>

              <!-- gold dao dd report -->
              <div v-if="reportId === 4" class="taco-report-explorer__report-container">

                <!-- inner -->
                <div class="taco-report-explorer__report-container__inner">
                
                  <!-- report header -->
                  <div class="taco-report-explorer__report-header">
                    
                    <!-- report title -->
                    <h2 class="taco-report-explorer__report-header__title">DUE DILIGENCE PROCESS Gold DAO (GOLDAO) & Gold Token (GLDT)</h2>

                    <!-- report metadata continer -->
                    <div class="taco-report-explorer__report-header__metadata-container">

                      <!-- report metadata -->
                      <span class="taco-report-explorer__report-header__metadata">
                        <i class="fa-solid fa-luchador-mask"></i> 
                        <span> Written by </span>
                        <span>manilpwn</span>
                        <span> and </span>
                        <span>TrickyVik</span>
                        <span class="small"> 07/2025</span>
                      </span>

                    </div>        
                    
                  </div>

                  <!-- report body -->
                  <div class="taco-report-explorer__report-body">
                    
                    <!-- heading -->
                    <h3 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h1">
                      Team Background
                      <i class="fa-solid fa-circle-info" 
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Assess the founding team's transparency, credibility, experience, and any past contributions to the ICP ecosystem"></i>
                    </h3>
                    
                    <!-- paragraph -->
                    <p>
                      “The DAO” is the most famous early example of a DAO. It was launched in 2016 on Ethereum as a decentralized venture capital fund, <a href="https://www.sec.gov/files/litigation/investreport/34-81207.pdf" target="_blank">raising over $150 million USD</a>. A vulnerability in the code was exploited to drain ~ $60 million USD worth of ETH from The DAO. As a result, the Ethereum network was hard forked to enable original owners to re-obtain their ETH. Some continued using the unforked Ethereum blockchain, which came to be known as Ethereum Classic.
                    </p>

                    <!-- paragraph -->
                    <p>
                      A German company, Slock.it, <a href="https://www.coindesk.com/markets/2016/05/12/the-dao-or-how-a-leaderless-ethereum-project-raised-50-million" target="_blank">created the open-source DAO framework used for The DAO</a>. According to CoinDesk, DAO.Link, a Swiss-based company, was created by Slock.it in partnership with the cryptocurrency brokerage Bity in order to provide an interface between DAOs and real-world legal structures. <a href="https://forum.dfinity.org/t/sns-the-gold-dao-by-dao-link/24255" target="_blank">DAO.Link created Gold DAO</a>. The founding team consisted of individuals that worked for DFINITY, ORIGYN, Yumi, Bity, and Quantum.
                    </p>
                    
                    <!-- paragraph -->
                    <p>
                      On DAO.Link's website, under history, DAO.Link makes no claim to being involved in the creation of The DAO, <a href="https://dao.link/about" target="_blank">they only claim to being involved in helping users recover funds from The DAO's hack</a>. If CoinDesk is accurate, this could potentially be seen as information that lacks the full context of the situation.
                    </p>
                    
                    <!-- paragraph -->
                    <p>
                      The ORIGYN Foundation created the ORIGYN protocol, designed to bring RWAs (Real-World Assets) fully on-chain. It is the main contributor to the ORIGYN NFT standard that is running the perpetual marketplace of the GLD NFT. ORIGYN donated 500m OGY to Gold DAO.
                    </p>
                    
                    <!-- paragraph -->
                    <p>
                      Although requested multiple times, the Gold DAO team did not provide any information related to team members and their experience. <a href="https://www.linkedin.com/company/daolink/people/" target="_blank">According to LinkedIn</a>:
                    </p>

                    <!-- unordered list -->
                    <ul>
                      
                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          <a href="https://www.linkedin.com/in/julien-aerni-04b247152/" target="_blank">Julien Aerni is Président of Dao.Link</a>, having ~ 5 years of industry experience, also being CEO at Quantum and Co-Founder of Genesium.
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          <a href="https://www.linkedin.com/in/dustin-becker-90159092/" target="_blank">Dustin Becker is Tech lead at Dao.Link</a>, having ~ 16 years of experience in software, and also being Head of Innovation Tech at Bity.
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          <a href="https://www.linkedin.com/in/gautierwojda/" target="_blank">Gautier Wodja is co-CTO at Dao.Link</a>, having ~ 8 years of experience in software, also being Staff Engineer at Bity, co-CTO at ORIGYN Foundation, and Software Architect at Bochsler Finance.
                        </p>

                      </li>
                      
                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          <a href="https://www.linkedin.com/in/cencensong/" target="_blank">Melissa Song is Head of Business Development & Partnerships at Dao.Link</a>, having ~ 14 years of industry experience, also being CEO of Bity, and previously being Head of Business Development: RWA & NFTs at Bochsler Finance.
                        </p>

                      </li>

                    </ul>   
                    
                    <!-- paragraph -->
                    <p>
                      <a href="https://x.com/VictorICPGold" target="_blank">VictorICP is the Community Manager</a>, also being the creator of the <a href="https://x.com/ICPLoteria" target="_blank">ICPLoteria NFT collection</a>.
                    </p>
                    
                    <!-- paragraph -->
                    <p>
                      <a href="https://dashboard.internetcomputer.org/sns/tw2vt-hqaaa-aaaaq-aab6a-cai/proposal/27" target="_blank">156,746 ICP was transferred from the treasury to the team wallet</a>. The team wallet now has an ICP balance of 394.67 ICP and 223217.76 WTN, so a $TACO bounty was offered for clarity on the destination of these funds. A community member with a track record of accurate wallet tracing reported that approximately 117k ICP went to WaterNeuron, 20k ICP went to Binance, and the remainder is unknown.
                    </p>

                    <!-- paragraph -->
                    <p>
                      Recently, with proposals <a href="https://nns.ic0.app/proposal/?u=tw2vt-hqaaa-aaaaq-aab6a-cai&proposal=240" target="_blank">240</a> and <a href="https://nns.ic0.app/proposal/?u=tw2vt-hqaaa-aaaaq-aab6a-cai&proposal=251" target="_blank">251</a>, Chris Yost of the Cloud Foundation was transferred GOLDAO tokens to make educational videos.
                    </p>

                    <hr>

                    <!-- heading -->
                    <h3 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h1">
                      Token Utility
                      <i class="fa-solid fa-circle-info" 
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Examine the token's purpose and functionality within its ecosystem to ensure it provides tangible value and practical use cases"></i>
                    </h3>  
                    
                    <!-- paragraph -->
                    <p>
                      The GOLDAO token serves as the governance token for Gold DAO, enabling members to submit and vote on proposals that are implemented if approved.
                    </p>

                    <!-- paragraph -->
                    <p>
                      The Gold NFT or GLD NFT represents direct ownership of physical gold bullion bars in sizes of 1g, 10g, 100g, or 1kg, stored in vaults in Switzerland. <a href="https://help.bity.com/en/articles/9680005-who-produced-the-gold-bar" target="_blank">All gold bars are produced by Metalor</a>, a global leading gold refiner. <a href="https://help.bity.com/en/articles/9680087-who-performs-the-auditing-at-the-vault" target="_blank">These bars are periodically audited by KPMG</a>, one of the world's leading accounting firms. <a href="https://docs.gold-dao.org/gold-dao-whitepaper/the-ecosystem/products/gold-nft-gld-nft" target="_blank">The ORIGYN Protocol is used to issue digital certificates minted as NFTs</a>, providing unique identifiers linked to the bars. Any upgrades to the NFT canisters need to go through ORIGYN which Gold DAO has a 500m token stake in. <a href="https://docs.gold-dao.org/resources/gold-dao-owned-neurons/ogy-neuron" target="_blank">The OGY tokens are in a neuron locked for 5 years</a>, from which rewards are distributed to Gold DAO neuron owners.
                    </p>

                    <!-- paragraph -->
                    <p>
                      Bity is a Swiss-based brokerage for cryptocurrency that provides the frontend to facilitate buying and selling of GLD NFTs, as well as a framework to perform KYC. <a href="https://help.bity.com/en/articles/9680033-how-is-the-gold-nft-price-determined" target="_blank">The GLD NFT price is calculated based on the LBMA (London Bullion Market Association) Spot price of gold</a>, plus the production costs and any additional fees such as storage, auditing, and transportation. <a href="https://help.bity.com/en/articles/9680077-how-can-i-redeem-the-physical-gold-bar-from-my-nfts" target="_blank">Owners can redeem their NFT to physical gold</a> by undergoing KYC, contacting the Bity support team, depositing the NFT to a wallet address provided by the support team, depositing a fee of 300 CHF to another address provided by the support team, and attending an appointment in Zurich to collect. Bity is working on providing additional delivery methods and expanding redemption locations. <a href="https://help.bity.com/en/articles/9680058-how-can-i-resell-my-gld-nft" target="_blank">Owners can sell their NFT to Bity for the current spot price</a>, minus a 3% commission, having to complete KYC, and receiving funds in USDT. <a href="https://help.bity.com/en/articles/9680059-how-can-i-transfer-my-gld-nft-to-someone-else" target="_blank">GLD NFTs can be transferred between wallet addresses</a>, with the originating wallet requiring 11 OGY tokens to initiate the transfer. The Gold DAO team is working on creating a secondary market for GLD NFTs.
                    </p>

                    <!-- paragraph -->
                    <p>
                      <a href="https://docs.gold-dao.org/gold-dao-whitepaper/the-ecosystem/products/gold-token-gldt" target="_blank">The Gold Token or GLDT is a fungible token backed by GLD NFTs</a>. 1 GLDT represents 0.01g of gold. GLDT is minted when a GLD NFT is swapped for GLDT, for which there is no fee. GLDT can be swapped for GLD NFTs, for which there is a fee of 1 GLDT per NFT. <a href="https://x.com/OneSecBridge/status/1943346067514290195" target="_blank">GLDT can be bridged to BASE using OneSecBridge</a>.
                    </p>

                    <!-- paragraph -->
                    <p>
                      Information on the planned GLDT staking mechanism was only discovered through a chance community tip. The subject is absent from the knowledge hub sidebar and is not linked in any of the sidebar's articles. <a href="https://docs.gold-dao.org/resources/gldt-staking" target="_blank">It only appears via a direct 'GLDT staking' search</a>, suggesting it may still be in the conceptual stage. GLDT staking allows users to lock their GLDT tokens and earn passive rewards in GOLDAO, ICP, and OGY. The minimum stake is 10 GLDT. Rewards are sourced from a dedicated GOLDAO neuron, with distributions based on stake size and an age bonus that doubles rewards annually. Staked GLDT has a one-week unlock delay, or users can pay a 5% fee for immediate access. The system aims for a ~5% APY, scaling the GOLDAO neuron to match GLDT staking demand. Early stakers may see higher returns until more GLDT is staked. The GOLDAO neuron will be funded from a 200 million GOLDAO treasury allocation for product growth, and its creation will dilute rewards for existing GOLDAO stakers.
                    </p>

                    <!-- paragraph -->
                    <p>
                      <a href="https://docs.gold-dao.org/gold-dao-whitepaper/the-ecosystem/products/usd-pegged-stablecoin-usdg" target="_blank">The planned USDG token will be a USD-pegged stablecoin minted by opening a Collateralized Debt Position (CDP) against GLDT</a>. USDG gains its value by being leveraged against GLDT which is itself convertible 1:1 with gold through the Gold NFT system.Those who issue USDG would do so to remain exposed to gold while also having liquid funds.
                    </p>

                    <!-- paragraph -->
                    <p>
                      <a href="https://2669388926-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FhyYilEcr51QGR1f1ZQ8w%2Fuploads%2FBcCDXIGwAHLVyxGVs238%2FAMA%20Q%26A%20Telegram%20Gold%20DAO.pdf?alt=media&token=3b8ca526-f413-47dd-a5e4-7ba7d20c1a81" target="_blank">The Gold DAO team does not rule out adding other RWAs in the future</a>.
                    </p>
                    
                    <hr>

                    <!-- heading -->
                    <h3 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h1">
                      Ecosystem Alignment
                      <i class="fa-solid fa-circle-info" 
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Evaluate the token's synergy with other ICP projects, including any existing collaborations and suitability for inclusion in the Salsa Season rewards program."></i>
                    </h3>  

                    <!-- paragraph -->
                    <p>
                      Programmable gold is a unique value proposition. Integration of GLDT can impact broader ICP adoption, facilitating enhanced liquidity and user engagement.
                    </p>
                    
                    <!-- paragraph -->
                    <p>
                      The Gold DAO invested 17.5k ICP in the first SNS sale of WaterNeuron. <a href="https://docs.gold-dao.org/resources/gold-dao-owned-neurons/wtn-neuron" target="_blank">The rewards from the resulting neuron are distributed to GOLDAO governance participants</a>.
                    </p>

                    <!-- paragraph -->
                    <p>
                      OpenChat uses GLDT for tipping.
                    </p>

                    <!-- paragraph -->
                    <p>
                      Including GLDT in the TACO DAO portfolio means that Salsa Season rewards program participants gain exposure to gold.
                    </p>

                    <hr>

                    <!-- heading -->
                    <h3 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h1">
                      Community
                      <i class="fa-solid fa-circle-info" 
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Assess the size and engagement of the token's community to gauge long-term adoption potential"></i>
                    </h3>  

                    <!-- paragraph -->
                    <p>
                      The Gold DAO telegram has 3314 members, and the OpenChat community has 1668 members.
                    </p>
                    
                    <!-- paragraph -->
                    <p>
                      On X, TheGoldDAO has 16.7k followers.
                    </p>
                    
                    <hr>

                    <!-- heading -->
                    <h3 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h1">
                      Technology
                      <i class="fa-solid fa-circle-info" 
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Review the project's technical foundation, focusing on code quality, scalability, and how effectively it leverages ICP's capabilities"></i>
                    </h3>  

                    <!-- paragraph -->
                    <p>
                      <a href="https://docs.gold-dao.org/gold-dao-whitepaper/technology/technology" target="_blank">All components directly related to the Gold project are fully deployed on the Internet Computer Protocol (ICP)</a>. The system is powered by canisters that handle NFT issuance, token minting, ledger tracking, and KYC. The GLD NFT canister, which issues the NFTs backed by physical gold, is built on the ORIGYN Protocol. ORIGYN NFTs offer low costs and fast transaction speeds, enabling complex data storage while being fully decentralized.
                    </p>
                    
                    <!-- paragraph -->
                    <p>
                      <a href="https://app.gldt.org/advanced/gldt" target="_blank">Users interact through the GLDT Swap frontend</a>, which connects to the GLDT Swap canister responsible for minting GLDT tokens when GLD NFTs are locked. All NFT swaps are routed through the BITY KYC canister, which manages identity verification. The frontend interfaces for the swap portal and the GLDT ledger explorer are hosted on-chain as part of the SNS.
                    </p>

                    <!-- paragraph -->
                    <p>
                      <a href="https://docs.gold-dao.org/gold-dao-whitepaper/the-ecosystem/products/usd-pegged-stablecoin-usdg" target="_blank">USDG mechanics</a>, currently in the conceptual and design phase, remain subject to revision. To mint USDG, users lock at least 150% of the desired value in GLDT, with a minimum deposit amount of 100 GLDT, no fee for initiation, and a 1% fee for closure. If price fluctuations cause the Collateral Ratio (CR) to fall below 150% but stay above 110%, users cannot mint more USDG but can still add collateral or repay their USDG debt. Falling below 110% triggers liquidation of the collateral. <a href="https://docs.gold-dao.org/gold-dao-whitepaper/tokenomics/ownership" target="_blank">The oracle canisters involved in the pegging of USDG are yet to be elucidated upon</a>.
                    </p>

                    <!-- paragraph -->
                    <p>
                      Liquidation is executed through the Stability Pool, where users can stake USDG. When liquidation occurs, a proportional amount of staked USDG is burned to cover the debt, and the corresponding GLDT is distributed to the pool participants. Users staking in the Stability Pool are incentivised with GOLDAO tokens.
                    </p>

                    <!-- paragraph -->
                    <p>
                      In the scenario of liquidation, which would happen from the USD price of gold dropping, the issuer of the USDG would lose their GLDT collateral and be left the USDG. Therefore they are forced to 'cash out' with an asset that is valued lower than the initial collateral, due to the 150% minimum ratio. As liquidation is triggered below a 110% CR, this forces an additional loss of 9.09% (drop from 110 to 100) upon the issuer when compared to the loss in price for GLDT. Stability pool participants profit from this loss.
                    </p>

                    <!-- paragraph -->
                    <p>
                      To further enforce the USDG price peg by blunting any short term fluctuations, such as those incurred from market dumping, USDG can be redeemed through a 'redemption channel' for GLDT from CDPs with the lowest CR, incurring a 0.5% fee. Users swap 1 USDG for $1 worth of GLDT, and instant profit is gained by the difference between the value of USDG and $1. If natural supply and demand does not restore the price peg in a timely fashion, arbitrageurs attracted by the prospect of instant profit will rapidly push the price back to $1 (or rather keep it above $0.995).
                    </p>

                    <!-- paragraph -->
                    <p>
                      The purpose of this system is to ensure that USDG remains reliably pegged to the dollar while allowing for fluctuations in the value of GLDT. The 40% zone between 150% and 110% is wide enough to avoid sudden liquidations, while the 10% margin between 110% and 100% guarantees that, in liquidation, GLDT is reclaimed to reestablish backing. A 33.33% drop in the price of gold without extra collateral being added is required to destroy this peg, but such a drop is extremely rare and has historically taken years. The failure of the peg would come about from the inaction of issuers in an extremely long period of time, rather than the fluctuation of the gold price.
                    </p>                      
                    
                    <hr>

                    <!-- anon container -->
                    <div class="d-flex flex-wrap" style="gap: 1rem 3rem;">

                      <!-- section 1 - GLDT -->
                      <div>

                        <!-- heading -->
                        <h3 class="taco-report-explorer__report-heading
                                  taco-report-explorer__report-heading--h1">
                          Tokenomics
                          <i class="fa-solid fa-circle-info" 
                            data-bs-toggle="tooltip" 
                            data-bs-placement="top" 
                            title="Analyse the supply and distribution of the token; any inflationary/deflationary mechanisms; and any incentive structures, to ensure sustainability and fair distribution"></i>
                        </h3>

                        <!-- heading -->
                        <h3 class="taco-report-explorer__report-heading
                                  taco-report-explorer__report-heading--h1"
                            style="font-weight: 600;">
                          GLDT
                        </h3>

                        <!-- unordered list -->
                        <ul>

                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              Total Supply: 702,800
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              Circulating Supply: 702,800
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              Burn per transaction: 0.1 GLDT, currently $0.11
                            </p>
                            
                          </li>

                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              In a scenario where there are 10 trusted tokens and the portfolio is trading at a 7 minute interval, TACO DAO would be losing approximately $824.9 a year to GLDT burn per transaction fees.
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              Holders:
                            </p>

                            <!-- unordered list -->
                            <ul style="list-style-type: disc">

                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Top - 34.27% (ICPSwap ckUSDT Pool)
                                </p>

                              </li>

                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Second - 15.42% (Kongswap)
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Third - 11.92%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Mean of Top 25 - 3.7668%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Median of Top 25 - 0.88%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Mode of Top 25 - 1.42%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Top 25 Total - 94.17%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Mean of Top 100 - 0.991%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Median of Top 100 - 0.06%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Mode of Top 100 - 0.02%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Top 100 Total - 99.1%
                                </p>
                                
                              </li>                          

                            </ul>
                            
                          </li>                      

                        </ul>

                        <!-- heading -->
                        <h3 class="taco-report-explorer__report-heading
                                  taco-report-explorer__report-heading--h1"
                            style="font-weight: 600;">
                          GOLDAO
                        </h3>

                        <!-- unordered list -->
                        <ul>

                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              Total Supply: 992,916,862
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              Circulating Supply: 707,592,233
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              Burn per transaction: 0.0001 GOLDAO, currently $0.00000248
                            </p>
                            
                          </li>

                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              In a scenario where there are 10 trusted tokens and the portfolio is trading at a 7 minute interval, TACO DAO would be losing approximately $0.018 a year to GOLDAO burn per transaction fees.
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              Holders:
                            </p>

                            <!-- unordered list -->
                            <ul style="list-style-type: disc">

                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Top - 28.73% (Treasury)
                                </p>

                              </li>

                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Second - 26.06%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Third - 0.99%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Mean of Top 25 - 2.5048%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Median of Top 25 - 0.3%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Mode of Top 25 - 0.3%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Top 25 Total - 62.62%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Mean of Top 100 - 0.8063%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Median of Top 100 - 0.25%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Mode of Top 100 - 0.25%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Top 100 Total - 80.63%
                                </p>
                                
                              </li>                          

                            </ul>
                            
                          </li>                      

                        </ul>      
                        
                        <!-- paragraph -->
                        <p>
                          <a href="https://docs.gold-dao.org/tokenomics/burning-mechanisms" target="_blank">Gold DAO uses a minting system whereby exactly 40 million new tokens are minted per year as voting rewards</a>. <a href="https://docs.gold-dao.org/how-to/receive-rewards/rewards-calculation" target="_blank">This figure will be halved every four years</a>. 33% of the rewards from the Gold DAO ICP neurons are used to buy GOLDAO tokens on ICPSwap and subsequently burn them. GLDT TX and swap fees are also used to buyback and burn GOLDAO tokens. This means that, while supply may be increasing at a fixed rate, depending on the number of transactions, the yields from the ICP neurons, and the price of GOLDAO to ICP, the supply may be deflationary.
                        </p>

                      </div>

                      <!-- section 2 -->
                      <div>

                        <!-- heading -->
                        <h3 class="taco-report-explorer__report-heading
                                  taco-report-explorer__report-heading--h1">
                          Market Metrics
                          <i class="fa-solid fa-circle-info" 
                            data-bs-toggle="tooltip" 
                            data-bs-placement="top" 
                            title="Review key indicators such as trading volume and historical market performance."></i>
                        </h3>

                        <!-- heading -->
                        <h3 class="taco-report-explorer__report-heading
                                  taco-report-explorer__report-heading--h1">
                          GLDT
                        </h3>

                        <!-- unordered list -->
                        <ul>

                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              All Time High (USD): 1.1359
                            </p>
                            
                          </li>

                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              All Time High (ICP): 0.2448
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              All Time Low (USD): 0.859
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              All Time Low (ICP): 0.0612
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              As of 11/07/25(USD): 1.1196
                            </p>
                            
                          </li>                      

                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              As of 11/07/25 (ICP): 0.2034
                            </p>

                          </li>

                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              Change from ATH USD: -1.43499%
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              Change from ATL USD: 30.3376%
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              USD Volume 24H as of 11/07/25: 7674
                            </p>
                            
                          </li>

                        </ul>

                        <!-- heading -->
                        <h3 class="taco-report-explorer__report-heading
                                  taco-report-explorer__report-heading--h1">
                          GOLDAO
                        </h3>

                        <!-- unordered list -->
                        <ul>

                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              All Time High (USD): 0.0986
                            </p>
                            
                          </li>

                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              All Time High (ICP): 0.0069
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              All Time Low (USD): 0.0135
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              All Time Low (ICP): 0.0024
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              As of 11/07/25(USD): 0.0249
                            </p>
                            
                          </li>                      

                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              As of 11/07/25 (ICP): 0.0045
                            </p>

                          </li>

                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              Change from ATH USD: -74.746%
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              Change from ATL USD: 84.44%
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              USD Volume 24H as of 11/07/25: 8339
                            </p>
                            
                          </li>

                        </ul>

                      </div>

                      <!-- section 3 -->
                      <div>

                        <!-- heading -->
                        <h3 class="taco-report-explorer__report-heading
                                  taco-report-explorer__report-heading--h1">
                          Liquidity
                        </h3>

                        <!-- paragraph -->
                        <p>
                          As per <a href="https://swaprunner.com" target="_blank">SwapRunner</a> on the 11th of July 2025, a single transaction of:
                        </p>

                        <!-- unordered list -->
                        <ul>

                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              20000 ICP ($110399.99) will result in a trade to 3162888.48 GOLDAO ($78452.98). 28.938% lost to price impact
                            </p>
                            
                          </li>

                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              10000 ICP ($55199.99) will result in a trade to 1768943.80 GOLDAO ($43877.27). 20.512% lost to price impact
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              1000 ICP ($5519.99) will result in a trade to 214579.91 GOLDAO ($5322.49). 3.578% lost to price impact
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              250 ICP ($1380) will result in a trade to 54978 GOLDAO ($1363.71). 1.18% lost to price impact
                            </p>
                            
                          </li>

                        </ul>

                        <!-- paragraph -->
                        <p>
                          As per <a href="https://swaprunner.com" target="_blank">SwapRunner</a> on the 11th of July 2025, a single transaction of:
                        </p>

                        <!-- unordered list -->
                        <ul>

                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              20000 ICP ($110399.99) will result in a trade to 37115.39 GLDT ($41750.74). 62.182% lost to price impact
                            </p>
                            
                          </li>

                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              10000 ICP ($55199.99) will result in a trade to 27504.96 GLDT ($30940.05). 43.949% lost to price impact
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              1000 ICP ($5519.99) will result in a trade to 4602.07 GLDT ($5176.82). 6.217% lost to price impact
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              250 ICP ($1380) will result in a trade to 1205.55 GLDT ($1356.11). 1.731% lost to price impact
                            </p>
                            
                          </li>

                        </ul>

                      </div>                      

                    </div>

                    <hr>

                    <!-- headings -->
                    <h3 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h1">
                      Competitors
                      <i class="fa-solid fa-circle-info" 
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Identify similar projects and assess the token's differentiators alongside the perceived competitive positioning within its niche"></i>
                    </h3>

                    <!-- paragraph -->
                    <p>
                      GLDT competes with other tokens pegged to the price of gold, such as Paxos, but all of these tokens will have a near identical value, based on whatever measurement of gold they are backed by. As the price will largely be the same and the difference in gains is minute between the gold standards, the reasons as to why someone would choose GLDT over another gold token depend heavily on the infrastructure. Competitors like Paxos utilize the Ethereum blockchain, which has higher fees and lower speeds than the ICP blockchain. Additionally, policies come from a centralized company with Paxos (Paxos Trust Company LLC); with Gold DAO decisions should be democratic. Ergo, interfacing with the ICP ecosystem would be the main reason one would choose GLDT over other gold coins. By being built on the ICP blockchain, GLDT can take advantage of the cross-chain capabilities of ICP.
                    </p>
                    
                    <!-- paragraph -->
                    <p>
                      Several USD stablecoins exist across numerous blockchains, with two main methods of backing existing:
                    </p>  

                    <!-- paragraph -->
                    <p>
                      One is being backed by fiat USD or other non crypto assets. This method is employed by large stablecoins such as USDT and USDC. In 2025, Tether reported that USDT was backed over 90% by cash or cash assets such as treasury bonds, with the remainder being a mix of bitcoin, precious metals, and other investments. What constitutes 'other investments' is unknown because Tether has never allowed a full audit.
                    </p>  

                    <!-- paragraph -->
                    <p>
                      The other option is to be backed by some form of cryptocurrency related securities. Tokens such as Dai over-collateralize with a vast array of cryptocurrencies, and, similar to USDG, automatically liquidate at a certain ratio of collateral to USD. In Dai's case, <a href="https://blockapps.net/blog/understanding-the-dai-liquidation-process-steps-risks-and-strategies-to-avoid-liquidation/" target="_blank">it is 124%</a>. The ratio is likely much higher than 100% (and USDG's 110%) to account for the sudden and vast drops in price often seen with volatile cryptocurrencies.
                    </p>  

                    <!-- paragraph -->
                    <p>
                      The choice of USDG to be backed by gold enables a stablecoin that utilises a backing asset not subject to vast sways of volatility, while also not being subject to inflationary pressures often seen on 'stable' fiat.
                    </p>  

                    <hr>
                   
                    <!-- heading -->
                    <h3 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h1">
                      Security Risks
                      <i class="fa-solid fa-circle-info" 
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Investigate perceived vulnerabilities, any audit reports, and adherence to security and regulatory standards"></i>
                    </h3> 
                    
                    <!-- paragraph -->
                    <p>
                      GLDT <a href="https://github.com/VibraniumAudits/VibraniumAudits-GoldDAO/blob/main/Vibranium-Audit-for-GLDT.pdf" target="_blank">was audited by Vibranium Audits</a> in October 2024 and a total of nine vulnerabilities were perceived, one of which was considered 'high' in severity. This high severity issue was surrounding the potential for an error to overload the system should it be continuous. To our knowledge, there exists no update on whether the nine vulnerabilities have been resolved since October 2024.
                    </p>

                    <!-- paragraph -->
                    <p>
                      Origyn NFT <a href="https://cdn.prod.website-files.com/64215e127d1ff32f211b42d7/66d45b10112e7670b3a3e4e9_Vibranium-Audit-for-Origyn-Revised.pdf" target="_blank">was audited by Vibranium Audits</a>. The audit had two High Severity findings that were resolved, one Low Severity finding that was acknowledged, and three Informational findings that were acknowledged.
                    </p>

                    <!-- paragraph -->
                    <p>
                      <a href="https://help.bity.com/en/articles/9680075-where-are-gold-bars-stored" target="_blank">The gold bars are fully insured</a>, which means that even if the existence of the physical gold is compromised (such as through robbery), they are still backed by the highest echelons of the Swiss financial and legal systems.
                    </p>

                    <!-- paragraph -->
                    <p>
                      The implications of a 51% attack on GOLDAO are unknown, as the canister that controls the minting right for GLDT <a href="https://docs.gold-dao.org/gold-dao-whitepaper/tokenomics/ownership" target="_blank">is in turn controlled by the GOLDAO SNS</a>. A 51-percenter may impact the methods by which GLDT is minted, ruining the chain-of-supply between USDG, GLDT, and GLD NFT.
                    </p>
                    
                    <!-- back to top link -->
                    <a href="#" @click.prevent="scrollToTop" class="taco-report-explorer__report-link text-center w-100 d-inline-block mt-2">Back to top</a>
                    
                  </div>

                  <!-- report footer -->
                  <div class="taco-report-explorer__report-footer">
                    
                    <!-- left -->
                    <div class="taco-report-explorer__report-footer__left">
                      
                      ❤️🌮
                      
                    </div>
                    
                    <!-- center -->
                    <div class="taco-report-explorer__report-footer__center text-center">
                      
                      &copy;2025 Taco Dao
                      
                    </div>
                    
                    <!-- right -->
                    <div class="taco-report-explorer__report-footer__right">                    
                      
                      <!-- link group -->
                      <span class="d-flex flex-column align-items-end">

                        <span class="text-end">#81 Add Token</span>

                        <span class="d-flex gap-2">

                          <a href="https://nns.ic0.app/proposal/?u=lacdn-3iaaa-aaaaq-aae3a-cai&proposal=81" class="taco-text-blue-to-light-blue text-end" target="_blank">NNS</a>                        

                          <a href="https://tacodao.com/chat/forum/81" class="taco-text-blue-to-light-blue text-end">Taco Forum</a>

                        </span>
                        
                      </span>  
                      
                      <!-- link group -->
                      <span class="d-flex flex-column align-items-end">

                        <span class="text-end">#53 Motion to Discuss</span>

                        <span class="d-flex gap-2">

                          <a href="https://nns.ic0.app/proposal/?u=lacdn-3iaaa-aaaaq-aae3a-cai&proposal=53" class="taco-text-blue-to-light-blue text-end" target="_blank">NNS</a>                        

                          <a href="https://tacodao.com/chat/forum/53" class="taco-text-blue-to-light-blue text-end">Taco Forum</a>

                        </span>
                        
                      </span>  

                      <!-- link group -->
                      <span class="d-flex flex-column align-items-end">

                        <span class="text-end">#25 Motion to Research</span>

                        <span class="d-flex gap-2">

                          <a href="https://nns.ic0.app/proposal/?u=lacdn-3iaaa-aaaaq-aae3a-cai&proposal=25" class="taco-text-blue-to-light-blue text-end" target="_blank">NNS</a>                        

                          <a href="https://tacodao.com/chat/forum/25" class="taco-text-blue-to-light-blue text-end">Taco Forum</a>

                        </span>
                        
                      </span>  
                      
                    </div>
                    
                  </div>

                </div>
                
              </div>
              
              <!-- wrapped gold dao dd report -->
              <div v-if="reportId === 5" class="taco-report-explorer__report-container">

                <!-- inner -->
                <div class="taco-report-explorer__report-container__inner">
                
                  <!-- report header -->
                  <div class="taco-report-explorer__report-header">
                    
                    <!-- report title -->
                    <h2 class="taco-report-explorer__report-header__title">DUE DILIGENCE PROCESS GLDT Wrapper (sGLDT)</h2>

                    <!-- report metadata continer -->
                    <div class="taco-report-explorer__report-header__metadata-container">

                      <!-- report metadata -->
                      <span class="taco-report-explorer__report-header__metadata">
                        <i class="fa-solid fa-luchador-mask"></i> 
                        <span> Written by </span>
                        <span>TrickyVik</span>
                        <span class="small"> 07/2025</span>
                      </span>

                    </div>        
                    
                  </div>

                  <!-- report body -->
                  <div class="taco-report-explorer__report-body">
                    
                    <!-- heading -->
                    <h3 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h1">
                      Team Background
                      <i class="fa-solid fa-circle-info" 
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Assess the founding team's transparency, credibility, experience, and any past contributions to the ICP ecosystem"></i>
                    </h3>
                    
                    <!-- paragraph -->
                    <p>
                      sGLDT was devved up by Bitcorn Labs, a loose conglomerate of anon devs with an extensive history of contributions to the ICP ecosystem. They are closely affiliated with the Sneed DAO. Some of their contributions include:
                    </p>

                    <!-- unordered list -->
                    <ul>
                      
                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Migrating tokens through dip20, icrc1, and icrc2 token standards
                        </p>

                      </li>
                      
                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Helping create an early indexer of ICRC tokens and produce token transaction URLs in a format needed to list on websites like OpenChat
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Helping to add Sneed to OpenChat, which was the first token to be used for tipping
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Creating a webpage that shows locked tokens for SneedLock, which locks tokens and liquidity pool positions for predefined durations
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Creating a service that automatically creates DAO proposals to top up cycles when cycle balances are low
                        </p>

                      </li>

                    </ul>

                    <hr>

                    <!-- heading -->
                    <h3 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h1">
                      Token Utility
                      <i class="fa-solid fa-circle-info" 
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Examine the token's purpose and functionality within its ecosystem to ensure it provides tangible value and practical use cases"></i>
                    </h3>  
                    
                    <!-- paragraph -->
                    <p>
                      <a href="https://docs.gold-dao.org/gold-dao-whitepaper/the-ecosystem/products/gold-token-gldt" target="_blank">The Gold Token or GLDT is a fungible token backed by GLD NFTs</a>. 1 GLDT represents 0.01g of gold. GLDT has a burn per transaction of 0.1 GLDT, currently $0.11, making it unsuitable for high frequency trading.
                    </p>

                    <!-- paragraph -->
                    <p>
                      sGLDT is a low fee wrapper of GLDT, bringing the tx fee down to 0.00001. Each sGLDT is backed 1:1 with GLDT and readily-convertible. sGLDT is suitable for high frequency trading
                    </p>
                    
                    <hr>

                    <!-- heading -->
                    <h3 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h1">
                      Ecosystem Alignment
                      <i class="fa-solid fa-circle-info" 
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Evaluate the token's synergy with other ICP projects, including any existing collaborations and suitability for inclusion in the Salsa Season rewards program."></i>
                    </h3>  

                    <!-- paragraph -->
                    <p>
                      GLDT tx fees are used to buyback and burn GOLDAO tokens. sGLDT takes this source of burning from GOLDAO, which could be interpreted as negatively impacting it.
                    </p>
                    
                    <!-- paragraph -->
                    <p>
                      If TACO DAO included GLDT in its portfolio, in a scenario where there are 10 trusted tokens and the portfolio is trading at a 7 minute interval, TACO DAO would be losing approximately $824.9 a year to GLDT burn per transaction fees. By including sGLDT in the portfolio instead, TACO DAO would save on this loss while getting the same exposure to gold.
                    </p>

                    <hr>

                    <!-- heading -->
                    <h3 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h1">
                      Technology
                      <i class="fa-solid fa-circle-info" 
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Review the project's technical foundation, focusing on code quality, scalability, and how effectively it leverages ICP's capabilities"></i>
                    </h3>  

                    <!-- paragraph -->
                    <p>
                      The sGLDT canister (sVAULT) is a novel icrc1234 implementation serving as an icrc1/icrc2 ledger and a converter. The converter consists of the wrap and unwrap methods. The Sneed DAO is the controller of this canister.
                    </p>
                    
                    <!-- paragraph -->
                    <p>
                      The wrap method mints sGLDT when it approves that it has received GLDT, and sends that GLDT to the sVAULT. This incurs two GLDT tx fees, and no sGLDT fee (because the canister is both ledger and converter).
                    </p>

                    <!-- paragraph -->
                    <p>
                      The unwrap method burns sGLDT when it approves that it has received sGLDT, and sends the corresponding GLDT to the burner. This incurs a fee of 0.2 sGLDT and one GLDT tx fee.
                    </p>

                    <!-- paragraph -->
                    <p>
                      Unwrap and sGLDT tx fees are split 50/50 between the sVAULT team and the Sneed DAO treasury.
                    </p>                    
                    
                    <hr>

                    <!-- heading -->
                    <h3 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h1">
                      Tokenomics
                      <i class="fa-solid fa-circle-info" 
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Analyse the supply and distribution of the token; any inflationary/deflationary mechanisms; and any incentive structures, to ensure sustainability and fair distribution"></i>
                    </h3>

                    <!-- paragraph -->
                    <p>
                      It is a new, wrapped version of GLDT. <a href="https://tacodao.com/reports/ddgolddao">Refer to Gold DAO's DD report for GLDT's market metrics</a>.
                    </p>
                    
                    <!-- paragraph -->
                    <p>
                      As of 22/07/2025, <a href="https://svault.app" target="_blank">there is a total of 8751.77749903 GLDT in the sVAULT</a>, which is equivalent to the supply of sGLDT.
                    </p>                   

                    <hr>

                    <!-- heading -->
                    <h3 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h1">
                      Market Metrics
                      <i class="fa-solid fa-circle-info" 
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Review key indicators such as trading volume and historical market performance."></i>
                    </h3>

                    <!-- paragraph -->
                    <p>
                      It is a new, wrapped version of GLDT. <a href="https://tacodao.com/reports/ddgolddao">Refer to Gold DAO's DD report for GLDT's market metrics</a>.
                    </p>

                    <!-- heading -->
                    <h3 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h2 mt-4">
                      Liquidity:
                    </h3>

                    <!-- paragraph -->
                    <p>
                      As per <a href="https://swaprunner.com/" target="_blank">SwapRunner</a> on the 22nd of July, a single transaction of:
                    </p>

                    <!-- unordered list -->
                    <ul>
                      <li>
                        <p>10 ICP ($59.19) will result in a trade to 52.71 sGLDT ($58.08). 1.87% lost to price impact</p>
                      </li>
                    </ul> 

                    <!-- paragraph -->
                    <p>
                      The price of sGLDT can be expected to be pegged to GLDT because of the incentive of arbitrage, and GLDT is a stablecoin. Therefore, sGLDT's liquidity should not be seen as a concern for TACO DAO's trading operations.
                    </p>

                    <!-- heading -->
                    <h3 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h1">
                      Security Risks
                      <i class="fa-solid fa-circle-info" 
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Investigate perceived vulnerabilities, any audit reports, and adherence to security and regulatory standards"></i>
                    </h3>                    

                    <!-- paragraph -->
                    <p>
                      <a href="https://tacodao.com/reports/ddgolddao">Refer to Gold DAO's DD report for security risks on GLDT</a>.
                    </p>

                    <!-- paragraph -->
                    <p>
                      The sVAULT team claims to have had their code pen tested, with no issues found. Snassy gives it a thumbs up.
                    </p>
                    
                    <!-- paragraph -->
                    <p>
                      The same code was used for rebob.fun and dragonwizards.club, which have been running for over 10 months without issues.
                    </p>
                    
                    <!-- paragraph -->
                    <p>
                      A 66% vote in the Sneed DAO would be required to take the GLDT in the sVAULT.
                    </p>                    
                    
                    <!-- back to top link -->
                    <a href="#" @click.prevent="scrollToTop" class="taco-report-explorer__report-link text-center w-100 d-inline-block mt-2">Back to top</a>
                    
                  </div>

                  <!-- report footer -->
                  <div class="taco-report-explorer__report-footer">
                    
                    <!-- left -->
                    <div class="taco-report-explorer__report-footer__left">
                      
                      ❤️🌮
                      
                    </div>
                    
                    <!-- center -->
                    <div class="taco-report-explorer__report-footer__center text-center">
                      
                      &copy;2025 Taco Dao
                      
                    </div>
                    
                    <!-- right -->
                    <div class="taco-report-explorer__report-footer__right">       
                      
                      <!-- link group -->
                      <span class="d-flex flex-column align-items-end">

                        <span class="text-end">#65 Add Token</span>

                        <span class="d-flex gap-2">

                          <a href="https://nns.ic0.app/proposal/?u=lacdn-3iaaa-aaaaq-aae3a-cai&proposal=65" class="taco-text-blue-to-light-blue text-end" target="_blank">NNS</a>                        

                          <a href="https://tacodao.com/chat/forum/65" class="taco-text-blue-to-light-blue text-end">Taco Forum</a>

                        </span>
                        
                      </span>                      
                      
                      <!-- link group -->
                      <span class="d-flex flex-column align-items-end">

                        <span class="text-end">#56 Motion to Research</span>

                        <span class="d-flex gap-2">

                          <a href="https://nns.ic0.app/proposal/?u=lacdn-3iaaa-aaaaq-aae3a-cai&proposal=56" class="taco-text-blue-to-light-blue text-end" target="_blank">NNS</a>                        

                          <a href="https://tacodao.com/chat/forum/56" class="taco-text-blue-to-light-blue text-end">Taco Forum</a>

                        </span>
                        
                      </span>                      
                      
                    </div>
                    
                  </div>

                </div>
                
              </div>
                    
              <!-- open chat dd report -->
              <div v-if="reportId === 6" class="taco-report-explorer__report-container">

                <!-- inner -->
                <div class="taco-report-explorer__report-container__inner">
                
                  <!-- report header -->
                  <div class="taco-report-explorer__report-header">
                    
                    <!-- report title -->
                    <h2 class="taco-report-explorer__report-header__title">DUE DILIGENCE PROCESS OpenChat (CHAT)</h2>

                    <!-- report metadata continer -->
                    <div class="taco-report-explorer__report-header__metadata-container">

                      <!-- report metadata -->
                      <span class="taco-report-explorer__report-header__metadata">
                        <i class="fa-solid fa-luchador-mask"></i> 
                        <span> Written by Tirex, manilpwn, & TrickyVik</span>
                        <span class="small"> 07/2025</span>
                      </span>

                    </div>        
                    
                  </div>

                  <!-- report body -->
                  <div class="taco-report-explorer__report-body">
                    
                    <!-- heading -->
                    <h3 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h1">
                      Team Background
                      <i class="fa-solid fa-circle-info" 
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Assess the founding team's transparency, credibility, experience, and any past contributions to the ICP ecosystem"></i>
                    </h3>
                    
                    <!-- paragraph -->
                    <p>
                      OpenChat was ideated before Internet Computer's mainnet launch. DFINITY contracted software
developers <a href="https://www.linkedin.com/in/matt-grogan-99535121/" target="_blank">Matt Grogan</a> and <a href="https://www.linkedin.com/in/hamish-peebles-868251a9/?originalSubdomain=uk" target="_blank">Hamish Peebles</a> to build a dApp that would showcase the potential of the
Internet Computer, and the two chose to build an instant messaging app. The Internet Computer mainnet
launch was on May 7th, 2021, and the OpenChat test version launched June 3rd, 2021. <a href="https://www.linkedin.com/in/julian-jelfs-7a68a415a/?originalSubdomain=uk" target="_blank">Julian Jelfs</a> joined
the team as a frontend dev shortly after, enabling the original two to focus on the backend.
                    </p>

                    <!-- paragraph -->
                    <p>
                      Matt has over 25 years of software engineering experience. He has recently focused on building
microservice backends supporting a multi-tenant platform for running online travel agencies. He holds a
Master's Degree in Engineering and Computer Science from the University of Oxford.
                    </p>
                    
                    <!-- paragraph -->
                    <p>
                      Hamish has over 13 years of software engineering experience, which he transitioned into after obtaining a
Degree in Mathematics from Cambridge University. He focused primarily on high throughput, low
latency cloud-based systems and worked for Emirates where he led the design of a B2B hotel search
engine.
                    </p>
                    
                    <!-- paragraph -->
                    <p>
                      Julian has been 'dabbling' in software engineering for ~ 25 years. He has a varied industry background
consisting of defence, risk management, e-commerce, educational technology, travel, and chat. He holds a
Master's Degree in Politics, Philosophy & Economics from the University of Oxford.
                    </p>
                    
                    <!-- paragraph -->
                    <p>
                      The team, whilst contracted to DFINITY, also built the first version of the NNS dApp and won an <a href="https://x.com/dominic_w/status/1439682958047293442" target="_blank">internal
DFINITY hackathon</a> with <a href="https://github.com/open-chat-labs/priv-ic" target="_blank">PrivIC</a>, which served as inspiration for NFID. They perform regular code
reviews of new IC replica versions. OpenChat was the second SNS to be launched, SNS-1 being the first.
                    </p>
                    
                    <!-- paragraph -->
                    <p>
                      OpenChat is <a href="https://x.com/OpenChat/status/1873018431622275241" target="_blank">contracting</a> <a href="https://www.linkedin.com/in/ivanthedev/" target="_blank">Ivan Jukic</a> as a developer and <a href="https://www.linkedin.com/in/jwfriedman/" target="_blank">Jesse Friedman</a> for marketing:
                    </p>                    

                    <!-- unordered list -->
                    <ul>
                      
                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Ivan is a software engineer with over 12 years of experience. He has worked as Principal
Engineer at Emirates.
                        </p>

                      </li>
                      
                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Jesse is an internationally recognized beverage, food, hospitality, and brand building expert. He
was co-founder & brewmaster at Almanac, a widely recognized figure in the craft beer and food
space. He was contracted by DFINITY as evangelist for 1 year and 5 months
                        </p>

                      </li>

                    </ul>

                    <!-- paragraph -->
                    <p>
                      Via proposals <a href="https://dashboard.internetcomputer.org/sns/3e3x2-xyaaa-aaaaq-aaalq-cai/proposal/1780" target="_blank">1780</a>, <a href="https://dashboard.internetcomputer.org/sns/3e3x2-xyaaa-aaaaq-aaalq-cai/proposal/1837" target="_blank">1837</a>, and <a href="https://dashboard.internetcomputer.org/sns/3e3x2-xyaaa-aaaaq-aaalq-cai/proposal/1853" target="_blank">1853</a>, the team was paid a total of 58500 ICP from the treasury for work
done in Q2 2025.
                    </p>
                    
                    <!-- paragraph -->
                    <p>
                      Via proposal <a href="https://dashboard.internetcomputer.org/sns/3e3x2-xyaaa-aaaaq-aaalq-cai/proposal/1975" target="_blank">1975</a>, the team has been paid 15000 ICP from the treasury for work in Q3 2025. There will
be two more installments that will make the total value of all three installments in Q3 add up to 304000
USD.
                    </p>                    

                    <hr>

                    <!-- heading -->
                    <h3 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h1">
                      Token Utility
                      <i class="fa-solid fa-circle-info" 
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Examine the token's purpose and functionality within its ecosystem to ensure it provides tangible value and practical use cases"></i>
                    </h3>  
                    
                    <!-- paragraph -->
                    <p>
                      The CHAT token serves as the governance token for OpenChat, enabling members to submit and vote on
proposals that are implemented if approved.
                    </p>

                    <!-- paragraph -->
                    <p>
                      OpenChat is a fully featured chat application designed for mobile and desktop running entirely on the
Internet Computer. It has a community feature similar to Discord servers, which can have various
different 'channels' for people to interact in. <a href="https://x.com/OpenChat/status/1648373664872579072" target="_blank">Communities can have channels that are gated by certain
requirements to join</a>. These requirements can include the verification of locked DAO token neurons,
token balances, unique personhood, credentials, or a payment which is split equally among community
owners and from which a small % goes to the OpenChat treasury. Communities can get verified with blue ticks via proposals.
                    </p>

                    <!-- paragraph -->
                    <p>
                      <a href="https://x.com/OpenChat/status/1555600823576576001" target="_blank">SNS DAO communities can add a 'Proposals' channel</a>, which DAO members can vote from if they
hotkey their neurons to their OpenChat canister ID. Threads can be created under individual proposals to
discuss them.
                    </p>

                    <!-- paragraph -->
                    <p>
                      The dApp has many quality-of-life features and settings, such as the ability for users to customize the
look of their UI with custom colour themes and font sizes. Communities come decked out with
customisable parameters, channel descriptions, and channel rules. Profiles have usernames, display
names, bios, and profile pictures. <a href="https://x.com/OpenChat/status/1442447454985674753" target="_blank">Users of Android and iOS devices can receive push notifications</a>. Large scale
video & audio live spaces are able to be hosted, allowing communities to come together and discuss live
en masse, or allowing projects to make live presentations and answer questions.
                    </p>

                    <!-- paragraph -->
                    <p>
                      There exists a two-tier system: free users can send text messages, audio messages, images, videos, files,
gifs, reactions, and tokens. Free users can also create polls and private groups. <a href="https://x.com/OpenChat/status/1623739037029638148" target="_blank">$CHAT can be used to pay
for 'Diamond' premium features</a>. Diamond unlocks video calls, community creation, gated group
creation, <a href="https://x.com/OpenChat/status/1750920544097010089" target="_blank">p2p swaps</a>, <a href="https://x.com/OpenChat/status/1522152787022389249" target="_blank">translation of messages</a>, eligibility for airdrops & rewards, and a diamond badge.
Diamond also increases the member limit of created private groups, MB size of media messages, and MB
storage.
                    </p>

                    <!-- paragraph -->
                    <p>
                      With an iFrame, <a href="https://x.com/OpenChat/status/1695044139497214260" target="_blank">OpenChat can be embedded into dApps and accessed directly within them</a>, similar to
how YouTube videos may be embedded into other websites (news articles, etc). Currently, OpenChat does
not charge for these integrations, but may do so later as part of the chat as a service roadmap item
                    </p>

                    <!-- paragraph -->
                    <p>
                      There is a built-in wallet which users can send tokens to, withdraw tokens from, and swap with.
Alongside p2p swaps and token tipping, tokens can be used to create 'prize' messages, which other users
can claim tokens from. Prize messages can have claim restrictions, parameters such as claim period and
number of claimants, and be distributed randomly or equally to claimants. Projects pay 500 CHAT for
their token to be added to OpenChat. Native bitcoin can be deposited and withdrawn.
                    </p>

                    <!-- paragraph -->
                    <p>
                      The <a href="https://oc.app/blog/chit" target="_blank">CHIT program</a> rewards users for maintaining a daily streak of using OpenChat, using different
features, referring verified users, or through one-off opportunities created by the team. To participate,
users need to either have a <a href="https://x.com/OpenChat/status/1733040851582960055" target="_blank">lifetime diamond membership</a>, or a standard diamond membership with a
<a href="https://x.com/OpenChat/status/1817903346885259698" target="_blank">proof of unique personhood</a>, disabling farmers from making multiple accounts. There is a top 10
leaderboard of CHIT holders for the current month, previous month, and all time. In the case that users
miss days, streaks are insurable with $CHAT. While CHIT was previously used to determine $CHAT
airdrops on a quarterly basis, <a href="https://dashboard.internetcomputer.org/sns/3e3x2-xyaaa-aaaaq-aaalq-cai/proposal/1946" target="_blank">this mechanism is being retired</a>. Going forward, CHIT will be spendable
directly on OpenChat enhancements and customizations.
                    </p>

                    <!-- paragraph -->
                    <p>
                      Overall, OpenChat lives up to its claim to being fully featured and stating all of the dApp's intricacies
would bloat this section.
                    </p>

                    <!-- paragraph -->
                    <p>
                      <a href="https://oc.app/roadmap" target="_blank">Roadmap-wise</a>, the near-term focus is currently on:
                    </p>

                    <!-- unordered list -->
                    <ul>
                      
                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Integrating autonomous agents to automate tasks, provide information, or just for fun. There is
also a planned AI chat bot
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Adding end-to-end encryption to 1-1 chats, private group chats, and private channels.
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Integrating 3rd party wallets
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Enabling monetisation of communities via advertising, enabling owners to pay to boost their community in the community explorer, and decentralising community governance.
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Building native apps for iOS and Android.
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          <a href="https://x.com/OpenChat/status/1948059146995253647" target="_blank">Improving the mobile UI</a>
                        </p>

                      </li>

                    </ul>

                    <!-- paragraph -->
                    <p>
                      Long-term goals include:
                    </p>

                    <!-- unordered list -->
                    <ul>
                      
                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Integration of NFTs into wallets, verified NFT avatars, NFTs displayed on profile, and NFT gates
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Contacts/friends
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Personas/alts tied to the same account
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Integration into UTOPIA clouds
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Group and community tags
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Gallery views for images in chats
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Community event calendars
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Custom emojis and stickers
                        </p>

                      </li>

                    </ul>

                    <!-- paragraph -->
                    <p>
                      At the end of the roadmap are the following wide-scoped options that may be pursued:
                    </p>

                    <!-- unordered list -->
                    <ul>
                      
                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Liking/disliking messages and having a sort by popularity option, like Reddit
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Users following users and subscribing to feeds, like X
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          A Web3 job board, like Fiverr
                        </p>

                      </li>

                    </ul>
                    
                    <hr>

                    <!-- heading -->
                    <h3 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h1">
                      Ecosystem Alignment
                      <i class="fa-solid fa-circle-info" 
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Evaluate the token's synergy with other ICP projects, including any existing collaborations and suitability for inclusion in the Salsa Season rewards program."></i>
                    </h3>  

                    <!-- paragraph -->
                    <p>
                      OpenChat is deeply integrated into the ecosystem, as it is almost ubiquitously used by ICP-based projects
and communities. Token prizes, token tipping, gated channels, polls, proposal channels, iFrames, and live
spaces provide significant and essential utility to Web3 communities. Roadmap items such as community
decentralisation, autonomous agents, community event calendars, custom emojis, NFT integration, and
other community features will further strengthen this. Many features that are offered, or eventually will be
offered, are impossible or difficult to achieve on Web2 applications such as Discord. OpenChat's
utilisation of the ICP blockchain encourages users to further explore the ecosystem and ICP as a whole.
Certain community requirements, such as locked neurons or token balances, spur a user to do more on
ICP than just use OpenChat.
                    </p>

                    <!-- paragraph -->
                    <p>
                      OpenChat has had and maintains several collaborations:
                    </p>

                    <!-- unordered list -->
                    <ul>
                      
                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          <a href="https://x.com/OpenChat/status/1592565875789660160" target="_blank">2000 SNS-1 tokens (20% of the supply) were airdropped to early OpenChat users</a>
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Custom Windoge98 colour theme
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Exchange rates from ICPCoins
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          <a href="https://x.com/OpenFPL_DAO/status/1725067760760140217" target="_blank">Sponsored OpenFPL paying for kids' football kits</a>
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          <a href="https://x.com/OpenChat/status/1725156479135617396" target="_blank">Partnered with Modclub for content moderation</a>
                        </p>

                      </li>                      

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Integration for third party bots e.g. ELNA.ai
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          <a href="https://x.com/OpenChat/status/1817903346885259698" target="_blank">Proof of Unique Personhood via DecideAI</a>
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          <a href="https://x.com/OpenChat/status/1843917939558494695" target="_blank">ICPSwap and KongSwap as swap providers</a>
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          <a href="https://openchat.myspreadshop.com/black+lion-A66e80408031199471ee853d3?productType=812&sellable=VMQ2NqYJexSL1rLyAayj-812-7&appearance=1" target="_blank">The shop offering OpenChat merchandise has merchandise with typographic illustrations of a
lion</a>, presumably in reference to <a href="https://cecildao.org/" target="_blank">Cecil The Lion DAO</a>
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Helping other teams integrate the Eventstore Canister, developed by the OpenChat team, which is used to analyse app usage data.
                        </p>

                      </li>                      

                    </ul>    
                    
                    <!-- paragraph -->
                    <p>
                      The OpenChat team has stated that they may consider getting involved in Salsa Season down the line.
Integrating CHIT directly into Salsa Season may be a viable option. Salsa Season will have off-seasons
and active seasons to create hype around the active seasons, so projects that integrate their rewards
programs would do so in order to join in on the seasonal hype and hot-points of engagement.
                    </p>

                    <hr>

                    <!-- heading -->
                    <h3 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h1">
                      Community
                      <i class="fa-solid fa-circle-info" 
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Assess the size and engagement of the token's community to gauge long-term adoption potential"></i>
                    </h3>  

                    <!-- paragraph -->
                    <p>
                      <a href="https://tokenterminal.com/explorer/projects/openchat/metrics/all" target="_blank">According to tokenterminal</a>, as of 09/07/2025, in the last 365 days, there were 99.2k registered users
(72.4k of which were referred), 61.4k unique person proofs, 806.6k hour of usage, 6 million messages,
231.4k message tips, 898k message reactions, 89.6k video calls, 36.3k P2P swaps, a monthly average of
334 active groups, a monthly average of 948 active channels, and a monthly average of 23.7k active
users.
                    </p>

                    <!-- paragraph -->
                    <p>
                      On X, <a href="https://x.com/OpenChat" target="_blank">OpenChat has 27.9k followers</a>.
                    </p>                 
                    
                    <hr>

                    <!-- heading -->
                    <h3 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h1">
                      Technology
                      <i class="fa-solid fa-circle-info" 
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Review the project's technical foundation, focusing on code quality, scalability, and how effectively it leverages ICP's capabilities"></i>
                    </h3>  

                    <!-- paragraph -->
                    <p>
                      The SNS framework is regularly updated and vetted by the Network Nervous System (NNS) community,
which oversees the entire ICP ecosystem. This vigilance ensures the adherence of CHAT's governance
framework to the most rigorous standards of security and efficiency.
                    </p>

                    <!-- paragraph -->
                    <p>
                      <a href="https://github.com/open-chat-labs/open-chat/blob/master/architecture/doc.md#openchat-architecture" target="_blank">OpenChat is a system composed of canister smart contracts running on the Internet Computer that
provides chat functionality</a>. <a href="https://forum.dfinity.org/t/proposal-to-allow-an-openchat-principal-to-create-canisters-on-subnet-2fq7c/17437" target="_blank">While initially running on one dedicated subnet, it now spans multiple</a>.
                    </p>   

                    <!-- paragraph -->
                    <p>
                      Each user and each group is assigned their own canister. User canisters hold the user's direct chats
including messages of both parties, references to each group the user is a member of, and other relevant
data. The user's canister is also a wallet. Group canisters store and manage the group's members and
roles, text messages and group events, and other associated details. The user index canister coordinates
user canisters and the group index canister coordinates group canisters. User and group canisters are
upgraded in batches with an API call by the SNS. The user index maintains a distributed hash table for
efficient discovery and routing, allowing scalable lookups without scanning the entire user set.
                    </p>   

                    <!-- paragraph -->
                    <p>
                      Each user canister implements a custom message indexing system using stable BTrees for efficient
chronological access and search. Direct chat data is stored bidirectionally in both participants' canisters
for redundancy and fast retrieval. Group membership is tracked through linked references rather than
duplicating user data across group canisters. The platform implements custom serialization protocols
optimized for Candid encoding efficiency, reducing storage overhead compared to standard JSON
approaches.
                    </p>   

                    <!-- paragraph -->
                    <p>
                      The per-entity canister model brings significant benefits but also introduces scaling challenges. Pros
include scalability of data and processing, straightforward access control, and having each canister
function as a wallet with a stable on-chain identity. The trade-offs include the need for each canister to
maintain a minimum cycle buffer and the fact that upgrades across many canisters are costly and slow.
Since genesis, <a href="https://x.com/OpenChat/status/1867622369537536337" target="_blank">many cycle-saving optimisations have been made</a>.
                    </p>   

                    <!-- paragraph -->
                    <p>
                      OpenStorage is a scalable file storage system consisting of an index canister and dynamically created
bucket canisters that hold file data such as images and videos. Once a bucket is full it becomes read-only,
and a new bucket is created. Duplicate files are only stored once, making the forwarding of file messages
cheap and quick. Each file has an owner and a set of accessors - principals who are permitted to view the
file. Users are given a storage allowance of 0.1GB if they've verified unique personhood, or 1GB if
they've paid for diamond.
                    </p>   

                    <!-- paragraph -->
                    <p>
                      The assets canister serves the static assets for the web app. Each HTTP GET request from the browser to
the assets canister is intercepted by the service worker, which uses the IC public key to verify the
signature of each asset and prove it has not been served by a malicious node and tampered with, before
returning the HTTP GET response.
                    </p>   

                    <!-- paragraph -->
                    <p>
                      The cycles dispenser canister is responsible for topping up other canisters when they are running low,
using predictive refilling algorithms based on usage patterns rather than reactive top-ups. Error handling
implements circuit breaker patterns when individual canisters become unresponsive, gracefully degrading
features rather than failing entirely. The frontend implements intelligent caching of canister responses to
minimize query calls. Message batching algorithms group multiple operations into single canister calls,
reducing cycle consumption. The platform uses stable memory migration patterns that minimize upgrade
downtime.
                    </p>   

                    <!-- paragraph -->
                    <p>
                      The client library uses WebRTC to send typing indicators and message data directly between
online users' browsers. All messages are still sent through the Internet Computer to ensure
delivery, but WebRTC serves as a performance optimization. WebRTC is end-to-end encrypted
and well suited to decentralized applications but requires off-chain components. Voice and
video calls use the Daily API, coordinated via a secure bridge hosted on AWS. This integration
allows for calls while maintaining user authentication through access tokens. Push notifications
also rely on off-chain components.
                    </p>   

                    <!-- paragraph -->
                    <p>
                      Users can sign in directly with passkeys or with other auth providers such as Internet Identity, NFID, email, Ethereum, Solana, Google, etc.
                    </p>
                    
                    <!-- paragraph -->
                    <p>
                      OpenChat data is recorded and transmitted to UserGeek and Token Terminal to collect and
analyse user app usage data, preserving user privacy through local anonymization before
transmission.
                    </p>                      
                    
                    <hr>

                    <!-- anon container -->
                    <div class="d-flex flex-wrap" style="gap: 1rem 3rem;">

                      <!-- left -->
                      <div>

                        <!-- heading -->
                        <h3 class="taco-report-explorer__report-heading
                                  taco-report-explorer__report-heading--h1">
                          Tokenomics
                          <i class="fa-solid fa-circle-info" 
                            data-bs-toggle="tooltip" 
                            data-bs-placement="top" 
                            title="Analyse the supply and distribution of the token; any inflationary/deflationary mechanisms; and any incentive structures, to ensure sustainability and fair distribution"></i>
                        </h3>

                        <!-- unordered list -->
                        <ul>

                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              Total Supply: 105,385,697
                            </p>
                            
                          </li>

                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>

                              <!-- link -->
                              <a href="https://app.sneeddao.com/sneedlock" target="_blank">
                                Circulating Supply: 57,039,847
                              </a>

                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              Burn per transaction: 0.001 CHAT, currently $0.0001405
                            </p>
                            
                          </li>

                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              In a scenario where there are 10 trusted tokens and the portfolio is trading at a 7 minute interval, TACO
DAO would be losing approximately $1.0198 a year to CHAT burn per transaction fees
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              Holders:
                            </p>

                            <!-- unordered list -->
                            <ul style="list-style-type: disc">

                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Top - 47.55% (Treasury)
                                </p>

                              </li>

                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Second - 1.96%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Third - 1.96%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Mean of Top 25 - 3.0104%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Median of Top 25 - 0.98%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Mode of Top 25 - 0.98%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Top 25 Total - 75.26%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Mean of Top 100 - 0.8675%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Median of Top 100 - 0.17%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Mode of Top 100 - 0.04%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Top 100 Total - 86.75%
                                </p>
                                
                              </li>                          

                            </ul>
                            
                          </li>                      

                        </ul>

                        <!-- paragraph -->
                        <p>
                          Inflationary mechanisms do exist in the forms of APY from staking rewards. For a 182 day old neuron
with a 1 year dissolve delay, a staker will earn 6.25% APY.
                        </p>

                      </div>

                      <!-- center -->
                      <div>

                        <!-- heading -->
                        <h3 class="taco-report-explorer__report-heading
                                  taco-report-explorer__report-heading--h1">
                          Market Metrics
                          <i class="fa-solid fa-circle-info" 
                            data-bs-toggle="tooltip" 
                            data-bs-placement="top" 
                            title="Review key indicators such as trading volume and historical market performance."></i>
                        </h3>

                        <!-- unordered list -->
                        <ul>

                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              All Time High (USD): 1.06
                            </p>
                            
                          </li>

                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              All Time Low (USD): 0.1156
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              As of 15/07/25(USD): 0.1405
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              As of 15/07/25 (ICP): 0.026461129 ICP
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              Change from ATH USD: -86.745%
                            </p>
                            
                          </li>                      

                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              Change from ATL USD: 21.54%
                            </p>

                          </li>

                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              USD Volume 24H as of 15/07/25: 3754
                            </p>
                            
                          </li>

                        </ul> 

                      </div>

                      <!-- right -->
                      <div>

                        <!-- heading -->
                        <h3 class="taco-report-explorer__report-heading
                                  taco-report-explorer__report-heading--h1">
                          Liquidity
                        </h3>

                        <!-- paragraph -->
                        <p>
                          As per <a href="https://swaprunner.com" target="_blank">SwapRunner</a> on the 15th of July 2025, a single transaction of:
                        </p>

                        <!-- unordered list -->
                        <ul>

                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              20000 ICP ($106159.43) will result in a trade to 530230.092 CHAT ($72069.34). 32.112% lost to
price impact
                            </p>
                            
                          </li>

                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              10000 ICP ($53079.71) will result in a trade to 303487.11 CHAT ($42967.34). 19.051% lost to
price impact
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              1000 ICP ($5307.97) will result in a trade to 36347.55 CHAT ($5146.04). 3.051% lost to price
impact
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              250 ICP ($1326.99) will result in a trade to 9279.21 CHAT ($1313.74) 0.999% lost to price
impact
                            </p>
                            
                          </li>

                        </ul>

                        <!-- paragraph -->
                        <p>
                          As can be seen, liquidity for CHAT remains limited. If liquidity is not recycled, and there are no 'sells' between the DAO's 'buys', the effective slippage rate will be identical regardless of whether multiple small transactions or one large one take place.
                        </p>

                      </div>                      

                    </div>

                    <hr>

                    <!-- headings -->
                    <h3 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h1">
                      Competitors
                      <i class="fa-solid fa-circle-info" 
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Identify similar projects and assess the token's differentiators alongside the perceived competitive positioning within its niche"></i>
                    </h3>

                    <h4 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h2 mt-4">
                      Web2
                    </h4>

                    <!-- paragraph -->
                    <p>
                      Telegram and WhatsApp are client-server messaging systems where individuals can engage in private
one-on-one chats, participate in groups, or receive updates via channels or broadcasts. Both platforms are
owned by private entities: WhatsApp by Meta Platforms Inc., and Telegram by Pavel Durov through
companies registered in the British Virgin Islands. WhatsApp provides end-to-end encryption (E2EE) by
default, <a href="https://www.kaspersky.com/resource-center/preemptive-safety/messaging-app-security" target="_blank">while Telegram uses client-server encryption for standard chats and requires users to initiate a
"Secret Chat" for E2EE</a>. As a result, neither company can access or read E2EE content or hand it over to
authorities—even under pressure—though WhatsApp's security has been undermined by zero-day
exploits, <a href="https://cybersecuritynews.com/paragon-spyware-exploited-whatsapp-zero-day-vulnerability/" target="_blank">such as one by NSO Group's Pegasus spyware (tied to the Israeli government-linked firm)</a>,
which infected devices of politically exposed individuals without breaking E2EE directly. Telegram's
default chats can be accessed by the company, hackers, or authorities via court orders or force. <a href="https://www.themoscowtimes.com/2017/05/16/russian-messenger-telegram-pledges-to-keep-data-safe-amid-rumored-government-pressure-a58006" target="_blank">While
Telegram resisted Russian demands to expose dissidents in the past</a>, it has updated its policy to disclose
user metadata (like IP addresses and phone numbers) for suspected criminals or terrorists, <a href="https://techcrunch.com/2025/01/07/telegram-reports-spike-in-sharing-user-data-with-law-enforcement/" target="_blank">and has done so
thousands of times in recent years</a>, including to U.S., European, and other authorities—contrary to earlier
claims of zero compliance. Similar privacy-oriented apps like Signal (centralized with default E2EE) and
Keet (fully P2P with E2EE) face comparable risks of metadata exposure or device-level exploits, despite
their non-profit or decentralized designs.
                    </p>

                    <!-- paragraph -->
                    <p>
                      OpenChat differs from these four because it is aiming to be fully on-chain, and is wholly DAO-governed.
Being on-chain means its code and data are replicated across a decentralized network of nodes, making it
tamperproof and resistant to pressure from centralized entities. Its code is open-source, and any changes
have to be voted on by token holders. Consequently, compliance with legal requests would depend on
open votes by token holders rather than directives from a central entity.
                    </p>

                    <!-- paragraph -->
                    <p>
                      Discord and Slack operate on a "rooms" system of communication, where communities are created with
internal organization, allowing for the creation of different chatrooms for different topics under the
community umbrella. Within such an umbrella, private rooms may exist. In both Discord and Slack,
access to private rooms is controlled at the discretion of admins (invite-only in Slack; typically role-based
permissions in Discord). <a href="https://famoid.com/blog/who-owns-discord/" target="_blank">Discord is wholly owned by a private corporation</a>, <a href="https://brandsownedby.com/who-owns-slack/" target="_blank">while Slack is owned by a
publicly traded company</a>. Both platforms use encryption for data in transit and at rest but lack end-to-end
encryption, making them susceptible to government pressure for content access in response to legal
requests.
                    </p>

                    <!-- paragraph -->
                    <p>
                      OpenChat allows for both peer-to-peer messaging alongside the rooms system utilised on Discord and
Slack. With a planned E2EE for messaging, and a decentralised form of control, OpenChat will combine
both systems detailed above, while maintaining privacy and sovereignty.
                    </p>

                    <!-- paragraph -->
                    <p>
                      <a href="—" target="_blank">Element is a secure messaging client on the Matrix Protocol</a>, enabling users to send messages, join rooms,
or make calls. It is decentralized through federation: independent homeservers interconnect using open
APIs, allowing users on different servers to chat without a central authority, similar to email - <a href="https://matrix.org/blog/2024/10/29/matrix-2.0-is-here/" target="_blank">preventing
single points of failure and enabling data sovereignty via self-hosting</a>. Like OpenChat, it is a hybrid
offering E2EE and a rooms system. Element has upper hands over OpenChat in features such as
<a href="https://matrix.org/ecosystem/bridges/" target="_blank">cross-platform bridging with external apps such as Slack and Whatsapp</a>, <a href="https://element.io/blog/end-to-end-encrypted-voice-and-video-for-self-hosted-community-users/" target="_blank">encrypted voice/video calls</a>, and
broad integrations.
                    </p>

                    <!-- paragraph -->
                    <p>
                      OpenChat edges out Element with its blockchain-based decentralization, <a href="https://anarc.at/blog/2022-06-17-matrix-notes/" target="_blank">unlike Element's
server-dependent federation vulnerable to operator trust or downtime</a>. Its DAO governance via CHAT
token holders enables community-driven decisions and self-sustaining economic incentives (revenue from
fees making up for voting rewards), and it leverages ICP's low-cost infrastructure to minimize operational
expenses. This setup potentially avoids Element's funding struggles - <a href="https://matrix.org/blog/2025/02/crossroads/" target="_blank">such as the Matrix Foundation's
2025 funding appeal to sustain bridges</a>, which risked shutdowns without donations. DAO governance can
mean eventual near-frictionless and inclusive organisation. Web3 integrations like in-app wallets, P2P
token swaps, tipping, neuron-gated channels, other current features, and other planned features, are
crypto-native use cases that Element's non-blockchain model can't replicate in a trustless manner.
                    </p> 
                    
                    <h4 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h2 mt-4">
                      Web3
                    </h4>

                    <!-- paragraph -->
                    <p>
                      <a href="https://xmtp.org/" target="_blank">XMTP is a decentralized, open-source messaging protocol designed for Web3</a>. <a href="https://status.app/" target="_blank">Status is an
Ethereum-based open-source app</a>. OpenChat, XMTP, and Status all aim for decentralized,
privacy-focused messaging in Web3, but they differ significantly in architecture, scope, and execution.
                    </p> 

                    <!-- paragraph -->
                    <p>
                      <a href="https://docs.xmtp.org/intro/faq" target="_blank">XMTP operates as a chain-agnostic protocol</a>, allowing developers to embed messaging into wallets or
dApps (<a href="https://xmtp.org/blog/coinbasewallet" target="_blank">e.g., integrations with Coinbase Wallet</a> or <a href="https://xmtp.org/blog/lens-dms-with-xmtp" target="_blank">Lens Protocol</a>). Its decentralized network of
nodes—<a href="https://xmtp.org/docs/concepts/decentralizing-xmtp" target="_blank">currently permissioned and selected by Ephemera (previously XMTP Labs) for reliability and
diversity</a>—handles message routing and storage off-chain in a peer-to-peer fashion, <a href="https://xmtp.org/docs/concepts/decentralizing-xmtp" target="_blank">with end-to-end
encryption via the Messaging Layer Security (MLS) protocol</a>. This provides perfect forward secrecy,
meaning that even if a user's long-term private keys are compromised in the future, <a href="https://docs.xmtp.org/protocol/security" target="_blank">past messages remain
secure and cannot be decrypted</a>. <a href="https://docs.xmtp.org/inboxes/user-consent/support-user-consent" target="_blank">Additionally, XMTP features spam filtering at the app level</a>. In contrast
to XMTP, which serves as a flexible backend for integrating messaging into other Web3 applications,
OpenChat operates as a complete, standalone, feature-rich chat application; a ready to use experience.
                    </p> 

                    <!-- paragraph -->
                    <p>
                      <a href="https://status.app/help/getting-started/what-is-status" target="_blank">Status combines secure messaging, a crypto wallet, communities, token-gates and dApp access</a>, achieving
privacy through P2P networking via the <a href="https://docs.waku.org/" target="_blank">Waku protocol (a scalable, privacy-focused P2P messaging
suite)</a>, E2EE, and metadata hiding. It is governed by the SNT token; this governance appears more
advisory than binding compared to ICP's SNS <a href="https://www.gate.com/learn/articles/what-is-status/667" target="_blank">[1]</a><a href="https://status.app/help/wallet/about-the-status-snt-token" target="_blank">[2]</a>. The core messaging and P2P networking occur
off-chain via the Waku protocol, relying on decentralized peers for routing and delivery rather than
blockchain consensus. In contrast, OpenChat is fully on-chain, with all messaging, data storage, and logic
executed directly within ICP's canister smart contracts for complete tamper-proof sovereignty.
                    </p> 

                    <!-- paragraph -->
                    <p>
                      SocialFi competitors exist in the ICP ecosystem, most not attempting quite the same thing as OpenChat.
                      <a href="https://medium.com/dfinity/distrikt-a-community-owned-professional-social-network-on-the-internet-computer-has-launched-12ca9642b9b9" target="_blank">Distrikt is a decentralized social media platform</a>, blending elements of Twitter and LinkedIn. <a href="https://forum.dfinity.org/t/introducing-a-decentralized-end-to-end-encrypted-messaging-app/35189" target="_blank">ICPanda
Message is a decentralized end-to-end encrypted messaging application</a>. It lacks OpenChat's extensive list
of features. The most similar ICP-based competitor is Catalyze, <a href="https://chat.catalyze.one/" target="_blank">a decentralized platform for Web3
communities and events</a>, having features such as chat, voice calls, token/NFT gated access, cross-chain
functionalities, and a rewards program. OpenChat surpasses Catalyze in adoption.
                    </p> 

                    <!-- paragraph -->
                    <p>
                      Put simply, <a href="https://learn.internetcomputer.org/hc/en-us" target="_blank">due to the inherent superpowers of the Internet Computer Protocol</a>, OpenChat has the most
features, minimal off-chain components, very low fees, very high speeds, and can be expected to be
scalable. As an instant messaging app, it may not hold the competitive edge in certain privacy aspects,
and it does not have multi-chain support. As a communication app for crypto communities, OpenChat
appears to offer much more than its few competitors.
                    </p> 

                    <h4 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h2 mt-4">
                      Profitability
                    </h4>

                    <!-- paragraph -->
                    <p>
                      Telegram generated <a href="https://resourcera.com/data/social/telegram-revenue/" target="_blank">in excess of $1 billion USD in 2024</a>, earning income from advertisements, premium
subscriptions, and in-app purchases.
                    </p> 

                    <!-- paragraph -->
                    <p>
                      In 2024, WhatsApp recorded revenue of <a href="https://www.businessofapps.com/data/whatsapp-statistics/" target="_blank">around $1.7 billion USD</a>, almost all of which was driven from its
'WhatsApp for Business' scheme which charges businesses after 1000 messages are sent in areas such as
customer service, authentication, or marketing. <a href="https://electroiq.com/stats/whatsapp-business-statistics/" target="_blank">Over three-quarters of a million users were active monthly
on WhatsApp for Business</a>.
                    </p> 

                    <!-- paragraph -->
                    <p>
                      Discord generated <a href="https://www.startupbooted.com/how-does-discord-make-money-the-hidden-truth-revealed" target="_blank">around $575 million USD in 2023</a>, with its main revenue stream being Discord Nitro -
a premium membership model - that accounted for $207 million of the 2023 earnings, or 36%. Server
boosting allows for community owners to pay for their servers to have increased quality in its features,
including video and audio quality, and this provides another form of income for the company.
                    </p> 

                    <!-- paragraph -->
                    <p>
                      Element is <a href="https://element.io/blog/synapse-now-lives-at-github-com-element-hq-synapse/" target="_blank">not a profitable company as of 2023</a>. Revenues surpassed 10 million Pound Sterling but the
company New Vector Limited, which oversees Element, <a href="https://tracxn.com/d/legal-entities/united-kingdom/new-vector-limited/__9P-jCeWRPdT-Bd1JmzmmgtJ1wU9ENSPzDzU9NeM__KM" target="_blank">recorded a loss of 12.9 million pounds</a>, with the
company spending more of its over <a href="https://tracxn.com/d/companies/element/__-CfYlwWsIKlLgg4xLqpUmf0zpi1awWpwmsDdD5pPcvM" target="_blank">$48 million worth of investments</a> than it recouped.
                    </p> 

                    <!-- paragraph -->
                    <p>
                      XMTP does not currently exist in its full release form, and thus has no ordinary revenues, but the
overseeing company Ephemera <a href="https://finance.yahoo.com/news/crypto-messaging-startup-ephemera-raises-130000835.html?guccounter=1&guce_referrer=aHR0cHM6Ly93d3cuYmluZy5jb20v&guce_referrer_sig=AQAAAIUKR7aw3qoBdbM4eWH6tdH1SdsMILToyd4sNvQMBIHqNW38R96KsjX7kUn7Su5xEddBDfullgA5QdJiJTW_2fuB5hrlrxDfYslv8hCkEIeSo1Si7XutXkZ7_C3rHhWFi4r4FtWBjKFxohI6ZZvNmi9b3UtQRWw0gkmveACDxloD" target="_blank">plans to garner a steady income via the network fees paid by developers
to use the Ephemera-owned servers</a>. From multiple rounds of investment, Ephemera reached a
post-money equity <a href="https://www.ainvest.com/news/ephemera-raises-20-million-series-funding-valuing-company-300-million-2507/" target="_blank">value of $300 million in 2025</a>.
                    </p> 

                    <!-- paragraph -->
                    <p>
                      Status is estimated by one source to have a revenue of <a href="https://growjo.com/company/StatusApp" target="_blank">just over $507,000 USD per year</a>, and drew over
                      <a href="https://tracxn.com/d/companies/status/__3VON_-ta6v5UX3TqsrlVcB2AcKCCRzFnpqKjnHsjGHE?utm_source=chatgpt.com#about-the-company" target="_blank">$100 million USD in investment in 2017</a>.
                    </p> 

                    <!-- paragraph -->
                    <p>
                      Current revenue streams for OpenChat include ICP neurons, diamond memberships, payment gated
channels, CHIT streak insurances, token listing fees, failed proposal token burns, and fees on prize
messages. Planned revenue streams include advertising on the dApp, paid community boosting,
OpenChat as a service integrated into other dApps, increased file storage, and OC enhancements
(personal themes, emoji packs, etc). Potential revenue streams include tx fees for token transfers, tx fees
fees for token swaps, and charging large private communities. The team has stated that their current focus
is on user growth over monetisation. <a href="https://tokenterminal.com/explorer/projects/openchat/metrics/all" target="_blank">According to tokenterminal</a>, OpenChat made 111k USD from
Diamond Memberships in the last 365 days.
                    </p> 

                    <!-- paragraph -->
                    <p>
                      As of the end of July, <a href="https://www.icexplorer.io/address/details/2jvtu-yqaaa-aaaaq-aaama-cai-t6mekta.d1216f443ead88f8f98a80b2ea59697726f18dffaa58d0a0156d0c605a01b672" target="_blank">the treasury of OpenChat has</a>:
                    </p>    
                    
                    <!-- list -->
                    <ul>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          <a href="https://dashboard.internetcomputer.org/account/a2200978cf15fa0d19b7c7eb75cc5d6d3ebabbacaec64a2a9a3f811277619c57" target="_blank">35,981.54 ICP</a> (liquid)
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          <a href="https://www.icexplorer.io/address/details/2jvtu-yqaaa-aaaaq-aaama-cai-t6mekta.d1216f443ead88f8f98a80b2ea59697726f18dffaa58d0a0156d0c605a01b672" target="_blank">48,343,162.39 CHAT (~$6.23M)</a>
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          <a href="https://dashboard.internetcomputer.org/neuron/17682165960669268263" target="_blank">105,113.74 ICP in an 8-year neuron</a>
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          <a href="https://dashboard.internetcomputer.org/neuron/15574844586067538603" target="_blank">300,001 ICP in a 6-month neuron</a>
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          100,000 ICP in a dissolving neuron set to unlock on 8th October 2025
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          <a href="https://dashboard.internetcomputer.org/account/6074e8a8002ffc6938dfcb50cea5ad25879cf6a2393acec6d4e9dbb683662ef3" target="_blank">9,236.86 ICP in the cycles dispenser</a>
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          38,678 ICP in WaterNeuron (34,687 nICP)
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          $1,489 in Bitmart reserved to pay for CEX listings and liquidity
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          ~$5,000 in DEX liquidity
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          A total of $172,710 distributed between CEX liquidity and Coinstore
                        </p>

                      </li>
                      
                    </ul>

                    <!-- paragraph -->
                    <p>
                      Some figures were sourced from Section 6 of proposal 1975 (created July 4th) and may be
inaccurate due to limited references and the time that has passed.
                    </p> 

                    <hr>
                   
                    <!-- heading -->
                    <h3 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h1">
                      Security Risks
                      <i class="fa-solid fa-circle-info" 
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Investigate perceived vulnerabilities, any audit reports, and adherence to security and regulatory standards"></i>
                    </h3> 
                    
                    <!-- paragraph -->
                    <p>
                      <a href="https://dashboard.internetcomputer.org/sns/3e3x2-xyaaa-aaaaq-aaalq-cai/proposal/829" target="_blank">OpenChat DAO is registered as an LLC in the Marshall Islands</a>, a jurisdiction with DAO-specific
legislation designed to limit liability for members and protect against individual prosecution. This
structure was chosen after review of multiple jurisdictions.
                    </p>

                    <!-- paragraph -->
                    <p>
                      <a href="https://x.com/OpenChat/status/1659487606541828096" target="_blank">OpenChat Labs LTD</a> was formed to handle off-chain responsibilities such as custody of the oc.app
domain and intellectual property, managing app store contracts, funding in-app voice/video calls, and
employing the core development team.
                    </p>

                    <!-- paragraph -->
                    <p>
                      The OpenChat team has claimed that they have 3 years of runway, though a community member has posited that it may in fact be 1.5 years. In our analysis:
                    </p>

                    <!-- paragraph -->
                    <p>
                      The total ICP that they hold is ~ 579, 774 ($2, 974, 242). The total ICP revenue that they are
receiving from their neurons is ~ 41, 310.82 ($211, 924). They have received 110k in fees in the
past year, though this form of revenue can be expected to taper off as it is 'low-hanging fruit' for
the existing ICP community which has not been growing. Other forms of revenue have not been
reported on.
                    </p>

                    <!-- paragraph -->
                    <p>
                      The team has been requesting ~ $1,216,000 worth of ICP a year. If adding up all funds that are
readily liquidatable within a 6-month time window, we estimate them to have a runway of ~ 2.3
years, a figure that does not consider price changes or other changes. Their 8-year neuron exists
as a fail-safe to keep the platform funded with cycles if run-way ends up running out.
                    </p>

                    <!-- button -->
                    <button @click="showOpenChatCalculations = !showOpenChatCalculations" class="btn taco-btn taco-btn--green">
                      Calculations
                    </button>

                    <div v-show="showOpenChatCalculations">

                      <!-- paragraph -->
                      <p class="taco-report-explorer__report-paragraph mt-4">
                        OpenChat's holdings:
                      </p>

                      <!-- list -->
                      <ul>

                        <!-- list item -->
                        <li>

                          <!-- paragraph -->
                          <p>
                            Liquid: 35981.54 ICP
                          </p>

                        </li>

                        <!-- list item -->
                        <li>

                          <!-- paragraph -->
                          <p>
                            Neurons, non-dissolving: 405,114.74 ICP
                          </p>

                        </li>

                        <!-- list item -->
                        <li>

                          <!-- paragraph -->
                          <p>
                            Neurons, dissolving: 100,000 ICP
                          </p>

                        </li>

                        <!-- list item -->
                        <li>

                          <!-- paragraph -->
                          <p>
                            WaterNeuron: 38,678 ICP
                          </p>

                        </li>

                        <!-- list item -->
                        <li>

                          <!-- paragraph -->
                          <p>
                            TOTAL ILLIQUID: 443,792.74 ICP = $2,276,656.76
                          </p>

                        </li>

                        <!-- list item -->
                        <li>

                          <!-- paragraph -->
                          <p>
                            SEMI-LIQUID: 100,000 ICP = $513,000
                          </p>

                        </li>

                        <!-- list item -->
                        <li>

                          <!-- paragraph -->
                          <p>
                            TOTAL: 579,774.28 ICP = $2,974,242.06
                          </p>

                        </li>
                        
                      </ul>

                      <!-- heading -->
                      <h3 class="taco-report-explorer__report-heading
                                taco-report-explorer__report-heading--h2">
                        Asset Revenue
                      </h3>

                      <!-- paragraph -->
                      <p>
                        Yearly Rewards presuming 0 yield reinvestment: ~ 41,310.82 ICP = ~$211,924.49 USD
                      </p>

                      <!-- paragraph -->
                      <p>
                        It has been stated that the 6 month is slowly being whittled away and thus the earnings from this
will only decrease over time. The 8-year neuron is said to be untouchable and will always be a
back up to keep OC running presuming all other revenue dries up.
                      </p>

                      <!-- paragraph -->
                      <p>
                        <a href="https://klgza-cqaaa-aaaak-qcz5a-cai.icp0.io/" target="_blank">Using the NNS neuron sandbox</a>, we can roughly calculate the revenue that OpenChat can earn.
                      </p>

                      <!-- paragraph -->
                      <p>
                        The following presumes that the price of ICP will remain constant at its 04.08.25 price of $5.13,
and that the minting of maturity will result in a 1:1 spawn of ICP (with it being virtually
guaranteed that neither of these things will occur). Each neuron will be presented with extreme
scenarios - full yield reinvestment, or no yield reinvestment. The likely scenario likes
somewhere between the two:
                      </p>

                      <!-- paragraph -->
                      <p>
                        <span class="fw-bold">8-year Neuron:</span> If auto-stake maturity is on, 74707.27 maturity is earned in 4 years. OpenChat
will have increased its assets (albeit illiquid) by $383,248.30, or $95812.07 per year (though
gains are not equally spread).
                      </p>

                      <!-- paragraph -->
                      <p>
                        If 100% of maturity is instantly spawned and sold off (i.e no rewards are reinvested), then
56447.84 is earned over four years. Presuming 1:1 minting with ICP, this results in $289,577.42
earned over 4 years, or $72,394.35.
                      </p>

                      <!-- paragraph -->
                      <p>
                        <span class="fw-bold">6-month Neuron:</span> If auto-staking maturity is on, the neuron earns 99035.32 maturity in 4 years,
or $508,051.1 ($127,012.80 per year), albeit wholly illiquid.
                      </p>

                      <!-- paragraph -->
                      <p>
                        If 100% of maturity is instantly spawned and sold, 85588.63 maturity in 4 years, or $439,069.67
($109,767.42 per year)
                      </p>

                      <!-- paragraph -->
                      <p>
                        <span class="fw-bold">Others:</span> 100,000 ICP will be dissolved on the 8th of October, netting the team (at current price)
$513,000. How much they plan to sell is unknown, alongside the potential ICP price.
                      </p>

                      <!-- paragraph -->
                      <p>
                        38,678 ICP in a WaterNeuron (with an APY of 15%) which results in 5801.7 ICP ($29762.72) per
year presuming no compounding, though a WaterNeuron dissolves after 6 months. Whether this
will be reinvested after dissolving is unknown.
                      </p>

                      <!-- paragraph -->
                      <p>
                        Ergo, presuming all the maturity is not reinvested and instead sold, and that the WaterNeuron
principal is reinvested and the yield sold (this scenario is the one of maximum short term
income) $211,924.49 is earned per year, roughly a sixth of what is needed to cover the yearly
running costs of OC if we extrapolate out the Q3 data from $304,000 per quarter to $1,216,000
per year.
                      </p>

                      <!-- paragraph -->
                      <p>
                        ICP needs to sextuple in price to allow for a break-even point via OC's passive income, and to
more than sextuple for OC to comfortably operate via passive income. This does not take into
account cycles, extraordinary costs, and other unforeseen windfalls.
                      </p>

                      <!-- paragraph -->
                      <p class="taco-report-explorer__report-paragraph mb-5">
                        <span class="fw-bold">TOTAL:</span> $211,924.49 per year
                      </p>

                      <!-- heading -->
                      <h3 class="taco-report-explorer__report-heading
                                taco-report-explorer__report-heading--h2">
                        NON-ASSET REVENUE
                      </h3>

                      <!-- paragraph -->
                      <p>
                        The only openly recorded revenue is the Diamond Membership which earned $110,000 in the
previous 12 months. Other forms of revenue, like streak insurance, have not been recorded
openly.
                      </p>

                      <!-- paragraph -->
                      <p class="taco-report-explorer__report-paragraph mb-5">
                        TOTAL: $110,000 per year
                      </p>

                      <!-- heading -->
                      <h3 class="taco-report-explorer__report-heading
                                taco-report-explorer__report-heading--h2">
                        HOLDINGS
                      </h3>

                      <!-- paragraph -->
                      <p>
                        The Treasury of OpenChat holds 48,343,162.39 CHAT, or roughly $6.59 million USD. However,
liquidity does not exist for this to be converted into USD at its full value. Per SwapRunner as at
04.08.25, the full amount of CHAT will convert into 19467.84 ICP, or just over $100,000 USD. The
true value of the OpenChat treasury can therefore not be considered to be reasonably more
than a few hundred thousand USD, if we take into account the possibility of liquidity recycling. A
full value dump is impossible at current.
                      </p>

                      <!-- paragraph -->
                      <p>
                        35,981.54 ICP is liquid, soon to become 135,981.53 ICP. This gives a liquid holdings value of
$697,585.25 in ICP, and one or two hundred thousand in CHAT.
                      </p>

                      <!-- paragraph -->
                      <p class="taco-report-explorer__report-paragraph mb-5">
                        TOTAL: Between $797,585.25 and $897,585.25 USD
                      </p>

                      <!-- heading -->
                      <h3 class="taco-report-explorer__report-heading
                                taco-report-explorer__report-heading--h2">
                        SUMMARY
                      </h3>

                      <!-- paragraph -->
                      <p>
                        <span class="fw-bold font-rubik">Revenue per year: $321,924.49</span>
                      </p>

                      <!-- paragraph -->
                      <p>
                        <span class="fw-bold font-rubik">Holdings: ~$845,000 liquid and semi-liquid, $2,276,656.76 illiquid</span>
                      </p>

                      <!-- paragraph -->
                      <p>
                        <span class="fw-bold font-rubik">Yearly costs: $1,216,000</span>
                      </p>

                      <!-- paragraph -->
                      <p>
                        <span class="fw-bold font-rubik">Yearly Profit: -$894,075.51</span>
                      </p>

                      <!-- paragraph -->
                      <p>
                        OpenChat, based on the openly recorded revenues and without an increase in the price of ICP,
will exhaust its liquid and semi-liquid holdings in slightly under a year. OpenChat currently relies
on membership increases and, more significantly, an increase in the price of USD, to survive
without touching its illiquid assets.
                      </p>

                      <!-- paragraph -->
                      <p>
                        <span class="fst-italic" style="font-family: 'rubik'">Presuming the 6 month neuron is dissolved, this timer extends significantly with the increase of
$1539005.13 to the holdings, but a loss of $109,767.42 to the revenue. In that scenario:</span>
                      </p>

                      <!-- paragraph -->
                      <p>
                        <span class="fw-bold font-rubik">Revenue per year: $212157.07</span>
                      </p>

                      <!-- paragraph -->
                      <p>
                        <span class="fw-bold font-rubik">Holdings: $2,384,005.13 liquid, $737.651.63 illiquid</span>
                      </p>

                      <!-- paragraph -->
                      <p>
                        <span class="fw-bold font-rubik">Year costs: $1,216,000</span>
                      </p>

                      <!-- paragraph -->
                      <p>
                        <span class="fw-bold font-rubik">Yearly profit: -$1,003,842.98</span>
                      </p>

                      <!-- paragraph -->
                      <p>
                        OpenChat will exhaust its liquid assets in just over 2.3 years.
                      </p>

                      <!-- paragraph -->
                      <p>
                        The 3 year runway claim is likely based on extra revenues not otherwise stated, or was
calculated when ICP had a different price. Ergo, OpenChat relies on the price of ICP increasing,
increased memberships, an increase in the liquidity and price of CHAT, and future development
of OpenChat.
                      </p>

                    </div>

                    <hr>
                    
                    <!-- back to top link -->
                    <a href="#" @click.prevent="scrollToTop" class="taco-report-explorer__report-link text-center w-100 d-inline-block mt-2">Back to top</a>
                    
                  </div>

                  <!-- report footer -->
                  <div class="taco-report-explorer__report-footer">
                    
                    <!-- left -->
                    <div class="taco-report-explorer__report-footer__left">
                      
                      ❤️🌮
                      
                    </div>
                    
                    <!-- center -->
                    <div class="taco-report-explorer__report-footer__center text-center">
                      
                      &copy;2025 Taco Dao
                      
                    </div>
                    
                    <!-- right -->
                    <div class="taco-report-explorer__report-footer__right">

                      <!-- link group -->
                      <span class="d-flex flex-column align-items-end">

                        <span class="text-end">#72 Add Token</span>

                        <span class="d-flex gap-2">

                          <a href="https://nns.ic0.app/proposal/?u=lacdn-3iaaa-aaaaq-aae3a-cai&proposal=72" class="taco-text-blue-to-light-blue text-end" target="_blank">NNS</a>                        

                          <a href="https://tacodao.com/chat/forum/72" class="taco-text-blue-to-light-blue text-end">Taco Forum</a>

                        </span>
                        
                      </span>

                      <!-- link group -->
                      <span class="d-flex flex-column align-items-end">

                        <span class="text-end">#71 Motion to Discuss</span>

                        <span class="d-flex gap-2">

                          <a href="https://nns.ic0.app/proposal/?u=lacdn-3iaaa-aaaaq-aae3a-cai&proposal=71" class="taco-text-blue-to-light-blue text-end" target="_blank">NNS</a>                        

                          <a href="https://tacodao.com/chat/forum/71" class="taco-text-blue-to-light-blue text-end">Taco Forum</a>

                        </span>
                        
                      </span>
                      
                      <!-- link group -->
                      <span class="d-flex flex-column align-items-end">

                        <span class="text-end">#24 Motion to Research</span>

                        <span class="d-flex gap-2">

                          <a href="https://nns.ic0.app/proposal/?u=lacdn-3iaaa-aaaaq-aae3a-cai&proposal=24" class="taco-text-blue-to-light-blue text-end" target="_blank">NNS</a>                        

                          <a href="https://tacodao.com/chat/forum/24" class="taco-text-blue-to-light-blue text-end">Taco Forum</a>

                        </span>
                        
                      </span>

                    </div>
                    
                  </div>

                </div>
                
              </div>

              <!-- kongswap dd report -->
              <div v-if="reportId === 7" class="taco-report-explorer__report-container">

                <!-- inner -->
                <div class="taco-report-explorer__report-container__inner">
                
                  <!-- report header -->
                  <div class="taco-report-explorer__report-header">
                    
                    <!-- report title -->
                    <h2 class="taco-report-explorer__report-header__title">DUE DILIGENCE PROCESS KongSwap (KONG)</h2>

                    <!-- report metadata continer -->
                    <div class="taco-report-explorer__report-header__metadata-container">

                      <!-- report metadata -->
                      <span class="taco-report-explorer__report-header__metadata">
                        <i class="fa-solid fa-luchador-mask"></i> 
                        <span> Written by Tirex & TrickyVik</span>
                        <span class="small"> 08/2025</span>
                      </span>

                    </div>        
                    
                  </div>

                  <!-- report body -->
                  <div class="taco-report-explorer__report-body">
                    
                    <!-- heading -->
                    <h3 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h1">
                      Team Background
                      <i class="fa-solid fa-circle-info" 
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Assess the founding team's transparency, credibility, experience, and any past contributions to the ICP ecosystem"></i>
                    </h3>
                    
                    <!-- paragraph -->
                    <p>
                      In KongSwap's <a href="https://forum.dfinity.org/t/introducing-kongswap/35607" target="_blank">introductory forum post</a> and <a href="https://github.com/KongSwap/documentation/blob/main/kong_whitepaper.md" target="_blank">whitepaper</a>, it was stated that the team's combined
experience included roles and successful projects within Sygnum Bank, UBS, Deutsche Bank, DFINITY,
and others. Other than this, we could not find public information on KongSwap's team. All of the
following was sourced from one of the team members:
                    </p>

                    <!-- unordered list -->
                    <ul>
                      
                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Gorazd is on the business side of things and does some backend. He has experience in finance.
He co-created Helix Markets
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Jon is the backend lead. He was a developer at Microsoft in the 90s before moving into finance.
He co-created Helix Markets
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Shillgatesy works on the front end. He has been developing for 7 years, first in logistics for 3
years, and then running a small crew of developers for projects in different industries. He created
Windoge98 and was well-involved in SNS-1
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Gladiator has been working on the backend, specifically on Solana functionality. He has been
working professionally for 2 years, starting on Windoge98
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Theo works on the front end. He previously worked on the Harmony blockchain. He made dApps
for the partyhats project on ICP
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Illya recently joined to work on the backend
                        </p>

                      </li>

                    </ul>

                    <!-- paragraph -->
                    <p>
                      <a href="https://app.sneeddao.com/proposal?proposalid=64&sns=ormnc-tiaaa-aaaaq-aadyq-cai" target="_blank">Via proposal 64</a>, the team was paid 25000 ICP from the treasury for work in Q4 2024 and Q1 2025.
                    </p>

                    <!-- paragraph -->
                    <p>
                      <a href="https://app.sneeddao.com/proposal?proposalid=262&sns=ormnc-tiaaa-aaaaq-aadyq-cai" target="_blank">Via proposal 262</a>, the team was paid 50000 ICP from the treasury for work in Q2 2025.
                    </p>

                    <hr>

                    <!-- heading -->
                    <h3 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h1">
                      Token Utility
                      <i class="fa-solid fa-circle-info" 
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Examine the token's purpose and functionality within its ecosystem to ensure it provides tangible value and practical use cases"></i>
                    </h3>  
                    
                    <!-- paragraph -->
                    <p>
                      The KONG token serves as the governance token for KongSwap, enabling members to submit and vote
on proposals that are implemented if approved.
                    </p>

                    <!-- paragraph -->
                    <p>
                      <a href="https://kongswap.io/" target="_blank">KongSwap is a decentralized exchange (DEX) offering trading on ICP and Solana</a>. Intelligent routing
enables any token to be swapped for any other token on the platform. Average swap time is claimed to be
2.5 seconds with a 99.9% success rate on their dApp. An official KongSwap <a href="https://kongswap.io/kb/articles/icp-eco-dex-comparison" target="_blank">article</a> states a different swap
time, 8 seconds. Swap fees start at 0.3%, but will double or triple depending on additional steps in the
trading route. All of the swap fees are distributed to liquidity providers. Trading fees that go to the
treasury are planned.
                    </p>
                    
                    <!-- paragraph -->
                    <p>
                      <a href="https://kongswap.io/predict/faq" target="_blank">Users can create and bet on future outcomes via prediction markets</a>. Winnings come from losing bets. A
time-weighted rewards system determines payouts, with the multiplier being 10x at the start of the market
and 1x at its end. Markets can have two or more outcomes. <a href="https://kongswap.io/predict/faq" target="_blank">Prediction markets</a> are activated with one
token, incurring a fee that varies between tokens. Current supported tokens include KONG, ICP, ckBTC,
ckETH, ckUSDT, DKP, and GLDT. Activation fees with $KONG are burned, and activation fees with
other tokens go to the treasury. Users can bet with any of the supported tokens, which are automatically
converted to the token with which the market was activated. Each bet incurs a platform fee.
                    </p>
                    
                    <!-- paragraph -->
                    <p>
                      The <a href="https://kongswap.io/stats" target="_blank">token index and token pages</a> display general statistics for listed tokens and their associated platform
metrics. The <a href="https://kongswap.io/stats/bubbles" target="_blank">bubble page</a> visualises gainers and losers of the last 24-hour period. The <a href="https://kongswap.io/stats/leaderboard" target="_blank">volume leaderboard</a>
highlights which users have the most trading volume.
                    </p>
                    
                    <!-- paragraph -->
                    <p>
                      A third-party service, Onramper, is integrated to enable the purchase of ICP with fiat.
                    </p>
                    
                    <!-- paragraph -->
                    <p>
                      A team member has stated that arbitrage bots that balance out prices between different protocols bring
revenue to the treasury.
                    </p>
                    
                    <!-- paragraph -->
                    <p>
                      Roadmap items include <a href="https://app.sneeddao.com/proposal?proposalid=64&sns=ormnc-tiaaa-aaaaq-aadyq-cai" target="_blank">[1]</a><a href="https://app.sneeddao.com/proposal?proposalid=262&sns=ormnc-tiaaa-aaaaq-aadyq-cai" target="_blank">[2]</a><a href="https://forum.dfinity.org/t/kongswap-q1-25-recap/43043" target="_blank">[3]</a>:
                    </p>

                    <!-- unordered list -->
                    <ul>
                      
                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Staking pools for LP tokens
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Concentrated and single-sided liquidity
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Lending Markets
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Referral program
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Predict AI, which will be similar to prediction markets but tailored to price predictions
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Data aggregators integration
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Limit orders
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Automated trading strategies
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          User-generated airdrops
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Native integrations for Bitcoin, Ethereum and SUI
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          KongSwap Proof-of-Work Launchpad
                        </p>

                      </li>

                    </ul>
                    
                    <hr>

                    <!-- heading -->
                    <h3 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h1">
                      Ecosystem Alignment
                      <i class="fa-solid fa-circle-info" 
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Evaluate the token's synergy with other ICP projects, including any existing collaborations and suitability for inclusion in the Salsa Season rewards program."></i>
                    </h3>  

                    <!-- paragraph -->
                    <p>
                      KongSwap maintains strong synergy with the rest of the ICP ecosystem. Beyond being a top ICP DEX,
examples of ecosystem alignment include:
                    </p>

                    <!-- unordered list -->
                    <ul>
                      
                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Integration into the Windoge98 dApp
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          <a href="https://dashboard.internetcomputer.org/sns/ormnc-tiaaa-aaaaq-aadyq-cai/proposal/332" target="_blank">Via a treasury swap</a>, 0.5% of KONG's token supply was swapped for EXE
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          <a href="https://x.com/dragginzgame/status/1920829593272901724" target="_blank">Dragginz</a> and Windoge98 background themes
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          <a href="https://dashboard.internetcomputer.org/sns/ormnc-tiaaa-aaaaq-aadyq-cai/proposal/266" target="_blank">Social mining partnership with Insane Clown Protocol</a>
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          <a href="https://x.com/KongSwapX/status/1931493877879570765" target="_blank"></a>Co-hosted X space with Insane Clown Protocol
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          <a href="https://x.com/KongSwapX/status/1929327101997462011" target="_blank">Enabled swapping on KongSwap for some Odin.Fun memecoins</a>
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          <a href="https://x.com/swaprunner/status/1911911263598227711" target="_blank">Sponsored achievements on SwapRunner</a>
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Integration into OISY, NFID, Plug, SwapRunner, OpenChat, and <a href="https://x.com/KongSwapX/status/1940766369152487465" target="_blank">Gold DAO</a> as a swap provider
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          OpenChat uses KONG for tipping
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          <a href="https://x.com/alexandria_lbry/status/1930569526485127534" target="_blank">Used for auto-locking LP by Alexandria Library</a>
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          <a href="https://x.com/NeuronPool/status/1910686826190287019" target="_blank">Collaborated with NeuronPool to enable sending tokens to vectors from KongSwap</a>
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Several prediction markets centred around other ICP projects have been created, and highlighted
on X
                        </p>

                      </li>

                    </ul>

                    <!-- paragraph -->
                    <p>
                      The KongSwap team has indicated interest in getting involved in Salsa Season. Salsa Season will have
off-seasons and active seasons to create hype around the active seasons, so projects that integrate their
rewards programs would do so in order to join in on the seasonal hype and hot-points of engagement.
                    </p>

                    <hr>

                    <!-- heading -->
                    <h3 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h1">
                      Community
                      <i class="fa-solid fa-circle-info" 
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Assess the size and engagement of the token's community to gauge long-term adoption potential"></i>
                    </h3>  

                    <!-- paragraph -->
                    <p>
                      The Telegram group has 654 members and the OpenChat community has 2088 members
                    </p>

                    <!-- paragraph -->
                    <p>
                      On X, <a href="https://x.com/KongSwapX" target="_blank">KongSwap has 2031 followers</a>
                    </p>
                    
                    <hr>

                    <!-- heading -->
                    <h3 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h1">
                      Technology
                      <i class="fa-solid fa-circle-info" 
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Review the project's technical foundation, focusing on code quality, scalability, and how effectively it leverages ICP's capabilities"></i>
                    </h3>  

                    <!-- paragraph -->
                    <p>
                      The SNS framework is regularly updated and vetted by the Network Nervous System (NNS) community,
which oversees the entire ICP ecosystem. This vigilance ensures the adherence of KONG's governance
framework to the most rigorous standards of security and efficiency.
                    </p>

                    <!-- paragraph -->
                    <p>
                      <a href="https://forum.dfinity.org/t/introducing-kongswap/35607" target="_blank">KongSwap operates entirely on-chain with both frontend and backend hosted within smart contracts</a>. The
frontend canister hosts the user interface, handling all user interactions, and communicating them to the
backend canister. The backend canister manages wallet logins, liquidity operations, token swaps, and
claims. The DEX's single canister architecture reduces the overhead of managing multiple contracts, and
ensures that all operations are tightly integrated and consistent.
                    </p>

                    <!-- paragraph -->
                    <p>
                      KongSwap is an Automated Market Maker (AMM) DEX. AMMs enable token swaps automatically
without the need for matching buyers and sellers. They achieve this through liquidity pools, which users
provide tokens to and receive trading fees from. These pools hold pairs of tokens and set prices based on
their balances. Trades happen directly against the pool's reserves. When a user swaps one token for
another, the system uses a fixed number called the constant product, which is just the two token reserves
multiplied together. The swap adds the user's input token to one side and removes some of the other
token, but the contract adjusts the output amount so that the constant product stays the same after the
trade. This adjustment is called slippage, and makes traders get a worse deal. Liquidity providers face a
risk called impermanent loss, where the value of their deposited tokens can drop compared to just holding
them outside the pool. If the relative prices of the tokens change, the pool's automatic rebalancing means
LP tokens will be worth less upon withdrawal, though trading fees can offset this.
                    </p>

                    <!-- paragraph -->
                    <p>
                      Intelligent multi-step trading automatically finds the most efficient swap routes for users. Rather than
forcing direct token-to-token trades, the system can execute multi-hop transactions - for example,
converting ICP to ckUSDT by routing through ckBTC (ICP → ckBTC → ckUSDT) if this path offers
better value than a direct swap. This built-in arbitrage mechanism continuously optimizes pricing across
the platform's liquidity pools. The single canister architecture provides a significant advantage here, as all
route calculations, price comparisons, and multi-step executions happen within one smart contract without
the coordination overhead and potential inconsistencies of cross-canister calls. This enables real-time
route optimization while maintaining atomic transaction guarantees - either the entire multi-step trade
succeeds or fails as one unit.
                    </p>

                    <!-- paragraph -->
                    <p>
                      To manage computational complexity and prevent excessive gas consumption, KongSwap limits the
maximum number of steps in any trading route. The system's token pairing structure is strategically
designed around two base pairs: ckUSDT and ICP. All supported tokens can be paired with either
ckUSDT or ICP, creating a hub-and-spoke model that simplifies routing logic while ensuring liquidity
concentration in these core trading pairs. This constraint reduces the computational overhead of
pathfinding algorithms while still enabling efficient price discovery across the entire token ecosystem.
                    </p>

                    <!-- paragraph -->
                    <p>
                      This automated route optimization essentially provides users with built-in MEV (Maximum Extractable
Value) protection, as the platform captures arbitrage opportunities on behalf of traders rather than leaving
them to external arbitrageurs.
                    </p>

                    <!-- paragraph -->
                    <p>
                      KongSwap achieves bridgeless multichain interoperability with Solana through <a href="https://medium.com/dfinity/icp-reaches-the-shores-of-solana-0f373a886dce" target="_blank">threshold EdDSA</a>, which
is used to securely generate and manage keys for Solana with Internet Identity, or inversely, generate an
Internet Identity with Solana keys. The SOL RPC canister enables the execution of transactions on the
Solana network from an Internet Computer dApp. Liquidity pools connect across chains through synthetic
swaps, where trades are processed on-chain by calculating exchange rates and signing cross-chain
transfers, effectively aggregating liquidity from ICP and Solana and enabling seamless swapping between
the two ecosystems. To illustrate with an example, once this is fully implemented, users will be able to
swap an ICP-native memecoin for a SOL-native memecoin in one swap. KongSwap plans to expand to
additional chains.
                    </p>

                    <!-- paragraph -->
                    <p>
                      Prediction markets use a simple pari mutuel pool design. Users stake into outcome pools and, at
settlement, the winners split the losers' pool pro-rata by weighted stake (time-weighting described in
Token Utility). Prediction markets are resolved when platform admins and market creators agree on the
resolution. If there is disagreement, the market is voided, all bets are refunded, and the creator's deposit is
burned. A team member has stated that admins can force resolutions.
                    </p>

                    <!-- paragraph -->
                    <p>
                      Stable memory is utilised for all state and operations. <a href="https://internetcomputer.org/docs/references/ic-interface-spec" target="_blank">Stable memory is a persistent storage mechanism in
ICP canister smart contracts that preserves data across code upgrades and lifecycle events</a>, ensuring that
information, which would otherwise be discarded in standard WebAssembly memory and require manual
saving and restoration, remains intact and accessible. This enables large-scale, on-chain storage of vast
amounts of data without the need for constant snapshots, frequent upgrades, external databases, or
oracles.
                    </p>
                    
                    <hr>

                    <!-- anon container -->
                    <div class="d-flex flex-wrap" style="gap: 1rem 3rem;">

                      <!-- left -->
                      <div>

                        <!-- heading -->
                        <h3 class="taco-report-explorer__report-heading
                                  taco-report-explorer__report-heading--h1">
                          Tokenomics
                          <i class="fa-solid fa-circle-info" 
                            data-bs-toggle="tooltip" 
                            data-bs-placement="top" 
                            title="Analyse the supply and distribution of the token; any inflationary/deflationary mechanisms; and any incentive structures, to ensure sustainability and fair distribution"></i>
                        </h3>

                        <!-- unordered list -->
                        <ul>

                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              Total Supply: 1,019,307,896
                            </p>
                            
                          </li>

                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>

                              <!-- link -->
                              <a href="https://app.sneeddao.com/sneedlock" target="_blank">
                                Circulating Supply: 474,925,678
                              </a>

                            </p>
                            
                          </li>

                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              Unlocked Circulating Supply: 106,702,890
                            </p>
                            
                          </li>                          
                          
                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              Burn per transaction: 0.0001 KONG
                            </p>
                            
                          </li>
                          
                          <!-- holders -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              Holders:
                            </p>

                            <!-- unordered list -->
                            <ul style="list-style-type: disc">

                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Top - 54.25% (Treasury)
                                </p>

                              </li>

                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Second - 1.99% (SNS:KONG GOVERNANCE)
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Third - 1.84%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Mean of Top 25 - 3.2508%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Median of Top 25 - 1.34%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Mode of Top 25 - 0.69%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Top 25 Total - 81.27%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Mean of Top 100 - 0.934%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Median of Top 100 - 0.24%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Mode of Top 100 - 0.03%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Top 100 Total - 93.4%
                                </p>
                                
                              </li>                          

                            </ul>
                            
                          </li> 
                          
                          <!-- treasury -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              Treasury:
                            </p>

                            <!-- unordered list -->
                            <ul style="list-style-type: disc">

                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  <a href="https://dashboard.internetcomputer.org/account/f39d9b22c382c25f832fd1d3e6ad5216249623b204a7fc5498f991f4cf2df1e1" target="_blank">160242 ICP ($842, 872.92)</a>
                                </p>

                              </li>  
                              
                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  According to <a href="https://dashboard.internetcomputer.org/sns/ormnc-tiaaa-aaaaq-aadyq-cai/proposal/262" target="_blank">proposal 262</a>, there was 45700 ICP in liquidity as at 22/04/2025
                                </p>

                              </li>  

                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  544,382,219.84 KONG (~ $7.55m)
                                </p>

                              </li>  

                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  ~ $9.5k worth of EXE
                                </p>

                              </li>  

                            </ul>
                            
                          </li>  

                          <li>

                            <!-- paragraph -->
                            <p>
                            Inflationary mechanisms do exist in the forms of APY from staking rewards. For a 1 year old neuron with a 1 year, 182 day dissolve delay, a staker will earn 6.25% APY
                            </p>

                          </li>

                        </ul>

                      </div>

                      <!-- center -->
                      <div>

                        <!-- heading -->
                        <h3 class="taco-report-explorer__report-heading
                                  taco-report-explorer__report-heading--h1">
                          Market Metrics
                          <i class="fa-solid fa-circle-info" 
                            data-bs-toggle="tooltip" 
                            data-bs-placement="top" 
                            title="Review key indicators such as trading volume and historical market performance."></i>
                        </h3>

                        <!-- unordered list -->
                        <ul>

                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              All Time High (USD): 0.08806
                            </p>
                            
                          </li>

                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              All Time Low (USD): 0.00582
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              As at 07/08/25(USD): 0.02264
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              Change from ATH USD: -74.2903%
                            </p>
                            
                          </li>                      

                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              Change from ATL USD: 289.003%
                            </p>

                          </li>

                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              USD Volume 24H as at 07/08/25: 15180
                            </p>
                            
                          </li>

                        </ul> 

                      </div>

                      <!-- right -->
                      <div>

                        <!-- heading -->
                        <h3 class="taco-report-explorer__report-heading
                                  taco-report-explorer__report-heading--h1">
                          Liquidity
                        </h3>

                        <!-- paragraph -->
                        <p>
                          As per <a href="https://swaprunner.com" target="_blank">SwapRunner</a> on the 7th of August, a single transaction of:
                        </p>

                        <!-- unordered list -->
                        <ul>

                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              20000 ICP ($102607.20) will result in a trade to 4577963.284 KONG ($64659.28). 36.984% lost
to price impact
                            </p>
                            
                          </li>

                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              10000 ICP ($51303.60) will result in a trade to 20810696.04 KONG ($39698.35). 22.62% lost to
price impact
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              1000 ICP ($5130.36) will result in a trade to 353503.45 KONG ($4992.89). 2.68% lost to price
impact
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              250 ICP ($1282.59) will result in a trade to 90307.95 KONG ($1275.51) 0.55% lost to price
impact
                            </p>
                            
                          </li>

                        </ul>

                        <!-- paragraph -->
                        <p>
                          As can be seen, liquidity for KONG remains limited. If liquidity is not recycled, and there are no 'sells'
between the DAO's 'buys', the effective slippage rate will be identical regardless of whether multiple
small transactions or one large one take place.
                        </p>

                      </div>                      

                    </div>

                    <hr>

                    <!-- headings -->
                    <h3 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h1">
                      Competitors
                      <i class="fa-solid fa-circle-info" 
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Identify similar projects and assess the token's differentiators alongside the perceived competitive positioning within its niche"></i>
                    </h3>

                    <h4 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h2 mt-4">
                      ICPSwap
                    </h4>

                    <!-- paragraph -->
                    <p>
                      KongSwap's primary competitor is ICPSwap, the main other AMM DEX in the ICP ecosystem. One
obvious differentiator is the branding; KongSwap's is fun.
                    </p>

                    <!-- paragraph -->
                    <p>
                      ICPSwap already has some features KongSwap intends to have, those being concentrated liquidity,
single-sided liquidity, limit orders, and staking pools. <a href="https://app.icpswap.com/ck-bridge?tokenId=xevnm-gaaaa-aaaar-qafnq-cai&chain=Ethereum" target="_blank">ICPSwap houses the ck-Bridge</a>, which facilitates
the minting and redemption of various chain-key tokens.
                    </p>

                    <!-- paragraph -->
                    <p>
                      Concentrated liquidity is a feature that enables liquidity providers to achieve greater capital efficiency and
higher fee yields by concentrating their assets within specific price ranges. These price ranges define
where the provided liquidity is active, virtualizing the deposited reserves as if a larger amount was
provided, thereby reducing slippage for trades in that range. This concentration amplifies the risk of
impermanent loss, as price movements cause the position to rebalance more aggressively. This risk is
offset by the virtualization granting liquidity providers a proportionally larger share of the active depth in
their range, enabling them to capture a greater portion of trading fees.
                    </p>

                    <!-- paragraph -->
                    <p>
                      Both dApps charge the same trading fees, but KongSwap gives 100% to LPs, <a href="https://iloveics.gitbook.io/icpswap/ics/how-much-are-icpswap-fees" target="_blank">while ICPSwap gives 80%
to LPs and uses the rest to buy back and burn $ICS</a>. 22442998 ICS tokens (~ $165k) have been burned.
                    </p>

                    <!-- paragraph -->
                    <p>
                      ICPSwap does not have intelligent routing; users can only swap where there is direct liquidity. ICPSwap's
architecture is inter-canister, so intelligent routing would be harder to achieve. Tokens can be deposited to
ICPSwap, and if done so, <a href="https://x.com/SnassyIcp/status/1894369040895729879" target="_blank">the swap time is slightly faster than it is on KongSwap</a>. If tokens are not
deposited, the swap time is slower and there are higher risks of sandwich bot attacks (bots copying your
trade and executing first) compared to KongSwap.
                    </p>

                    <!-- paragraph -->
                    <p>
                      ICPSwap's <a href="https://iloveics.gitbook.io/icpswap/icpswaps-next-phase-roadmap-and-potential-product-directions-updated-on-april-3-2025" target="_blank">near-term roadmap</a> includes items such as:
                    </p>

                    <!-- unordered list -->
                    <ul>
                      
                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Speeding up swap times
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Preventing sandwich bot attacks
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Launching a <a href="https://x.com/ICPSwap/status/1903108129572917454" target="_blank">leverage trading platform</a>
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Several new features, optimizations, and upgrades: one-click liquidity adjustment, seamless
liquidity provision, smart price range recommendations, price alerts, batch trading, enhanced
ckBridge functionality, wallet labeling, trading competitions, and UI/UX improvements
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Considering AI agents for analysis, multi-chain, P2P, NFT mining, and social features
                        </p>

                      </li>

                    </ul>                    
                    
                    <h4 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h2 mt-4">
                      Neutrinite DEX
                    </h4>

                    <!-- paragraph -->
                    <p>
                      Neutrinite's vectors automate DeFi operations. They are designed with DAOs in mind as key users, as
they autonomously perform tasks without the need for constant manual oversight or repeated governance
votes. The Neutrinite DEX was built for vectors which conduct exchange operations. The user-facing end
of the Neutrinite DEX could be considered a by-product of its primary use case, and it is unknown if the
NTN devs intend to focus their efforts to cater it to users. It currently only supports tokens that are vector
ready, which primarily consist of SNS tokens.
                    </p>

                    <!-- paragraph -->
                    <p>
                      It is another AMM DEX. Like KongSwap, it offers intelligent routing for token swaps, and like ICPSwap,
it has concentrated liquidity (which is on KongSwap's roadmap).
                    </p>

                    <!-- paragraph -->
                    <p>
                      Liquidity is currently limited compared to KongSwap and ICPSwap; executing large trades incurs high slippage. NTN devs have created arbitrage bots that, rather than aiming for profit, only aim to break even on trades that synchronize Neutrinite DEX's prices with KongSwap and ICPSwap. These bots make smaller trades over time advantageous, which users could set up with a vector. Such a vector would currently charge a one-time creation fee of 2 NTN (currently ~ $10.9), and be refunded upon its deletion.
                    </p>

                    <!-- paragraph -->
                    <p>
                      The Neutrinite project is much broader than its DEX.
                    </p>

                    <h4 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h2 mt-4">
                      ICDex
                    </h4>

                    <!-- paragraph -->
                    <p>
                      <a href="https://iclight.house/whitepaper.pdf" target="_blank">ICLighthouse DAO's ICDEX is a hybrid AMM-Orderbook (OAMM) DEX</a>. A grid strategy is used for
market making, which automates and manages buy and sell orders at regular intervals around the market
price. It offers a suite of order types, many of which are catered to sophisticated traders, these include
Market, Limit, Fill and Kill, Fill or Kill, Stop-Limit, and Pro Orders. Pro-Orders consist of Grid, Iceberg,
Time-Weighted Average Price, and Volume-Weighted Average Price.
                    </p>

                    <!-- paragraph -->
                    <p>
                      The Initial DEX Offering (IDO) is a DAO-authorized token sale for new pairs, set up by a Funder.
Pre-IDO, the Funder places sell-limit orders. During the active period (from opening to closing time),
users buy via fill-or-kill orders. Post-closing, unfilled orders cancel, transitioning to normal trading. This
ensures controlled distribution.
                    </p>

                    <!-- paragraph -->
                    <p>
                      ICLighthouse's dApp also houses icRouter, a bridgeless cross-chain network, leveraging threshold
signature technology to connect Bitcoin, IC, and EVM networks.
                    </p>

                    <!-- paragraph -->
                    <p>
                      Revenue streams include token pair creation fees, OAMM/LP creation fees, LP withdrawal fees, trading
(taker) fees, cancelling order fees, and strategic order fees.
                    </p>

                    <!-- paragraph -->
                    <p>
                      ICDex achieves task atomicity via the <a href="https://iclighthouse.gitbook.io/iclighthouse/products/ictc" target="_blank">IC Transaction Coordinator (ICTC)</a>, though this is limited by its
inter-canister architecture.
                    </p>

                    <!-- paragraph -->
                    <p>
                      We couldn't find a roadmap for ICDex. It is important to note that ICL has very limited liquidity on the
DEXes where TACO DAO conducts its trading operations, making it non-viable for addition to the
portfolio without technical upgrades.
                    </p>

                    <h4 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h2 mt-4">
                      Sonic
                    </h4>

                    <!-- paragraph -->
                    <p>
                      Sonic is another ICP AMM DEX. It lacks KongSwap's and ICPSwap's distinguishing features; no Solana
integration, no intelligent swap routing, and no concentrated liquidity.
                    </p>

                    <!-- paragraph -->
                    <p>
                      Their <a href="https://docs.sonic.ooo/product/liquidity-bootstrapping-pool/overview" target="_blank">Liquidity Boot Strapping Pool (LBP)</a> feature enables projects to raise funds and bootstrap liquidity
on ICP. It starts with a high token price that gradually decreases over time before transitioning to a normal
DEX pair. This feature was last used a year ago.
                    </p>

                    <!-- paragraph -->
                    <p>
                      Sonic has integrated with the Bitfinity EVM chain through <a href="https://sonic-ooo.medium.com/sonic-bitfinity-dex-your-gateway-to-bitfinity-evm-chain-0c44c4271038" target="_blank">Sonic Bitfinity DEX</a>, serving as a gateway for
bridging assets from ICP via Omnity Bridge.
                    </p>

                    <!-- paragraph -->
                    <p>
                      The <a href="https://hyperlaunch.fun/" target="_blank">hyperlaunch.fun</a> platform linked from their dApp appears to be a pump.fun-esque memecoin
launcher with some form of tie to ELNA AI agents. It does not have any tokens with a MCAP bigger than
$12k.
                    </p>

                    <!-- paragraph -->
                    <p>
                      <a href="https://sonicdex.gitbook.io/sonic-whitepaper/future-of-sonic-roadmap" target="_blank">Sonic's roadmap</a> includes items such as:
                    </p>

                    <!-- unordered list -->
                    <ul>
                      
                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Perpetual contracts, enabling users to trade with leverage. This was marked for Q2-Q4 of 2024
and we could find no updates on its current status
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          <a href="https://app.sonic.ooo/swap/recurring" target="_blank">Recurring trade feature</a>
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Dark pools
                        </p>

                      </li>

                    </ul> 

                    <h4 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h2 mt-4">
                      SwapRunner
                    </h4>

                    <!-- paragraph -->
                    <p>
                      Sneed DAO's <a href="https://swaprunner.com/help" target="_blank">SwapRunner</a> is a DEX aggregator that enables users to split trade orders between ICPSwap
and KongSwap to optimize execution. A planned Time-Distributed Trading feature will enable users to
break down large trades into smaller ones over time. SwapRunner includes a <a href="https://swaprunner.com/help/rewards" target="_blank">rewards system</a> that lets
project teams sponsor specific achievements, offering users incentives for completing various trading
activities. Fees from sponsored achievements go to the Sneed DAO.
                    </p>

                    <!-- paragraph -->
                    <p>
                      For now, SwapRunner's canister is not under Sneed DAO's governance. The Sneed DAO project is much
broader than SwapRunner.
                    </p>

                    <h4 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h2 mt-4">
                      DEXes Beyond ICP
                    </h4>

                    <!-- paragraph -->
                    <p>
                      KongSwap inherits ICP's technological advancements, giving it the potential to rival and surpass leading
DEXes.
                    </p>

                    <!-- paragraph -->
                    <p>
                      KongSwap is entirely on-chain, front-end to back-end. ICP enables full-stack decentralized applications
to run natively on the blockchain, serving web content directly without relying on centralized servers or
external hosting. It is the only blockchain capable of this. This ensures complete tamper-proof
decentralization, eliminating single points of failure like off-chain frontends that could be censored,
hacked, or taken offline. In contrast, leading DEXes like Uniswap cannot achieve this unless they put
their frontend on ICP. Currently, only their backend logic resides on-chain, leaving them vulnerable to
downtime, regulatory takedowns, or frontend manipulations.
                    </p>

                    <!-- paragraph -->
                    <p>
                      ICP's canister smart contracts have properties that enable dApps to run at web speed and execute complex
operations, incurring computational costs low enough to be competitive with Web2. This is, theoretically,
infinitely scalable as more subnets are added. Once again, it is the only blockchain capable of this, others
burden users with variable gas fees, and are limited to simpler operations. ICP's reverse gas model, where
developers pre-pay computational fees, does away with charging users for gas altogether.
                    </p>

                    <!-- paragraph -->
                    <p>
                      KongSwap's use of stable memory, a persistent storage mechanism, allows all operational state, liquidity
pools, transaction histories, user positions, and analytics to be stored and queried entirely on-chain
without external databases or oracles. DEXes on other chains face prohibitive storage costs and limits,
forcing reliance on off-chain indexers or APIs for data.
                    </p>

                    <!-- paragraph -->
                    <p>
                      Chain-Key technology enables bridgeless multichain interoperability, which KongSwap takes advantage
of to position itself favourably against non-ICP DEXes reliant on bridges. Bridges are notorious for
having vulnerabilities. <a href="https://chain.link/education-hub/cross-chain-bridge-vulnerabilities" target="_blank">According to DefiLlama</a>, cross-chain bridges have been hacked for more than $2.8
billion, representing almost 40% of the entire value hacked in Web3. By generating and managing
cross-chain keys, KongSwap securely aggregates liquidity across the chains it intergrates.
                    </p>

                    <!-- paragraph -->
                    <p>
                      With all this in mind, we identify 1inch Network as KongSwap's primary non-ICP competitor. As a
leading decentralized exchange aggregator (<a href="https://medium.com/@biosioidongesit/1inch-reclaims-dex-aggregator-crown-with-60-market-share-a43657d965c8" target="_blank">60% market share as of June</a>), 1inch routes user trades across
hundreds of liquidity sources on over 13 chains, including Ethereum, Solana, and various Layer-2
networks, to deliver optimal rates and minimize slippage. It enables seamless cross-chain swaps through
its <a href="https://1inch.io/assets/1inch-fusion-plus.pdf" target="_blank">Fusion+</a> mode, an intent-based atomic swap protocol that avoids traditional bridges by using escrow
contracts for trustless execution. In Fusion+, users express swap intents (e.g., minimum return across
chains), and professional resolvers compete in Dutch auctions to fulfill them by creating escrow contracts
with cryptographic hashlocks (tied to a secret) and timelocks (deadlines) on both source and destination
chains, ensuring atomic execution where the swap either completes fully or reverts entirely. This design is
trustless because it relies solely on on-chain cryptography and smart contract logic—no intermediaries or
custodians hold funds, users maintain self-custody throughout, and failures trigger automatic refunds
without external trust. 1inch also features gasless execution, MEV protection, limit orders, and DAO
governance.
                    </p>

                    <!-- paragraph -->
                    <p>
                      KongSwap aims to be a one-stop-shop DEX, enabling seamless, trustless swaps of any token for any
other across integrated ecosystems, regardless of their native chains. 1inch has already largely achieved
all of this. KongSwap's potential to catch up is limited by a few factors, the primary of which being the
fact that it is not a DEX aggregator. Even when it has made the necessary implementations to enable
support of tokens from other ecosystems, such as SPL tokens (Solana's token standard), its potential to be
a one-stop-shop will be contingent on liquidity being provided for them on the platform, a contingency
which 1inch is not limited by. Another limitation is KongSwap's dependence upon rollouts of Chain-Key
implementations for new chains, while 1inch has already integrated DEXes on 13 chains, allowing
immediate access to their ecosystems without waiting for protocol-level Chain-Key rollouts on ICP. A
third factor is ICP's smaller ecosystem adoption, which hampers liquidity growth compared to 1inch's
established DeFi hubs.
                    </p>

                    <!-- paragraph -->
                    <p>
                      If KongSwap can overcome these limiting factors through adoption, it will have a technical edge. By
handling swaps internally, it could achieve faster execution than 1inch's Fusion+ auctions, which
generally take multiple minutes. By not relying on multiple external DEXes and resolvers, KongSwap
would likely have a lower rate of failure. KongSwap's fully on-chain architecture ensures tamper-proof
decentralization, eliminating off-chain vulnerabilities like 1inch's reliance on external services for DAO
voting (e.g., Snapshot for off-chain tallies), off-chain data indexing, and frontend hosting that could
introduce points of failure, censorship, or hacks. For <a href="https://x.com/1inch/status/1851832307746742686" target="_blank">example</a>, a recent supply chain attack on 1inch's web
dApp (via a compromised third-party JS library) led to malicious wallet connect requests that could drain
user funds for about 2 hours, though the team resolved it with refunds and advised revoking approvals.
Beyond security, ICP's canister smart contracts, which KongSwap is composed of, offer a cornucopia of
unique, decentralized features waiting to be built, features that other chains could only dream of.
                    </p>

                    <h4 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h2 mt-4">
                      Prediction Markets
                    </h4>

                    <!-- paragraph -->
                    <p>
                      While KongSwap's core focus is the DEX, its prediction markets feature puts it up against specialized
platforms in the broader crypto space. We assess the KongSwap prediction markets system as not yet
competitive.
                    </p>

                    <!-- paragraph -->
                    <p>
                      To illustrate our logic behind this statement, we will start by explaining V1 of their prediction markets. In
V1, the prediction markets used a straightforward pool-based mechanism; bettors would send their tokens
to one of the outcome pools. At the market's end, all losing bets would be distributed to the winning
bettors. The system had a critical flaw, it did not take the evolving nature of information into account. For
example, if the prediction market's topic was 'Will x token's price be above y as of z date?', it did not
matter if you bet early or late into that market, these bets would count the same, even though those who
would bet late would have a far greater advantage in predicting the outcome. This was easily-gameable.
                    </p>

                    <!-- paragraph -->
                    <p>
                      V2 introduced time-weighted decay as a solution to this problem. This system added multipliers based on
how early bettors entered into the market, with the multiplier being 10x at the start of the market and 1x at
its end. We perceive this to be a band-aid solution to an already flawed system, rather than a fix. Even if
the multiplier is 1x at the market's end, if it is easy to deduce its outcome, late bettors with enough capital
could still put a big stake into the imminently-victorious pool to drown out the rewards of their
forerunners, and such an opportunity would only be limited by how much capital the bettor has. The
arbitrary 10x early bonus also invites coordination (creators ping associates to front-load). Finally, the
market's resolution is centralized as it, reportedly, can be forced by admins.
                    </p>

                    <!-- paragraph -->
                    <p>
                      By contrast, leading crypto prediction markets like Polymarket typically price outcomes via AMMs or
order books. For example, in Polymarket, traders buy/sell “Yes/No” shares that trade between 0 and 1 in a
stablecoin, so the price at any moment reflects the crowd's implied probability. Prices adjust as
information arrives, rewarding correct early positions through price movement alone, without arbitrary
time-decay multipliers. Resolution is generally decentralized using oracle or vote-based dispute
mechanisms.
                    </p>

                    <!-- paragraph -->
                    <p>
                      Competitors avoid KongSwap's centralization risks and offer scalable mechanics suited for high-volume
events (e.g., Polymarket's $1B+ in election bets). KongSwap's approach may suit low-stakes ICP fun but
is functionally behind the state of the art.
                    </p>

                    <h4 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h2 mt-4">
                      Statistics
                    </h4>

                    <!-- paragraph -->
                    <p>
                      According to <a href="https://icptokens.net/dex" target="_blank">icptokens</a> and <a href="https://v3.data.sonic.ooo/" target="_blank">Sonic</a>, as at 07/08/2025:
                    </p>

                    <!-- unordered list -->
                    <ul>
                      
                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          KongSwap's TVL was $5.82m and 24h volume was $577.02k
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          ICPSwap's TVL was $8.63m and 24h volume was $579.77k
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          ICDex's TVL was $1.17m and 24h volume was $4.98k
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Sonic's TVL was $3.46m and 24h volume was 0
                        </p>

                      </li>

                    </ul> 

                    <!-- paragraph -->
                    <p>
                      According to <a href="https://defillama.com/protocol/uniswap?dexVolume=true&groupBy=daily" target="_blank">DefiLlama</a>, as at 06/08/2025:
                    </p>

                    <!-- unordered list -->
                    <ul>
                      
                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          1inch's DEX Aggregator Volume was $364.43m
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Uniswap's TVL was $5.471b and 24h volume was $2.635b
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
                          Polymarket's TVL was $112.97m and 24h volume was $32.1m
                        </p>

                      </li>

                    </ul> 

                    <hr>
                   
                    <!-- heading -->
                    <h3 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h1">
                      Security Risks
                      <i class="fa-solid fa-circle-info" 
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Investigate perceived vulnerabilities, any audit reports, and adherence to security and regulatory standards"></i>
                    </h3> 
                    
                    <!-- paragraph -->
                    <p>
                      KongSwap <a href="https://github.com/KongSwap/documentation/blob/main/sig9_kongswap_audit_report.pdf" target="_blank">was audited by sig9</a>. The audit had two medium severity findings, two low severity findings
that were acknowledged, and four informational findings that were acknowledged. One medium severity
finding was partially addressed, one medium severity finding was fixed, one low severity remained
unfixed, one low severity finding was fixed, two informational findings were fixed, and two informational
findings remained unfixed.
                    </p>

                    <!-- paragraph -->
                    <p>
                      The fact that platform admins can force prediction market outcomes is not stated on the KongSwap dApp,
this was only discovered through discussion with one of the team members. Their FAQ explicitly states:
“Neither creator nor admin can unilaterally resolve.”
                    </p>

                    <!-- paragraph -->
                    <p>
                      Leading decentralized prediction markets like Polymarket, Augur, and Omen (Gnosis) do not hold
gambling licenses, as they position themselves as information aggregation tools or DeFi protocols rather
than pure betting sites. This framing helps them navigate regulations, but they've still faced scrutiny under
derivatives laws (e.g., from the CFTC in the US), treating markets as binary options or swaps. None have
obtained gambling-specific licenses from bodies like state gaming commissions or international
authorities, which are common for centralized sportsbooks or casinos. Instead, they rely on blockchain's
pseudonymous, global nature, with varying compliance strategies.
                    </p>

                    <!-- paragraph -->
                    <p>
                      In 2022, <a href="https://www.dlapiper.com/en-us/insights/publications/2022/1/cftc-settles-enforcement-action-against-defi-platform-polymarket" target="_blank">the CFTC fined Polymarket $1.4 million for offering unregistered event-based binary options</a>,
ordering them to wind down non-compliant markets, refund users, and cease violations. As part of the
settlement, <a href="https://www.coindesk.com/business/2022/01/24/polymarket-relaunches-site-after-cftc-shutdown-but-not-for-us-traders" target="_blank">Polymarket implemented IP geoblocking to exclude US users</a>, effectively banning them from
trading. However, <a href="https://www.cryptopolitan.com/polymarket-strikes-deal-to-return-to-u-s/" target="_blank">updates</a> in 2025 show a turnaround: Polymarket acquired QCX (a CFTC-licensed
derivatives exchange) for $112 million in July, allowing them to re-enter the US market compliantly
under QCX's regulatory umbrella. The DOJ and CFTC also closed their civil/criminal investigations
(initiated under Biden) without charges, amid a more crypto-friendly Trump administration shift.
                    </p>

                    <!-- paragraph -->
                    <p>
                      KongSwap has not reported holding any licenses or authorizations for its prediction markets, aligning
with the unlicensed status of peers like Augur and Omen, which have avoided major enforcement by
emphasizing decentralization and operating as trustless protocols. This lack of formal approval does not
appear inherently alarming for a smaller platform with limited volume, as regulators often prioritize
high-profile cases. However, Polymarket's 2022 CFTC fine and subsequent geoblocking highlight
potential risks if KongSwap scales.
                    </p>

                    <hr>
                    
                    <!-- back to top link -->
                    <a href="#" @click.prevent="scrollToTop" class="taco-report-explorer__report-link text-center w-100 d-inline-block mt-2">Back to top</a>
                    
                  </div>

                  <!-- report footer -->
                  <div class="taco-report-explorer__report-footer">
                    
                    <!-- left -->
                    <div class="taco-report-explorer__report-footer__left">
                      
                      ❤️🌮
                      
                    </div>
                    
                    <!-- center -->
                    <div class="taco-report-explorer__report-footer__center text-center">
                      
                      &copy;2025 Taco Dao
                      
                    </div>
                    
                    <!-- right -->
                    <div class="taco-report-explorer__report-footer__right">

                      <!-- link group -->
                      <!-- <span class="d-flex flex-column align-items-end">

                        <span class="text-end">#45 Add Token</span>

                        <span class="d-flex gap-2">

                          <a href="https://nns.ic0.app/proposal/?u=lacdn-3iaaa-aaaaq-aae3a-cai&proposal=45" class="taco-text-blue-to-light-blue text-end" target="_blank">NNS</a>                        

                          <a href="https://app.sneeddao.com/proposal?proposalid=45&sns=lacdn-3iaaa-aaaaq-aae3a-cai" class="taco-text-blue-to-light-blue text-end" target="_blank">Sneed Hub</a>

                        </span>
                        
                      </span> -->
                      
                      <!-- link group -->
                      <span class="d-flex flex-column align-items-end">

                        <span class="text-end">#88 Motion to Discuss</span>

                        <span class="d-flex gap-2">

                          <a href="https://nns.ic0.app/proposal/?u=lacdn-3iaaa-aaaaq-aae3a-cai&proposal=88" class="taco-text-blue-to-light-blue text-end" target="_blank">NNS</a>                        

                          <a href="https://tacodao.com/chat/forum/88" class="taco-text-blue-to-light-blue text-end">Taco Forum</a>

                        </span>                        

                        <span class="text-end">#26 Motion to Research</span>

                        <span class="d-flex gap-2">

                          <a href="https://nns.ic0.app/proposal/?u=lacdn-3iaaa-aaaaq-aae3a-cai&proposal=26" class="taco-text-blue-to-light-blue text-end" target="_blank">NNS</a>                        

                          <a href="https://tacodao.com/chat/forum/26" class="taco-text-blue-to-light-blue text-end">Taco Forum</a>

                        </span>
                        
                      </span>

                    </div>
                    
                  </div>

                </div>
                
              </div>

              <!-- neutrinite dd report -->
              <div v-if="reportId === 8" class="taco-report-explorer__report-container">

                <!-- inner -->
                <div class="taco-report-explorer__report-container__inner">
                
                  <!-- report header -->
                  <div class="taco-report-explorer__report-header">
                    
                    <!-- report title -->
                    <h2 class="taco-report-explorer__report-header__title">DUE DILIGENCE PROCESS Neutrinite (NTN) & Compounding Stream ICP (cICP)</h2>

                    <!-- report metadata continer -->
                    <div class="taco-report-explorer__report-header__metadata-container">

                      <!-- report metadata -->
                      <span class="taco-report-explorer__report-header__metadata">
                        <i class="fa-solid fa-luchador-mask"></i> 
                        <span> Written by Manilpwn, Tirex and TrickyVik</span>
                        <span class="small"> 08/2025</span>
                      </span>

                    </div>        
                    
                  </div>

                  <!-- report body -->
                  <div class="taco-report-explorer__report-body">
                    
                    <!-- heading -->
                    <h3 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h1">
                      Team Background
                      <i class="fa-solid fa-circle-info" 
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Assess the founding team's transparency, credibility, experience, and any past contributions to the ICP ecosystem"></i>
                    </h3>
                    
                    <!-- paragraph -->
                    <p>
SNS-1 was the original SNS DAO for ICP, launched in 2022 as a framework and test run to experiment
with decentralized governance over dApps. It served as a blank slate, and a community gathered, putting
forth multiple ideas on how best to utilise the technology, debating what direction should be taken. The
only project created during this period was <a href="https://dashboard.internetcomputer.org/sns/zxeu2-7aaaa-aaaaq-aaafa-cai/proposal/43" target="_blank">ICPCoins</a>, an index of the eponymous tokens circulating
around the ecosystem. The dev behind it was Anvil, who is respected in the ICP ecosystem for his
aptitude in DeFi. On June 11th, 2023, Adam Powell took over SNS-1 by purchasing a majority stake. Via
proposal <a href="https://dashboard.internetcomputer.org/sns/zxeu2-7aaaa-aaaaq-aaafa-cai/proposal/99" target="_blank">99</a>, ICPCoins was released from DKP's (formerly SNS-1's) control. Neutrinite was formed to
govern it and other projects Anvil intended to create.
                    </p>

                    <!-- paragraph -->
                    <p>
From discussions with team members, as well as information provided in the <a href="https://drive.google.com/file/d/1PtPMKycqh6evLdpHGcAd3dJ_IowgrluY/view" target="_blank">whitepaper</a> and proposal
<a href="https://dashboard.internetcomputer.org/sns/extk7-gaaaa-aaaaq-aacda-cai/proposal/273" target="_blank">273</a>, the following team information has been identified:
                    </p>

                    <!-- unordered list -->
                    <ul>
                      
                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
Anvil is the lead dev. He has over 25 years of experience as an entrepreneur specializing in
Internet websites and applications. He has an extensive list of involvement in the ICP ecosystem,
including being the winner of the first public DFINITY hackathon, recipient of DFINITY grants,
and having developed over 37 repositories. Prior to this, he co-led <a href="http://aula.bg/" target="_blank">aula.bg</a>, the number one online
education center in Bulgaria, where he built all of its systems in-house.
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
The CFO is accomplished with a robust background in finance and legal operations, specializing
in steering large corporations through complex financial landscapes.
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
Jesse is a contributor to the ICP Neuron, SNS, and cycles vector components. He is a software
engineer and entrepreneur with 3+ years focused on ICP. He shipped Kontribute (1000 MAU at
peak; Supernova SocialFi winner), Rakeoff (10k+ ICP staked at peak; Encode Club Blue Skies
winner), and NeuronPool (affiliate UI for Neutrinite). He was previously a front-end engineer at a
leading financial services firm and has a BSc (Hons) in Business & Computing.
                        </p>

                      </li>

                    </ul>

                    <!-- paragraph -->
                    <p>
The team also has an assistant, advisors, and some freelancers from time to time.
                    </p>

                    <!-- paragraph -->
                    <p>
Project funding proposals:
                    </p>

                    <!-- unordered list -->
                    <ul>
                      
                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
Via proposal <a href="https://dashboard.internetcomputer.org/sns/extk7-gaaaa-aaaaq-aacda-cai/proposal/18" target="_blank">18</a>, the team was funded with a total of 15,500 ICP from the treasury
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
Via proposals <a href="https://dashboard.internetcomputer.org/sns/extk7-gaaaa-aaaaq-aacda-cai/proposal/24" target="_blank">24</a> and <a href="https://dashboard.internetcomputer.org/sns/extk7-gaaaa-aaaaq-aacda-cai/proposal/26" target="_blank">26</a>, a total of 4195 ICP was transferred from the treasury to fund DeFi
Vector audits
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
Via proposal <a href="https://dashboard.internetcomputer.org/sns/extk7-gaaaa-aaaaq-aacda-cai/proposal/84" target="_blank">84</a>, the team was funded with a total of 27,500 ICP from the treasury
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
Via proposal <a href="https://dashboard.internetcomputer.org/sns/extk7-gaaaa-aaaaq-aacda-cai/proposal/206" target="_blank">206</a>, 2000 ICP was transferred from the treasury to fund Toolkit development
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
Via proposal <a href="https://dashboard.internetcomputer.org/sns/extk7-gaaaa-aaaaq-aacda-cai/proposal/274" target="_blank">274</a>, Jes was funded with a total of 10,000 ICP from the treasury
                        </p>

                      </li>

                    </ul>

                    <hr>

                    <!-- heading -->
                    <h3 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h1">
                      Token Utility
                      <i class="fa-solid fa-circle-info" 
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Examine the token's purpose and functionality within its ecosystem to ensure it provides tangible value and practical use cases"></i>
                    </h3>  
                    
                    <!-- paragraph -->
                    <p>
The NTN token serves as the governance token for Neutrinite, enabling members to submit and vote on
proposals that are implemented if approved.
                    </p>

                    <h4 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h2 mt-4">
                      Token Data Aggregator
                    </h4>

                    <!-- paragraph -->
                    <p>
Neutrinite's homepage aggregates real-time information about tokens in the ICP ecosystem. The token
directory provides a list of tokens sortable by 24h price change, MCAP, volume, LP APY, LP score, and
LP TVL, as well as neuron APY and liquid treasury size for SNS tokens. Token pages provide the price
chart, ledger address, DEX info, and info on all LP pairs. Token pages for SNS tokens also provide launch
info, supply info, treasury info, voting info, and relevant addresses.
                    </p>

                    <h4 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h2 mt-4">
                      Vectors
                    </h4>
                    
                    <!-- paragraph -->
                    <p>
Neutrinite introduced vectors, which automate DeFi operations. These were designed with DAOs in mind
as key users, as they autonomously perform tasks without the need for constant manual oversight or
repeated governance votes.
                    </p>

                    <!-- paragraph -->
                    <p>
Current vector types include:
                    </p>

                    <!-- unordered list -->
                    <ul>
                      
                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
<a href="https://neutrinite.io/vector/create/togwv-zqaaa-aaaal-qr7aa-cai/throttle" target="_blank">Throttle</a>: Send a fixed or randomized range of tokens at a fixed or randomized range interval
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
<a href="https://neutrinite.io/vector/create/togwv-zqaaa-aaaal-qr7aa-cai/switcher" target="_blank">Switcher</a>: Same as throttle, but it randomly switches between two destinations at regular intervals
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
<a href="https://neutrinite.io/vector/create/togwv-zqaaa-aaaal-qr7aa-cai/exchange" target="_blank">Exchange</a>: Swaps tokens at a regular interval with configurable max acceptable slippage and rate
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
<a href="https://neutrinite.io/vector/create/togwv-zqaaa-aaaal-qr7aa-cai/split" target="_blank">Split</a>: Splits tokens at a defined ratio from a source to up to 10 destinations
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
<a href="https://neutrinite.io/vector/create/togwv-zqaaa-aaaal-qr7aa-cai/exchange_liquidity" target="_blank">Exchange Liquidity</a>: The add mode adds tokens to liquidity at a defined price range, and the
remove mode removes all liquidity from the pool and sends it to a destination
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
<a href="https://neutrinite.io/vector/create/togwv-zqaaa-aaaal-qr7aa-cai/auto_liquidity" target="_blank">Auto Liquidity</a>: Rebalances liquidity at regular intervals according to pre-defined ranges
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
<a href="https://neutrinite.io/vector/create/togwv-zqaaa-aaaal-qr7aa-cai/vault" target="_blank">Vault</a>: Stores tokens
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
<a href="https://neutrinite.io/vector/create/togwv-zqaaa-aaaal-qr7aa-cai/balancer" target="_blank">Balancer</a>: Maintains specified value ratios between two tokens by automatically rebalancing. Also
periodically sends tokens to destinations
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
<a href="https://neutrinite.io/vector/create/6jvpj-sqaaa-aaaaj-azwnq-cai/devefi_jes1_icpneuron" target="_blank">ICP Neuron</a>: Stakes ICP and sends maturity to a destination
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
<a href="https://neutrinite.io/vector/create/6jvpj-sqaaa-aaaaj-azwnq-cai/devefi_jes1_snsneuron" target="_blank">SNS Neuron</a>: Stakes SNS tokens and sends maturity to a destination
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
<a href="https://neutrinite.io/vector/create/6jvpj-sqaaa-aaaaj-azwnq-cai/devefi_jes1_ntcmint" target="_blank">Mint NTC</a>: Mints NTC from ICP
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
<a href="https://neutrinite.io/vector/create/6jvpj-sqaaa-aaaaj-azwnq-cai/devefi_jes1_ntcredeem" target="_blank">Redeem NTC</a>: Redeems NTC for cycles
                        </p>

                      </li>

                    </ul>

                    <!-- paragraph -->
                    <p>
Vectors can be chained together by being set as destinations. For most vectors, creation incurs a one-time
fee of 2 NTN, which is refunded upon the vector's deletion. Operations such as modifying or withdrawing
from the vector incur a fee of 0.0002 NTN. ICP neuron vectors take a 5% from maturity being sent to a
destination. SNS neuron vectors charge 0.05 NTN per day. Mint NTC vectors charge 0.0000002 NTN per
transaction to destination. Redeem NTC vectors charge 0.00000005 NTN per transaction to destination.
Fees are expected to change.
                    </p>

                    <h4 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h2 mt-4">
                      DEX
                    </h4>

                    <!-- paragraph -->
                    <p>
The Neutrinite DEX was built for vectors involved in exchange operations - Exchange, Exchange
Liquidity, Auto Liquidity, and Balancer. The user-facing end of the Neutrinite DEX could be considered a
by-product of its primary use case, and it is unknown if the NTN devs intend to focus their efforts to cater
it to users. Neutrinite DEX offers intelligent routing, which enables any token to be swapped for any
token on the platform, and concentrated liquidity, which enables liquidity to be provided within specified
price ranges (amplifying risk of impermanent loss as ranges get tighter). Each hop in a trade route charges
a 0.3% LP fee.
                    </p>

                    <!-- paragraph -->
                    <p>
For now, only tokens that are vector ready are supported, which consist of ICP, cICP, SNS tokens, and
ChainKey tokens. Arbitrage bots have been created that, rather than aiming to profit, only aim to break
even on trades that synchronize prices with those on other DEXes and CEXes. This gives an advantage in
conducting small trades over time.
                    </p>

                    <h4 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h2 mt-4">
                      cICP
                    </h4>

                    <!-- paragraph -->
                    <p>
<a href="https://forum.dfinity.org/t/cicp-compounding-stream-icp-liquid-staking-token/49663" target="_blank">Compounding Stream ICP (cICP)</a> is a liquid staking token. Liquid staking tokens represent a transferable
claim on staked tokens that benefits from staking rewards while staying usable elsewhere. With cICP, the
benefit comes from token burns.
                    </p>

                    <!-- paragraph -->
                    <p>
Users mint cICP by depositing ICP and receiving cICP at the prevailing mint rate, a rate that can be
expected to rise as past buyback-and-burns retire supply. cICP buybacks-and-burns are implemented via
two mechanisms, of which only one is currently active. 95-98% (adjustable via governance) of the ICP
used to mint cICP is routed to an 8-year ICP neuron. 95% of this neuron's maturity is routed via an
exchange vector to purchase cICP; the purchased tokens are then sent to a burn vector, permanently
retiring them from supply. The remaining 5% of the neuron's maturity does the same but with NTN.
                    </p>

                    <!-- paragraph -->
                    <p>
The remaining 2-5% of ICP used to mint cICP is diverted to the Node Provider Vault, where it is
progressively converted to USDT via an exchange vector. This USDT will be used to finance IC nodes
(hardware, hosting, ops). IC nodes are independently run replica servers that join IC subnets to execute
canister smart contracts, store state, and participate in consensus for NNS-set rewards. Neutrinite is yet to
finance/establish nodes; when it does, their monthly NP rewards will add to cICP's and NTN's (same 95/5
split) buyback and burn. The governance-tuned 2-5% split will be used to align cICP's share of NP
rewards with its share of network voting power. It is projected that after the first nodes come online and
begin providing node rewards, <a href="https://forum.dfinity.org/t/cicp-compounding-stream-icp-liquid-staking-token/49663/188" target="_blank">a deflation of 20%+ can be expected yearly for cICP</a>.
                    </p>

                    <!-- paragraph -->
                    <p>
This buyback mechanism creates a price stabilization effect: if cICP trades below its mint rate, more cICP
will be burned per ICP generated from staking and node rewards, effectively increasing the deflationary
pressure and rewarding long-term holders. This design aims to insulate cICP holders from dilution driven
by ICP issuance (voting rewards and NP rewards). The cICP neuron currently follows Anvil's neuron.
When the cICP neuron reaches ~ 400,000 ICP, a proportional-representation system will be introduced to
let cICP holders follow other neurons.
                    </p>

                    <h4 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h2 mt-4">
                      NTC
                    </h4>

                    <!-- paragraph -->
                    <p>
ICP is burned to mint cycles, and cycles are burned to power the canister smart contracts running on the
Internet Computer Protocol. They can be compared to “gas” for Ethereum. Cycles reflect the real cost of
compute operations, and the protocol pegs their unit so that 1 trillion cycles = 1 XDR (a basket of USD,
EUR, CNY, JPY, and GBP). Raw cycles can only be 'redeemed' by powering canisters.
                    </p>

                    <!-- paragraph -->
                    <p>
<a href="https://forum.dfinity.org/t/ntc-not-that-cycles/54120" target="_blank">Neutrinite Trillion Cycles (NTC)</a> tokenizes cycles into the ICRC-1 token standard so they can be held,
transferred, traded, and used to top up canisters. NTC is aimed at making it easier to top up canisters -
simply by transferring the token, canisters can be topped up automatically since each canister has a
unique ICRC-1 address. Vectors enable these operations to run autonomously and be tailored to different
use cases, with vectors in place to easily top up multiple canisters simultaneously. There is a 0.1 NTC fee
for cycle top-ups, and the ledger fee is 0.005 NTC. NTC vectors charge NTN fees.
                    </p>

                    <h4 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h2 mt-4">
                      Roadmap
                    </h4>

                    <!-- paragraph -->
                    <p>
There is no public roadmap for Neutrinite, the team's modus operandi so far appears to be hinting at what
they'll do next and revealing it once they're close to done with it.
                    </p>

                    <!-- paragraph -->
                    <p>
Anvil concluded the forum post that introduced NTC with: “Next up: multi-chain tokens. Crypto, brace
for impact!”.
                    </p>
                    
                    <hr>

                    <!-- heading -->
                    <h3 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h1">
                      Ecosystem Alignment
                      <i class="fa-solid fa-circle-info" 
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Evaluate the token's synergy with other ICP projects, including any existing collaborations and suitability for inclusion in the Salsa Season rewards program."></i>
                    </h3>  

                    <!-- paragraph -->
                    <p>
NTN tries to serve as a "swiss army knife" for the Internet Computer ecosystem, maximizing the use of
ICP's unique capabilities to serve multiple user groups. For traders, NTN provides a comprehensive
dashboard displaying asset prices across ICP, liquidity metrics across multiple DEXs (including its own),
APY rates for liquidity provision, and staking yields in neurons. The platform offers oracle-based
automated trading and liquid staking opportunities through its DEX and cICP. For developers, NTN
provides NTC (tokenized cycles) to simplify canister management and operation costs.
                    </p>

                    <!-- paragraph -->
                    <p>
Perhaps most importantly, vectors provide essential utility to DAOs. They simplify the creation of
automated and trustless treasury ops that can be chained together. They are especially useful when
considering exchange operations. Public, week-long proposal windows make large treasury swaps easy to
game, prices drift while voting is open, DEX depth is thin (high slippage), CEX routes need custodians,
and DIY canisters need maintenance to interface with DEXes. Neutrinite's vectors solve all of this: the
DAO configures a vector once (rate, slippage, schedule) and updates it by proposal; an internal matcher
executes small, frequent swaps at oracle (XRC) reference prices; arbitrage bots import external liquidity;
there are no taker/maker fees; and matching occurs atomically inside the canister. Together, this reduces
the manipulation surface and maintenance burden, removes custodial risk, and improves execution
                    </p>

                    <!-- paragraph -->
                    <p>
Vectors are used to run Sneed DAO's tokenomics model, the <a href="https://app.sneeddao.com/rll_info" target="_blank">Recursive Liquidity Loop (RLL)</a>. Sneed
DAO has also used vectors to purchase and stake <a href="https://x.com/NeuronPool/status/1939337520224825788" target="_blank">NTN</a> and <a href="https://x.com/NeuronPool/status/1932935025298751533" target="_blank">KONG</a>. TACO DAO is also utilising vectors.
The throttle vector is used to top up the portfolio with ICP gradually, avoiding a sharp imbalance which
would make portfolio trading easier to predict. The exchange vector was used to buy back TACO. A
TACO DAO-controlled ICP neuron has been created with the neuron vector.
                    </p>

                    <!-- paragraph -->
                    <p>
cICP will unlock NP rewards for anyone: once the node-provider leg is live, rewards from DAO-run
nodes are routed into continuous cICP and NTN buybacks, so holders share in a stream that previously
accrued only to node providers themselves. This channels a slice of issuance into on-chain demand,
potentially increasing the odds of value staying inside the ecosystem, contingent on the assumption that
broader ecosystem participants are less likely to sell than node providers.
                    </p>

                    <!-- paragraph -->
                    <p>
While no details were laid out when Anvil stated his upcoming cross-chain plans, considering his diverse
and innovative product portfolio, what he is building likely has potential to expose ICP to wider
cryptocurrency ecosystems.
                    </p>

                    <!-- paragraph -->
                    <p>
Other examples of ecosystem alignment include:
                    </p>

                    <!-- unordered list -->
                    <ul>
                      
                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
~25k NTN airdropped to SNS1 holders
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
<a href="https://x.com/swaprunner/status/1909355464661295467" target="_blank">Sponsored achievements on SwapRunner</a>
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
<a href="https://dashboard.internetcomputer.org/sns/extk7-gaaaa-aaaaq-aacda-cai/proposal/206" target="_blank">Funded remco to get vector integrations on the toolkit app</a>
                        </p>

                      </li>

                    </ul>

                    <hr>

                    <!-- heading -->
                    <h3 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h1">
                      Community
                      <i class="fa-solid fa-circle-info" 
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Assess the size and engagement of the token's community to gauge long-term adoption potential"></i>
                    </h3>  

                    <!-- paragraph -->
                    <p>
Anvil's discord server is inactive and there is no OpenChat community.
                    </p>

                    <!-- paragraph -->
                    <p>
On X, anvil_ic has 4528 followers and NeuronPool has 1403 followers.
                    </p>
                    
                    <hr>

                    <!-- heading -->
                    <h3 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h1">
                      Technology
                      <i class="fa-solid fa-circle-info" 
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Review the project's technical foundation, focusing on code quality, scalability, and how effectively it leverages ICP's capabilities"></i>
                    </h3>  

                    <!-- paragraph -->
                    <p>
The SNS framework is regularly updated and vetted by the Network Nervous System (NNS) community,
which oversees the entire ICP ecosystem. This vigilance ensures the adherence of NTN's governance
framework to the most rigorous standards of security and efficiency. The defivectors codebase
demonstrates exceptional code quality, having completed <a href="https://github.com/Neutrinomic/defivectors/blob/main/audits/20240419-RIVVIR-NTN-DeFiVectors_final.md" target="_blank">professional audit by RIVVIR Tech LLC</a> with
no high-severity vulnerabilities identified, and implements sophisticated actor model patterns where each
vector operates as an autonomous canister.
                    </p>

                    <!-- paragraph -->
                    <p>
Each vector runs an on-chain timer leveraging ICP's <a href="https://internetcomputer.org/docs/references/ic-interface-spec#heartbeat" target="_blank">heartbeats</a>; at every tick it reads deposits from its
ledger subaccount and applies its policy in issuing transfers. The architecture employs Redux-style
reducer patterns for predictable state transitions, integrated with ICP's stable memory through custom
sliding window buffers that achieve O(sqrt(n)) memory efficiency. The DeVeFi ledger middleware
provides internal atomicity, transactions achieve finality upon local queue inclusion before syncing with
the ledgers, fundamentally solving async complexity. Transfers carry unique identifiers to guarantee
idempotent retries.
                    </p>

                    <!-- paragraph -->
                    <p>
Load testing demonstrates exceptional scalability with successful management of 1000 concurrent vectors
<a href="https://forum.dfinity.org/t/devefi-ledger-icrc-ledger-middleware/27274/11" target="_blank">processing 91 transactions/second to ledger and 250 transactions/second from ledger</a>. The system's
memory-limited queuing is bounded only by canister memory and instruction limits, not by network or
external dependencies.
                    </p>

                    <!-- paragraph -->
                    <p>
For exchange vectors, a timer-driven matcher aggregates all exchange-related vector intents every 3
seconds, references XRC prices, builds a transient book, and executes matched orders atomically at the
midpoint. The system achieves MEV resistance through time-based trading and wobbling parameters that
make bot exploitation harder. There are no taker/maker fees, external liquidity is drawn in by arbitrage,
and the design favors small, frequent swaps with internal atomicity that eliminates many async-related
vulnerabilities common in DeFi.
                    </p>

                    <!-- paragraph -->
                    <p>
The <a href="https://neutrinite.io/streamfusion/cICP" target="_blank">cICP liquid staking implementation</a> leverages the vector infrastructure through a multi-layered
autonomous system. Exchange vectors automatically route 95% of neuron maturity rewards to purchase
cICP tokens from the open market, while other vectors immediately destroy these purchased tokens,
reducing total supply. A separate node provider vector converts the remaining 2-5% of mint input into
USDT for hardware financing, with future node rewards feeding back into the same exchange-burn vector
cycle. This creates a deflationary mechanism where the mint rate (mint_input / total_ledger_supply)
continuously increases as supply contracts while the underlying ICP stake grows from compound neuron
maturity.
                    </p>

                    <!-- paragraph -->
                    <p>
Rather than distributing yield directly, cICP achieves maximum return through mathematical deflation
combining three revenue streams: 8-year neuron staking rewards (~10-15% APY), future node provider
rewards (when operational), and automatically compounding maturity while burning tokens creating
scarcity. When market price falls below mint rate, more cICP tokens are burned per unit of ICP reward,
accelerating deflation and mechanically increasing holder value through supply reduction rather than
token distribution.
                    </p>

                    <!-- paragraph -->
                    <p>
The system also leverages ICP's native <a href="https://internetcomputer.org/docs/references/system-canisters/xrc" target="_blank">Exchange Rate Canister</a> (XRC) which represents a fundamental
departure from traditional oracle architectures. Unlike external oracle networks requiring token incentives
and trusted nodes, XRC achieves consensus through deterministic execution where all subnet nodes
perform identical HTTPS outcalls to multiple exchange APIs simultaneously. This eliminates oracle token
economics, removes single points of failure, and prevents manipulation through cryptographic consensus
rather than economic incentives.
                    </p>

                    <!-- paragraph -->
                    <p>
NTN has implemented sophisticated cycles management <a href="https://forum.dfinity.org/t/ntc-not-that-cycles/54120" target="_blank">through NTC (Neutrinite Trillion Cycles)</a> with
built-in DoS resistance mechanisms. The system employs a priority-based mempool architecture where
transaction processing follows FIFO ordering with priority weighting - higher NTC transaction amounts
receive faster processing while failed calls have their priority halved. This parallel processing system
handles up to 80,000 transactions per 5 seconds, creating natural protection against cycles drain attacks by
making it economically expensive for attackers to maintain high priority while legitimate high-value
transactions get processed first. This approach eliminates the traditional requirement for thousands of
timer calls that cost ~$30/month and cause network congestion, representing a significant advancement in
canister resource management and attack resistance.
                    </p>
                    
                    <hr>

                    <!-- anon container -->
                    <div class="d-flex flex-wrap" style="gap: 1rem 3rem;">

                      <!-- left -->
                      <div>

                        <!-- heading -->
                        <h3 class="taco-report-explorer__report-heading
                                  taco-report-explorer__report-heading--h1">
                          Tokenomics
                          <i class="fa-solid fa-circle-info" 
                            data-bs-toggle="tooltip" 
                            data-bs-placement="top" 
                            title="Analyse the supply and distribution of the token; any inflationary/deflationary mechanisms; and any incentive structures, to ensure sustainability and fair distribution"></i>
                        </h3>

                        <!-- unordered list -->
                        <ul>

                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              Total Supply: 1,031,810
                            </p>
                            
                          </li>

                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>

                              <!-- link -->
                              <a href="https://app.sneeddao.com/sneedlock" target="_blank">
                                Circulating Supply: 544,177
                              </a>

                            </p>
                            
                          </li>

                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              Unlocked Circulating Supply: 117,541
                            </p>
                            
                          </li>                          
                          
                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              Burn per transaction: 0.0001 NTN
                            </p>
                            
                          </li>
                          
                          <!-- holders -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              Holders:
                            </p>

                            <!-- unordered list -->
                            <ul style="list-style-type: disc">

                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Top - 48.34% (Treasury)
                                </p>

                              </li>

                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Second - 2.97% (NTN Governance)
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Third - 2.97% (NTN Governance)
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Mean of Top 25 - 3.2464%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Median of Top 25 - 0.99%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Top 25 Total - 81.16%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Mean of Top 100 - 0.9299%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Median of Top 100 - 0.17%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  Top 100 Total - 92.99%
                                </p>
                                
                              </li>                          

                            </ul>
                            
                          </li> 
                          
                          <!-- treasury -->
                          <li>
                            
                            <!-- paragraph -->
                            <p class="fw-bold">
                              Treasury:
                            </p>

                            <!-- paragraph -->
                            <p>
As per <a href="https://neutrinite.io/currencies/NTN" target="_blank">Neutrinite</a> and the <a href="https://dashboard.internetcomputer.org/sns/extk7-gaaaa-aaaaq-aacda-cai" target="_blank">Internet Computer dashboard</a> on the 25th of August, the total USD value of the
treasury is $3,658,246.94. This consists of:
                            </p>

                            <!-- unordered list -->
                            <ul style="list-style-type: disc">

                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  487,633 NTN ($3,058,482.94)
                                </p>

                              </li>  
                              
                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  30,735.61 ICP ($164,497)
                                </p>

                              </li>  

                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  5,226 ICS ($32)
                                </p>

                              </li>  

                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  152,833.95 ckUSDT ($152,834)
                                </p>

                              </li> 
                              
                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  38,000 cICP ($205,595)
                                </p>

                              </li> 
                              
                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  328,009.19 staked WTN ($50,906)
                                </p>

                              </li> 
                              
                              <!-- list item -->
                              <li>
                                
                                <!-- paragraph -->
                                <p>
                                  3,445,935.46 staked KONG ($32,346)
                                </p>

                              </li>                               

                            </ul>
                            
                          </li>

                        </ul>

                      </div>

                      <!-- center -->
                      <div>

                        <!-- heading -->
                        <h3 class="taco-report-explorer__report-heading
                                  taco-report-explorer__report-heading--h1">
                          Market Metrics
                          <i class="fa-solid fa-circle-info" 
                            data-bs-toggle="tooltip" 
                            data-bs-placement="top" 
                            title="Review key indicators such as trading volume and historical market performance."></i>
                        </h3>

                        <!-- paragraph -->
                        <p class="fw-bold">
                          NTN
                        </p>

                        <!-- unordered list -->
                        <ul>

                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              All Time High (USD): 18.144
                            </p>
                            
                          </li>

                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              All Time Low (USD): 2.159
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              As at 24/08/25(USD): 6.069
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              Change from ATH USD: -66.55%
                            </p>
                            
                          </li>                      

                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              Change from ATL USD: 181.1%
                            </p>

                          </li>

                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
                              USD Volume 24H as at 24/08/25: 3898
                            </p>
                            
                          </li>

                        </ul> 

                        <!-- paragraph -->
                        <p class="fw-bold">
                          cICP
                        </p>     
                        
                        <!-- paragraph -->
                        <p>
The only metric we consider relevant for cICP in this report is its price relative to ICP. As per Neutrinite
on 24th of August, cICP is priced 5.5265 while ICP is priced 5.446, which is a premium of 1.47815%.
The mint rate sits at a premium of 3.82%.
                        </p>                          

                      </div>

                      <!-- right -->
                      <div>

                        <!-- heading -->
                        <h3 class="taco-report-explorer__report-heading
                                  taco-report-explorer__report-heading--h1">
                          Liquidity
                        </h3>

                        <!-- paragraph -->
                        <p class="fw-bold">
                          NTN
                        </p>

                        <!-- paragraph -->
                        <p>
                          As per <a href="https://swaprunner.com" target="_blank">SwapRunner</a> on the 23rd of August, a single transaction of:
                        </p>

                        <!-- unordered list -->
                        <ul>

                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
20000 ICP ($107760) will result in a trade to 4289.68325 NTN ($26086.62). 75.79% lost to price
impact
                            </p>
                            
                          </li>

                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
10000 ICP ($53880) will result in a trade to 3494.086 NTN ($21248.37). 60.56% lost to price
impact
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
1000 ICP ($5388) will result in a trade to 786.23353 NTN ($4781.27). 11.26% lost to price
impact
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
250 ICP ($1347) will result in a trade to 214.33719 NTN ($1303.43) 3.23% lost to price impact
                            </p>
                            
                          </li>

                        </ul>

                        <!-- paragraph -->
                        <p>
As can be seen, liquidity for NTN is very limited on ICPSwap and KongSwap. In this topic, Neutrinite is
an edge case compared to projects previously reviewed, as the majority of its liquidity exists on the
Neutrinite DEX. As there are arbitrage bots that only break even to synchronize prices between the three
DEXes, and as TACO DAO trades in a small and frequent fashion, losses to price impact can be expected
to be less drastic than shown above. Whatever the effective slippage rate actually is when accounting for
this factor, if liquidity is not recycled, and there are no 'sells' between the DAO's 'buys', the effective
slippage rate will be identical regardless of whether multiple small transactions or one large one take
place.
                        </p>

                        <!-- paragraph -->
                        <p class="fw-bold">
                          cICP
                        </p>

                        <!-- paragraph -->
                        <p>
                          As per <a href="https://swaprunner.com" target="_blank">SwapRunner</a> on the 24th of August, a single transaction of:
                        </p>

                        <!-- unordered list -->
                        <ul>
                          
                          <!-- list item -->
                          <li>
                            
                            <!-- paragraph -->
                            <p>
250 ICP ($1320) will result in a trade to 243.9235 cICP ($1311.3) 0.659% lost to price impac
                            </p>
                            
                          </li>

                        </ul>  
                        
                        <!-- paragraph -->
                        <p>
As cICP is backed by ICP, it can be expected to follow the price of ICP. Therefore, cICP's liquidity should
not be a concern for TACO DAO's trading operations.
                        </p>

                      </div>                      

                    </div>

                    <hr>

                    <!-- headings -->
                    <h3 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h1">
                      Competitors
                      <i class="fa-solid fa-circle-info" 
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Identify similar projects and assess the token's differentiators alongside the perceived competitive positioning within its niche"></i>
                    </h3>

                    <h4 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h2 mt-4">
                      Cryptocurrency Data Aggregators
                    </h4>

                    <!-- paragraph -->
                    <p>
Neutrinite's token data aggregator puts it in competition with broader platforms such as CoinMarketCap,
CoinGecko, and DefiLlama. All of these have broader reach and are not limited to the ICP ecosystem,
while Neutrinite is - for now. Neutrinite differentiates via an on-chain, DAO-governed model that aims to
minimize listing bias and make methodologies transparent and upgradeable on-chain. Its core wedge is
verifiable data provenance (direct reads from IC/SNS/DEX canisters, auditable transforms, XRC-based
pricing) and machine-first distribution (on-chain feeds and developer-friendly APIs that dApps, DAOs,
and wallets can consume without a Web2 chokepoint).
                    </p>
                    
                    <!-- paragraph -->
                    <p>
This decentralized model has potential to avoid prior actualized sector risks, such as conflicts-of-interest
and data integrity. A conflict-of-interest example: when CMC was acquired by Binance, <a href="https://www.coindesk.com/markets/2020/06/08/coinmarketcap-metric-overhaul-keeps-owner-binance-at-the-top" target="_blank">within weeks
CMC's ranking overhaul pushed Binance to #1</a>, sparking criticism over a “web traffic” factor and
perceived partiality. A data integrity example: <a href="https://static.bitwiseinvestments.com/Research/Bitwise-Asset-Management-Analysis-of-Real-Bitcoin-Trade-Volume.pdf?utm_source=chatgpt.com" target="_blank">Bitwise's 2019 analysis</a> submitted to the SEC found that
~95% of reported BTC spot volume on major aggregators was fake or non-economic, prompting the
industry to shift from raw self-reported volume toward liquidity/quality-based metrics. Neutrinite
mitigates these risks by anchoring datapoints on-chain and routing methodology changes through
transparent DAO governance.
                    </p>

                    <!-- paragraph -->
                    <p>
More broadly, the centralization of existing platforms, driven by their interests and incentives, introduces
a bias in the representation and visibility of various projects and actual technological progress. DAO
governance avoids this, as decentralization opens the door to representation of broader interests; no single
party can quietly tilt the table, and any bias becomes visible, contestable, and correctable.
                    </p>

                    <!-- paragraph -->
                    <p>
ICPTokens is Neutrinite's primary competitor as an ICP-focused token data aggregator with broader token
coverage plus Watchlist and Portfolio tools. It does not have a native token, it does not provide
information related to liquidity on individual tokens, nor does it have SNS-specific information.
                    </p>

                    <h4 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h2 mt-4">
                      Vectors
                    </h4>

                    <!-- paragraph -->
                    <p>
We are unable to identify a product that is closely comparable to DeFi vectors. The following is an
especially subjective take on what the competitive positioning of vectors is.
                    </p>

                    <!-- paragraph -->
                    <p>
Vectors could be described as building blocks of policies that define what is done with input tokens.
These building blocks can be arranged in different ways. We believe this collapses all sorts of DeFi
products into one 'policy layer'. To illustrate this, we point to cICP. cICP is a liquid staking token that is
composed of vectors. It exemplifies that many kinds of DeFi products can be created with vectors. These
products, being composed of 'plug-and-play' building blocks, would be easy to assemble, edit, and
disassemble. With Anvil's recent announcement to expand cross-chain, it could be speculated that this
policy layer could span networks. We will not venture to speculate on the inherent value of this policy
layer much further, but simply point out that the early example of a product composed of vectors, cICP, is
a superior liquid staking token to the only other liquid staking token in the ICP ecosystem, nICP. We
demonstrate why in a subsection below.
                    </p>

                    <!-- paragraph -->
                    <p>
A broader consideration for the competitive positioning of vectors is their relation to DAOs. We believe
vectors to be part and parcel of DAOs. From this, we infer that whatever it is that DAOs are competing
with, vectors are competing with it as well.
                    </p>

                    <!-- paragraph -->
                    <p>
At the most basic interpretation, the necessity of DAOs stems from the desirability of a 'middle-point' in
trust. A project could be blackholed to guarantee full trust, but then it has no controller, and therefore
cannot evolve. However, if you give control to a controller, something could be broken or lost on purpose
or incident. DAOs distribute control between many token holders so a project can continue evolving
without the single point of error. This is beneficial in crypto, where there is no assurance for assets
through legal systems. This is the most concrete take on this technology.
                    </p>

                    <!-- paragraph -->
                    <p>
A much heavier weight is put on the potential of DAOs by many, including the authors of this report. In
this more open take, the inherent characteristics of DAO technology position it as a challenger to existing
organisations where decisions are made top-down. A basic summary of this sentiment is that the
technology could be used to better recruit the intellect of the many through liquid democracy, and create
systems where there is minimal friction for rewardable contribution through smart contracts.
                    </p>

                    <!-- paragraph -->
                    <p>
Vectors could actualise the potential of DAOs as they give DAOs maximised agency over their assets.
Without vectors, for a DAO's vote on what to do with its assets to be carried out efficiently would require
a constant production stream of custom canisters. These canisters would likely cease to work when
whatever they interface with changes, and would also require custom maintenance when changes are
needed. This causes a DAO to depend on the unwavering diligence of a development team, which will
oftentimes waver. Rather, with vectors, the DAO's will can be carried out by a series of easy-to-use,
plug-and-play commands that can fit together and be edited seamlessly. These are maintained externally
and have passed audits. Those involved in exchange operations integrate into existing liquidity in an
exchange environment that has been designed with frequent and small trading in mind, the kind which is
optimal for DAOs. It is because of this that we believe vectors to be essential to the success of DAOs.
And, as we believe DAOs to be competing with traditional top-down organisations, we posit that vectors,
being part and parcel of DAOs, are also competing with traditional top-down organisations
                    </p>

                    <h4 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h2 mt-4">
                      DEXes
                    </h4>

                    <!-- paragraph -->
                    <p>
Neutrinite's AMM DEX puts it in competition with ICP's leading DEXes KongSwap and ICPSwap. It has
not received their adoption, partially due to it being new and its UX being undeveloped, and likely
primarily due to it only supporting ICP, cICP, Chain-Key tokens, and SNS tokens.
                    </p>

                    <!-- paragraph -->
                    <p>
Technologically, Neutrinite's DEX competes well with established platforms through features like
arbitrage trading integration, atomic trades, concentrated liquidity, and intelligent routing, though being
recently out of beta means liquidity is still building and the UX/customer journey requires optimization
for adoption. It should be noted that neither KongSwap nor ICPSwap currently offer both concentrated
liquidity and intelligent routing together, while Neutrinite DEX already integrates both
                    </p>

                    <!-- paragraph -->
                    <p>
In terms of competing with non-ICP DEXes, the same ICP-inherent characteristics can be noted as for
many other ICP projects. These include:
                    </p>

                    <!-- unordered list -->
                    <ul>
                      
                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
On-chain frontend that cannot be censored, hacked, or taken offline.
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
Canister smart contracts that run at web speed with ultra low costs, enabling complex operations.
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
Theoretically near-infinite scalability as more subnets are added.
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
No gas costs to the user via reverse gas.
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
Stable memory enabling information to be stored and queried on-chain, removing reliance on
external databases.
                        </p>

                      </li>

                      <!-- list item -->
                      <li>

                        <!-- paragraph -->
                        <p>
Chain-Key technology enabling secure multi-chain interoperability.
                        </p>

                      </li>

                    </ul>

                    <h4 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h2 mt-4">
                      WaterNeuron & nICP
                    </h4>

                    <!-- paragraph -->
                    <p>
WaterNeuron's neuron ICP (nICP) is the only other liquid staking token (LST) in the ICP ecosystem,
putting WTN & nICP in competition with NTN & cICP. Even though nICP currently has more adoption,
we identify cICP's methodology to have more potential to scale.
                    </p>

                    <!-- paragraph -->
                    <p>
nICP is issued in exchange for ICP tokens, which are locked in a 6-month neuron. The exchange rate for
nICP/ICP is calculated as the ratio of total nICP supply to the total ICP staked in the 6-month neuron,
decreasing over time as maturity accrues, leading to nICP's appreciation relative to ICP. 10% of the
6-month neuron's maturity goes to WTN governance participants and 90% is compounded back into the
same neuron. WaterNeuron has had two sale rounds, with one additional planned, the ICP proceeds from
which are staked into an 8-year neuron. 10% of the 8-year neuron's maturity goes to WTN governance
participants and 90% is compounded into the 6-month neuron. nICP holders can unstake their nICP into
ICP by burning nICP through the redemption protocol, which allocates their proportional share of the
6-month neuron to be split off into a personal 6-month neuron, which immediately begins dissolving,
allowing withdrawal of the original ICP plus accrued rewards after the 6-month period. They can also sell
their nICP on DEXes.
                    </p>

                    <!-- paragraph -->
                    <p>
By contrast, cICP is a non-redeemable LST backed by an 8-year neuron: voting rewards fund continuous
buybacks and burns via a vector, so value accrues through supply contraction. Every new cICP mint feeds
the same long-lock base (max voting power/age bonus), so the buyback budget scales with TVL. nICP
mints expand the 6-month pool (less rewards), while its 8-year base is funded episodically from WTN
sales. nICP's 8-year neuron component will not scale with TVL, it will only be topped-up with one more
WTN sale. This is why we identify cICP's methodology to be more scalable, while WTN's established
8-year neuron gives it a short-term advantage; an LST backed by an 8-year neuron is, at scale, superior to
an LST backed by a 6-month neuron and supported by a capped 8-year neuron. A point to consider is that,
with nICP, redemption is guaranteed after 6 months. This dissolve period has no rewards, and because of
this, it is dubious to expect redemption to be beneficial when compared to DCA-ing out of the position
over a 6-month period instead.
                    </p>

                    <!-- paragraph -->
                    <p>
It would be remiss not to mention the node provider component of the cICP project. According to Anvil, a
node pays for itself in roughly 13 months. If this is accurate, then the node provider component will
provide more ROI in the form of buyback-and-burns than the 8-year neuron component. According to the
<a href="https://klgza-cqaaa-aaaak-qcz5a-cai.icp0.io/" target="_blank">NNS Neuron Sandbox</a>, an 8-year neuron (without auto-staking) would take over 7 years to double itself if
established on 18/08/2025. For extra comparison, the simulation for a 6-month neuron (with auto-staking)
took over 9 years to double itself. These numbers are just for comparison's sake as the simulator cannot
account for the total amount of ICP that will be staked in the NNS.
                    </p>

                    <!-- paragraph -->
                    <p>
As of 18/08/2025, the APY for an 8-year ICP neuron is 12.9%, or up to 16.125% with the maximum
4-year age bonus. 90.25% of this figure can be expected to be around the rate at which the ICP/cICP mint
rate rises while the node provider component is not live. The APY for nICP is currently 15% (according
to WaterNeuron), a figure that will receive a boost on the third and final planned WTN sale. nICP's APY
may also temporarily increase from its 8-year neuron component receiving an age bonus (caps out after 4
years), however, this would be counteracted by increased nICP adoption (8-year component doesn't scale
with it).
                    </p>

                    <hr>
                   
                    <!-- heading -->
                    <h3 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h1">
                      Security Risks
                      <i class="fa-solid fa-circle-info" 
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="Investigate perceived vulnerabilities, any audit reports, and adherence to security and regulatory standards"></i>
                    </h3> 
                    
                    <h4 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h2 mt-4">
                      Audit
                    </h4>

                    <!-- paragraph -->
                    <p>
DeFi Vectors were audited by <a href="https://github.com/Neutrinomic/defivectors/blob/main/audits/20240419-RIVVIR-NTN-DeFiVectors_final.md" target="_blank">RIVVIR Tech</a>. The final audit had 2 medium severity findings, 6 low
severity findings, and 3 informational findings. One medium severity finding was related to potential
front running leak through deterministic subaccounts telegraphing upcoming activity. Anvil responded
that, as vectors execute small, frequent slices with ~2-3s latency at reference/midpoint prices, the
practical front-running surface is tiny; risk rises only if users attempt large trades, which vectors aren't
designed for. This response was accepted but it was advised to warn users. The other medium security
finding was related to a Denial of Service (DoS) through creating a large amount of vectors. Anvil argued
that such an attack would be economically non-feasible. This response was accepted but it was advised to
reconsider the issue as TVL grows. Overall, the core logic appeared sound and the remaining items either
had plans in place to improve code quality, reporting, or were highly difficult issues to take advantage of.
                    </p>

                    <h4 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h2 mt-4">
                      LSTs and Voting Power
                    </h4>

                    <!-- paragraph -->
                    <p>
Liquid staking tokens, in a way, game the rewards system of the token they are backed by. ICP provides
more voting power and rewards for long dissolve delay periods because they represent a vested interest in
the long-term success of ICP; if someone were to attempt to ruin the NNS, they would do so at their own
detriment as they are unable to sell. cICP partially side-steps this, as it gains the extras of 8-year lock-ups
while being readily sellable, though limited by available liquidity. Therefore, voting power gained
through cICP represents a risk to ICP's security, as those intent on harming the network could partially
exit out of their position before such a harm comes fully into effect.
                    </p>

                    <!-- paragraph -->
                    <p>
nICP takes a different approach to voting power than what cICP plans to do. Instead of having
proportional voting representation, like what is planned for cICP holders, WaterNeuron simply gives all
the voting power of the ICP neurons backing nICP to the WaterNeuron DAO. All NNS proposals are
mirrored to WTN DAO for WTN neuron holders to vote on, and the outcome of these votes causes all the
neurons to vote in one block. When compared to cICP, the upside in risk-reduction here is that WTN
neuron holders are not able to readily liquidate should they vote through a proposal that is detrimental to
the network. The downside is that the governance participants of the WTN DAO would have to scale with
nICP adoption for the vested interest to be in proportion to the level of influence. Considering that only
10% of the voting rewards of nICP's neurons go to the WTN DAO, it appears to have little obvious
reason to scale in such a way, unless buyers buy primarily in order to counter the threat that others pose.
                    </p>

                    <!-- paragraph -->
                    <p>
Enabling a large block of voting power to be captured through a potentially much smaller investment
appears, to us, a bigger risk to the network than that perceived from cICP (exit limited by available
liquidity). That said, having multiple liquid staking protocols competing over voting power captured
likely cancels out some of the risk they pose individually.
                    </p>

                    <h4 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h2 mt-4">
                      Node Provider Component
                    </h4>

                    <!-- paragraph -->
                    <p>
The timeline and execution of cICP's node provider component appears unclear or undecided on. The
following two statements are pretty much all the information we've been able to find related to trust and
execution<a href="https://forum.dfinity.org/t/cicp-compounding-stream-icp-liquid-staking-token/49663/167" target="_blank">[1]</a><a href="https://neutrinite.io/streamfusion/cICP" target="_blank">[2]</a>:
                    </p>

                    <!-- quote -->
                    <div class="taco-report-explorer__report-quote">
                      <blockquote cite="#">
                        <p>
“Different LLCs can own the servers, same way RWAs work and mint NFTs for them, which the DAO
holds. The DAO gets all the ICP rewards directly, while the service provider gets ~300$ in NTN. I'll be
happy to support the IC and run some servers to see what the process is and what the obstacles are.”
                        </p>
                      </blockquote>
                      <p>—infu, <cite><a href="https://forum.dfinity.org/t/cicp-compounding-stream-icp-liquid-staking-token/49663/167" target="_blank" class="taco-text-blue-to-light-blue">source</a></cite></p>
                    </div>                     

                    <!-- quote -->
                    <div class="taco-report-explorer__report-quote">
                      <blockquote cite="#">
                        <p>
“NPs lock cICP for a duration so the DAO doesn't take risks.”
                        </p>
                      </blockquote>
                      <p>—https://neutrinite.io, <cite><a href="https://neutrinite.io/streamfusion/cICP" target="_blank" class="taco-text-blue-to-light-blue">source</a></cite></p>
                    </div>                    

                    <!-- paragraph -->
                    <p>
How node providers will be minted as RWA NFTs, and the specifics of the cICP as node provider
collateral scheme are yet to be elucidated upon. The lack of elaboration puts into question the feasibility
of this endeavour, especially in a timely-fashion.
                    </p>

                    <h4 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h2 mt-4">
                      Runway
                    </h4>

                    <!-- paragraph -->
                    <p>
In proposal <a href="https://dashboard.internetcomputer.org/sns/extk7-gaaaa-aaaaq-aacda-cai/proposal/273" target="_blank">273</a>, the Neutrinite team reported their treasury expenditure since genesis up til June this year
(18 months) to be $618,400. As the team has not been requesting funding from the treasury on a regular
schedule, it is difficult to extrapolate how much time they have until they run out of runway (should ICP's
price not change). The treasury expenditure report should not be used as a baseline for predicting future
expenditure, especially considering that some large figures that add to it, such as audits and liquidity
provision, may not be expenditures that require repetition.
                    </p>

                    <!-- paragraph -->
                    <p>
Of the holdings that make up the treasury, the readily liquidatable assets consist of ICP and ckUSDT. As
at 25/08/2025, the value of these totals $317,331. It is difficult to estimate how much all other assets can
contribute to the runway as they are subject to liquidity constraints, and in addition, some would be
subject to dissolve delays. It is unknown how much remains of the previous treasury withdrawal. The
when and how much of the next treasury withdrawal are also unknown.
                    </p>

                    <hr>
                    
                    <!-- back to top link -->
                    <a href="#" @click.prevent="scrollToTop" class="taco-report-explorer__report-link text-center w-100 d-inline-block mt-2">Back to top</a>
                    
                  </div>

                  <!-- report footer -->
                  <div class="taco-report-explorer__report-footer">
                    
                    <!-- left -->
                    <div class="taco-report-explorer__report-footer__left">
                      
                      ❤️🌮
                      
                    </div>
                    
                    <!-- center -->
                    <div class="taco-report-explorer__report-footer__center text-center">
                      
                      &copy;2025 Taco Dao
                      
                    </div>
                    
                    <!-- right -->
                    <div class="taco-report-explorer__report-footer__right">

                      <!-- link group -->
                      <!-- <span class="d-flex flex-column align-items-end">

                        <span class="text-end">#45 Add Token</span>

                        <span class="d-flex gap-2">

                          <a href="https://nns.ic0.app/proposal/?u=lacdn-3iaaa-aaaaq-aae3a-cai&proposal=45" class="taco-text-blue-to-light-blue text-end" target="_blank">NNS</a>                        

                          <a href="https://app.sneeddao.com/proposal?proposalid=45&sns=lacdn-3iaaa-aaaaq-aae3a-cai" class="taco-text-blue-to-light-blue text-end" target="_blank">Sneed Hub</a>

                        </span>
                        
                      </span> -->
                      
                      <!-- link group -->
                      <span class="d-flex flex-column align-items-end">

                        <span class="text-end">#99 Motion to Discuss</span>

                        <span class="d-flex gap-2">

                          <a href="https://nns.ic0.app/proposal/?u=lacdn-3iaaa-aaaaq-aae3a-cai&proposal=99" class="taco-text-blue-to-light-blue text-end" target="_blank">NNS</a>

                          <a href="https://tacodao.com/chat/forum/99" class="taco-text-blue-to-light-blue text-end">Taco Forum</a>

                        </span>
                        
                      </span>

                      <!-- link group -->
                      <span class="d-flex flex-column align-items-end">

                        <span class="text-end">#27 Motion to Research</span>

                        <span class="d-flex gap-2">

                          <a href="https://nns.ic0.app/proposal/?u=lacdn-3iaaa-aaaaq-aae3a-cai&proposal=27" class="taco-text-blue-to-light-blue text-end" target="_blank">NNS</a>

                          <a href="https://tacodao.com/chat/forum/27" class="taco-text-blue-to-light-blue text-end">Taco Forum</a>

                        </span>
                        
                      </span>                      

                    </div>
                    
                  </div>

                </div>
                
              </div>
              
            </div>
            
          </div>

        </div>

      </div>

    </div>

    <!-- footer bar -->
    <FooterBar />

    <!-- message modal -->
    <div v-if="!userAcceptedReportsDisclaimer || userReshownReportsDisclaimer" class="reports__message">
      
      <!-- message -->
      <div class="reports__message__dialog">
        
        <!-- message top -->
        <div class="reports__message__dialog__top px-2 p-2">

          <!-- message top left -->
          <div class="taco-text-white">Disclaimer</div>

          <!-- message top right -->
          <div class="taco-text-black-to-white"></div>

        </div>

        <!-- message middle -->
        <div class="reports__message__dialog__middle">

          <!-- content -->
          <div class="d-flex flex-column align-items-center justify-content-start pt-4 pb-5">

            <!-- hotkey svg icon -->
            <i class="fa-solid fa-triangle-exclamation"
              style="font-size: 5rem; color: var(--dark-orange-to-light-brown);"></i>

            <!-- title -->
            <span class="taco-text-black-to-white d-inline-block text-center px-2 pt-2 pb-1"
              style="font-weight: 600;">
              Legal Disclaimer
            </span>

            <!-- text -->
            <span class="taco-text-black-to-white px-4 pt-2 pb-1 text-center">
              These reports are for informational purposes only and do not constitute investment advice, financial advice, trading advice, legal advice, or any other type of advice. Nothing contained herein should be interpreted as such. No representations or warranties are made regarding the accuracy, completeness, or reliability of the information provided. The authors shall not be liable for any losses or damages—whether direct, indirect, incidental, punitive, or consequential—arising from the use of or reliance on this material. All information is subject to change without notice, and no obligation is assumed to update or revise the content.
            </span>

          </div>

        </div>

        <!-- message bottom -->
        <div class="reports__message__dialog__bottom p-2">

          <!-- message bottom left -->
          <div class="taco-text-black-to-white"></div>

          <!-- message bottom right -->
          <div class="taco-text-black-to-white">

            <!-- close button -->
            <button class="btn taco-nav-btn"
                    @click="acceptReportsDisclaimer(); hideDisclaimerLocally()">
              Got It
            </button>

          </div>

        </div>

      </div> 
      
    </div>

  </div>

</template>

<style scoped lang="scss">

  /////////////////////
  // component style //
  /////////////////////

  // report explorer
  .taco-report-explorer {
    position: relative;
    display: flex;
    flex-wrap: no-wrap;
    color: var(--black-to-white);
    
    // left
    &__left {
      display: flex;
      flex-direction: column;
      width: 100%;
      max-width: 18rem;
      border-right: 1px solid var(--dark-orange);
      border-top-left-radius: 0.5rem;
      border-bottom-left-radius: 0.5rem;
      background-color: var(--orange-to-light-brown);      
    }

    // right
    &__right {
      display: flex;
      width: 100%;
    }

    // title container
    &__title-container {
      margin: 0 1rem 0;
      padding: 1rem 0 0.5rem;
      border-bottom: 1px solid var(--black-to-white);
      transition: border-color 0.125s ease-in-out;
    }

    // title
    &__title {
      position: relative;
      font-size: 1.5rem;
      text-align: center;
      font-family: "Space Mono";
      color: var(--black-to-white);
    }

    // list container
    &__list-container {
      padding-top: 1rem;
    }

    // list
    &__list {
      list-style-type: none;
      padding: 0;
    }

    // list item
    &__list-item {
      // placeholder
    }

    // list report
    &__list-report {
      display: flex;
      gap: 0.75rem;
      padding: 0.5rem 1rem;
      
      // icon
      &__icon {
        min-width: 48px;
        width: 48px;
        max-width: 48px;
        height: 48px;
        border: none;
        border-radius: 999rem;
        background: lightgray;
        background-repeat: no-repeat;
        background-position: center;
        background-size: contain;
        background-color: transparent;
      }

      // title container
      &__title-container {
        display: flex;
        flex-direction: column;
      }    

      // title
      &__title {
        color: var(--black-to-white);
      }

      // hover
      &:hover {
        cursor: pointer;
        background-color: var(--dark-orange-to-brown);
      }  

      // active
      &--active {
        background-color: var(--dark-orange-to-brown);
      }

    }

    // hamburger menu
    &__hamburger-menu {
      display: none;
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      background-color: var(--dark-orange-to-light-brown);
      height: fit-content;
      padding: 0.5rem 0.75rem;
      border-radius: 0.25rem;
      z-index: 2000;
      cursor: pointer;
      border: 1px solid var(--dark-orange);

      // icon
      &__icon {
        font-size: 1.5rem;
        color: white;
      }

    }
    
    // report
    &__report-container {
      padding: 1.5rem 1.5rem;

      // inner
      &__inner {
        padding: 2rem 2rem 0;
        background-color: var(--light-orange-to-dark-brown);
        border-radius: 0.5rem;
        border: 1px solid var(--dark-orange-to-light-brown);
      }

    }

    // report header
    &__report-header {

      // title
      &__title {
        font-size: 2.5rem;
        font-family: "Space Mono";
        color: var(--black-to-white);
      }

      // metadata container
      &__metadata-container {
        // placeholder
      }

      // metadata
      &__metadata {
        font-size: 1rem;
        color: var(--black-to-white);

        * {
          color: var(--black-to-white);
        }

        // icon
        i {
          color: var(--brown-to-light-orange);
        }

      }

    }

    // report body
    &__report-body {
      padding-top: 2rem;
    }

    // report heading
    &__report-heading {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: var(--black-to-white);

      // all headings
      &--h1, &--h2, &--h3, &--h4, &--h5, &--h6 {
        font-family: "Space Mono";
        margin-bottom: 1rem;
      }

      // individual headings
      &--h1 {
        font-size: 2rem;
      }
      &--h2 {
        font-size: 1.5rem;
      }
      &--h3 {
        font-size: 1.25rem;
      }
      &--h4 {
        font-size: 1rem;
      }
      &--h5 {
        font-size: 0.875rem;
      }
      &--h6 {
        font-size: 0.75rem;
      }

      // icon
      i {
        font-size: 1.125rem;
        color: var(--dark-orange-to-brown);
      }

    }

    // report paragraph
    .taco-report-explorer__report-body p {
      font-family: "Rubik";
      line-height: 1.825;
      font-weight: 300;
      color: var(--black-to-white);
    }

    // report ul and ol
    .taco-report-explorer__report-body ul,
    .taco-report-explorer__report-body ol {
      p {
        margin: 0;
      }
    }

    // report ul
    .taco-report-explorer__report-body ul {
      list-style-type: '🌮';
    }

    // report ol
    .taco-report-explorer__report-body ol {
      list-style-type: decimal;
    }

    // report li
    .taco-report-explorer__report-body li {
      padding-left: 0.5rem;
      color: var(--black-to-white);
    }

    // report link
    .taco-report-explorer__report-body a {
      font-family: "Rubik";
      color: var(--blue-to-light-blue);
    }

    // report quote
    &__report-quote {
      border-left: 0.25rem solid var(--dark-orange);
      padding-left: 1rem;
      margin-left: 1rem;
      color: var(--black-to-white);
    }

    // report img
    &__report-img {
      width: fit-content;
      max-width: 100%;
      height: auto;
      border-radius: 0.25rem;
    }

    // report hr
    &__report-container hr {
      margin: 2rem 0 1.5rem;
      color: var(--black-to-white);
    }

    // report footer
    &__report-footer {
      color: var(--black-to-white);
      display: flex;
      width: 100%;
      align-items: flex-start;
      justify-content: space-between;
      margin-top: 2.5rem;
      padding: 0.75rem 0 0.75rem 0;
      border-top: 1px solid var(--dark-orange);
      
      // left
      &__left {
        font-size: 0.8 75rem;
      }

      // center
      &__center {
        opacity: 0.5;
        font-size: 0.875rem;
        color: var(--black-to-white);
      }

      // right
      &__right {
        display: flex;
        flex-direction: column;
        font-size: 0.875rem;
        gap: 0.5rem;
        color: var(--black-to-white);

        * {
          color: var(--black-to-white);
        }
        
      }

    }

  }

  // vote message modal
  .reports__message {
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    justify-content: center;
    align-items: start;
    width: 100%;
    height: 100%;
    background-color: var(--curtain-bg);
    z-index: 99999;
    margin: 0;
    padding: 0;
    overflow: auto;

    // dialog
    &__dialog {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      width: 100%;
      max-width: 40rem;
      border-radius: 0.5rem;
      background-color: var(--light-orange-to-dark-brown);
      border: 1px solid var(--dark-orange);
      overflow: clip;
      margin: 2rem 2rem 2rem;

      // top and bottom
      &__top, &__bottom {
        display: flex;
        width: 100%;
        justify-content: space-between;
        background-color: var(--dark-orange);
      }

      // middle
      &__middle {
        display: flex;
        flex-direction: row;
        align-items: start;
        gap: 2rem;
      }

    }

  }

  ///////////////////
  // media queries //
  ///////////////////

  // phone protrait
  @media (max-width: 575.98px) {
    .taco-report-explorer__left {
      position: absolute;
      top: 0;
      left: 0;
      z-index: 1000;
      border: none;
      outline: 1px solid var(--dark-orange);
      border-radius: 0.5rem;
    }
    .taco-report-explorer__hamburger-menu {
      display: block;
    }
  }
  
  // phone landscape
  @media (min-width: 576px) and (max-width: 767.98px) { 
    .taco-report-explorer__left {
      position: absolute;
      top: 0;
      left: 0;
      z-index: 1000;
      border: none;
      outline: 1px solid var(--dark-orange);
      border-radius: 0.5rem;
    }
    .taco-report-explorer__hamburger-menu {
      display: block;
    }
  }

  // // tablet
  // @media (min-width: 767px) and (max-width: 991.98px) {
    
  // }

  // // small daktop
  // @media (min-width: 992px) and (max-width: 1199.98px) {
    
  // }

  // // medium desktop
  // @media (min-width: 1200px) and (max-width: 1399.98px) {
    
  // }

</style>

<script setup lang="ts">

  /////////////
  // Imports //
  /////////////

  import HeaderBar from "../components/HeaderBar.vue"
  import FooterBar from "../components/FooterBar.vue"
  import { ref, onMounted, watch, computed } from "vue"
  import { useTacoStore } from "../stores/taco.store"
  import { storeToRefs } from "pinia"  
  import { useRoute, useRouter } from 'vue-router'
  import ckBtcIcon from '../assets/tokens/ckbtc.png'
  import sneedIcon from '../assets/tokens/snspng/sneed.png'
  import motokoIcon from '../assets/tokens/snspng/motoko.png'
  import goldDaoIcon from '../assets/tokens/snspng/gold-dao.png'
  import sgldtIcon from '../assets/tokens/sgldt.png'
  import openChatIcon from '../assets/tokens/snspng/openchat.png'
  import kongSwapIcon from '../assets/tokens/snspng/kongswap.png'
  import neutriniteIcon from '../assets/tokens/snspng/neutrinite.png'
  
  ///////////
  // store //
  ///////////

  // # SETUP #
  const tacoStore = useTacoStore()

  // # STATE #

  // user
  const { userAcceptedReportsDisclaimer } = storeToRefs(tacoStore)

  // # ACTIONS #

  // user
  const { acceptReportsDisclaimer } = tacoStore

  /////////////////////
  // local variables //
  /////////////////////

  // route
  const route = useRoute()
  const router = useRouter()

  // report explorer
  const reportId = ref(0)
  const ckBtcIconUrl = ckBtcIcon
  const sneedIconUrl = sneedIcon
  const motokoIconUrl = motokoIcon
  const goldDaoIconUrl = goldDaoIcon
  const sgldtIconUrl = sgldtIcon
  const openChatIconUrl = openChatIcon
  const kongSwapIconUrl = kongSwapIcon
  const neutriniteIconUrl = neutriniteIcon

  // show report menu on mobile
  const showReportMenuOnMobile = ref(false)

  // disclaimer
  const userReshownReportsDisclaimer = ref(false)

  // misc
  const showOpenChatCalculations = ref(false)

  ///////////////////
  // local methods //
  ///////////////////  

  //////////////
  // handlers //    

  // scroll to top
  const scrollToTop = () => {

    // log
    // console.log('ReportsView.vue: scroll to top')

    // get scroll container
    const scrollContainer = document.querySelector('.scroll-y-container')
    if (scrollContainer) {
      scrollContainer.scrollTo({top: 0, behavior: 'smooth'})
    }

  }

  // toggle report menu on mobile
  const toggleReportMenuOnMobile = () => {

    // log
    // console.log('ReportsView.vue: toggle report menu on mobile')

    // toggle
    showReportMenuOnMobile.value = !showReportMenuOnMobile.value
    
    // log
    // console.log('ReportsView.vue: showReportMenuOnMobile', showReportMenuOnMobile.value)

  }

  // reshown disclaimer locally
  const reshownDisclaimerLocally = () => {
    userReshownReportsDisclaimer.value = true
  }

  // accept reports disclaimer locally
  const hideDisclaimerLocally = () => {
    userReshownReportsDisclaimer.value = false
  }

  //////////////
  // computed //
  //////////////

  // is mobile
  const isMobile = ref(window.innerWidth < 768)

  //////////////
  // handlers //  

  // 
  
  ///////////////
  // watchers //
  //////////////

  // watch for route changes
  watch(() => route.path, async (newPath) => {

    // log
    // console.log('ReportsView.vue: watch route')

    // set reportId (dd* links supported for historical linking)
    if (newPath === '/reports/ddckbtc' || newPath === '/reports/ckbtc') {
      reportId.value = 1
    } else if (newPath === '/reports/ddsneed' || newPath === '/reports/sneed') {
      reportId.value = 2
    } else if (newPath === '/reports/ddmotoko' || newPath === '/reports/motoko') {
      reportId.value = 3
    } else if (newPath === '/reports/ddgolddao' || newPath === '/reports/golddao') {
      reportId.value = 4
    } else if (newPath === '/reports/ddsgldt' || newPath === '/reports/sgldt') {
      reportId.value = 5
    } else if (newPath === '/reports/openchat') {
      reportId.value = 6
    } else if (newPath === '/reports/kongswap') {
      reportId.value = 7
    } else if (newPath === '/reports/neutrinite') {
      reportId.value = 8
    } else if (newPath === '/reports/example') {
      reportId.value = 0
    }

  }, { immediate: true })

  /////////////////////
  // lifecycle hooks //
  /////////////////////

  // on mounted
  onMounted(async () => {

    // watch for window resize
    window.addEventListener('resize', () => {
      isMobile.value = window.innerWidth < 768
    })

  })

</script>
