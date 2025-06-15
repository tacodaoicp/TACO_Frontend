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
                
              </div>
              
              <!-- reports list container -->
              <div class="taco-report-explorer__list-container">
                
                <!-- reports list -->
                <ul class="taco-report-explorer__list">      
                    
                  <!-- report item -->
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
                  
                  <!-- report item -->
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
                        <span class="taco-report-explorer__list-report__title">DUE DILIGENCE PROCESS Sneed (SNS)</span>
                        
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

                      <li class="taco-report-explorer__report-li">Finality Guarantees: Medium Risk</li>

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
                              As at 08/06/25(USD): 72.37
                            </p>
                            
                          </li>                      

                          <!-- list item -->
                          <li class="taco-report-explorer__report-li">
                            
                            <!-- paragraph -->
                            <p class="taco-report-explorer__report-paragraph">
                              As at 08/06/25 (ICP): 13.65
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
                              USD Volume 24H as at 08/06/25: 2010
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

                        <span class="text-end">#18 Motion to Add</span>

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
              
            </div>
            
          </div>

        </div>

      </div>

    </div>

    <!-- footer bar -->
    <FooterBar />

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
    
    // report explorer
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
    &__right {
      display: flex;
      width: 100%;
    }
    &__title-container {
      margin: 0 1rem 0;
      padding: 1rem 0 0.5rem;
      border-bottom: 1px solid var(--black-to-white);
      transition: border-color 0.125s ease-in-out;
    }
    &__title {
      position: relative;
      font-size: 1.5rem;
      text-align: center;
      font-family: "Space Mono";
    }
    &__list-container {
      padding-top: 1rem;
    }
    &__list {
      list-style-type: none;
      padding: 0;
    }
    &__list-item {

    }
    &__list-report {
      display: flex;
      gap: 0.75rem;
      padding: 0.5rem 1rem;
      
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
      }
      &__title-container {
        display: flex;
        flex-direction: column;
      }    
      &__title {
        
      }
      &:hover {
        cursor: pointer;
        background-color: var(--dark-orange-to-brown);
      }  
      &--active {
        background-color: var(--dark-orange-to-brown);
      }
    }
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
    &__report-header {

      &__title {
        font-size: 2.5rem;
        font-family: "Space Mono";
      }

      &__metadata-container {

      }

      &__metadata {
        font-size: 1rem;

        i {
          color: var(--brown-to-light-orange);
        }

      }

    }
    &__report-body {
      padding-top: 2rem;
    }
    &__report-heading {
      display: flex;
      align-items: center;
      gap: 0.75rem;

      &--h1, &--h2, &--h3, &--h4, &--h5, &--h6 {
        font-family: "Space Mono";
        margin-bottom: 1rem;
      }

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

      i {
        font-size: 1.125rem;
        color: var(--dark-orange-to-brown);
      }

    }
    &__report-paragraph {
      font-family: "Rubik";
      line-height: 1.825;
      font-weight: 300;
    }
    &__report-ul, &__report-ol {
      .taco-report-explorer__report-paragraph {
        margin: 0;
      }
    }
    &__report-ul {
      list-style-type: '🌮';
    }
    &__report-ol {
      list-style-type: decimal;
    }
    &__report-li {
      padding-left: 0.5rem;
    }
    &__report-link {
      font-family: "Rubik";
      color: var(--blue-to-light-blue);
    }
    &__report-quote {
      border-left: 0.25rem solid var(--dark-orange);
      padding-left: 1rem;
      margin-left: 1rem;
    }
    &__report-img {
      width: fit-content;
      max-width: 100%;
      height: auto;
      border-radius: 0.25rem;
    }
    &__report-container hr {
      margin: 2rem 0 1.5rem;
    }
    &__report-footer {
      color: var(--black-to-white);
      display: flex;
      width: 100%;
      align-items: flex-start;
      justify-content: space-between;
      margin-top: 2.5rem;
      padding: 0.75rem 0 0.75rem 0;
      border-top: 1px solid var(--dark-orange);
      
      &__left {
        font-size: 0.8 75rem;
      }
      &__center {
        opacity: 0.5;
        font-size: 0.875rem;
      }
      &__right {
        display: flex;
        flex-direction: column;
        font-size: 0.875rem;
        gap: 0.5rem;
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
  import { useRoute, useRouter } from 'vue-router'
  import ckBtcIcon from '../assets/tokens/ckbtc.png'
  import sneedIcon from '../assets/tokens/snspng/sneed.png'

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

  // show report menu on mobile
  const showReportMenuOnMobile = ref(false)

  ///////////////////
  // local methods //
  ///////////////////  

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