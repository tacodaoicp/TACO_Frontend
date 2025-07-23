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

                  <!-- wrapped gold dao - report item -->
                  <li class="taco-report-explorer__list-item" @click="toggleReportMenuOnMobile(); router.push('/reports/ddsgldt')">
                    
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
                  <li class="taco-report-explorer__list-item" @click="toggleReportMenuOnMobile(); router.push('/reports/ddgolddao')">
                    
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
                  <li class="taco-report-explorer__list-item" @click="toggleReportMenuOnMobile(); router.push('/reports/ddmotoko')">
                    
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
                  <li class="taco-report-explorer__list-item" @click="toggleReportMenuOnMobile(); router.push('/reports/ddsneed')">
                    
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
                  <li class="taco-report-explorer__list-item" @click="toggleReportMenuOnMobile(); router.push('/reports/ddckbtc')">
                    
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
                              taco-report-explorer__report-heading--h2">
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
                    <p class="taco-report-explorer__report-paragraph">
                      Lorem ipsum dolor sit amet consectetur adipisicing elit. Cumque labore molestias mollitia modi? Sed magni quasi in vitae dicta iste neque porro, asperiores doloremque repellat vero magnam quisquam voluptate pariatur? Tempora, libero distinctio at facere sint, mollitia totam, blanditiis dolorem eius hic fugit! Earum aut nostrum exercitationem corporis sed temporibus deleniti, nesciunt velit laborum nam ipsam minima minus non tenetur?
                    </p>

                    <!-- unordered list -->
                    <ul class="taco-report-explorer__report-ul">
                      <li class="taco-report-explorer__report-li">list item 1</li>
                      <li class="taco-report-explorer__report-li">list item 2</li>
                      <li class="taco-report-explorer__report-li">list item 3</li>
                    </ul>

                    <!-- ordered list -->
                    <ol class="taco-report-explorer__report-ol">
                      <li class="taco-report-explorer__report-li">list item 1</li>
                      <li class="taco-report-explorer__report-li">list item 2</li>
                      <li class="taco-report-explorer__report-li">list item 3</li>
                    </ol>                        

                    <!-- horizontal rule -->
                    <hr>
                    <span class="small">^ that's a horizontal rule</span><br><br>

                    <!-- link -->
                    <a class="taco-report-explorer__report-link" href="#" target="_blank">This is a link</a>

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
                    <p class="taco-report-explorer__report-paragraph">
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
                    <p class="taco-report-explorer__report-paragraph">
                      Chain-key Bitcoin (ckBTC) serves as a multi-chain twin of Bitcoin, enabling BTC to be used seamlessly within the ICP ecosystem. It retains full 1:1 backing with native BTC, secured via cryptographic techniques and managed by the Network Nervous System (NNS).
                    </p>

                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      Primary utilities include:
                    </p>                  

                    <!-- unordered list -->
                    <ul class="taco-report-explorer__report-ul">
                      <li class="taco-report-explorer__report-li">
                        <p class="taco-report-explorer__report-paragraph">Facilitation of DeFi applications</p>
                      </li>
                      <li class="taco-report-explorer__report-li">
                        <p class="taco-report-explorer__report-paragraph">Integration of Bitcoin into smart contracts and dApps</p>
                      </li>
                      <li class="taco-report-explorer__report-li">
                        <p class="taco-report-explorer__report-paragraph">Instant, low-cost transactions on ICP compared to native Bitcoin network fees and times</p>
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
                    <p class="taco-report-explorer__report-paragraph">
                      Programmable bitcoin is a unique value proposition. Integration of ckBTC can impact broader ICP adoption, facilitating enhanced liquidity and user engagement.
                    </p>

                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      OpenChat uses ckBTC for tipping and Odin.Fun is a popular memecoin platform with ckBTC being the primary mode of payment.
                    </p>

                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
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
                    <p class="taco-report-explorer__report-paragraph">
                      ICP's Chain-Key Technology allows smart contracts to securely sign Bitcoin transactions without any single node accessing private keys. This enables ckBTC to hold and manage Bitcoin addresses directly on-chain.
                    </p>
                    
                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      ICP's network security depends on validators who are paid in ICP tokens and the governance of ICP token holders.
                    </p>
                    
                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      <a href="https://wiki.internetcomputer.org/wiki/Chain-key_Bitcoin" target="_blank" class="taco-report-explorer__report-link">ckBTC utilises the ckBTC Minter</a>, a canister controlled by the NNS and operating on the 'pzp6e…' subnet (more information on this in Security Risks). Principal ID's inform the Minter about an increase in the BTC balance as a result of their BTC address, and the Minter then mints ckBTC of identical value. Later, ckBTC can be burned in the Minter for an equivalent amount of BTC.
                    </p>
                    
                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      <a href="https://internetcomputer.org/docs/references/ckbtc-reference" target="_blank" class="taco-report-explorer__report-link">A minimum ckBTC burn</a> (in other words BTC withdrawal) amount of 0.001 BTC, or 100,000 satoshi, and; a Know-Your-Transaction fee of 0.00002 BTC, or 2,000 satoshi.
                    </p>

                    <!-- heading -->
                    <h3 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h2 mt-4">
                      Liquidity:
                    </h3>

                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      As per <a href="https://swaprunner.com" target="_blank" class="taco-report-explorer__report-link">SwapRunner</a> on the 1st of June 2025, a single transaction of:
                    </p>

                    <!-- unordered list -->
                    <ul class="taco-report-explorer__report-ul">
                      <li class="taco-report-explorer__report-li">
                        <p class="taco-report-explorer__report-paragraph">20000 ICP ($98739.32) will result in a trade to 0.75197956 ckBTC ($78761.20). 20.23% lost to price impact</p>
                      </li>
                      <li class="taco-report-explorer__report-li">
                        <p class="taco-report-explorer__report-paragraph">10000 ICP ($49369.66) will result in a trade to 0.4307592 ckBTC ($45117.07). 8.614% lost to price impact</p>
                      </li>
                      <li class="taco-report-explorer__report-li">
                        <p class="taco-report-explorer__report-paragraph">1000 ICP ($4936.97) will result in a trade to 0.04672558 ckBTC ($4893.97). 0.871% lost to price impact</p>
                      </li>
                      <li class="taco-report-explorer__report-li">
                        <p class="taco-report-explorer__report-paragraph">250 ICP ($1234.24) will result in a trade to 0.01174256 ckBTC ($1229.90). 0.352% lost to price impact</p>
                      </li>
                    </ul>

                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
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
                    <ul class="taco-report-explorer__report-ul">

                      <!-- list item -->
                      <li class="taco-report-explorer__report-li">

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">Wrapped Bitcoin is the Ethereum network's 1:1 tokenised version of Bitcoin. In the WBTC system, one party sends BTC to a custodian, who agrees to mint a token that is backed 1:1 by the held Bitcoin. This token, now holding an exact value pair with the BTC, can interface with the Ethereum network and all it has to offer.</p>
                        
                      </li>

                      <!-- list item -->
                      <li class="taco-report-explorer__report-li">
                        
                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">When BTC is deposited onto BTC addresses controlled by the ICP network, no one individual is now 'owning' the BTC and agreeing to mint a tokenised version of it in return. Instead, the ICP Network's various nodes split parts of the private key between themselves, cryptographically ensuring the existence of reserves and removing the necessity of human trust that a system such as WBTC employs. In WBTC, a custodian is simply holding the existing BTC and creating a token backed by it, creating a single point of failure: legitimacy of the custodian. WBTC can theoretically lose all value because its reserves can vanish or become compromised.</p>
                        
                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
                          
                          <!-- link -->
                          <a class="taco-report-explorer__report-link taco-text-blue-to-light-blue" href="https://chainspect.app/compare/ethereum-vs-icp" target="_blank">Faster settlement times are seen on ICP, specifically</a>:
                        
                        </p>

                        <!-- ordered list -->
                        <ol class="taco-report-explorer__report-ol">

                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">

                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">Ethereum's real-time TPS (transactions per second) is 1.75% that of ICP</p>

                          </li>

                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">

                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">Ethereum's block time is 25x that of ICP</p>

                          </li>

                        </ol>
                      
                      </li>

                      <!-- list item -->
                      <li class="taco-report-explorer__report-li">

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">Lighting Network represents a novel solution to the crypto 'trilemma' - the battle between security, scalability, and decentralisation. Lightning works by creating a channel between two individuals that essentially creates a locked figure of BTC belonging to both parties, in which infinite transactions of virtually any size can occur without causing an actual transaction on the BTC blockchain. Heavy fees are avoided, and extremely small payments can take place. Only two blockchain transactions occur: opening the channel with the initial figures, and closing it with the updated figures.</p>

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">ckBTC also uses two transactions, both 'leaving' and 'entering' the BTC blockchain. The main difference lies in utility. Lighting can only serve as a peer-to-peer transaction system. It cannot interface with any other system: there exists no DeFi, no smart contracts, no voting, and none of the other unique features available on other blockchains. ckBTC allows direct integration of BTC with ICP's ecosystem.</p>

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
                    <p class="taco-report-explorer__report-paragraph">
                      Trail of Bits, an organization specializing in high-end security research, scanned the ckBTC codebase. <a href="https://medium.com/dfinity/taking-security-seriously-two-top-icp-features-assessed-by-trail-of-bits-4a0023ab1e68" target="_blank" class="taco-report-explorer__report-link">The verdict was very positive and there were no medium or high-severity findings</a>. The audit focused on preventing double-spending, denial-of-service attacks, and ensuring the ckBTC Minter could not be manipulated into signing invalid transactions or burning tokens improperly.
                    </p>

                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      BitcoinLayers, a research initiative documenting Bitcoin scaling solutions, <a href="https://www.bitcoinlayers.org/layers/internetcomputer" target="_blank" class="taco-report-explorer__report-link">provided the following risk ratings</a>:
                    </p>

                    <!-- unordered list -->
                    <ul class="taco-report-explorer__report-ul">

                      <!-- list item -->
                      <li class="taco-report-explorer__report-li">

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">BTC Custody: High Risk</p>

                      </li>

                      <!-- list item -->
                      <li class="taco-report-explorer__report-li">

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">Data Availability: High Risk</p>

                      </li>

                      <!-- list item -->
                      <li class="taco-report-explorer__report-li">

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">Network Operators: Medium Risk</p>

                      </li>

                      <li class="taco-report-explorer__report-li">

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">Finality Guarantees: Medium Risk</p>

                      </li>

                    </ul>

                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      While this may seem bad, it is worth noting that virtually all other layer-solutions score 'very high' or 'critical' on many of these tags, and that only Bitcoin native solutions (such as Lightning) score as 'low risk'. When it comes to Bitcoin layers that allow interfacing with other systems, ICP is among the top in terms of safety.
                    </p>
                    
                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      The 'pzp6e…' subnet managing the ckBTC smart contract module has 34 node operators who have undergone a KYB process to ICP governance and are publicly known. If nodes for this subnet go offline, and a backup of the state is not regularly made, holders would lose access to their ckBTC. It would require 10 nodes to collude to take over the ckBTC subnet.
                    </p>
                    
                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      When a user deposits or withdraws bitcoin, the Bitcoin Checker Canister checks whether <a href="https://wiki.internetcomputer.org/wiki/Bitcoin_Checker_Canister" target="_blank" class="taco-report-explorer__report-link">the bitcoin address is associated with any illicit activities on the SDN list of the OFAC</a>. If it is, deposits are quarantined and withdrawals are rejected.
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

                          <a href="https://app.sneeddao.com/proposal?proposalid=13&sns=lacdn-3iaaa-aaaaq-aae3a-cai" class="taco-text-blue-to-light-blue text-end" target="_blank">Sneed Hub</a>

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
                    <p class="taco-report-explorer__report-paragraph">
                      SNS-1 was the original SNS DAO for ICP, launched in 2022 as a framework and test run to experiment with decentralized governance over dApps. It served as a blank slate, and a community gathered, putting forth multiple ideas on how best to utilise the technology, debating what direction should be taken. The only project created during this period was ICPCoins, an index of the eponymous tokens circulating around the ecosystem.
                    </p>

                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      On June 11th, 2023, Adam Powell took over SNS-1 by purchasing a majority stake. His takeover turned the DAO from one containing multiple directions to one with a single, unified direction: creating a video game. With that, the blank slate experiment came to an abrupt end. Sneed DAO was created to continue where SNS-1 left off.                      
                    </p>
                    
                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      Sneed DAO is arguably the most sovereign DAO of the SNS DAOs, operating without any identifiable central leadership.
                    </p>
                    
                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      One of the core contributors, Snassy, is doxxed and brings over two decades of professional development experience to the project. In the last 16 years, he worked at Intentional Software (later acquired by Microsoft), and then at Microsoft itself, where he served as a Principal Engineer and Principal Engineering Manager across both the Office and Windows divisions. He left Microsoft in 2024 to be a Web3 builder full-time.
                    </p>
                    
                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
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
                    <p class="taco-report-explorer__report-paragraph">
                      The SNEED token serves as the governance token for Sneed DAO, enabling members to submit and vote on proposals that are implemented if approved.
                    </p>      
                    
                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      SNEED is deflationary, <a href="https://github.com/solidstate-auditing/audits-public/blob/main/defi-vectors.md" target="_blank" class="taco-report-explorer__report-link">with a unique tokenomics model known as the Recursive Liquidity Loop (RLL)</a>. The RLL burns or distributes SNEED rewards from liquidity pools (LPs), stakes ICP rewards in an 8-year neuron, and distributes the resulting maturity rewards to governance members.
                    </p>      
                    
                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      <a href="https://app.sneeddao.com/sneedlock" target="_blank" class="taco-report-explorer__report-link">SneedLock 2.0 enables users to lock tokens and liquidity pool positions for predefined durations</a>. It exists primarily to build trust between teams and communities by ensuring that locked assets remain inaccessible until the lock expires. Prior to SneedLock, teams had to blackhole LP positions to signal commitment - permanently forfeiting access to both the tokens and any LP rewards. SneedLock offers a more flexible alternative. It is planned for SneedLock to charge fees that will go to the Sneed DAO.                      
                    </p>  
                    
                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      <a href="https://swaprunner.com/help" target="_blank" class="taco-report-explorer__report-link">SwapRunner is a DEX aggregator that enables users to split trade orders between ICPSwap and KongSwap to optimize execution</a>. A planned Time-Distributed Trading feature will enable users to break down large trades into smaller ones over time. <a href="https://swaprunner.com/help/rewards" target="_blank" class="taco-report-explorer__report-link">SwapRunner includes a rewards system that lets project teams sponsor specific achievements</a>, offering users incentives for completing various trading activities. Fees from sponsored achievements go to the Sneed DAO.
                    </p>  
                    
                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      Both the SneedLock and SwapRunner canisters will be under DAO control when ready.
                    </p>  
                    
                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      <a href="https://app.sneeddao.com/hub" target="_blank" class="taco-report-explorer__report-link">Sneed Hub serves as an explorer for SNS DAOs</a>, providing key information and links for each project. Its forum feature enables users to create discussion threads tied to SNS proposals, and - if they hotkey their SNS neurons - they can upvote or downvote posts using their voting power.
                    </p>  
                    
                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
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
                    <p class="taco-report-explorer__report-paragraph">
                      SNEED was created in October 2023 and transitioned to an SNS DAO in January 2024. The original Sneed token was an implementation of Dfinity's ICRC1 standard, developed by the Sneed community to enable the direct addition of the token logo into the token canister. This implementation has been forked to create SNOGE, TENDIES, Insane Clown Protocol, Windoge98, Motokowifhat, Pepe, Internet Doge, and ALIEN.
                    </p>   
                    
                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      When the SNEED transitioned to an SNS DAO, SneedSwap was developed to convert old tokens to new tokens. SneedSwap has been forked to SNS-ify DOGMI.
                    </p>   
                    
                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      Sneed DAO has had and maintains several partnerships:
                    </p>    
                    
                    <!-- unordered list -->
                    <ul class="taco-report-explorer__report-ul">
                      
                      <!-- list item -->
                      <li class="taco-report-explorer__report-li">

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
                          ICPSwap: Partnered for Sneedlock, which has been used by many teams, currently resulting in a grand total of $840 across 22 different projects, for an average of $38.18 per project. Also used to provide prices to SwapRunner.
                        </p>

                      </li>

                      <!-- list item -->
                      <li class="taco-report-explorer__report-li">

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
                          KongSwap: Used to provide prices to SwapRunner.
                        </p>
                        
                      </li>

                      <!-- list item -->
                      <li class="taco-report-explorer__report-li">

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
                          FomoWell: Collaborated with Sneed DAO to integrate an automatic SneedLock feature for launched tokens.
                        </p>
                        
                      </li>
                      
                      <!-- list item -->
                      <li class="taco-report-explorer__report-li">

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
                          Neutrinite DAO & NeuronPool: Collaborating on the Recursive Liquidity Loop.
                        </p>
                        
                      </li>
                      
                      <!-- list item -->
                      <li class="taco-report-explorer__report-li">

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
                          Catalyze: Collaborated to create an NFT-gated chat room.
                        </p>
                        
                      </li>
                      
                      <!-- list item -->
                      <li class="taco-report-explorer__report-li">

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
                          OpenChat: Sneed was the first token to be added for tipping.
                        </p>
                        
                      </li>
                      
                      <!-- list item -->
                      <li class="taco-report-explorer__report-li">

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
                          Bitcoin Labs: Collaborated on dApps such as the Sneedlock Explorer.
                        </p>
                        
                      </li>
                      
                      <!-- list item -->
                      <li class="taco-report-explorer__report-li">

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
                          ELNA AI: Partnered to build a Mr. Sneed AI agent.
                        </p>
                        
                      </li>
                      
                      <!-- list item -->
                      <li class="taco-report-explorer__report-li">

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
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
                    <p class="taco-report-explorer__report-paragraph">
                      The official Discord server has 728 members, and the OpenChat community has 4093 members.
                    </p>  

                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      Diamond Club is an exclusive Discord channel gated by NFTs, consisting of those who were either airdropped a membership for holding more than 1 SNEED on the drop date, or those who have purchased entry. 3% of the royalty from a sale is immediately transferred to the DAO's treasury. There are 186 members as of June 2025 in the Diamond Club. This figure contains many well known ICP community members and the chat is active with discussions.
                    </p>  
                    
                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
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
                    <p class="taco-report-explorer__report-paragraph">
                      The SNS framework is regularly updated and vetted by the Network Nervous System (NNS) community, which oversees the entire ICP ecosystem. This vigilance ensures the adherence of SNEED's governance framework to the most rigorous standards of security and efficiency.
                    </p>  

                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      The core infrastructure of the RLL consists of the 8 year ICP NNS Neuron, ICP Neuron Vector, and ICP Splitter Vector. The ICP Neuron Vector controls the 8 year Neuron and manages maturity collection. The ICP Splitter Vector distributes ICP to the Treasury, Neuron Vector, and SNEED Buyback Vector in fixed proportions.
                    </p>  
                    
                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      The token management of the RLL consists of the SNEED Buyback Vector, SNEED Splitter Vector, Sneed DAO Treasury, Sneed DeFi Canister, SNEED Burn Address, and RLL Distribution Canister. The SNEED Buyback Vector purchases SNEED from the market using ICP. The SNEED Splitter Vector distributes SNEED to the Treasury, DeFi Canister, and Burn Address in fixed proportions. The SNEED DeFi Canister distributes ICP to the ICP Splitter Vector and tokens to RLL Distribution.The SNEED Burn Address permanently removes SNEED from circulation. The RLL Distribution Canister distributes tokens to DAO voting members.
                    </p>  
                    
                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      Currently, the main revenue source for the RLL is the SNEED/ICP provision rewards from ICPSwap.
                    </p>                      
                    
                    <hr>

                    <!-- anon container -->
                    <div class="d-flex flex-wrap gap-5">

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
                        <ul class="taco-report-explorer__report-ul">

                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
                              Initial Total Supply: 10,000
                            </p>
                            
                          </li>

                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">

                              <!-- link -->
                              <a href="https://app.sneeddao.com/sneedlock" target="_blank" class="taco-report-explorer__report-link">
                                Current Total Supply (08/06/25): 9948.925
                              </a>

                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
                              Circulating Supply: 7,386.945
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
                              Burn per transaction: 0.00001
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
                              Holders:
                            </p>

                            <!-- unordered list -->
                            <ul class="taco-report-explorer__report-ul" style="list-style-type: disc">

                              <!-- list item -->
                              <li class="taco-report-explorer__report-li">
                                
                                <!-- paragraph -->
                                <p class="taco-report-explorer__report-paragraph">
                                  Top - 16.53% (Treasury)
                                </p>

                              </li>

                              <!-- list item -->
                              <li class="taco-report-explorer__report-li">
                                
                                <!-- paragraph -->
                                <p class="taco-report-explorer__report-paragraph">
                                  Second - 10.17% (ICPSwap Pool)
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li class="taco-report-explorer__report-li">
                                
                                <!-- paragraph -->
                                <p class="taco-report-explorer__report-paragraph">
                                  Third - 5.02% (Sneed Team Neuron)
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li class="taco-report-explorer__report-li">
                                
                                <!-- paragraph -->
                                <p class="taco-report-explorer__report-paragraph">
                                  Mean of Top 25 - 2.62%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li class="taco-report-explorer__report-li">
                                
                                <!-- paragraph -->
                                <p class="taco-report-explorer__report-paragraph">
                                  Median of Top 25 - 1.09%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li class="taco-report-explorer__report-li">
                                
                                <!-- paragraph -->
                                <p class="taco-report-explorer__report-paragraph">
                                  Mode of Top 25 - 1%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li class="taco-report-explorer__report-li">
                                
                                <!-- paragraph -->
                                <p class="taco-report-explorer__report-paragraph">
                                  Top 25 Total - 65.56%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li class="taco-report-explorer__report-li">
                                
                                <!-- paragraph -->
                                <p class="taco-report-explorer__report-paragraph">
                                  Mean of Top 100 - 0.85%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li class="taco-report-explorer__report-li">
                                
                                <!-- paragraph -->
                                <p class="taco-report-explorer__report-paragraph">
                                  Median of Top 100 - 0.285%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li class="taco-report-explorer__report-li">
                                
                                <!-- paragraph -->
                                <p class="taco-report-explorer__report-paragraph">
                                  Mode of Top 100 - 0.50, 0.16%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li class="taco-report-explorer__report-li">
                                
                                <!-- paragraph -->
                                <p class="taco-report-explorer__report-paragraph">
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
                        <ul class="taco-report-explorer__report-ul">

                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
                              All Time High (USD): 279.02
                            </p>
                            
                          </li>

                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
                              All Time High (ICP): 69.21
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
                              All Time Low (USD): 38.96
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
                              All Time Low (ICP): 6.43
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
                              As of 08/06/25(USD): 72.37
                            </p>
                            
                          </li>                      

                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
                              As of 08/06/25 (ICP): 13.65
                            </p>

                          </li>

                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
                              Change from ATH USD: -74.06%
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
                              Change from ATL USD: 85.75%
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
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
                        <p class="taco-report-explorer__report-paragraph">
                          As per <a href="https://swaprunner.com" target="_blank" class="taco-report-explorer__report-link">SwapRunner</a> on the 8th of June 2025, a single transaction of:
                        </p>

                        <!-- unordered list -->
                        <ul class="taco-report-explorer__report-ul">

                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
                              20000 ICP ($106425.90) will result in a trade to 729.76 SNEED ($53728.54). 49.51% lost to price impact
                            </p>
                            
                          </li>

                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
                              10000 ICP ($53258.27) will result in a trade to 488.91 SNEED ($35996.36). 32.41% lost to price impact
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
                              1000 ICP ($5325.83) will result in a trade to 68.86 SNEED ($5069.83). 4.81% lost to price impact
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
                              250 ICP ($1331.46) will result in a trade to 17.82 SNEED ($1310.14). 1.60% lost to price impact
                            </p>
                            
                          </li>

                        </ul>

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
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
                    <p class="taco-report-explorer__report-paragraph">
                      While there are numerous DAOs present on the ICP ecosystem, many either have a definitive purpose behind them, or are highly centralized.
                    </p>

                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      In terms of sovereignty and the extent to which collective intelligence and governance is planned to be executed, TACO and SNEED are subjectively the two most on-track DAOs.
                    </p>
                    
                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
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
                    <p class="taco-report-explorer__report-paragraph">
                      <a href="https://github.com/icsneed/sneed_sns_dapp/tree/main/audit" target="_blank" class="taco-report-explorer__report-link">SneedSwap was audited by RIVVIR Tech, LLC.</a> The initial audit had 6 High Severity and 8 Medium Severity findings, all of which were addressed in the follow-up.
                    </p>
                    
                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      The RLL relies on Neutrinite's DeFi Vectors, <a href="https://github.com/solidstate-auditing/audits-public/blob/main/defi-vectors.md" target="_blank" class="taco-report-explorer__report-link">which was audited by Solidstate</a>. All findings scored Strong or Sufficient.
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

                          <a href="https://app.sneeddao.com/proposal?proposalid=18&sns=lacdn-3iaaa-aaaaq-aae3a-cai" class="taco-text-blue-to-light-blue text-end" target="_blank">Sneed Hub</a>

                        </span>
                        
                      </span>

                      <!-- link group -->
                      <span class="d-flex flex-column align-items-end">

                        <span class="text-end">#15 Motion to Discuss</span>

                        <span class="d-flex gap-2">

                          <a href="https://nns.ic0.app/proposal/?u=lacdn-3iaaa-aaaaq-aae3a-cai&proposal=15" class="taco-text-blue-to-light-blue text-end" target="_blank">NNS</a>                        

                          <a href="https://app.sneeddao.com/proposal?proposalid=15&sns=lacdn-3iaaa-aaaaq-aae3a-cai" class="taco-text-blue-to-light-blue text-end" target="_blank">Sneed Hub</a>

                        </span>
                        
                      </span>
                      
                      <!-- link group -->
                      <span class="d-flex flex-column align-items-end">

                        <span class="text-end">#12 Motion to Discuss</span>

                        <span class="d-flex gap-2">

                          <a href="https://nns.ic0.app/proposal/?u=lacdn-3iaaa-aaaaq-aae3a-cai&proposal=12" class="taco-text-blue-to-light-blue text-end" target="_blank">NNS</a>                        

                          <a href="https://app.sneeddao.com/proposal?proposalid=12&sns=lacdn-3iaaa-aaaaq-aae3a-cai" class="taco-text-blue-to-light-blue text-end" target="_blank">Sneed Hub</a>

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
                    <p class="taco-report-explorer__report-paragraph">
                      Motoko Ghosts is a collection of 10, 000 uniquely illustrated NFTs created by Jon Ball of Poked Studio. They established a visual identity around Motoko, a programming language designed by DFINITY for writing smart contracts on ICP.
                    </p>

                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      Before the creation of the Motoko DAO, <a href="https://x.com/sonic_ooo/status/1745314196034588816?t=p9K9YrK2DF2OD_cPX2QYTA" target="_blank" class="taco-report-explorer__report-link">10,000 $MOTOKO tokens were minted and airdropped 1:1 to Motoko Ghosts NFT holders</a>. Community member AccumulatingICP and the Sonic team collaborated on this, with DFINITY being involved in the process & decision making, and Jon Ball giving the greenlight to proceed.
                    </p>
                    
                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      Motoko DAO was created to give the Motoko Ghosts community a structure to collectively steer the direction of the Motoko Ghosts brand. An ICPSwap LP was used to give existing holders of $MOTOKO the ability to convert their tokens to SNS governance tokens. Four custodians were designated to execute this transition: Bug Slayer, AccumulatingICP, RemCodes, and BobbyO.
                    </p>
                    
                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      The founders of Dragginz, Adam Powell and Donna Powell, are involved as investors and advisors. The Dragginz team has committed to working on the Toko NFT Maker & Marketplace (Toko) until it is ready to transition under Motoko DAO. The Powells previously created Neopets, a 1999 online video game which within less than a decade accrued 140 million accounts. They went on to form Meteor Games after selling Neopets, which, among other projects, created a Facebook game named Island Paradise, which at its peak claimed 6.8 million monthly users. Adam Powell has contributed ICP to several SNS launches, and the Powells are vocal contributors to the broader ICP ecosystem.
                    </p>
                    
                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      Approved governance proposals have appointed six $MOTOKO team hires:
                    </p>

                    <!-- unordered list -->
                    <ul class="taco-report-explorer__report-ul">
                      
                      <!-- list item -->
                      <li class="taco-report-explorer__report-li">

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
                          <a href="https://app.sneeddao.com/proposal?proposalid=224&sns=ko36b-myaaa-aaaaq-aadbq-cai" target="_blank" class="taco-report-explorer__report-link">Proposal ID 224 appointed VingTheory as Frontend Developer</a>. He created the ICpxy NFT collection and has worked with Poked Studio. He is working on the Motoko Mining dApp and the Motoko MMO.
                        </p>

                      </li>

                      <!-- list item -->
                      <li class="taco-report-explorer__report-li">

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
                          <a href="https://app.sneeddao.com/proposal?proposalid=225&sns=ko36b-myaaa-aaaaq-aadbq-cai" target="_blank" class="taco-report-explorer__report-link">Proposal ID 225 appointed Enoch as Backend Developer</a>. He has worked on numerous projects including Motoko Pals, Tswaanda Africa, and has contributed to IC-Websocket Motoko. He is also DevRel and Instructor at ICP HUB South Africa. He is working on the Motoko MMO.
                        </p>

                      </li>

                      <!-- list item -->
                      <li class="taco-report-explorer__report-li">

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
                          <a href="https://app.sneeddao.com/proposal?proposalid=227&sns=ko36b-myaaa-aaaaq-aadbq-cai" target="_blank" class="taco-report-explorer__report-link">Proposal ID 227 appointed AccumulatingICP as Product Manager</a>. He has worked as a Technical Writer at InfinitySwap, done marketing for Finny, is currently Product Manager & doing marketing for ToolKit, and has a Named Neuron for Due Diligence on SNS Decentralisation Swaps.
                        </p>

                      </li>
                      
                      <!-- list item -->
                      <li class="taco-report-explorer__report-li">

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
                          <a href="https://app.sneeddao.com/proposal?proposalid=228&sns=ko36b-myaaa-aaaaq-aadbq-cai" target="_blank" class="taco-report-explorer__report-link">Proposal ID 228 appointed Mohammed as Graphic Designer</a>. He has 3 years of experience in this field.
                        </p>

                      </li>
                      
                      <!-- list item -->
                      <li class="taco-report-explorer__report-li">

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
                          <a href="https://app.sneeddao.com/proposal?proposalid=229&sns=ko36b-myaaa-aaaaq-aadbq-cai" target="_blank" class="taco-report-explorer__report-link">Proposal ID 229 appointed MyArtbar as 3D Animation Artist</a>. He is creator and lead artist for multiple ICP NFT collections including MotokoPals, Puzzle, Offspring, and Space Odyssey.
                        </p>

                      </li>
                      
                      <!-- list item -->
                      <li class="taco-report-explorer__report-li">

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
                          <a href="https://app.sneeddao.com/proposal?proposalid=233&sns=ko36b-myaaa-aaaaq-aadbq-cai" target="_blank" class="taco-report-explorer__report-link">Proposal ID 233 appointed Jay Nolan as Content Creator</a>. He has created content tailored to the Internet Computer and the Motoko DAO.
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
                    <p class="taco-report-explorer__report-paragraph">
                      The MOTOKO token serves as the governance token for Motoko DAO, enabling members to submit and vote on proposals that are implemented if approved.
                    </p>  
                    
                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      The Motoko DAO controls the canisters of the Motoko Ghosts and Motoko Pals NFT collections. There is a planned collection of 3D Motoko Ghosts that will be paired 1:1 with the current 2D Motoko Ghosts.
                    </p>  
                    
                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      <a href="https://motoko-1.gitbook.io/motoko-mining/" target="_blank" class="taco-report-explorer__report-link">Motoko Mining will be a platform that allows users to stake their Motoko Ghost</a>, burn $MOTOKO, and have a chance to earn $MOTOKO and a “fuel asset” that will be leveraged in the Motoko MMO. Details for the MMO have not been announced yet, but it will be a combination of PvE & PvP where users level up their Motoko Ghost & compete for $MOTOKO.
                    </p>  
                    
                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      Toko is an NFT Maker & Marketplace planned to be launched this year. The progress that has been completed so far includes account creation, the upload of assets of any filetype, the ability to add tags to assets, the design of the majority of the system, and its wireframe. <a href="https://x.com/dragginzgame/status/1920435166507413664" target="_blank" class="taco-report-explorer__report-link">A video sneak peek of NFT Maker has been shared</a>. The plan for the MVP includes tools for creators to launch simple collections and a marketplace with the basic features of listing, buying, royalties, and transfers.
                    </p>  
                    
                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      Adam has stated that Toko may be under NNS control, with development being done by and royalties going to Motoko DAO.
                    </p>  

                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      Toko will be funded by an optional minting fee - a small percentage of each claim and sale going to the DAO. Creators will be able to adjust this percentage or remove it completely. While these values will be fixed upon creation, creators can set predefined ranges which they can adjust between post-creation. Adam has stated that Motoko DAO may receive all fees from secondary sales.
                    </p>                      
                    
                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      Toko will be built with a focus on creator control and flexibility. This includes creators being able to adjust how many NFTs can ever be minted, how many times they can be transferred, whether royalties taper off over time, allocating % of each sale to fund cycles that keep NFTs usable, and claim rules. Additional planned concepts include splitting and merging NFTs, weighted layer-based NFT generation, as well as mass imports of existing NFT collections.
                    </p>  
                    
                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      <a href="https://x.com/dragginzgame/status/1932136841127272613" target="_blank" class="taco-report-explorer__report-link">Donna has explored potential use cases spanning music, merchandise, events, writing, real-world art, charities, and gaming</a>:
                    </p>

                    <!-- unordered list -->
                    <ul class="taco-report-explorer__report-ul">
                      
                      <!-- list item -->
                      <li class="taco-report-explorer__report-li">

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
                          Exclusive content.
                        </p>

                      </li>

                      <!-- list item -->
                      <li class="taco-report-explorer__report-li">

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
                          Dynamic NFTs that evolve over time based on engagement or ownership duration.
                        </p>

                      </li>

                      <!-- list item -->
                      <li class="taco-report-explorer__report-li">

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
                          Royalty routing that splits payments transparently and instantly.
                        </p>

                      </li>
                      
                      <!-- list item -->
                      <li class="taco-report-explorer__report-li">

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
                          Fan club access to private Discords, early tour dates, and voting on future releases.
                        </p>

                      </li>
                      
                      <!-- list item -->
                      <li class="taco-report-explorer__report-li">

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
                          Claiming merchandise via NFTs prior to conventions and shows to prevent overproduction and reduce the shipping footprint.
                        </p>

                      </li>
                      
                      <!-- list item -->
                      <li class="taco-report-explorer__report-li">

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
                          Gamified experiences.
                        </p>

                      </li>   
                      
                      <!-- list item -->
                      <li class="taco-report-explorer__report-li">

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
                          Proof of Origin.
                        </p>

                      </li>   
                      
                      <!-- list item -->
                      <li class="taco-report-explorer__report-li">

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
                          NFT tickets that are non-transferable and burned upon entry to remove scalping, or, alternatively, royalties on resales.
                        </p>

                      </li>   
                      
                      <!-- list item -->
                      <li class="taco-report-explorer__report-li">

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
                          Proof of Attendance.
                        </p>

                      </li>   
                      
                      <!-- list item -->
                      <li class="taco-report-explorer__report-li">

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
                          Serialized writing and publishing.
                        </p>

                      </li>  
                      
                      <!-- list item -->
                      <li class="taco-report-explorer__report-li">

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
                          NFTs tied to real-world art events and physical artwork as certificates of authenticity
                        </p>

                      </li>  
                      
                      <!-- list item -->
                      <li class="taco-report-explorer__report-li">

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
                          Transparent donation flows for charitable causes, including Proof of Donation NFTs.
                        </p>

                      </li>  
                      
                      <!-- list item -->
                      <li class="taco-report-explorer__report-li">

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
                          In-game NFTs with cross-IP utility and custom logic for interactive gameplay.
                        </p>

                      </li>                        

                    </ul>   
                    
                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
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
                    <p class="taco-report-explorer__report-paragraph">
                      Motoko DAO aligns closely with the broader ICP ecosystem by promoting the Motoko programming language - not just as a tool for smart contract development, but as a cultural brand. Subjectively speaking, Motoko Ghosts are cute and lend themselves easily to merchandisable formats like plushies.
                    </p>

                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      With ICP often praised for its technical superiority, building out a world-class NFT standard on this stack makes natural sense.
                    </p>
                    
                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      While Dragginz is a separate project, the Dragginz team has clarified that strong NFT infrastructure is a prerequisite for the Dragginz game itself, and that work on Toko does not represent a shift away from Dragginz development.
                    </p>
                    
                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      This due diligence process was the first to be initiated by a community member rather than the TACO DAO team. <a href="https://forum.dfinity.org/t/commission-due-diligence-report-on-motoko-token-for-taco-dao/50192" target="_blank" class="taco-report-explorer__report-link">The proposal came from long-time active member CryptoMyth</a>.
                    </p>
                    
                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      During the writing of this due diligence, <a href="https://x.com/MotokoGhosts/status/1936132191907459228" target="_blank" class="taco-report-explorer__report-link">Motoko Ghosts held a meme contest on X in collaboration with Windoge98</a>.
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
                    <p class="taco-report-explorer__report-paragraph">
                      The Motoko DAO Community Discord server has 1.45k members, the Toko Discord server has 81 members, and the OpenChat community has 360 members.
                    </p>  

                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
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
                    <p class="taco-report-explorer__report-paragraph">
                      <a href="https://forum.dfinity.org/t/why-support-boom-evolving-into-mimic/44176" target="_blank" class="taco-report-explorer__report-link">Mimic is an open-source, schema-based query and data modelling language for handling complex data</a>. It was originally developed for Dragginz and is now being used for Toko. For now, Mimic does not have the necessary documentation to make it accessible.
                    </p>  

                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      <a href="https://forum.dfinity.org/t/migrating-existing-nfts-to-the-motoko-marketplace/43389/19" target="_blank" class="taco-report-explorer__report-link">Adam has outlined the creation of the “NextGenNFT” standard</a>, an ambitious evolution of NFTs designed to meet the emotional and technological demands of digital experiences in 2030. It will use Plutchik's Wheel of Emotions - a psychological model identifying eight primary emotions (Joy, Trust, Fear, Surprise, Sadness, Disgust, Anger, Anticipation) - as a framework to create emotionally responsive NFTs.
                    </p>  
                    
                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      This is intended to support modular interactions and to scale across a range of applications, including gaming, AR/VR, and live streaming.
                    </p>  
                    
                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      Current NFT standards are limited to static metadata and basic ownership mechanics, lacking native support for dynamic, interactive, or emotionally responsive features. The proposed NextGenNFT standard introduces 23 components to address these gaps:
                    </p>   
                    
                    <!-- unordered list -->
                    <ul class="taco-report-explorer__report-ul">
                      
                      <!-- list item -->
                      <li class="taco-report-explorer__report-li">

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
                          NFT Name: Mutable title (e.g., “Wedding Day” to “10th Anniversary”).
                        </p>

                      </li>

                      <!-- list item -->
                      <li class="taco-report-explorer__report-li">

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
                          Description: Mutable text for narrative evolution.
                        </p>

                      </li>

                      <!-- list item -->
                      <li class="taco-report-explorer__report-li">

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
                          ID: Immutable unique identifier.
                        </p>

                      </li>
                      
                      <!-- list item -->
                      <li class="taco-report-explorer__report-li">

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
                          Issuer: Immutable entity that minted the NFT.
                        </p>

                      </li>
                      
                      <!-- list item -->
                      <li class="taco-report-explorer__report-li">

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
                          Asset: Mutable content that can adapt to context.
                        </p>

                      </li>
                      
                      <!-- list item -->
                      <li class="taco-report-explorer__report-li">

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
                          Attributes: Mutable key-value pairs for dynamic metadata (e.g., “mood: happy”).
                        </p>

                      </li>   
                      
                      <!-- list item -->
                      <li class="taco-report-explorer__report-li">

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
                          Immutable Part: Defines unchangeable fields.
                        </p>

                      </li>   
                      
                      <!-- list item -->
                      <li class="taco-report-explorer__report-li">

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
                          Royalties: Built-in creator compensation for secondary sales.
                        </p>

                      </li>   
                      
                      <!-- list item -->
                      <li class="taco-report-explorer__report-li">

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
                          Dynamic Metadata: Mechanism to update mutable fields.
                        </p>

                      </li>   
                      
                      <!-- list item -->
                      <li class="taco-report-explorer__report-li">

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
                          Conditional Logic: Restricts access/perks based on conditions.
                        </p>

                      </li>  
                      
                      <!-- list item -->
                      <li class="taco-report-explorer__report-li">

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
                          Execution Logic: Automates actions (e.g., transfers on death).
                        </p>

                      </li>  
                      
                      <!-- list item -->
                      <li class="taco-report-explorer__report-li">

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
                          Ownership Structure: Supports multiple co-owners.
                        </p>

                      </li>  
                      
                      <!-- list item -->
                      <li class="taco-report-explorer__report-li">

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
                          Context Handler: Adapts asset to environment (e.g., VR vs. mobile).
                        </p>

                      </li>    
                      
                      <!-- list item -->
                      <li class="taco-report-explorer__report-li">

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
                          Encryption Layer: Secures sensitive data (e.g., biometrics).
                        </p>

                      </li>    

                      <!-- list item -->
                      <li class="taco-report-explorer__report-li">

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
                          Pricing Engine: Dynamically adjusts value based on demand.
                        </p>

                      </li>    

                      <!-- list item -->
                      <li class="taco-report-explorer__report-li">

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
                          Sentiment Interface: Responds to user emotions (e.g., glows for Joy).
                        </p>

                      </li>    

                      <!-- list item -->
                      <li class="taco-report-explorer__report-li">

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
                          Oracle Support: Integrates real-time data (e.g., weather).
                        </p>

                      </li>    

                      <!-- list item -->
                      <li class="taco-report-explorer__report-li">

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
                          Generative Module: Creates unique content at minting.
                        </p>

                      </li>    

                      <!-- list item -->
                      <li class="taco-report-explorer__report-li">

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
                          Soulbound Status: Locks NFT to a wallet.
                        </p>

                      </li>    

                      <!-- list item -->
                      <li class="taco-report-explorer__report-li">

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
                          Transferable but Non-Sellable Status: Allows gifting but not selling.
                        </p>

                      </li>    

                      <!-- list item -->
                      <li class="taco-report-explorer__report-li">

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
                          Self-Destruct Settings: Enables expiration/burning (e.g., post-event).
                        </p>

                      </li>    

                      <!-- list item -->
                      <li class="taco-report-explorer__report-li">

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
                          Revocability Status: Allows issuer to cancel NFT.
                        </p>

                      </li>    

                      <!-- list item -->
                      <li class="taco-report-explorer__report-li">

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
                          Social Impact Metrics: Tracks engagement/impact (e.g., boycott success).
                        </p>

                      </li>    

                    </ul>                       
                    
                    <hr>

                    <!-- anon container -->
                    <div class="d-flex flex-wrap gap-5">

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
                        <ul class="taco-report-explorer__report-ul">

                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
                              Initial Total Supply: 10,000
                            </p>
                            
                          </li>

                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">

                              <!-- link -->
                              <a href="https://app.sneeddao.com/sneedlock" target="_blank" class="taco-report-explorer__report-link">
                                Current Total Supply (22/06/25): 54,660,973
                              </a>

                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
                              Circulating Supply: 42,259,439
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
                              Burn per transaction: 0.1
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
                              Holders:
                            </p>

                            <!-- unordered list -->
                            <ul class="taco-report-explorer__report-ul" style="list-style-type: disc">

                              <!-- list item -->
                              <li class="taco-report-explorer__report-li">
                                
                                <!-- paragraph -->
                                <p class="taco-report-explorer__report-paragraph">
                                  Top - 22.68% (Treasury)
                                </p>

                              </li>

                              <!-- list item -->
                              <li class="taco-report-explorer__report-li">
                                
                                <!-- paragraph -->
                                <p class="taco-report-explorer__report-paragraph">
                                  Second - 16.46%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li class="taco-report-explorer__report-li">
                                
                                <!-- paragraph -->
                                <p class="taco-report-explorer__report-paragraph">
                                  Third - 3.6%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li class="taco-report-explorer__report-li">
                                
                                <!-- paragraph -->
                                <p class="taco-report-explorer__report-paragraph">
                                  Mean of Top 25 - 2.5324%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li class="taco-report-explorer__report-li">
                                
                                <!-- paragraph -->
                                <p class="taco-report-explorer__report-paragraph">
                                  Median of Top 25 - 0.69%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li class="taco-report-explorer__report-li">
                                
                                <!-- paragraph -->
                                <p class="taco-report-explorer__report-paragraph">
                                  Mode of Top 25 - 0.55%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li class="taco-report-explorer__report-li">
                                
                                <!-- paragraph -->
                                <p class="taco-report-explorer__report-paragraph">
                                  Top 25 Total - 63.31%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li class="taco-report-explorer__report-li">
                                
                                <!-- paragraph -->
                                <p class="taco-report-explorer__report-paragraph">
                                  Mean of Top 100 - 0.7762%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li class="taco-report-explorer__report-li">
                                
                                <!-- paragraph -->
                                <p class="taco-report-explorer__report-paragraph">
                                  Median of Top 100 - 0.2%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li class="taco-report-explorer__report-li">
                                
                                <!-- paragraph -->
                                <p class="taco-report-explorer__report-paragraph">
                                  Mode of Top 100 - 0.18%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li class="taco-report-explorer__report-li">
                                
                                <!-- paragraph -->
                                <p class="taco-report-explorer__report-paragraph">
                                  Top 100 Total - 77.62%
                                </p>
                                
                              </li>                          

                            </ul>
                            
                          </li>                      

                        </ul>

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
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
                        <ul class="taco-report-explorer__report-ul">

                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
                              All Time High (USD): 334.11
                            </p>
                            
                          </li>

                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
                              All Time High (ICP): 27.39
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
                              All Time Low (USD): 0.00122
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
                              All Time Low (ICP): 0.0022
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
                              As of 18/06/25(USD): 0.0942
                            </p>
                            
                          </li>                      

                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
                              As of 18/06/25 (ICP): 0.0187
                            </p>

                          </li>

                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
                              Change from ATH USD: -99.972%
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
                              Change from ATL USD: 7621.311%
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
                              USD Volume 24H as of 18/06/25: 16436
                            </p>
                            
                          </li>

                        </ul>

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
                          $MOTOKO's supply changed in January 2025, explaining the vast majority of the price changes. Therefore we can approximate ATH and ATL to get a more accurate figure of the data
                        </p>

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
                          All Time High (USD): ~ 0.0611
                        </p>

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
                          This means that the actual dollar value ATH is not the true ATH, and the true ATH adjusted for supply changes is June 9th's 0.1237 USD.
                        </p>

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
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
                        <p class="taco-report-explorer__report-paragraph">
                          As per <a href="https://swaprunner.com" target="_blank" class="taco-report-explorer__report-link">SwapRunner</a> on the 18th of June 2025, a single transaction of:
                        </p>

                        <!-- unordered list -->
                        <ul class="taco-report-explorer__report-ul">

                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
                              20000 ICP ($100817.27) will result in a trade to 717209.30 MOTOKO ($67469.52). 33.077% lost to price impact
                            </p>
                            
                          </li>

                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
                              10000 ICP ($50408.63) will result in a trade to 421841.63 MOTOKO ($39683.61). 21.276% lost to price impact
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
                              1000 ICP ($5040.86) will result in a trade to 51562.78 MOTOKO ($4850.63). 3.774% lost to price impact
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
                              250 ICP ($1260.22) will result in a trade to 13226.93 MOTOKO ($1242.83). 1.38% lost to price impact
                            </p>
                            
                          </li>

                        </ul>

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
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
                    <p class="taco-report-explorer__report-paragraph">
                      Motoko Ghosts originally launched without DAO control, and during this period, <a href="https://motoko-backdoor-report.gitbook.io/motoko-backdoor-report" target="_blank" class="taco-report-explorer__report-link">the NFT canister contained a backdoor</a>. This vulnerability was exploited through a series of timed upgrades and wallet transfers that extracted thousands of ICP via dormant NFTs. The issue was later investigated, the backdoor removed, the code verified, and control handed to the Motoko DAO.
                    </p>

                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      In assessing the competitive landscape, <a href="https://x.com/dragginzgame/status/1932136841127272613" target="_blank" class="taco-report-explorer__report-link">Donna has noted the following</a>:
                    </p>
                    
                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      “The existing NFT landscape on the Internet Computer is a mess. There is little to no support for existing collections. Many creators have had their NFTs stop working completely because they ran out of cycles even though they paid marketplace fees that were supposed to cover exactly that. On top of that, there's been security issues, missing assets, and no real way to fix anything when it goes wrong.”
                    </p>

                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      Motoko DAO aims to address these gaps by prioritizing canister maintainability, long-term creator control, and technical flexibility.
                    </p>   
                    
                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      The $CLOUD memecoin has positioned itself as a brand-awareness vehicle for the Internet Computer, citing the alignment between its name and ICP's positioning as a decentralized cloud. Its visibility is supported by community advocate BobbyO, who promotes $CLOUD and creates educational content around ICP. Similarly, $MOTOKO leverages the name of the Internet Computer's native programming language to elevate ecosystem visibility. While $CLOUD leans on association and influencer marketing, Motoko DAO's strategy centers around development, community creation, and physical goods — offering a more infrastructure-anchored approach to ICP branding.
                    </p>   
                    
                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      Google trends show NFT interest is one-fiftieth what it was in January 2022. Over the course of 2022, trading volume in NFTs on OpenSea, one of the largest NFT marketplaces, witnessed a <a href="https://web.archive.org/web/20220829170925/https://fortune.com/2022/08/29/nfts-opensea-crypto-winter-bubble-blockchain-web3/" target="_blank" class="taco-report-explorer__report-link">99% decline</a> from its ATH. While recently the volume of new users has seen OpenSea <a href="https://www.msn.com/en-us/money/markets/opensea-reports-highest-monthly-user-count-since-2023-are-nfts-back/ar-AA1GlZlu" target="_blank" class="taco-report-explorer__report-link">reach highs not seen since 2023</a>, the monthly volume of $81 million still far underperforms the $5 billion seen in January 2022.
                    </p>   
                    
                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      The most significant competitors to $MOTOKO will be those best poised to compete with its main product, that being Toko. The two most noteworthy marketplaces are OpenSea and Rarible.
                    </p>   
                    
                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      OpenSea is an exchange that allows for a wide variety of NFT collections from static images to music to be minted on chain by anybody, with some creator flexibility regarding fees. However, NFT creators are at risk of being <a href="https://nftevening.com/what-is-opensea/" target="_blank" class="taco-report-explorer__report-link">deplatformed by the owners of the site due to the lack of community control</a>. While OpenSea operates under a peer-to-peer transaction system, the owners of OpenSea can theoretically prevent a creator from successfully listing on the platform (<a href="https://www.cryptopolitan.com/game-developers-hit-opensea-nft-delisting/" target="_blank" class="taco-report-explorer__report-link">and has done so</a>).
                    </p>   
                    
                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      Rarible utilises a governance token of its own, $RARI, which avoids the centralisation issues posed by OpenSea, and while Rarible still does have some policies on what is considered acceptable to list, it is a form of self-regulation voted upon by governance holders rather than one imposed by executives. Rarible utilises a significant transaction fee - 2.5% - for both buyers and sellers. Rarible also allows for direct fiat transactions to be used in the minting of NFTs.
                    </p>   
                    
                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
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
                    <p class="taco-report-explorer__report-paragraph">
                      Motoko Mining is currently under audit.
                    </p>
                    
                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      It is worth noting that virtually everything purported by the Motoko DAO team is either speculative, promised, theoretical, or otherwise non-tangible, and the only created project so far is the Motoko Ghosts NFT collection (which predated the DAO), and the DAO's most significant asset is its ownership of other NFT-controlling canisters. Additionally, the DAO has made agreements with certain NFT creators to have control end up in the DAO's hands, that have yet to be followed through.
                    </p>   

                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      Subjectively speaking the largely unlaunched nature of Motoko DAO's projects would ordinarily engender caution, though it is worth noting the connections and trust Motoko DAO has earned from large figures. The Powells have expressed significant interest in the Toko marketplace, and it was after they joined as advisors that the idea was actually brought into existence. <a href="https://x.com/dragginzgame/status/1932136841127272613" target="_blank" class="taco-report-explorer__report-link">It was their Dragginz twitter account that posted a fleshed-out version of the concept</a>. The Dragginz Team are creating the Toko marketplace themselves and 'donating' it to the DAO for no explicit financial gain. This suggests existing significant financial and technical backing of the visions proposed by Motoko DAO.
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

                          <a href="https://app.sneeddao.com/proposal?proposalid=45&sns=lacdn-3iaaa-aaaaq-aae3a-cai" class="taco-text-blue-to-light-blue text-end" target="_blank">Sneed Hub</a>

                        </span>
                        
                      </span>                        
                      
                      <!-- link group -->
                      <span class="d-flex flex-column align-items-end">

                        <span class="text-end">#14 Motion to Discuss</span>

                        <span class="d-flex gap-2">

                          <a href="https://nns.ic0.app/proposal/?u=lacdn-3iaaa-aaaaq-aae3a-cai&proposal=14" class="taco-text-blue-to-light-blue text-end" target="_blank">NNS</a>                        

                          <a href="https://app.sneeddao.com/proposal?proposalid=14&sns=lacdn-3iaaa-aaaaq-aae3a-cai" class="taco-text-blue-to-light-blue text-end" target="_blank">Sneed Hub</a>

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
                    <h2 class="taco-report-explorer__report-header__title">DUE DILIGENCE Gold DAO (GOLDAO) & Gold Token (GLDT)</h2>

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
                    <p class="taco-report-explorer__report-paragraph">
                      “The DAO” is the most famous early example of a DAO. It was launched in 2016 on Ethereum as a decentralized venture capital fund, <a href="https://www.sec.gov/files/litigation/investreport/34-81207.pdf" target="_blank" class="taco-report-explorer__report-link">raising over $150 million USD</a>. A vulnerability in the code was exploited to drain ~ $60 million USD worth of ETH from The DAO. As a result, the Ethereum network was hard forked to enable original owners to re-obtain their ETH. Some continued using the unforked Ethereum blockchain, which came to be known as Ethereum Classic.
                    </p>

                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      A German company, Slock.it, <a href="https://www.coindesk.com/markets/2016/05/12/the-dao-or-how-a-leaderless-ethereum-project-raised-50-million" target="_blank" class="taco-report-explorer__report-link">created the open-source DAO framework used for The DAO</a>. According to CoinDesk, DAO.Link, a Swiss-based company, was created by Slock.it in partnership with the cryptocurrency brokerage Bity in order to provide an interface between DAOs and real-world legal structures. <a href="https://forum.dfinity.org/t/sns-the-gold-dao-by-dao-link/24255" target="_blank" class="taco-report-explorer__report-link">DAO.Link created Gold DAO</a>. The founding team consisted of individuals that worked for DFINITY, ORIGYN, Yumi, Bity, and Quantum.
                    </p>
                    
                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      On DAO.Link's website, under history, DAO.Link makes no claim to being involved in the creation of The DAO, <a href="https://dao.link/about" target="_blank" class="taco-report-explorer__report-link">they only claim to being involved in helping users recover funds from The DAO's hack</a>. If CoinDesk is accurate, this could potentially be seen as information that lacks the full context of the situation.
                    </p>
                    
                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      The ORIGYN Foundation created the ORIGYN protocol, designed to bring RWAs (Real-World Assets) fully on-chain. It is the main contributor to the ORIGYN NFT standard that is running the perpetual marketplace of the GLD NFT. ORIGYN donated 500m OGY to Gold DAO.
                    </p>
                    
                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      Although requested multiple times, the Gold DAO team did not provide any information related to team members and their experience. <a href="https://www.linkedin.com/company/daolink/people/" target="_blank" class="taco-report-explorer__report-link">According to LinkedIn</a>:
                    </p>

                    <!-- unordered list -->
                    <ul class="taco-report-explorer__report-ul">
                      
                      <!-- list item -->
                      <li class="taco-report-explorer__report-li">

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
                          <a href="https://www.linkedin.com/in/julien-aerni-04b247152/" target="_blank" class="taco-report-explorer__report-link">Julien Aerni is Président of Dao.Link</a>, having ~ 5 years of industry experience, also being CEO at Quantum and Co-Founder of Genesium.
                        </p>

                      </li>

                      <!-- list item -->
                      <li class="taco-report-explorer__report-li">

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
                          <a href="https://www.linkedin.com/in/dustin-becker-90159092/" target="_blank" class="taco-report-explorer__report-link">Dustin Becker is Tech lead at Dao.Link</a>, having ~ 16 years of experience in software, and also being Head of Innovation Tech at Bity.
                        </p>

                      </li>

                      <!-- list item -->
                      <li class="taco-report-explorer__report-li">

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
                          <a href="https://www.linkedin.com/in/gautierwojda/" target="_blank" class="taco-report-explorer__report-link">Gautier Wodja is co-CTO at Dao.Link</a>, having ~ 8 years of experience in software, also being Staff Engineer at Bity, co-CTO at ORIGYN Foundation, and Software Architect at Bochsler Finance.
                        </p>

                      </li>
                      
                      <!-- list item -->
                      <li class="taco-report-explorer__report-li">

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
                          <a href="https://www.linkedin.com/in/cencensong/" target="_blank" class="taco-report-explorer__report-link">Melissa Song is Head of Business Development & Partnerships at Dao.Link</a>, having ~ 14 years of industry experience, also being CEO of Bity, and previously being Head of Business Development: RWA & NFTs at Bochsler Finance.
                        </p>

                      </li>

                    </ul>   
                    
                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      <a href="https://x.com/VictorICPGold" target="_blank" class="taco-report-explorer__report-link">VictorICP is the Community Manager</a>, also being the creator of the <a href="https://x.com/ICPLoteria" target="_blank" class="taco-report-explorer__report-link">ICPLoteria NFT collection</a>.
                    </p>
                    
                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      <a href="https://dashboard.internetcomputer.org/sns/tw2vt-hqaaa-aaaaq-aab6a-cai/proposal/27" target="_blank" class="taco-report-explorer__report-link">156,746 ICP was transferred from the treasury to the team wallet</a>.
                    </p>

                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      Recently, with proposals <a href="https://nns.ic0.app/proposal/?u=tw2vt-hqaaa-aaaaq-aab6a-cai&proposal=240" target="_blank" class="taco-report-explorer__report-link">240</a> and <a href="https://nns.ic0.app/proposal/?u=tw2vt-hqaaa-aaaaq-aab6a-cai&proposal=251" target="_blank" class="taco-report-explorer__report-link">251</a>, Chris Yost of the Cloud Foundation was transferred GOLDAO tokens to make educational videos.
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
                    <p class="taco-report-explorer__report-paragraph">
                      The GOLDAO token serves as the governance token for Gold DAO, enabling members to submit and vote on proposals that are implemented if approved.
                    </p>

                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      The Gold NFT or GLD NFT represents direct ownership of physical gold bullion bars in sizes of 1g, 10g, 100g, or 1kg, stored in vaults in Switzerland. <a href="https://help.bity.com/en/articles/9680005-who-produced-the-gold-bar" target="_blank" class="taco-report-explorer__report-link">All gold bars are produced by Metalor</a>, a global leading gold refiner. <a href="https://help.bity.com/en/articles/9680087-who-performs-the-auditing-at-the-vault" target="_blank" class="taco-report-explorer__report-link">These bars are periodically audited by KPMG</a>, one of the world's leading accounting firms. <a href="https://docs.gold-dao.org/gold-dao-whitepaper/the-ecosystem/products/gold-nft-gld-nft" target="_blank" class="taco-report-explorer__report-link">The ORIGYN Protocol is used to issue digital certificates minted as NFTs</a>, providing unique identifiers linked to the bars. Any upgrades to the NFT canisters need to go through ORIGYN which Gold DAO has a 500m token stake in. <a href="https://docs.gold-dao.org/resources/gold-dao-owned-neurons/ogy-neuron" target="_blank" class="taco-report-explorer__report-link">The OGY tokens are in a neuron locked for 5 years</a>, from which rewards are distributed to Gold DAO neuron owners.
                    </p>

                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      Bity is a Swiss-based brokerage for cryptocurrency that provides the frontend to facilitate buying and selling of GLD NFTs, as well as a framework to perform KYC. <a href="https://help.bity.com/en/articles/9680033-how-is-the-gold-nft-price-determined" target="_blank" class="taco-report-explorer__report-link">The GLD NFT price is calculated based on the LBMA (London Bullion Market Association) Spot price of gold</a>, plus the production costs and any additional fees such as storage, auditing, and transportation. <a href="https://help.bity.com/en/articles/9680077-how-can-i-redeem-the-physical-gold-bar-from-my-nfts" target="_blank" class="taco-report-explorer__report-link">Owners can redeem their NFT to physical gold</a> by undergoing KYC, contacting the Bity support team, depositing the NFT to a wallet address provided by the support team, depositing a fee of 300 CHF to another address provided by the support team, and attending an appointment in Zurich to collect. Bity is working on providing additional delivery methods and expanding redemption locations. <a href="https://help.bity.com/en/articles/9680058-how-can-i-resell-my-gld-nft" target="_blank" class="taco-report-explorer__report-link">Owners can sell their NFT to Bity for the current spot price</a>, minus a 3% commission, having to complete KYC, and receiving funds in USDT. <a href="https://help.bity.com/en/articles/9680059-how-can-i-transfer-my-gld-nft-to-someone-else" target="_blank" class="taco-report-explorer__report-link">GLD NFTs can be transferred between wallet addresses</a>, with the originating wallet requiring 11 OGY tokens to initiate the transfer. The Gold DAO team is working on creating a secondary market for GLD NFTs.
                    </p>

                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      <a href="https://docs.gold-dao.org/gold-dao-whitepaper/the-ecosystem/products/gold-token-gldt" target="_blank" class="taco-report-explorer__report-link">The Gold Token or GLDT is a fungible token backed by GLD NFTs</a>. 1 GLDT represents 0.01g of gold. GLDT is minted when a GLD NFT is swapped for GLDT, for which there is no fee. GLDT can be swapped for GLD NFTs, for which there is a fee of 1 GLDT per NFT. <a href="https://x.com/OneSecBridge/status/1943346067514290195" target="_blank" class="taco-report-explorer__report-link">GLDT can be bridged to BASE using OneSecBridge</a>.
                    </p>

                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      Information on the planned GLDT staking mechanism was only discovered through a chance community tip. The subject is absent from the knowledge hub sidebar and is not linked in any of the sidebar's articles. <a href="https://docs.gold-dao.org/resources/gldt-staking" target="_blank" class="taco-report-explorer__report-link">It only appears via a direct 'GLDT staking' search</a>, suggesting it may still be in the conceptual stage. GLDT staking allows users to lock their GLDT tokens and earn passive rewards in GOLDAO, ICP, and OGY. The minimum stake is 10 GLDT. Rewards are sourced from a dedicated GOLDAO neuron, with distributions based on stake size and an age bonus that doubles rewards annually. Staked GLDT has a one-week unlock delay, or users can pay a 5% fee for immediate access. The system aims for a ~5% APY, scaling the GOLDAO neuron to match GLDT staking demand. Early stakers may see higher returns until more GLDT is staked. The GOLDAO neuron will be funded from a 200 million GOLDAO treasury allocation for product growth, and its creation will dilute rewards for existing GOLDAO stakers.
                    </p>

                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      <a href="https://docs.gold-dao.org/gold-dao-whitepaper/the-ecosystem/products/usd-pegged-stablecoin-usdg" target="_blank" class="taco-report-explorer__report-link">The planned USDG token will be a USD-pegged stablecoin minted by opening a Collateralized Debt Position (CDP) against GLDT</a>. USDG gains its value by being leveraged against GLDT which is itself convertible 1:1 with gold through the Gold NFT system.Those who issue USDG would do so to remain exposed to gold while also having liquid funds.
                    </p>

                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      <a href="https://2669388926-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FhyYilEcr51QGR1f1ZQ8w%2Fuploads%2FBcCDXIGwAHLVyxGVs238%2FAMA%20Q%26A%20Telegram%20Gold%20DAO.pdf?alt=media&token=3b8ca526-f413-47dd-a5e4-7ba7d20c1a81" target="_blank" class="taco-report-explorer__report-link">The Gold DAO team does not rule out adding other RWAs in the future</a>.
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
                    <p class="taco-report-explorer__report-paragraph">
                      Programmable gold is a unique value proposition. Integration of GLDT can impact broader ICP adoption, facilitating enhanced liquidity and user engagement.
                    </p>
                    
                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      The Gold DAO invested 17.5k ICP in the first SNS sale of WaterNeuron. <a href="https://docs.gold-dao.org/resources/gold-dao-owned-neurons/wtn-neuron" target="_blank" class="taco-report-explorer__report-link">The rewards from the resulting neuron are distributed to GOLDAO governance participants</a>.
                    </p>

                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      OpenChat uses GLDT for tipping.
                    </p>

                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
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
                    <p class="taco-report-explorer__report-paragraph">
                      The Gold DAO telegram has 3314 members, and the OpenChat community has 1668 members.
                    </p>
                    
                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
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
                    <p class="taco-report-explorer__report-paragraph">
                      <a href="https://docs.gold-dao.org/gold-dao-whitepaper/technology/technology" target="_blank" class="taco-report-explorer__report-link">All components directly related to the Gold project are fully deployed on the Internet Computer Protocol (ICP)</a>. The system is powered by canisters that handle NFT issuance, token minting, ledger tracking, and KYC. The GLD NFT canister, which issues the NFTs backed by physical gold, is built on the ORIGYN Protocol. ORIGYN NFTs offer low costs and fast transaction speeds, enabling complex data storage while being fully decentralized.
                    </p>
                    
                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      <a href="https://app.gldt.org/advanced/gldt" target="_blank" class="taco-report-explorer__report-link">Users interact through the GLDT Swap frontend</a>, which connects to the GLDT Swap canister responsible for minting GLDT tokens when GLD NFTs are locked. All NFT swaps are routed through the BITY KYC canister, which manages identity verification. The frontend interfaces for the swap portal and the GLDT ledger explorer are hosted on-chain as part of the SNS.
                    </p>

                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      <a href="https://docs.gold-dao.org/gold-dao-whitepaper/the-ecosystem/products/usd-pegged-stablecoin-usdg" target="_blank" class="taco-report-explorer__report-link">USDG mechanics</a>, currently in the conceptual and design phase, remain subject to revision. To mint USDG, users lock at least 150% of the desired value in GLDT, with a minimum deposit amount of 100 GLDT, no fee for initiation, and a 1% fee for closure. If price fluctuations cause the Collateral Ratio (CR) to fall below 150% but stay above 110%, users cannot mint more USDG but can still add collateral or repay their USDG debt. Falling below 110% triggers liquidation of the collateral. <a href="https://docs.gold-dao.org/gold-dao-whitepaper/tokenomics/ownership" target="_blank" class="taco-report-explorer__report-link">The oracle canisters involved in the pegging of USDG are yet to be elucidated upon</a>.
                    </p>

                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      Liquidation is executed through the Stability Pool, where users can stake USDG. When liquidation occurs, a proportional amount of staked USDG is burned to cover the debt, and the corresponding GLDT is distributed to the pool participants. Users staking in the Stability Pool are incentivised with GOLDAO tokens.
                    </p>

                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      In the scenario of liquidation, which would happen from the USD price of gold dropping, the issuer of the USDG would lose their GLDT collateral and be left the USDG. Therefore they are forced to 'cash out' with an asset that is valued lower than the initial collateral, due to the 150% minimum ratio. As liquidation is triggered below a 110% CR, this forces an additional loss of 9.09% (drop from 110 to 100) upon the issuer when compared to the loss in price for GLDT. Stability pool participants profit from this loss.
                    </p>

                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      To further enforce the USDG price peg by blunting any short term fluctuations, such as those incurred from market dumping, USDG can be redeemed through a 'redemption channel' for GLDT from CDPs with the lowest CR, incurring a 0.5% fee. Users swap 1 USDG for $1 worth of GLDT, and instant profit is gained by the difference between the value of USDG and $1. If natural supply and demand does not restore the price peg in a timely fashion, arbitrageurs attracted by the prospect of instant profit will rapidly push the price back to $1 (or rather keep it above $0.995).
                    </p>

                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      The purpose of this system is to ensure that USDG remains reliably pegged to the dollar while allowing for fluctuations in the value of GLDT. The 40% zone between 150% and 110% is wide enough to avoid sudden liquidations, while the 10% margin between 110% and 100% guarantees that, in liquidation, GLDT is reclaimed to reestablish backing. A 33.33% drop in the price of gold without extra collateral being added is required to destroy this peg, but such a drop is extremely rare and has historically taken years. The failure of the peg would come about from the inaction of issuers in an extremely long period of time, rather than the fluctuation of the gold price.
                    </p>                      
                    
                    <hr>

                    <!-- anon container -->
                    <div class="d-flex flex-wrap gap-5">

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
                        <ul class="taco-report-explorer__report-ul">

                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
                              Total Supply: 702,800
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
                              Circulating Supply: 702,800
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
                              Burn per transaction: 0.1 GLDT, currently $0.11
                            </p>
                            
                          </li>

                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
                              In a scenario where there are 10 trusted tokens and the portfolio is trading at a 7 minute interval, TACO DAO would be losing approximately $824.9 a year to GLDT burn per transaction fees.
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
                              Holders:
                            </p>

                            <!-- unordered list -->
                            <ul class="taco-report-explorer__report-ul" style="list-style-type: disc">

                              <!-- list item -->
                              <li class="taco-report-explorer__report-li">
                                
                                <!-- paragraph -->
                                <p class="taco-report-explorer__report-paragraph">
                                  Top - 34.27% (ICPSwap ckUSDT Pool)
                                </p>

                              </li>

                              <!-- list item -->
                              <li class="taco-report-explorer__report-li">
                                
                                <!-- paragraph -->
                                <p class="taco-report-explorer__report-paragraph">
                                  Second - 15.42% (Kongswap)
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li class="taco-report-explorer__report-li">
                                
                                <!-- paragraph -->
                                <p class="taco-report-explorer__report-paragraph">
                                  Third - 11.92%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li class="taco-report-explorer__report-li">
                                
                                <!-- paragraph -->
                                <p class="taco-report-explorer__report-paragraph">
                                  Mean of Top 25 - 3.7668%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li class="taco-report-explorer__report-li">
                                
                                <!-- paragraph -->
                                <p class="taco-report-explorer__report-paragraph">
                                  Median of Top 25 - 0.88%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li class="taco-report-explorer__report-li">
                                
                                <!-- paragraph -->
                                <p class="taco-report-explorer__report-paragraph">
                                  Mode of Top 25 - 1.42%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li class="taco-report-explorer__report-li">
                                
                                <!-- paragraph -->
                                <p class="taco-report-explorer__report-paragraph">
                                  Top 25 Total - 94.17%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li class="taco-report-explorer__report-li">
                                
                                <!-- paragraph -->
                                <p class="taco-report-explorer__report-paragraph">
                                  Mean of Top 100 - 0.991%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li class="taco-report-explorer__report-li">
                                
                                <!-- paragraph -->
                                <p class="taco-report-explorer__report-paragraph">
                                  Median of Top 100 - 0.06%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li class="taco-report-explorer__report-li">
                                
                                <!-- paragraph -->
                                <p class="taco-report-explorer__report-paragraph">
                                  Mode of Top 100 - 0.02%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li class="taco-report-explorer__report-li">
                                
                                <!-- paragraph -->
                                <p class="taco-report-explorer__report-paragraph">
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
                        <ul class="taco-report-explorer__report-ul">

                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
                              Total Supply: 992,916,862
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
                              Circulating Supply: 707,592,233
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
                              Burn per transaction: 0.0001 GOLDAO, currently $0.00000248
                            </p>
                            
                          </li>

                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
                              In a scenario where there are 10 trusted tokens and the portfolio is trading at a 7 minute interval, TACO DAO would be losing approximately $0.018 a year to GOLDAO burn per transaction fees.
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
                              Holders:
                            </p>

                            <!-- unordered list -->
                            <ul class="taco-report-explorer__report-ul" style="list-style-type: disc">

                              <!-- list item -->
                              <li class="taco-report-explorer__report-li">
                                
                                <!-- paragraph -->
                                <p class="taco-report-explorer__report-paragraph">
                                  Top - 28.73% (Treasury)
                                </p>

                              </li>

                              <!-- list item -->
                              <li class="taco-report-explorer__report-li">
                                
                                <!-- paragraph -->
                                <p class="taco-report-explorer__report-paragraph">
                                  Second - 26.06%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li class="taco-report-explorer__report-li">
                                
                                <!-- paragraph -->
                                <p class="taco-report-explorer__report-paragraph">
                                  Third - 0.99%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li class="taco-report-explorer__report-li">
                                
                                <!-- paragraph -->
                                <p class="taco-report-explorer__report-paragraph">
                                  Mean of Top 25 - 2.5048%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li class="taco-report-explorer__report-li">
                                
                                <!-- paragraph -->
                                <p class="taco-report-explorer__report-paragraph">
                                  Median of Top 25 - 0.3%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li class="taco-report-explorer__report-li">
                                
                                <!-- paragraph -->
                                <p class="taco-report-explorer__report-paragraph">
                                  Mode of Top 25 - 0.3%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li class="taco-report-explorer__report-li">
                                
                                <!-- paragraph -->
                                <p class="taco-report-explorer__report-paragraph">
                                  Top 25 Total - 62.62%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li class="taco-report-explorer__report-li">
                                
                                <!-- paragraph -->
                                <p class="taco-report-explorer__report-paragraph">
                                  Mean of Top 100 - 0.8063%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li class="taco-report-explorer__report-li">
                                
                                <!-- paragraph -->
                                <p class="taco-report-explorer__report-paragraph">
                                  Median of Top 100 - 0.25%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li class="taco-report-explorer__report-li">
                                
                                <!-- paragraph -->
                                <p class="taco-report-explorer__report-paragraph">
                                  Mode of Top 100 - 0.25%
                                </p>
                                
                              </li>
                              
                              <!-- list item -->
                              <li class="taco-report-explorer__report-li">
                                
                                <!-- paragraph -->
                                <p class="taco-report-explorer__report-paragraph">
                                  Top 100 Total - 80.63%
                                </p>
                                
                              </li>                          

                            </ul>
                            
                          </li>                      

                        </ul>      
                        
                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
                          <a href="https://docs.gold-dao.org/tokenomics/burning-mechanisms" target="_blank" class="taco-report-explorer__report-link">Gold DAO uses a minting system whereby exactly 40 million new tokens are minted per year as voting rewards</a>. <a href="https://docs.gold-dao.org/how-to/receive-rewards/rewards-calculation" target="_blank" class="taco-report-explorer__report-link">This figure will be halved every four years</a>. 33% of the rewards from the Gold DAO ICP neurons are used to buy GOLDAO tokens on ICPSwap and subsequently burn them. GLDT TX and swap fees are also used to buyback and burn GOLDAO tokens. This means that, while supply may be increasing at a fixed rate, depending on the number of transactions, the yields from the ICP neurons, and the price of GOLDAO to ICP, the supply may be deflationary.
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
                        <ul class="taco-report-explorer__report-ul">

                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
                              All Time High (USD): 1.1359
                            </p>
                            
                          </li>

                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
                              All Time High (ICP): 0.2448
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
                              All Time Low (USD): 0.859
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
                              All Time Low (ICP): 0.0612
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
                              As of 11/07/25(USD): 1.1196
                            </p>
                            
                          </li>                      

                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
                              As of 11/07/25 (ICP): 0.2034
                            </p>

                          </li>

                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
                              Change from ATH USD: -1.43499%
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
                              Change from ATL USD: 30.3376%
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
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
                        <ul class="taco-report-explorer__report-ul">

                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
                              All Time High (USD): 0.0986
                            </p>
                            
                          </li>

                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
                              All Time High (ICP): 0.0069
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
                              All Time Low (USD): 0.0135
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
                              All Time Low (ICP): 0.0024
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
                              As of 11/07/25(USD): 0.0249
                            </p>
                            
                          </li>                      

                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
                              As of 11/07/25 (ICP): 0.0045
                            </p>

                          </li>

                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
                              Change from ATH USD: -74.746%
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
                              Change from ATL USD: 84.44%
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
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
                        <p class="taco-report-explorer__report-paragraph">
                          As per <a href="https://swaprunner.com" target="_blank" class="taco-report-explorer__report-link">SwapRunner</a> on the 11th of July 2025, a single transaction of:
                        </p>

                        <!-- unordered list -->
                        <ul class="taco-report-explorer__report-ul">

                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
                              20000 ICP ($110399.99) will result in a trade to 3162888.48 GOLDAO ($78452.98). 28.938% lost to price impact
                            </p>
                            
                          </li>

                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
                              10000 ICP ($55199.99) will result in a trade to 1768943.80 GOLDAO ($43877.27). 20.512% lost to price impact
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
                              1000 ICP ($5519.99) will result in a trade to 214579.91 GOLDAO ($5322.49). 3.578% lost to price impact
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
                              250 ICP ($1380) will result in a trade to 54978 GOLDAO ($1363.71). 1.18% lost to price impact
                            </p>
                            
                          </li>

                        </ul>

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
                          As per <a href="https://swaprunner.com" target="_blank" class="taco-report-explorer__report-link">SwapRunner</a> on the 11th of July 2025, a single transaction of:
                        </p>

                        <!-- unordered list -->
                        <ul class="taco-report-explorer__report-ul">

                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
                              20000 ICP ($110399.99) will result in a trade to 37115.39 GLDT ($41750.74). 62.182% lost to price impact
                            </p>
                            
                          </li>

                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
                              10000 ICP ($55199.99) will result in a trade to 27504.96 GLDT ($30940.05). 43.949% lost to price impact
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
                              1000 ICP ($5519.99) will result in a trade to 4602.07 GLDT ($5176.82). 6.217% lost to price impact
                            </p>
                            
                          </li>
                          
                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
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
                    <p class="taco-report-explorer__report-paragraph">
                      GLDT competes with other tokens pegged to the price of gold, such as Paxos, but all of these tokens will have a near identical value, based on whatever measurement of gold they are backed by. As the price will largely be the same and the difference in gains is minute between the gold standards, the reasons as to why someone would choose GLDT over another gold token depend heavily on the infrastructure. Competitors like Paxos utilize the Ethereum blockchain, which has higher fees and lower speeds than the ICP blockchain. Additionally, policies come from a centralized company with Paxos (Paxos Trust Company LLC); with Gold DAO decisions should be democratic. Ergo, interfacing with the ICP ecosystem would be the main reason one would choose GLDT over other gold coins. By being built on the ICP blockchain, GLDT can take advantage of the cross-chain capabilities of ICP.
                    </p>
                    
                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      Several USD stablecoins exist across numerous blockchains, with two main methods of backing existing:
                    </p>  

                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      One is being backed by fiat USD or other non crypto assets. This method is employed by large stablecoins such as USDT and USDC. In 2025, Tether reported that USDT was backed over 90% by cash or cash assets such as treasury bonds, with the remainder being a mix of bitcoin, precious metals, and other investments. What constitutes 'other investments' is unknown because Tether has never allowed a full audit.
                    </p>  

                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      The other option is to be backed by some form of cryptocurrency related securities. Tokens such as Dai over-collateralize with a vast array of cryptocurrencies, and, similar to USDG, automatically liquidate at a certain ratio of collateral to USD. In Dai's case, <a href="https://blockapps.net/blog/understanding-the-dai-liquidation-process-steps-risks-and-strategies-to-avoid-liquidation/" target="_blank" class="taco-report-explorer__report-link">it is 124%</a>. The ratio is likely much higher than 100% (and USDG's 110%) to account for the sudden and vast drops in price often seen with volatile cryptocurrencies.
                    </p>  

                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
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
                    <p class="taco-report-explorer__report-paragraph">
                      GLDT <a href="https://github.com/VibraniumAudits/VibraniumAudits-GoldDAO/blob/main/Vibranium-Audit-for-GLDT.pdf" target="_blank" class="taco-report-explorer__report-link">was audited by Vibranium Audits</a> in October 2024 and a total of nine vulnerabilities were perceived, one of which was considered 'high' in severity. This high severity issue was surrounding the potential for an error to overload the system should it be continuous. To our knowledge, there exists no update on whether the nine vulnerabilities have been resolved since October 2024.
                    </p>

                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      Origyn NFT <a href="https://cdn.prod.website-files.com/64215e127d1ff32f211b42d7/66d45b10112e7670b3a3e4e9_Vibranium-Audit-for-Origyn-Revised.pdf" target="_blank" class="taco-report-explorer__report-link">was audited by Vibranium Audits</a>. The audit had two High Severity findings that were resolved, one Low Severity finding that was acknowledged, and three Informational findings that were acknowledged.
                    </p>

                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      <a href="https://help.bity.com/en/articles/9680075-where-are-gold-bars-stored" target="_blank" class="taco-report-explorer__report-link">The gold bars are fully insured</a>, which means that even if the existence of the physical gold is compromised (such as through robbery), they are still backed by the highest echelons of the Swiss financial and legal systems.
                    </p>

                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      The implications of a 51% attack on GOLDAO are unknown, as the canister that controls the minting right for GLDT <a href="https://docs.gold-dao.org/gold-dao-whitepaper/tokenomics/ownership" target="_blank" class="taco-report-explorer__report-link">is in turn controlled by the GOLDAO SNS</a>. A 51-percenter may impact the methods by which GLDT is minted, ruining the chain-of-supply between USDG, GLDT, and GLD NFT.
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

                        <span class="text-end">#25 Motion to Discuss</span>

                        <span class="d-flex gap-2">

                          <a href="https://nns.ic0.app/proposal/?u=lacdn-3iaaa-aaaaq-aae3a-cai&proposal=25" class="taco-text-blue-to-light-blue text-end" target="_blank">NNS</a>                        

                          <a href="https://app.sneeddao.com/proposal?proposalid=25&sns=lacdn-3iaaa-aaaaq-aae3a-cai" class="taco-text-blue-to-light-blue text-end" target="_blank">Sneed Hub</a>

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
                    <h2 class="taco-report-explorer__report-header__title">DUE DILIGENCE GLDT Wrapper (sGLDT)</h2>

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
                    <p class="taco-report-explorer__report-paragraph">
                      sGLDT was devved up by Bitcorn Labs, a loose conglomerate of anon devs with an extensive history of contributions to the ICP ecosystem. They are closely affiliated with the Sneed DAO. Some of their contributions include:
                    </p>

                    <!-- unordered list -->
                    <ul class="taco-report-explorer__report-ul">
                      
                      <!-- list item -->
                      <li class="taco-report-explorer__report-li">

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
                          Migrating tokens through dip20, icrc1, and icrc2 token standards
                        </p>

                      </li>
                      
                      <!-- list item -->
                      <li class="taco-report-explorer__report-li">

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
                          Helping create an early indexer of ICRC tokens and produce token transaction URLs in a format needed to list on websites like OpenChat
                        </p>

                      </li>

                      <!-- list item -->
                      <li class="taco-report-explorer__report-li">

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
                          Helping to add Sneed to OpenChat, which was the first token to be used for tipping
                        </p>

                      </li>

                      <!-- list item -->
                      <li class="taco-report-explorer__report-li">

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
                          Creating a webpage that shows locked tokens for SneedLock, which locks tokens and liquidity pool positions for predefined durations
                        </p>

                      </li>

                      <!-- list item -->
                      <li class="taco-report-explorer__report-li">

                        <!-- paragraph -->
                        <p class="taco-report-explorer__report-paragraph">
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
                    <p class="taco-report-explorer__report-paragraph">
                      <a href="https://docs.gold-dao.org/gold-dao-whitepaper/the-ecosystem/products/gold-token-gldt" target="_blank" class="taco-report-explorer__report-link">The Gold Token or GLDT is a fungible token backed by GLD NFTs</a>. 1 GLDT represents 0.01g of gold. GLDT has a burn per transaction of 0.1 GLDT, currently $0.11, making it unsuitable for high frequency trading.
                    </p>

                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
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
                    <p class="taco-report-explorer__report-paragraph">
                      GLDT tx fees are used to buyback and burn GOLDAO tokens. sGLDT takes this source of burning from GOLDAO, which could be interpreted as negatively impacting it.
                    </p>
                    
                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
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
                    <p class="taco-report-explorer__report-paragraph">
                      The sGLDT canister (sVAULT) is a novel icrc1234 implementation serving as an icrc1/icrc2 ledger and a converter. The converter consists of the wrap and unwrap methods. The Sneed DAO is the controller of this canister.
                    </p>
                    
                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      The wrap method mints sGLDT when it approves that it has received GLDT, and sends that GLDT to the sVAULT. This incurs two GLDT tx fees, and no sGLDT fee (because the canister is both ledger and converter).
                    </p>

                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      The unwrap method burns sGLDT when it approves that it has received sGLDT, and sends the corresponding GLDT to the burner. This incurs a fee of 0.2 sGLDT and one GLDT tx fee.
                    </p>

                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
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
                    <p class="taco-report-explorer__report-paragraph">
                      It is a new, wrapped version of GLDT. <a href="https://tacodao.com/reports/ddgolddao" class="taco-report-explorer__report-link">Refer to Gold DAO's DD report for GLDT's market metrics</a>.
                    </p>
                    
                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      As of 22/07/2025, <a href="https://svault.app" target="_blank" class="taco-report-explorer__report-link">there is a total of 8751.77749903 GLDT in the sVAULT</a>, which is equivalent to the supply of sGLDT.
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
                    <p class="taco-report-explorer__report-paragraph">
                      It is a new, wrapped version of GLDT. <a href="https://tacodao.com/reports/ddgolddao" class="taco-report-explorer__report-link">Refer to Gold DAO's DD report for GLDT's market metrics</a>.
                    </p>

                    <!-- heading -->
                    <h3 class="taco-report-explorer__report-heading
                              taco-report-explorer__report-heading--h2 mt-4">
                      Liquidity:
                    </h3>

                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      As per <a href="https://swaprunner.com/" target="_blank" class="taco-report-explorer__report-link">SwapRunner</a> on the 22nd of July, a single transaction of:
                    </p>

                    <!-- unordered list -->
                    <ul class="taco-report-explorer__report-ul">
                      <li class="taco-report-explorer__report-li">
                        <p class="taco-report-explorer__report-paragraph">10 ICP ($59.19) will result in a trade to 52.71 sGLDT ($58.08). 1.87% lost to price impact</p>
                      </li>
                    </ul> 

                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
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
                    <p class="taco-report-explorer__report-paragraph">
                      <a href="https://tacodao.com/reports/ddgolddao" class="taco-report-explorer__report-link">Refer to Gold DAO's DD report for security risks on GLDT</a>.
                    </p>

                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      The sVAULT team claims to have had their code pen tested, with no issues found. Snassy gives it a thumbs up.
                    </p>
                    
                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
                      The same code was used for rebob.fun and dragonwizards.club, which have been running for over 10 months without issues.
                    </p>
                    
                    <!-- paragraph -->
                    <p class="taco-report-explorer__report-paragraph">
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

                        <span class="text-end">#56 Motion to Discuss</span>

                        <span class="d-flex gap-2">

                          <a href="https://nns.ic0.app/proposal/?u=lacdn-3iaaa-aaaaq-aae3a-cai&proposal=56" class="taco-text-blue-to-light-blue text-end" target="_blank">NNS</a>                        

                          <a href="https://app.sneeddao.com/proposal?proposalid=56&sns=lacdn-3iaaa-aaaaq-aae3a-cai" class="taco-text-blue-to-light-blue text-end" target="_blank">Sneed Hub</a>

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
    &__report-paragraph {
      font-family: "Rubik";
      line-height: 1.825;
      font-weight: 300;
      color: var(--black-to-white);
    }

    // report ul and ol
    &__report-ul, &__report-ol {
      .taco-report-explorer__report-paragraph {
        margin: 0;
      }
    }

    // report ul
    &__report-ul {
      list-style-type: '🌮';
    }

    // report ol
    &__report-ol {
      list-style-type: decimal;
    }

    // report li
    &__report-li {
      padding-left: 0.5rem;
      color: var(--black-to-white);
    }

    // report link
    &__report-link {
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
    z-index: 1000;
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

  // show report menu on mobile
  const showReportMenuOnMobile = ref(false)

  // disclaimer
  const userReshownReportsDisclaimer = ref(false)

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

  /////////////
  // returns //  
  
  // 


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

    // set reportId
    if (newPath === '/reports/ddckbtc') {
      reportId.value = 1
    } else if (newPath === '/reports/ddsneed') {
      reportId.value = 2
    } else if (newPath === '/reports/ddmotoko') {
      reportId.value = 3
    } else if (newPath === '/reports/ddgolddao') {
      reportId.value = 4
    } else if (newPath === '/reports/ddsgldt') {
      reportId.value = 5
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
