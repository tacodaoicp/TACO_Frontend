<template>

  <div class="standard-view">

    <!-- header bar -->
    <HeaderBar />

    <!-- scroll container - app util class -->
    <div class="scroll-y-container h-100">

      <!-- bootstrap container -->
      <div class="container">

        <!-- bootstrap row -->
        <div class="row">

          <!-- otc title -->
          <TacoTitle level="h2" emoji="📌" title="More Information" class="mt-4" style="padding-left: 1rem !important;"/>

          <!-- flex container -->
          <div class="info d-flex gap-4 mt-4 p-0">

            <!-- taco token -->
            <div class="info__area 
                        pe-0 pe-lg-4">

              <ul class="taco-list info__area__ul
                         list-group border-0 pt-0">

                  <!-- title -->
                  <li class="taco-list__item 
                            taco-list__item--title
                            taco-list__item--no-hover           
                            list-group-item">

                    <!-- test title -->
                    <TacoTitle level="h2" emoji="🌮" title="Taco Token" style="margin-bottom: 0 !important; padding: 0 !important;" />

                  </li>

                  <!-- list item -->
                  <li class="taco-list__item          
                            list-group-item d-none">

                      <!-- key value pair -->
                      <div class="taco-list__kvp">

                          <!-- title -->
                          <span class="taco-text-black-to-white">Current Price:</span>

                          <!-- data -->
                          <span class="taco-text-black-to-white"> 0.00 ICP ($0.00 USD)</span>

                      </div>

                  </li>

                  <!-- list item -->
                  <li class="taco-list__item          
                            list-group-item">

                      <!-- key value pair -->
                      <div class="taco-list__kvp">

                          <!-- title -->
                          <span class="taco-text-black-to-white">Circulating Supply:</span>

                          <!-- data -->
                          <span class="taco-text-black-to-white">7,777,777 TACO</span>

                      </div>

                  </li>

                  <!-- list item -->
                  <li class="taco-list__item          
                            list-group-item">

                      <!-- key value pair -->
                      <div class="taco-list__kvp ps-3">

                          <!-- title -->
                          <span class="taco-text-black-to-white">
                            <i class="fa-solid fa-corner fa-rotate-180 me-2 taco-text-black-to-white" style="opacity: 0.5;"></i> SNS Swap:
                          </span>

                          <!-- data -->
                          <span class="taco-text-black-to-white">2,049,666 TACO (26.353%)</span>

                      </div>

                  </li>

                  <!-- list item -->
                  <li class="taco-list__item          
                            list-group-item">

                      <!-- key value pair -->
                      <div class="taco-list__kvp ps-3">

                          <!-- title -->
                          <span class="taco-text-black-to-white"><i class="fa-solid fa-corner fa-rotate-180 me-2 taco-text-black-to-white" style="opacity: 0.5;"></i> Founders' Presale:</span>

                          <!-- data -->
                          <span class="taco-text-black-to-white">999,999 TACO (12.857%)</span>

                      </div>

                  </li>

                  <!-- list item -->
                  <li class="taco-list__item          
                            list-group-item">

                      <!-- key value pair -->
                      <div class="taco-list__kvp ps-3">

                          <!-- title -->
                          <span class="taco-text-black-to-white"><i class="fa-solid fa-corner fa-rotate-180 me-2 taco-text-black-to-white" style="opacity: 0.5;"></i> Front End Dev Allocation:</span>

                          <!-- data -->
                          <span class="taco-text-black-to-white">155,555 TACO  (2%)</span>

                      </div>

                  </li>

                  <!-- list item -->
                  <li class="taco-list__item          
                            list-group-item">

                      <!-- key value pair -->
                      <div class="taco-list__kvp ps-3">

                          <!-- title -->
                          <span class="taco-text-black-to-white"><i class="fa-solid fa-corner fa-rotate-180 me-2 taco-text-black-to-white" style="opacity: 0.5;"></i> Advisors' Allocation:</span>

                          <!-- data -->
                          <span class="taco-text-black-to-white">115,077 TACO (1.479%)</span>

                      </div>

                  </li>

                  <!-- list item -->
                  <li class="taco-list__item          
                            list-group-item">

                      <!-- key value pair -->
                      <div class="taco-list__kvp ps-3">

                          <!-- title -->
                          <span class="taco-text-black-to-white"><i class="fa-solid fa-corner fa-rotate-180 me-2 taco-text-black-to-white" style="opacity: 0.5;"></i> Visual Design Allocation:</span>

                          <!-- data -->
                          <span class="taco-text-black-to-white">77,777 TACO (1%)</span>

                      </div>

                  </li>

                  <!-- list item -->
                  <li class="taco-list__item          
                            list-group-item">

                      <!-- key value pair -->
                      <div class="taco-list__kvp ps-3">

                          <!-- title -->
                          <span class="taco-text-black-to-white"><i class="fa-solid fa-corner fa-rotate-180 me-2 taco-text-black-to-white" style="opacity: 0.5;"></i> DKP Swap:</span>

                          <!-- data -->
                          <span class="taco-text-black-to-white">700,000 TACO (9%)</span>

                      </div>

                  </li>                  

                  <!-- list item -->
                  <li class="taco-list__item          
                            list-group-item">

                      <!-- key value pair -->
                      <div class="taco-list__kvp ps-3">

                          <!-- title -->
                          <span class="taco-text-black-to-white"><i class="fa-solid fa-corner fa-rotate-180 me-2 taco-text-black-to-white" style="opacity: 0.5;"></i> Liquidity Pools:</span>

                          <!-- data -->
                          <span class="taco-text-black-to-white">395,975 TACO (5.091%)</span>

                      </div>

                  </li>

                  <!-- list item -->
                  <li class="taco-list__item          
                            list-group-item">

                      <!-- key value pair -->
                      <div class="taco-list__kvp ps-3">

                          <!-- title -->
                          <span class="taco-text-black-to-white"><i class="fa-solid fa-corner fa-rotate-180 me-2 taco-text-black-to-white" style="opacity: 0.5;"></i> Future Dev Allocation:</span>

                          <!-- data -->
                          <span class="taco-text-black-to-white">930,975 TACO (11.97%)</span>

                      </div>

                  </li>  
                  
                  <!-- list item -->
                  <li class="taco-list__item          
                            list-group-item">

                      <!-- key value pair -->
                      <div class="taco-list__kvp ps-3">

                          <!-- title -->
                          <span class="taco-text-black-to-white"><i class="fa-solid fa-corner fa-rotate-180 me-2 taco-text-black-to-white" style="opacity: 0.5;"></i> TACO Mint Vault:</span>

                          <!-- data -->
                          <span class="taco-text-black-to-white">2,352,753 TACO (30.25%)</span>

                      </div>

                  </li>                     

              </ul>

            </div>

            <!-- taco team -->
            <div class="info__area 
                        d-flex flex-column gap-2 pe-0 pe-sm-4">

              <!-- team title -->
              <TacoTitle level="h2" emoji="🙌" title="Taco Team"/>

              <!--  -->
              <ul class="taco-bs-list 
                        list-group">

                <!-- list item -->
                <li class="standard-focus standard-focus--negative-offset
                          list-group-item d-flex flex-nowrap py-3 gap-3"
                    tabindex="0">

                  <span class="taco-text-black-to-white"><span class="fw-bold taco-text-black-to-white">biketaco</span> - Executive</span>

                </li>

                <!-- list item -->
                <li class="standard-focus standard-focus--negative-offset
                          list-group-item d-flex flex-nowrap py-3 gap-3"
                    tabindex="0">

                  <span class="taco-text-black-to-white"><span class="fw-bold taco-text-black-to-white">TrickyVik</span> - Theory & Outreach</span>

                </li>                

                <!-- list item -->
                <li class="standard-focus standard-focus--negative-offset
                          list-group-item d-flex flex-nowrap py-3 gap-3"
                    tabindex="0">

                  <span class="taco-text-black-to-white"><a class="taco-text-blue-to-light-blue fw-bold" href="https://egidoval.com/" target="_blank">EgidoVal</a> - Art & Design</span>

                </li>  
                
                <!-- list item -->
                <li class="standard-focus standard-focus--negative-offset
                          list-group-item d-flex flex-nowrap py-3 gap-3"
                    tabindex="0">

                  <span class="taco-text-black-to-white"><a class="taco-text-blue-to-light-blue fw-bold" href="https://x.com/SnassyIcp" target="_blank">Snassy</a> - Backend Development</span>

                </li>                

                <!-- list item -->
                <li class="standard-focus standard-focus--negative-offset
                          list-group-item d-flex flex-nowrap py-3 gap-3"
                    tabindex="0">

                  <span class="taco-text-black-to-white"><a class="taco-text-blue-to-light-blue fw-bold" href="http://ericrose.dev" target="_blank">ericrosedev</a> - Frontend Design & Development</span>

                </li>

              </ul>

            </div>

            <!-- links -->
            <div class="info__area 
                        d-flex flex-column gap-2 pb-5">

              <!-- links title -->
              <TacoTitle level="h2" emoji="🔗" title="Links"/>

              <ul class="taco-bs-list 
                        list-group">

                <!-- list item - launching taco dao -->
                <li class="standard-focus standard-focus--negative-offset
                          list-group-item d-flex flex-nowrap py-3 gap-3"
                    tabindex="0">

                  <span class="taco-text-black-to-white text-nowrap">📰 <a class="taco-text-blue-to-light-blue" href="https://nuance.xyz/tacodao/13771-434go-diaaa-aaaaf-qakwq-cai/launching-taco-dao" target="_blank">Launching Taco Dao</a></span>

                </li>   

                <!-- list item - Applications of the Weighted Voting Framework -->
                <li class="standard-focus standard-focus--negative-offset
                          list-group-item d-flex flex-nowrap py-3 gap-3"
                    tabindex="0">

                  <span class="taco-text-black-to-white text-nowrap">📰 <a class="taco-text-blue-to-light-blue" href="https://nuance.xyz/tacodao/12606-434go-diaaa-aaaaf-qakwq-cai/applications-of-the-weighted-voting-framework" target="_blank">Applications of the WFW</a></span>

                </li>                
                
                <!-- list item - introducing the taco dex -->
                <li class="standard-focus standard-focus--negative-offset
                          list-group-item d-flex flex-nowrap py-3 gap-3"
                    tabindex="0">

                  <span class="taco-text-black-to-white text-nowrap">📰 <a class="taco-text-blue-to-light-blue" href="https://nuance.xyz/tacodao/11330-434go-diaaa-aaaaf-qakwq-cai/introducing-the-taco-dex" target="_blank">Introducing the TACO DEX</a></span>

                </li>

                        <!-- list item - revealing taco dao -->
                <li class="standard-focus standard-focus--negative-offset
                          list-group-item d-flex flex-nowrap py-3 gap-3"
                    tabindex="0">

                  <span class="taco-text-black-to-white text-nowrap">📰 <a class="taco-text-blue-to-light-blue" href="https://nuance.xyz/tacodao/11327-434go-diaaa-aaaaf-qakwq-cai/revealing-taco-dao" target="_blank">Revealing Taco DAO</a></span>

                </li>

                        <!-- list item - announcing taco dao -->
                <li class="standard-focus standard-focus--negative-offset
                          list-group-item d-flex flex-nowrap py-3 gap-3"
                    tabindex="0">

                  <span class="taco-text-black-to-white text-nowrap">📰 <a class="taco-text-blue-to-light-blue" href="https://nuance.xyz/tacodao/5402-434go-diaaa-aaaaf-qakwq-cai/announcing-taco-dao" target="_blank">Announcing Taco DAO</a></span>

                </li>

                <!-- list item - whitepaper -->
                <li class="standard-focus standard-focus--negative-offset
                          list-group-item d-flex flex-nowrap py-3 gap-3"
                    tabindex="0">

                  <span class="taco-text-black-to-white text-nowrap">📝 <a class="taco-text-blue-to-light-blue" href="/Taco_Dao_Whitepaper_v7.77_latest.pdf" target="_blank">Whitepaper</a></span>

                </li>

              </ul>

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

  // 
  h2 {
    padding-left: 0.75rem !important;
    margin-bottom: 0.5rem !important;
  }

  // 
  .taco-bs-list {
    border: none;

    // 
    li {
      border: none;
    }
  }

  // info
  .info {
    flex-direction: row;

    // info area
    &__area {
      border-right: 1px solid var(--dark-orange) !important;

      //
      &:last-child {
        border-right: none !important;
      }

      // ul
      &__ul {
        width: fit-content
      }

    }

  }

  ///////////////////
  // media queries //
  ///////////////////

  // phone protrait
  @media (max-width: 575.98px) {
    
    // info
    .info {
      flex-direction: column;
    }

    // info area
    .info__area {
      border-right: none !important;
      border-bottom: 1px solid var(--dark-orange);
    }

    // last info area
    .info__area:last-child {
      border-bottom: none;
    }

    // info area ul
    .info__area__ul {
      width: 100%;
    }    
    
  }
  
  // phone landscape
  @media (min-width: 576px) and (max-width: 767.98px) {

    // info
    .info {
      flex-direction: column;
    }

    // info area
    .info__area {
      border-right: none !important;
      border-bottom: 1px solid var(--dark-orange);
    }

    // last info area
    .info__area:last-child {
      border-bottom: none;
    }

    // info area ul
    .info__area__ul {
      width: 100%;
    }    

  }

  // tablet
  @media (min-width: 767px) and (max-width: 991.98px) {

    // info
    .info {
      flex-direction: column;
    }

    // info area
    .info__area {
      border-right: none !important;
      border-bottom: 1px solid var(--dark-orange);
    }

    // last info area
    .info__area:last-child {
      border-bottom: none;
    }

    // info area ul
    .info__area__ul {
      width: 100%;
    }
    
  }

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

  import HeaderBar from "../components/HeaderBar.vue";
  import FooterBar from "../components/FooterBar.vue";
  import { ref } from "vue";
  import TacoTitle from '../components/misc/TacoTitle.vue';

  /////////////////////
  // local variables //
  /////////////////////

  // has proposals
  // const test = ref(false);

</script>