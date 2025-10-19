<template>

  <div class="home-view">

    <!-- home view inner -->
    <div class="home-view__inner">

      <!-- above the fold -->
      <div class="home-view__above-the-fold">

        <!-- header bar -->
        <HeaderBar />

        <!-- upper -->
        <div class="container home-view__above-the-fold__upper">

          <!-- top -->
          <div class="home-view__above-the-fold__upper__top">

            <!-- left -->
            <div class="home-view__above-the-fold__upper__top__left">

              <!-- current discussion container -->
              <div class="home-view__canted__container
                          home-view__canted__container--left">

                <!-- current discussion -->
                <span class="home-view__canted__title">Current Discussion</span>

                <!-- current discussion link -->
                <router-link to="/chat/forum/142" 
                            class="home-view__canted__link">
                  Insane Clown Protocol
                </router-link>
                
              </div>

            </div>

            <!-- center -->
            <div class="home-view__above-the-fold__upper__top__center">

              <!-- logo and slogan lockup -->
              <div class="d-flex flex-column align-items-center">

                <!-- logo -->
                <TacoDaoLogo class="home-view__taco-dao-logo"
                             @click="redirectToDao"
                             style="cursor: pointer;"/>

                <!-- slogan -->
                <h2 class="home-view__taco-dao-slogan">
                  <span class="cs__h2__line1 taco-text-brown-to-white">The <span class="taco-text-brown-to-white" style="font-weight: 500;">Tastiest</span> Entry Point in Crypto</span>
                </h2>

              </div>

            </div>

            <!-- right -->
            <div class="home-view__above-the-fold__upper__top__right">

              <!-- latest report container -->
              <div class="home-view__canted__container
                          home-view__canted__container--right">

               <!-- latest report -->
                <span class="home-view__canted__title">Latest Report</span>

                <!-- latest report link -->
                <router-link to="/reports/clown" 
                            class="home-view__canted__link">
                  <!-- Insane Clown Protocol -->
                  Insane Clown Protocol
                </router-link>

              </div>

            </div>

          </div>

          <!-- middle -->
          <div class="home-view__above-the-fold__upper__middle">

            <!-- left -->
            <div class="home-view__above-the-fold__upper__middle__left">

              <!-- tile container -->
              <div class="home-view__tile taco-container taco-container--l1">

                <!-- title -->
                <h2 class="home-view__title">
                  <TacoCoinIcon class="home-view__title__icon"/>
                  <span class="home-view__title__text">TACO Token</span>
                </h2>

                <!-- chart and loader container -->
                <div class="w-100">

                  <!-- tile container inner -->
                  <div class="position-relative home-view__tile__inner home-view__taco-token-chart taco-container taco-container--l2 p-0">

                    <!-- expand button -->
                    <button v-if="!isMobile"
                            class="btn taco-nav-btn home-view__taco-token-chart__expand-btn"
                            @click="viewingChartModal = true">
                      <i class="fa-solid fa-expand"></i>
                    </button>

                    <!-- if desktop, chart iframe -->
                    <iframe v-if="!isMobile && shouldLoadDex" 
                            loading="lazy"
                            style="border-radius: 0.5rem; 
                                   z-index: 2;" 
                            src="https://dexscreener.com/icp/vhoia-myaaa-aaaar-qbmja-cai?embed=1&loadChartSettings=0&trades=0&tabs=0&info=0&chartLeftToolbar=0&chartTheme=dark&theme=dark&chartStyle=1&chartType=usd&interval=15"></iframe>

                    <!-- if mobile, tap to view -->
                    <div v-else @click="viewingChartModal = true" 
                          class="home-view__taco-token-chart__mobile"
                          style="z-index: 2;">
                      
                      <!-- text -->
                      <span>Tap to View</span>
                      
                    </div>

                    <!-- loader container -->
                    <div class="position-absolute top-0 start-0 w-100 h-100"
                          style="z-index: 1;">

                      <!-- astronaut -->
                      <img :src="astronautLoaderUrl" :style="{ zoom: !isMobile ? 2 : 1 }" class="loading-img">

                    </div>                    

                  </div>

                </div>

              </div>

            </div>

            <!-- center -->
            <div class="home-view__above-the-fold__upper__middle__center">

              <!-- tile container -->
              <div class="home-view__tile taco-container taco-container--l1">

                <!-- title -->
                <h2 class="home-view__title">
                  <span class="home-view__title__icon home-view__title__icon--i">📚</span>
                  <span class="home-view__title__text">Getting Started</span>
                </h2>

                <!-- tile container inner -->
                <div class="home-view__tile__inner taco-container taco-container--l2 p-0">

                  <!-- video iframe (lazy) -->
                  <iframe v-if="shouldLoadYouTube"
                    loading="lazy"
                    src="https://www.youtube.com/embed/ikNBuHYMkNs"
                    title="YouTube video player" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen
                    style="z-index: 2;"
                    ></iframe>

                  <!-- astronaut -->
                  <img :src="astronautLoaderUrl" class="loading-img">

                </div>
                
              </div>

            </div>

            <!-- right -->
            <div class="home-view__above-the-fold__upper__middle__right">

              <!-- tile container -->
              <div class="home-view__tile taco-container taco-container--l1">

                <h2 class="home-view__title">
                  <TacoDaoLogo class="home-view__title__icon"/>
                  <span class="home-view__title__text">Taco Dao Assets</span>
                </h2>

                <!-- tile container inner -->
                <div class="home-view__tile__inner taco-container taco-container--l2 p-0">

                  <!-- taco assets -->
                  <div class="home-view__taco-assets">

                    <!-- kvp (treasury) -->
                    <div class="home-view__taco-assets__kvp">

                        <!-- key -->
                        <span class="home-view__taco-assets__kvp__key">
                            <i class="fa-solid fa-building-columns home-view__taco-assets__fa-icon"></i>
                            Treasury
                        </span>

                        <!-- value -->
                        <span class="home-view__taco-assets__kvp__value">${{formatNumber(totalTreasuryValueInUsd)}}</span>

                    </div>   
                    
                    <!-- kvp (icp) -->
                    <div class="home-view__taco-assets__kvp">

                        <!-- key -->
                        <span class="home-view__taco-assets__kvp__key"
                            style="padding-left: 0.5rem">
                            <img :src="icpLogo" class="home-view__taco-assets__svg"/>
                            ICP
                        </span>

                        <!-- value -->
                        <span class="home-view__taco-assets__kvp__value">${{formatNumber(snsTreasuryIcpValueInUsd)}}</span>

                    </div>                     

                    <!-- kvp (taco) -->
                    <div class="home-view__taco-assets__kvp">

                        <!-- key -->
                        <span class="home-view__taco-assets__kvp__key"
                            style="padding-left: 0.5rem">
                            <TacoCoinIcon class="home-view__taco-assets__svg"/>
                            Taco
                        </span>

                        <!-- value -->
                        <span class="home-view__taco-assets__kvp__value">${{formatNumber(snsTreasuryTacoValueInUsd)}}</span>

                    </div> 
                    
                    <!-- kvp (dkp) -->
                    <div class="home-view__taco-assets__kvp">

                        <!-- key -->
                        <span class="home-view__taco-assets__kvp__key"
                            style="padding-left: 0.5rem">
                            <img :src="dkpLogo" class="home-view__taco-assets__svg"/>
                            DKP
                        </span>

                        <!-- value -->
                        <span class="home-view__taco-assets__kvp__value">${{formatNumber(snsTreasuryDkpValueInUsd)}}</span>

                    </div>                     
                    
                    <hr class="m-0 p-0"></hr>

                    <!-- kvp (portfolio) -->
                    <div class="home-view__taco-assets__kvp">

                        <!-- key -->
                        <span class="home-view__taco-assets__kvp__key">
                            <i class="fa-solid fa-chart-pie  home-view__taco-assets__fa-icon"></i>
                            Portfolio
                        </span>

                        <!-- value -->
                        <span class="home-view__taco-assets__kvp__value">${{formatNumber(totalPortfolioValueInUsd)}}</span>

                    </div>

                    <hr class="m-0 p-0"></hr>

                    <!-- kvp (total) -->
                    <div class="home-view__taco-assets__kvp">

                        <!-- key -->
                        <span class="home-view__taco-assets__kvp__key">Total</span>

                        <!-- value -->
                        <span class="home-view__taco-assets__kvp__value">${{formatNumber(totalTreasuryValueInUsd + totalPortfolioValueInUsd)}}</span>

                    </div>

                  </div>

                </div>
                
              </div>

            </div>

          </div>

          <!-- bottom -->
          <div class="home-view__above-the-fold__upper__bottom">

            <!-- wizard tagline container -->
            <div v-if="localNeuronsCount < 1" class="home-view__tagline__container mt-4">

              <!-- wizard tagline -->
              <span class="home-view__tagline">
                Use the <span @click="toggleTacoWizard" class="home-view__tagline__link">🧙Taco Wizard</span> to start voting and earning rewards!
              </span>

            </div>

            <!-- tagline container -->
            <div class="home-view__tagline__container mt-3">

              <!-- tagline line 1 -->
              <span class="home-view__tagline">
                Fully on-chain, holder-directed
              </span>

              <!-- tagline line 2 -->
              <span class="home-view__tagline">
                curation and allocation.
              </span>

            </div>

            <!-- socials container -->
            <div class="home-view__social-links">

              <!-- social link - X -->
              <a class="home-view__social-link" 
                href="https://twitter.com/tacodaoicp" 
                target="_blank">
                <xSocialImg />
              </a>

              <!-- social link - Open Chat -->
              <a class="home-view__social-link" 
              href="https://oc.app/community/lizfz-ryaaa-aaaar-bagsa-cai" 
              target="_blank">
                <ocSocialImg />
              </a>        

              <!-- social link - Nuance -->
              <a class="home-view__social-link" 
              href="https://nuance.xyz/user/tacodao" 
              target="_blank">
                <nuanceSocialImg />
              </a>

              <!-- social link - TAGGR -->
              <a class="home-view__social-link" 
              href="https://taggr.link/#/user/4914" 
              target="_blank">
                <taggrSocialImg />
              </a>

              <!-- social link - Catalyze -->
              <a class="home-view__social-link" 
              href="https://catalyze.one/channels/79/!fMrfPzCYDphcZUHqvn" 
              target="_blank">
                <catalyzeSocialImg />
              </a>

              <!-- social link - Github -->
              <a class="home-view__social-link" 
              href="https://github.com/tacodaoicp" 
              target="_blank">
                <githubSocialImg />
              </a>

              <!-- social link - Discord -->
              <a class="home-view__social-link" 
              href="https://discord.gg/eVe8kqdVQd" 
              target="_blank">
                <discordSocialImg />
              </a>

            </div>

          </div>

        </div>

        <!-- lower -->
        <div class="home-view__above-the-fold__lower">

          <!-- bobbing down indicator -->
          <i class="home-view__bobbing-down-indicator fa-solid fa-angle-down"
            :class="{ 'home-view__bobbing-down-indicator--paused': isBelowTheFoldVisible }"
            :style="{ opacity: isBelowTheFoldVisible ? 0 : 1 }"></i>

        </div>

      </div>

      <!-- below the fold -->
      <div class="home-view__below-the-fold">

        <!-- pitch points -->
        <div class="home-view__pitch-points">

          <!-- point 1 -->
          <div class="home-view__pitch-point">

            <!-- left -->
            <img :src="TacoChefWave" alt="placeholder" class="home-view__pitch-point__image home-view__pitch-point__image--lg">

            <!-- right -->
            <div class="home-view__pitch-point__right">

              <!-- title -->
              <h3 class="home-view__pitch-point__title">Welcome to Taco DAO!</h3>

              <!-- description -->
              <p class="home-view__pitch-point__description">You've found the most exciting place in crypto! Together we vote on how our portfolio should be allocated, and what tokens we should include.</p>

            </div>

          </div>

          <!-- point 2 -->
          <div class="home-view__pitch-point">

            <!-- left -->
            <img :src="TacoChefTaco" alt="placeholder" class="home-view__pitch-point__image">

            <!-- right -->
            <div class="home-view__pitch-point__right">

              <!-- title -->
              <h3 class="home-view__pitch-point__title">Together we perfect the recipe</h3>

              <!-- description -->
              <p class="home-view__pitch-point__description">We're a DAO, that means no one person is in control. Every choice we make is decided by consensus, putting the power in your hands.</p>

            </div>

          </div>

          <!-- point 3 -->
          <div class="home-view__pitch-point">

            <!-- left -->
            <img :src="TacoChefFriends" alt="placeholder" class="home-view__pitch-point__image">

            <!-- right -->
            <div class="home-view__pitch-point__right">

              <!-- title -->
              <h3 class="home-view__pitch-point__title">Using the Wisdom of the Crowd</h3>

              <!-- description -->
              <p class="home-view__pitch-point__description">We believe crowd-sourcing decisions leads to the best outcomes, and ensures the platform always benefits the users instead of a select few.</p>

            </div>

          </div>

          <!-- point 4 -->
          <div class="home-view__pitch-point">

            <!-- left -->
            <img :src="TacoChefRead" alt="placeholder" class="home-view__pitch-point__image">

            <!-- right -->
            <div class="home-view__pitch-point__right">

              <!-- title -->
              <h3 class="home-view__pitch-point__title">And researching as a team</h3>

              <!-- description -->
              <p class="home-view__pitch-point__description">Participate and get rewarded! We award TACO tokens for best allocation choices, impactful research, and insightful discussion. Our members are our superpower!</p>

            </div>

          </div>

        </div>

        <!-- speedbump -->
        <div class="home-view__speedbump">

          <!-- title -->
          <h3 class="home-view__speedbump__title">You can get TACO at these exchanges</h3>

          <!-- exchanges -->
          <div class="home-view__speedbump__exchanges">

            <!-- exchange 1 -->
            <a href="https://kongswap.io"
              target="_blank"
              class="home-view__speedbump__exchange">

              <!-- top -->
              <kongSwapLogo class="home-view__speedbump__exchange__logo"/>

              <!-- bottom -->
              <kongSwapText class="home-view__speedbump__exchange__text sbt-kong"/>

            </a>

            <!-- exchange 2 -->
            <a href="https://swaprunner.com/"
              target="_blank"
              class="home-view__speedbump__exchange">

              <!-- top -->
              <swapRunnerLogo class="home-view__speedbump__exchange__logo"/>

              <!-- bottom -->
              <swapRunnerText class="home-view__speedbump__exchange__text sbt-sw"/>

            </a>

            <!-- exchange 3 -->
            <a href="https://app.icpswap.com/"
              target="_blank"
              class="home-view__speedbump__exchange">

              <!-- top -->
              <icpSwapLogo class="home-view__speedbump__exchange__logo"/>

              <!-- bottom -->
              <icpSwapText class="home-view__speedbump__exchange__text sbt-icpswap"/>

            </a>

          </div>

        </div>
        
        <!-- links and CTA -->
        <div class="home-view__cta">

          <!-- top -->
          <div class="home-view__cta__top">

            <span>
              We've also got <router-link to="/chat/oc" class="home-view__cta__link">Chat Rooms</router-link>, <router-link to="/chat/forum" class="home-view__cta__link">Forums</router-link>, <router-link to="/reports" class="home-view__cta__link">Reports</router-link>, <router-link to="/vote" class="home-view__cta__link">Voting</router-link>, and more!
            </span>

          </div>

          <!-- bottom -->
          <div class="home-view__cta__bottom">

            <span>Ready to Join Us?</span>

            <router-link to="/dao" class="btn taco-btn taco-btn--green">Enter Taco DAO</router-link>

          </div>

        </div>

        <!-- powered by -->
        <a href="https://internetcomputer.org/" target="_blank" class="home-view__powered-by" style="color: var(--black-to-white);">

          <span>Powered By The</span>

          <svg viewBox="0 0 219 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clip-path="url(#clip0_8683_62477)">
              <path d="M69.5606 33.234C63.7777 33.234 57.6722 29.4534 54.6754 26.711C51.3977 23.7104 42.3941 13.9438 42.3543 13.9002C36.4499 7.31258 28.511 0 20.5911 0C11.0523 0 2.73196 6.60657 0.568359 15.3578C0.733476 14.7808 3.76631 6.76409 15.1499 6.76409C20.9328 6.76409 27.0383 10.5447 30.035 13.2872C33.3127 16.2877 42.3163 26.0543 42.3562 26.0979C48.2605 32.6855 56.1994 39.9981 64.1212 39.9981C73.66 39.9981 81.9785 33.3915 84.144 24.6404C83.9789 25.2173 80.946 33.234 69.5625 33.234H69.5606Z" fill="#29AAE1"/>
              <path d="M42.3534 26.0998C42.3326 26.0752 39.74 23.2644 36.8325 20.1974C35.261 22.063 32.9968 24.6043 30.3948 26.8837C25.5438 31.1349 22.3914 32.027 20.5884 32.027C13.7864 32.027 8.23691 26.6312 8.23691 20C8.23691 13.3688 13.7788 8.01481 20.5884 7.97306C20.8351 7.97306 21.135 7.99773 21.4956 8.06226C19.4497 7.27653 17.2766 6.7641 15.1471 6.7641C3.76737 6.7641 0.73454 14.777 0.567525 15.3578C0.199334 16.8495 0.00195312 18.402 0.00195312 20C0.00195312 31.0287 9.09855 40 20.4423 40C25.1718 40 30.4688 37.5764 35.9234 32.7937C38.5026 30.5333 40.7383 28.1154 42.418 26.172C42.3971 26.1473 42.3743 26.1245 42.3534 26.0998Z" fill="url(#paint0_linear_8683_62477)"/>
              <path d="M42.3536 13.9002C42.3745 13.9248 44.967 16.7356 47.8746 19.8026C49.446 17.937 51.7102 15.3957 54.3122 13.1163C59.1632 8.86506 62.3156 7.97305 64.1186 7.97305C70.9207 7.97305 76.4701 13.3688 76.4701 20C76.4701 26.5933 70.9283 31.9852 64.1186 32.027C63.8719 32.027 63.572 32.0023 63.2114 31.9377C65.2574 32.7235 67.4305 33.2359 69.5599 33.2359C80.9416 33.2359 83.9744 25.223 84.1414 24.6422C84.5096 23.1505 84.707 21.598 84.707 20C84.707 8.97134 75.4623 0 64.1186 0C59.3891 0 54.2401 2.42361 48.7837 7.2063C46.2044 9.46669 43.9687 11.8846 42.2891 13.8281C42.3099 13.8527 42.3327 13.8755 42.3536 13.9002Z" fill="url(#paint1_linear_8683_62477)"/>
              <path fill="currentColor" d="M93.9102 17.5973V0.516235H98.5125V17.5973H93.9102Z"/>
              <path fill="currentColor" d="M111.256 17.5973L105.329 7.45493V17.5973H100.873V0.516235H106.077L111.401 9.79124V0.516235H115.882V17.5973H111.256Z"/>
              <path fill="currentColor" d="M126.29 4.7808V17.5973H121.761V4.7808H116.846V0.516235H131.228V4.7808H126.29Z"/>
              <path fill="currentColor" d="M132.193 17.5973V0.516235H143.131V4.4183H136.674V7.11711H142.552V10.8749H136.674V13.6212H143.178V17.5954H132.193V17.5973Z"/>
              <path fill="currentColor" d="M144.937 17.5973V0.516235H152.14C155.609 0.516235 157.873 2.82977 157.873 6.00874C157.873 8.32227 156.596 10.0323 154.717 10.7781L157.946 17.5954H153.055L150.356 11.4045H149.416V17.5954H144.936L144.937 17.5973ZM151.297 7.937C152.647 7.937 153.345 7.16645 153.345 6.08276C153.345 4.99906 152.647 4.25129 151.297 4.25129H149.418V7.937H151.297Z"/>
              <path fill="currentColor" d="M169.559 17.5973L163.632 7.45493V17.5973H159.176V0.516235H164.38L169.703 9.79124V0.516235H174.184V17.5973H169.559Z"/>
              <path fill="currentColor" d="M176.156 17.5973V0.516235H187.094V4.4183H180.637V7.11711H186.515V10.8749H180.637V13.6212H187.141V17.5954H176.156V17.5973Z"/>
              <path fill="currentColor" d="M197.336 4.7808V17.5973H192.808V4.7808H187.893V0.516235H202.275V4.7808H197.336Z"/>
              <path fill="currentColor" d="M96.8855 30.6984C96.8855 33.5415 98.9087 35.1794 100.981 35.1794C103.342 35.1794 104.354 33.7104 104.716 32.5052L108.956 33.7332C108.282 36.2631 106.016 39.5882 100.958 39.5882C96.2118 39.5882 92.2129 36.1435 92.2129 30.7231C92.2129 25.3027 96.2839 21.7859 100.911 21.7859C105.826 21.7859 108.066 24.7732 108.764 27.3278L104.597 28.7493C104.283 27.6162 103.369 26.1226 100.958 26.1226C99.0301 26.1226 96.8874 27.5916 96.8874 30.7003L96.8855 30.6984Z"/>
              <path fill="currentColor" d="M117.725 21.7859C122.423 21.7859 126.495 25.1585 126.495 30.7003C126.495 36.2422 122.424 39.6147 117.725 39.6147C113.026 39.6147 108.955 36.2422 108.955 30.7003C108.955 25.1585 113.026 21.7859 117.725 21.7859ZM117.725 35.2534C119.726 35.2534 121.846 33.8318 121.846 30.6757C121.846 27.5195 119.726 26.1473 117.725 26.1473C115.725 26.1473 113.605 27.5688 113.605 30.6757C113.605 33.7825 115.725 35.2534 117.725 35.2534Z"/>
              <path fill="currentColor" d="M143.02 39.2276V28.6506L139.285 39.2276H135.718L132.008 28.7721V39.2276H127.719V22.1465H133.718L137.548 32.5546L141.209 22.1465H147.377V39.2276H143.016H143.02Z"/>
              <path fill="currentColor" d="M153.834 33.3972V39.2276H149.354V22.1465H156.171C159.737 22.1465 162.17 24.4828 162.17 27.7833C162.17 31.0837 159.737 33.3972 156.171 33.3972H153.834ZM155.594 29.6622C156.774 29.6622 157.642 28.9637 157.642 27.8079C157.642 26.6521 156.774 25.929 155.594 25.929H153.859V29.6641H155.594V29.6622Z"/>
              <path fill="currentColor" d="M163.062 32.9645V22.1465H167.568V32.8184C167.568 34.5056 168.435 35.3957 169.929 35.3957C171.423 35.3957 172.265 34.5037 172.265 32.8184V22.1465H176.771V32.9645C176.771 37.2518 173.903 39.6147 169.929 39.6147C165.955 39.6147 163.062 37.2537 163.062 32.9645Z"/>
              <path fill="currentColor" d="M187.01 26.4111V39.2276H182.482V26.4111H177.566V22.1465H191.949V26.4111H187.01Z"/>
              <path fill="currentColor" d="M192.912 39.2276V22.1465H203.85V26.0486H197.393V28.7474H203.271V32.5052H197.393V35.2515H203.897V39.2257H192.912V39.2276Z"/>
              <path fill="currentColor" d="M205.658 39.2276V22.1465H212.861C216.33 22.1465 218.594 24.46 218.594 27.639C218.594 29.9526 217.317 31.6626 215.438 32.4084L218.666 39.2257H213.775L211.077 33.0347H210.137V39.2257H205.656L205.658 39.2276ZM212.018 29.5673C213.367 29.5673 214.066 28.7967 214.066 27.713C214.066 26.6293 213.367 25.8816 212.018 25.8816H210.139V29.5673H212.018Z"/>
            </g>
            <defs>
              <linearGradient id="paint0_linear_8683_62477" x1="31.2622" y1="37.3828" x2="3.40487" y2="8.53484" gradientUnits="userSpaceOnUse">
                <stop offset="0.22" stop-color="#EC1E79"/>
                <stop offset="0.89" stop-color="#522784"/>
              </linearGradient>
              <linearGradient id="paint1_linear_8683_62477" x1="53.4278" y1="2.63428" x2="81.2851" y2="31.4823" gradientUnits="userSpaceOnUse">
                <stop offset="0.21" stop-color="#F05A24"/>
                <stop offset="0.68" stop-color="#FAAF3B"/>
              </linearGradient>
              <clipPath id="clip0_8683_62477">
                <rect width="218.666" height="40" fill="white"/>
              </clipPath>
            </defs>
          </svg>

        </a>

        <!-- footer bar -->
        <FooterBar style="width: 100%;" />

        <!-- upper taco dao background taco -->
        <img :src="TacoDaoTaco" 
              alt="placeholder" 
              class="home-view__upper-background-taco"> 
        
      </div>
      
    </div>

    <!-- animated background -->
    <ul class="floating-tacos overflow-hidden"
        :style="{ opacity: isBelowTheFoldVisible ? 0 : 1 }">
      <li>{{ floatingEmoji1 }}</li>
      <li>{{ floatingEmoji2 }}</li>
      <li>{{ floatingEmoji1 }}</li>
      <li>{{ floatingEmoji2 }}</li>
      <li>{{ floatingEmoji1 }}</li>
      <li>{{ floatingEmoji2 }}</li>
      <li>{{ floatingEmoji1 }}</li>
      <li>{{ floatingEmoji2 }}</li>
      <li>{{ floatingEmoji1 }}</li>
      <li>{{ floatingEmoji2 }}</li>
    </ul> 

    <!-- chart modal -->
    <div v-if="viewingChartModal" class="home-view__chart-modal">
      
      <!-- message -->
      <div class="home-view__chart-modal__dialog">
        
        <!-- message top -->
        <div class="home-view__chart-modal__dialog__top px-2 p-2">

          <!-- message top left -->
          <div class="taco-text-white d-flex align-items-center gap-1 ms-1">

            <!-- taco token icon -->
            <TacoCoinIcon class="home-view__taco-token-chart__icon"/>

            <!-- text -->
            <span>Taco Token Chart</span>  
          
          </div>

          <!-- message top right -->
          <div class="taco-text-black-to-white">

            <!-- close button -->
            <button class="btn btn-sm p-0 text-white px-2"
                    @click="viewingChartModal = false">
              <i class="fa-solid fa-xmark"></i>
            </button>

          </div>

        </div>

        <!-- message middle -->
        <div class="home-view__chart-modal__dialog__middle" style="width: 100%; height: 100%;">

            <iframe style="width: 100%; height: 100%;" src="https://dexscreener.com/icp/vhoia-myaaa-aaaar-qbmja-cai?embed=1&loadChartSettings=0&trades=0&tabs=0&info=0&chartLeftToolbar=0&chartTheme=dark&theme=dark&chartStyle=1&chartType=usd&interval=15"></iframe>

        </div>

        <!-- message bottom -->
        <div class="home-view__chart-modal__dialog__bottom p-2">

          <!-- message bottom left -->
          <div class="taco-text-black-to-white"></div>

          <!-- message bottom right -->
          <div class="taco-text-black-to-white">

            <!-- close button -->
            <button class="btn taco-nav-btn"
                    @click="viewingChartModal = false">
              Close
            </button>

          </div>

        </div>

      </div> 
      
    </div>    

  </div>

</template>

<style scoped lang="scss">

////////////////
// page style //
////////////////

.home-view {

  &__inner {
    overflow: auto;
    overflow-x: hidden;

    *:focus:focus-visible {
        outline: 3px solid var(--dark-orange);
        outline-offset: 2px;
        box-shadow: none;
        border-radius: 0.125rem;
    }

  }

  &__above-the-fold {
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100dvh;
    min-height: 888px;
    z-index: 2;

    &__upper {
      display: flex;
      flex-direction: column;
      justify-content: center;
      flex-grow: 1;

      *:focus:focus-visible {
        outline: 3px solid var(--dark-orange);
        outline-offset: 2px;
        box-shadow: none;
        border-radius: 0.125rem;
      }

      &__top {
        display: flex;
        justify-content: center;
        align-items: center;

        &__left {
          position: relative;
          width: 30%;
        }

        &__center {
          width: 40%;
        }

        &__right {
          position: relative;
          width: 30%;
        }

      }

      &__middle {
        display: flex;
        gap: 1rem;
        margin-top: 1.5rem;

        &__left {
          width: 33.33%;
        }

        &__center {
          width: 33.33%;
        }

        &__right {
          width: 33.33%;
        }

      }
      &__bottom {
        /* placeholder to maintain structure */
      }

    }

    &__lower {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
      padding-bottom: 2rem;
      z-index: 2;
    }
    
  }

  &__below-the-fold {
    z-index: 1;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;

    *:focus:focus-visible {
      outline: 3px solid var(--dark-orange);
      outline-offset: 2px;
      box-shadow: none;
      border-radius: 0.125rem;
    }    

  }

  &__taco-dao-logo {
    width: 140px;
    min-width: 140px;
    min-height: 80px;
    // margin-top: 4rem;
    margin-bottom: 1.5rem;
  }

  &__taco-dao-slogan {
    text-align: center;

    * {
      font-family: "Rubik" !important;
      font-size: 1.875rem;
      font-weight: 400;
    }

  }

  &__title {
    display: inline-flex;
    align-items: center;
    margin: 0;
    font-size: 1.5rem;
    font-weight: 500;
    font-family: "Rubik Mono One", monospace;
    gap: 0.75rem;

    &__icon {
      color: var(--brown-to-white);
      width: 1.75rem !important;
      font-size: 1.5rem;
      min-width: unset !important;
      max-width: unset !important;
      min-height: unset !important;
      max-height: unset !important;
      margin: 0 !important;

      &--i {
        transform: scale(1.25);
      }
    }

    &__text {
      color: var(--brown-to-white);
      white-space: nowrap;
    }

  }

  &__tile {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1rem 0.5rem 0.5rem;
    gap: 1rem;

    &__inner {
      display: flex;
      width: 100%;
      aspect-ratio: 16 / 9;
    }

    iframe {
      width: 100%;
      aspect-ratio: 16 / 9;
      border-radius: 0.5rem;
    }

  }

  &__canted {

    &__container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      &--left {
        transform: translateY(-1rem) rotate(-10deg);
      }

      &--right {
        transform: translateY(-1rem) rotate(10deg);
      }

    }

    &__title {
      font-size: 1.5rem;
      color: var(--brown-to-light-orange);
      // white-space: nowrap;
      text-align: center;
    }

    &__link {
      font-size: 1.5rem;
      color: var(--blue-to-light-blue);
      text-align: center;
    }

  }

  &__tagline {
    font-size: 1.5rem;
    // font-weight: 400;
    text-align: center;
    color: var(--brown-to-white);

    &__container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      line-height: 1.375;
    }

    &__link {
      color: var(--blue-to-light-blue);
      text-decoration: underline;
      cursor: pointer;
    }

  }

  &__social-links {
    padding: 2rem;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    border-radius: 1rem;
  }

  &__social-link {
    &__svg {
      height: 3ch;
    }
  }

  &__bobbing-down-indicator {
    color: var(--brown-to-light-orange);
    font-size: 2.5rem;
    animation-name: bob;
    animation-duration: 2s;
    animation-timing-function: ease-in-out;
    animation-iteration-count: infinite;
    z-index: 1;
    transition: opacity 0.5s ease-in-out;
    will-change: transform, opacity;
    backface-visibility: hidden;
    transform: translate3d(0,0,0);
  }
  &__bobbing-down-indicator--paused {
    animation-play-state: paused;
  }

  &__pitch-points {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3rem;
    color: var(--black-to-white);
    width: 100%;
    z-index: 2;
  }

  &__pitch-point {
    display: flex;
    align-items: center;
    padding: 0 3rem;
    gap: 2rem;

    &:nth-child(even) {
      flex-direction: row-reverse;

      .home-view__pitch-point__title {
        text-align: right;
      }

      .home-view__pitch-point__description {
        text-align: right;
        padding-right: 0;
        padding-left: 10rem;
      }

    }

    &__image {
      width: 13rem;
      user-select: none;

      &--lg {
        width: 15rem;
      }

    }

    &__title {
      color: var(--brown-to-white);
      font-size: 2.75rem;
      font-family: "Rubik" !important;
    }

    &__description {
      color: var(--dark-brown-to-white);
      font-size: 1.675rem;
      line-height: 1.375;
      font-family: "Rubik" !important;
      padding-right: 10rem;
    }

  }

  &__speedbump {
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: var(--orange-to-brown);
    width: 100%;
    z-index: 2;
    margin-top: 7rem;
    padding: 3rem 0 2.5rem;

    &__title {
      color: var(--brown-to-white);
      margin-bottom: 2.5rem;
      text-align: center;
      padding: 0 1rem;
    }

    &__exchanges {
      display: flex;
      justify-content: center;
      gap: 3rem 5rem;
      flex-wrap: wrap;
      padding: 0 2rem;
    }

    &__exchange {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      min-width: 290px;

      &__logo {
        width: 8rem;
      }

      &__text {
        color: var(--black-to-white);
      }

    }

  }

  &__cta {
    color: var(--brown-to-white);
    margin-top: 5rem;
    padding: 3rem 0;
    z-index: 2;
    background-image: url("../assets/images/tacoDaoTacoTranslucent.svg");
    background-repeat: no-repeat;
    background-position: center;
    background-size: 100% 100%;

    * {
      font-family: "Rubik";
    }

    &__top {
      text-align: center;
      padding: 0 2rem;
      
      span {
        font-size: 1.75rem;
        text-align: center;
      }

    }
    
    &__bottom {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      margin-top: 4rem;

      span {
        color: var(--brown-to-white);
        font-size: 1.75rem;
        text-align: center;
      }

      .taco-btn {
        font-size: 1.75rem;
        font-family: "Space Mono";
      }

    }

    &__link {
      color: var(--blue-to-light-blue);
    }

  }

  &__powered-by {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 4rem 0 2rem;
    gap: 0.25rem;
    z-index: 2;
    text-decoration: none;

    span {
      font-size: 0.75rem;
      color: var(--black-to-white);
      font-weight: 600;
    }
  
    &__logo {
      width: 8rem;
      color: var(--black-to-white);

      svg {
        color: var(--black-to-white);
      }

    }
  }

  &__upper-background-taco {
    position: absolute;
    top: -6.5rem;
    width: 1120px;
    left: 50%;
    transform: translateX(-50%);
    opacity: 0.125;
    z-index: 0;
    pointer-events: none;
    user-select: none;
  }

  &__taco-token-chart {
    zoom: 0.5;
    border-radius: 1rem;

    &__icon {
      width: 1rem;
      height: 1rem;
    }

    &__expand-btn {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      z-index: 1000;
      color: var(--);
      background-color: var(--yellow-to-dark-orange);
      border: 1px solid var(--dark-orange);
      zoom: 2;
    }

    &__mobile {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      background-image: url("../assets/images/smallchartplaceholder.png");
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      aspect-ratio: 16 / 9;
      border-radius: 1rem;
      position: relative;
      cursor: pointer;

      &:after {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        border-radius: 1rem;
        z-index: 1;
      }

      span {
        font-size: 1rem;
        color: var(--white);
        z-index: 2;
        text-align: center;
      }

    }

  }

  &__chart-modal {
    position: fixed;
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
    padding: 2rem;
    overflow: auto;

    // dialog
    &__dialog {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      height: 100%;
      border-radius: 0.5rem;
      background-color: var(--light-orange-to-dark-brown);
      border: 1px solid var(--dark-orange);
      overflow: auto;

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

  &__taco-assets {
    padding: 0.5rem 0 0.375rem 0;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    gap: 0;
    aspect-ratio: 16 / 9;
    background-image: url("../assets/images/tacoDaoTacoTranslucent2.svg");
    background-repeat: no-repeat;
    background-position: center;
    background-size: 75% 75%;
    width: 100%;

    hr {
      border-top: 1px solid var(--dark-orange) !important;
      opacity: 1;
      border: none;
      height: 1px;
    }

    // token icon
    &__svg {
      width: 1.25rem;
    }

    // fa icon
    &__fa-icon {
      font-size: 1.125rem;
    }

    // price
    span {
      white-space: nowrap;
      line-height: 1;
      font-size: 1rem;
      font-family: 'rubik';
      font-weight: bold;
    }

    // kvp
    &__kvp {
      display: flex;
      justify-content: space-between;
      gap: 0.625rem;
      padding: 0 1.125rem 0;

      // key
      &__key {
        color: var(--brown-to-white);
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        font-weight: 500;
      }

      // value
      &__value {
        color: var(--dark-brown-to-white);
        text-align: right;
        font-size: 0.875rem;
        font-family: 'rubik';
        font-weight: 700;        
      }

    }

  }

  .loading-img {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 10rem;
    z-index: 1;
  }

  .floating-tacos {
    position: absolute;
    top: 0%;
    left: 0%;
    right: 0%;
    width: 100%;
    height: 100%;
    list-style: none;
    pointer-events: none;
    z-index: 1;
    transition: opacity 0.5s ease-in-out;
    contain: layout paint style;
    transform: translateZ(0);

    li {
      position: absolute;
      width: fit-content;
      height: fit-content;
      opacity: 1;
      bottom: -3rem;
      font-size: 2rem;
      transform-origin: 50% 70%;
      user-select: none;
      animation-timing-function: linear;
      animation-iteration-count: infinite;
      will-change: transform, opacity;
      backface-visibility: hidden;
      transform: translate3d(0, 0, 0);

      &:nth-child(1) {
        left: 10%;
        animation-delay: 4s;
        animation-duration: 15s;
        animation-name: turnTacosClockwise;
      }

      &:nth-child(2) {
        left: 20%;
        animation-delay: 7s;
        animation-duration: 15s;
        animation-name: turnTacosCounterClockwise;
      }
      &:nth-child(3) {
        left: 28%;
        animation-delay: 6s;
        animation-duration: 12s;
        animation-name: turnTacosClockwise;
      }
      &:nth-child(4) {
        left: 35%;
        animation-delay: 10s;
        animation-duration: 10s;
        animation-name: turnTacosCounterClockwise;
      }
      &:nth-child(5) {
        left: 43%;
        animation-delay: 1s;
        animation-duration: 12s;
        animation-name: turnTacosClockwise;
      }
      &:nth-child(6) {
        left: 50%;
        animation-delay: 3s;
        animation-duration: 8s;
        animation-name: turnTacosCounterClockwise;
      }
      &:nth-child(7) {
        left: 60%;
        animation-delay: 6s;
        animation-duration: 13s;
        animation-name: turnTacosClockwise;
      }
      &:nth-child(8) {
        left: 70%;
        animation-delay: 4s;
        animation-duration: 20s;
        animation-name: turnTacosCounterClockwise;
      }
      &:nth-child(9) {
        left: 77%;
        animation-delay: 8s;
        animation-duration: 16s;
        animation-name: turnTacosClockwise;
      }
      &:nth-child(10) {
        left: 85%;
        animation-delay: 6s;
        animation-duration: 19s;
        animation-name: turnTacosCounterClockwise;
      }
    }

  }

}

////////////////
// animations //
////////////////

@keyframes bob {
  0% {
    transform: translate3d(0, 0, 0); /* starting position */
  }
  50% {
    transform: translate3d(0, -10px, 0); /* move up */
  }
  100% {
    transform: translate3d(0, 0, 0); /* return to starting position */
  }
}

@keyframes turnTacosClockwise {
  0% {
    transform: translate3d(0, 0rem, 0) rotate(0);
    opacity: 0.5;
  }
  100% {
    transform: translate3d(0, -15rem, 0) rotate(360deg);
    opacity: 0;
  }
}

@keyframes turnTacosCounterClockwise {
  0% {
    transform: translate3d(0, 0rem, 0) rotate(0);
    opacity: 0.5;
  }
  100% {
    transform: translate3d(0, -15rem, 0) rotate(-360deg);
    opacity: 0;
  }
}

///////////////////
// media queries //
///////////////////

// extra small
@media (max-width: 459.98px) {
  .home-view__pitch-point {
    flex-direction: column !important;
    align-items: center !important;
    gap: 1rem !important;
  }
  .home-view__pitch-point__title {
    text-align: center !important;
  }
  .home-view__pitch-point__description {
    text-align: center !important;
  }
  .home-view__pitch-points {
    gap: 2rem;
  }
  .home-view__pitch-point__image {
    width: 9rem !important;
  }
}

// phone protrait
@media (max-width: 575.98px) {
  .home-view__above-the-fold {
    min-height: 780px;
  }
  .home-view__above-the-fold__upper__middle {
    flex-direction: column;
    align-items: center;
    margin-top: 1.25rem;
  }
  .home-view__tagline__container {
    margin-top: 1.75rem;
  }
  .home-view__above-the-fold__upper {
    justify-content: start;
    margin-top: 1.25rem;
  }
  .home-view__above-the-fold__upper__middle__center {
    width: 80%;
  }  
  .home-view__above-the-fold__upper__middle__left {
    display: none;
  }
  .home-view__above-the-fold__upper__middle__right {
    display: none;
  }
  .container {
    max-width: 100%;
    padding: 0 0.5rem;
  }  
  .home-view__canted__container {
    gap: 0.25rem;
  }
  .home-view__canted__title {
    font-size: 0.875rem;
    line-height: 1.25;
  }
  .home-view__canted__link {
    font-size: 0.875rem;
    line-height: 1.25;
  }  
  .home-view__title__text {
    font-size: 1rem;
  }  
  .home-view__tile {
    padding: 0.5rem 0.5rem 0.5rem;
    gap: 0.5rem;
  }
  .home-view__taco-dao-slogan {
    line-height: 1;
  }
  .home-view__taco-dao-slogan span {
    font-size: 1.5rem;
    line-height: 1.125;
  }
  .home-view__taco-dao-logo {
    width: 100px;
    min-width: 100px;
    min-height: 57px;
    margin-bottom: 0.75rem;
  }
  .home-view__pitch-point__title {
    font-size: 1.5rem;
  }
  .home-view__pitch-point__description {
    font-size: 1.125rem;
  }
  .home-view__pitch-point__image--lg {
    width: 9rem !important;
  }
  .home-view__pitch-point__image {
    width: 7rem;
  }
  .home-view__pitch-points {
    padding: 0 1rem;
  }
  .home-view__pitch-point {
    padding: 0;
    gap: 1.5rem;
    align-items: start;
  }
  .home-view__pitch-point__description {
    padding-right: 0;
    padding-left: 0 !important;
  }
  .home-view__pitch-point__description:nth-child(even) {
    padding-left: 0;
  }
  .home-view__tagline__container span {
    font-size: 1.125rem;
  }    
  .home-view__speedbump {
    padding: 2rem 0 1.75rem;
    margin-top: 3rem;
  }
  .home-view__speedbump__exchanges {
    gap: 2rem 3rem;
  }
  .home-view__speedbump__exchange {
    min-width: 140px;
    gap: 0.5rem;
  }
  .home-view__speedbump__exchange__logo {
    width: 5rem;
  }  
  .home-view__speedbump__title {
    font-size: 1.25rem;
    margin-bottom: 1.5rem;
  }
  .sbt-kong {
    width: 7rem !important;
  }
  .sbt-sw {
    width: 8.5rem !important;
  }
  .sbt-icpswap {
    width: 5rem !important;
  } 
  .home-view__cta {
    margin-top: 4rem;
  }
  .home-view__cta__top span {
    font-size: 1.25rem;
  }
  .home-view__cta__bottom {
    margin-top: 3rem;
    gap: 0.5rem;
  }  
  .home-view__cta__bottom span {
    font-size: 1.25rem;
  }
  .home-view__cta__bottom .taco-btn {
    font-size: 1.25rem;
  }
  .home-view__powered-by {
    margin: 3rem 0 1.5rem;
  }  
  .home-view__chart-modal {
    padding: 1rem;
  }  
}

// phone landscape
@media (min-width: 576px) and (max-width: 767.98px) {
  .home-view__pitch-points {
    max-width: 540px;
  }
  .home-view__above-the-fold__upper__middle {
    flex-wrap: wrap;
    justify-content: center;
  }
  .home-view__above-the-fold__upper__middle__left,
  .home-view__above-the-fold__upper__middle__center,
  .home-view__above-the-fold__upper__middle__right {
    width: 40%;
  }
  .container {
    max-width: 100%;
    padding: 0 1rem;
  }
  .home-view__canted__title {
    font-size: 1rem;
  }
  .home-view__canted__link {
    font-size: 1rem;
  }  
  .home-view__title__text {
    font-size: 1rem;
  }
  .home-view__tile {
    padding: 0.5rem 0.5rem 0.5rem;
    gap: 0.5rem;
  }
  .home-view__taco-dao-slogan {
    line-height: 1;
  }
  .home-view__taco-dao-slogan span {
    font-size: 1.5rem;
  }
  .home-view__taco-dao-logo {
    width: 100px;
    min-width: 100px;
    min-height: 57px;
    margin-bottom: 0.5rem;
  }
  .home-view__pitch-point__title {
    font-size: 1.5rem;
  }
  .home-view__pitch-point__description {
    font-size: 1.125rem;
  }
  .home-view__pitch-point__image--lg {
    width: 9rem !important;
  }
  .home-view__pitch-point__image {
    width: 7rem;
  }
  .home-view__pitch-point {
    padding: 0;
    align-items: start;
  }
  .home-view__pitch-point__description {
    padding-right: 0;
    padding-left: 0 !important;
  }
  .home-view__pitch-point__description:nth-child(even) {
    padding-left: 0;
  }
  .home-view__below-the-fold {
    margin-top: 5rem;
  }
  .home-view__above-the-fold {
    min-height: 908px;
  }
  .home-view__tagline__container span {
    font-size: 1.125rem;
  }  
  .home-view__speedbump {
    padding: 2rem 0 1.75rem;
    margin-top: 4rem;
  }
  .home-view__speedbump__exchanges {
    gap: 2rem 3rem;
  }
  .home-view__speedbump__exchange {
    min-width: 140px;
    gap: 0.5rem;
  }
  .home-view__speedbump__exchange__logo {
    width: 5rem;
  }  
  .home-view__speedbump__title {
    font-size: 1.25rem;
    margin-bottom: 1.5rem;
  }
  .sbt-kong {
    width: 7rem !important;
  }
  .sbt-sw {
    width: 8.5rem !important;
  }
  .sbt-icpswap {
    width: 5rem !important;
  }  
  .home-view__cta {
    margin-top: 4rem;
  }
  .home-view__cta__top span {
    font-size: 1.25rem;
  }
  .home-view__cta__bottom {
    margin-top: 3rem;
    gap: 0.5rem;
  }
  .home-view__cta__bottom span {
    font-size: 1.25rem;
  }
  .home-view__cta__bottom .taco-btn {
    font-size: 1.25rem;
  }
  .home-view__powered-by {
    margin: 3rem 0 2rem;
  }  
  .taco-token-chart {
    zoom: 0.4 !important;
  }  
  .home-view__taco-assets span {
    font-size: 0.75rem;
  }  
  .home-view__taco-assets__fa-icon {
    font-size: 1rem;
  }
  .home-view__taco-assets__svg {
    width: 1rem;
  }  
  .home-view__chart-modal {
    padding: 1rem;
  }  
}

// tablet
@media (min-width: 767px) and (max-width: 991.98px) {
  .home-view__pitch-points {
    max-width: 720px;
  }
  .container {
    max-width: 100%;
    padding: 0 1rem;
  }
  .home-view__canted__title {
    font-size: 1.125rem;
  }
  .home-view__canted__link {
    font-size: 1.125rem;
  }  
  .home-view__title__text {
    font-size: 1.125rem;
  }
  .home-view__tile {
    padding: 0.5rem 0.5rem 0.5rem;
    gap: 0.5rem;
  }
  .home-view__taco-dao-slogan {
    line-height: 1.125;
  }
  .home-view__taco-dao-slogan span {
    font-size: 1.75rem;
  }
  .home-view__taco-dao-logo {
    width: 120px;
    min-width: 120px;
    min-height: 68px;
    margin-bottom: 1rem;
  }
  .home-view__pitch-point__title {
    font-size: 2rem;
  }
  .home-view__pitch-point__description {
    font-size: 1.25rem;
  }
  .home-view__pitch-point__image--lg {
    width: 11rem !important;
  }
  .home-view__pitch-point__image {
    width: 9rem;
  }
  .home-view__pitch-point {
    padding: 0 2rem;
  }
  .home-view__pitch-point__description {
    padding-right: 0;
    padding-left: 0 !important;
  }
  .home-view__pitch-point__description:nth-child(even) {
    padding-left: 0;
  }
  .home-view__tagline__container span {
    font-size: 1.25rem;
  }
  .home-view__speedbump {
    padding: 2rem 0 2rem;
    margin-top: 5rem;
  }
  .home-view__speedbump__exchanges {
    gap: 2rem 4rem;
  }
  .home-view__speedbump__exchange {
    min-width: 225px;
  }  
  .home-view__speedbump__exchange__logo {
    width: 6rem;
  }  
  .home-view__speedbump__title {
    font-size: 1.5rem;
    margin-bottom: 1.5rem;
  }
  .sbt-kong {
    width: 12rem !important;
  }
  .sbt-sw {
    width: 14rem !important;
  }
  .sbt-icpswap {
    width: 8rem !important;
  }
  .home-view__cta__top span {
    font-size: 1.5rem;
  }
  .home-view__cta__bottom {
    gap: 0.75rem;
  }
  .home-view__cta__bottom span {
    font-size: 1.5rem;
  }
  .home-view__cta__bottom .taco-btn {
    font-size: 1.5rem;
  }
  .home-view__powered-by {
    margin: 3rem 0 2rem;
  }
  .taco-token-chart {
    zoom: 0.4 !important;
  }
  .home-view__taco-assets span {
    font-size: 0.75rem;
  }  
  .home-view__taco-assets__fa-icon {
    font-size: 1rem;
  }
  .home-view__taco-assets__svg {
    width: 1rem;
  }  
  .home-view__chart-modal {
    padding: 1rem;
  }
}

// small daktop
@media (min-width: 992px) and (max-width: 1199.98px) {
  .home-view__pitch-points {
    max-width: 960px;
  }
  .home-view__canted__title {
    font-size: 1.25rem;
  }
  .home-view__canted__link {
    font-size: 1.25rem;
  }
  .home-view__title__text {
    font-size: 1.25rem;
  }
  .home-view__tile {
    padding: 0.75rem 0.5rem 0.5rem;
    gap: 0.75rem;
  }
  .home-view__pitch-point__title {
    font-size: 2.25rem;
  }
  .home-view__pitch-point__description {
    font-size: 1.5rem;
  }
  .home-view__pitch-point__image--lg {
    width: 13rem;
  }
  .home-view__pitch-point__image {
    width: 11rem;
  }
  .home-view__pitch-point {
    padding: 0 2rem;
  }
  .home-view__pitch-point__description {
    padding-right: 3rem;
    padding-left: 0 !important;
  }
  .home-view__pitch-point__description:nth-child(even) {
    padding-left: 3rem;
  }
  .home-view__speedbump {
    padding: 2rem 0 2rem;
    margin-top: 5rem;
  }
  .home-view__speedbump__title {
    margin-bottom: 2rem;
  }
  .home-view__speedbump__exchange__logo {
    width: 7rem;
  }
  .home-view__cta__top span {
    font-size: 1.75rem;
  }
  .home-view__cta__bottom span {
    font-size: 1.75rem;
  }
  .home-view__taco-assets span {
    font-size: 0.875rem;
  }
  .home-view__taco-assets__fa-icon {
    font-size: 1rem;
  }
  .home-view__taco-assets__svg {
    width: 1rem;
  }
}

// medium desktop
@media (min-width: 1200px) and (max-width: 1399.98px) {
  .home-view__pitch-points {
    max-width: 1140px;
  }
  .home-view__pitch-point__title {
    font-size: 2.25rem;
  }
  .home-view__pitch-point__description {
    font-size: 1.5rem;
  }  
  .home-view__speedbump {
    margin-top: 5rem;
  }
}

// large desktop
@media (min-width: 1400px) {
  .home-view__pitch-points {
    max-width: 1320px;
  }
  .home-view__pitch-point__title {
    font-size: 2.25rem;
  }
  .home-view__pitch-point__description {
    font-size: 1.5rem;
  }    
}

</style>

<script setup lang="ts">

  /////////////
  // Imports //
  /////////////

  import { ref, onMounted, computed, onUnmounted } from "vue";
  import HeaderBar from "../components/HeaderBar.vue";
  import FooterBar from "../components/FooterBar.vue";
  import { useTacoStore } from "../stores/taco.store"
  import { storeToRefs } from "pinia"  
  import TacoCoinIcon from "../assets/tokens/tacoCoinIcon.vue"
  import TacoDaoLogo from "../assets/images/tacoDaoLogo.vue"
  import TacoChefWave from '../assets/images/chef/chef-wave.png'
  import TacoChefTaco from '../assets/images/chef/chef-taco.png'
  import TacoChefFriends from '../assets/images/chef/chef-friends.png'
  import TacoChefRead from '../assets/images/chef/chef-read.png'
  import TacoDaoTaco from '../assets/images/tacoDaoTaco.svg'
  import icpLogo from "../assets/tokens/snspng/icp.png"
  import dkpLogo from "../assets/tokens/snspng/dragginz.png"
  import astronautLoader from '../assets/images/astonautLoader.webp'
  import TaggrSocialImg from '../assets/images/social/taggr.vue'
  import CatalyzeSocialImg from '../assets/images/social/catalyze.vue'
  import GithubSocialImg from '../assets/images/social/github.vue'
  import DiscordSocialImg from '../assets/images/social/discord.vue'
  import NuanceSocialImg from '../assets/images/social/nuance.vue'
  import OcSocialImg from '../assets/images/social/oc.vue'
  import XSocialImg from '../assets/images/social/x.vue'
  import SwapRunnerText from '../assets/images/exchanges/swapRunnerText.vue'
  import SwapRunnerLogo from '../assets/images/exchanges/swapRunnerLogo.vue'
  import KongSwapText from '../assets/images/exchanges/kongSwapText.vue'
  import KongSwapLogo from '../assets/images/exchanges/kongSwapLogo.vue'
  import IcpSwapLogo from '../assets/images/exchanges/icpSwapLogo.vue'
  import IcpSwapText from '../assets/images/exchanges/icpSwapText.vue'

  ///////////
  // Store //
  ///////////

  // # SETUP #
  const tacoStore = useTacoStore()

  // # ACTIONS #

  // wizard
  const { toggleTacoWizard } = tacoStore

  // user
  const { checkIfLoggedIn } = tacoStore

  // # STATE #

  // user
  const { userLoggedIn } = storeToRefs(tacoStore)

  // dao
  const { totalPortfolioValueInUsd, totalTreasuryValueInUsd, snsTreasuryTacoValueInUsd, snsTreasuryIcpValueInUsd, snsTreasuryDkpValueInUsd } = storeToRefs(tacoStore)  

  /////////////////////
  // Local Variables //
  /////////////////////

  // Track intersection state
  const isBelowTheFoldVisible = ref(false)

  // mobile check
  const isMobile = ref(false)

  // viewing chart modal
  const viewingChartModal = ref(false)

  // images
  const astronautLoaderUrl =  astronautLoader 
  const shouldLoadDex = ref(false)
  const shouldLoadYouTube = ref(false)

  // social links
  const xSocialImg = XSocialImg
  const taggrSocialImg = TaggrSocialImg
  const catalyzeSocialImg = CatalyzeSocialImg
  const githubSocialImg = GithubSocialImg
  const discordSocialImg = DiscordSocialImg
  const nuanceSocialImg = NuanceSocialImg
  const ocSocialImg = OcSocialImg

  // exchanges
  const swapRunnerText = SwapRunnerText
  const swapRunnerLogo = SwapRunnerLogo
  const kongSwapText = KongSwapText
  const kongSwapLogo = KongSwapLogo
  const icpSwapLogo = IcpSwapLogo
  const icpSwapText = IcpSwapText

  // neurons count
  const localNeuronsCount = ref(0)

  //////////////
  // Computed //
  //////////////

  // date based emojis
  const floatingEmoji1 = computed(() => {

    // get today's date
    const today = new Date()

    // get the month
    const month = today.getMonth() + 1

    // get the day
    const day = today.getDate()
    
    // halloween: October 31st
    if (month === 10 && day === 31) {
      return '🎃'
    }
    
    // christmas: December 25th
    if (month === 12 && day === 25) {
      return '🎅'
    }
    
    // new years: January 1st
    if (month === 1 && day === 1) {
      return '🎉'
    }
    
    // valentines day: February 14th
    if (month === 2 && day === 14) {
      return '❤️'
    }
    
    // st. patrick's day: March 17th
    if (month === 3 && day === 17) {
      return '☘️'
    }
    
    // easter: April 9th (you can adjust this date)
    if (month === 4 && day === 9) {
      return '🐰'
    }
    
    // independence day: July 4th
    if (month === 7 && day === 4) {
      return '💥'
    }
    
    // default: taco
    return '🌮'

  })
  const floatingEmoji2 = computed(() => {
    const today = new Date()
    const month = today.getMonth() + 1 // getMonth() returns 0-11
    const day = today.getDate()
    
    // halloween: October 31st
    if (month === 10 && day === 31) {
      return '🎃'
    }
    
    // christmas: December 25th
    if (month === 12 && day === 25) {
      return '🎄'
    }
    
    // new years: January 1st
    if (month === 1 && day === 1) {
      return '🍾'
    }
    
    // valentines day: February 14th
    if (month === 2 && day === 14) {
      return '❤️'
    }
    
    // st. patrick's day: March 17th
    if (month === 3 && day === 17) {
      return '☘️'
    }
    
    // easter: April 9th (you can adjust this date)
    if (month === 4 && day === 9) {
      return '🥚'
    }
    
    // independence day: July 4th
    if (month === 7 && day === 4) {
      return '🇺🇸'
    }
    
    // default: taco
    return '🌮'

  })

  // format number
  const formatNumber = computed(() => {
    return (num: number) => {
      if (typeof num !== 'number') {
        return num
      }
      if (num >= 1000) {
        return new Intl.NumberFormat('en-US', {
            notation: 'compact',
            compactDisplay: 'short'
        }).format(num).toLowerCase();
      }
      return num.toFixed(2)
    }
  })  

  ///////////////////
  // Local Methods //
  ///////////////////

  //////////////
  // handlers //

  // handle intersection changes
  const handleIntersection = (entries: IntersectionObserverEntry[]) => {

    // loop through entries
    entries.forEach(entry => {

      // set is below the fold visible
      isBelowTheFoldVisible.value = entry.isIntersecting
      
      // log
      // console.log('.home-view__below-the-fold is visible:', entry.isIntersecting)

    })
  }  

  // redirect to dao page
  const redirectToDao = () => {
    window.location.href = '/dao'
  }

  /////////////////////
  // Lifecycle Hooks //
  /////////////////////

  // on mounted
  onMounted(async () => {
    
    // log
    // console.log('homepage mounted')


    // check if user is logged in
    await checkIfLoggedIn()    

    // if user is logged in, get neurons count
    if (userLoggedIn.value) {

      const rawNeurons = await tacoStore.getTacoNeurons()
      const neuronsCount = rawNeurons.length

      // set neurons count
      localNeuronsCount.value = neuronsCount

    }      

    // get the below the fold element
    const belowTheFold = document.querySelector('.home-view__below-the-fold')

    // check for mobile
    isMobile.value = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    
    // if below the fold exists
    if (belowTheFold) {
      
      // create intersection observer
      const observer = new IntersectionObserver(handleIntersection, {

        // set threshold
        threshold: 0.01

      })

      // sart observing below the fold
      observer.observe(belowTheFold)
      
      // store observer for cleanup
      ;(window as any).belowTheFoldObserver = observer

    } 
    
    // else no below the fold element
    else {

      // log error
      console.error('Could not find below the fold')

    }

    // lazy load heavy iframes after idle
    if ('requestIdleCallback' in window) {
      ;(window as any).requestIdleCallback(() => {
        shouldLoadDex.value = true
        shouldLoadYouTube.value = true
      })
    } else {
      setTimeout(() => {
        shouldLoadDex.value = true
        shouldLoadYouTube.value = true
      }, 1000)
    }  
    
  })

  // clean up observer
  onUnmounted(() => {

    // get the observer
    const observer = (window as any).belowTheFoldObserver
    
    // if observer exists
    if (observer) {

      // stop observing
      observer.disconnect()
      
      // log
      // console.log('Intersection observer disconnected')
      
      // clean up
      delete (window as any).belowTheFoldObserver

    }

  })

</script>