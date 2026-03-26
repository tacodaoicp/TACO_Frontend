<template>

  <div class="standard-view">

    <!-- scroll container - app util class -->
    <div class="scroll-y-container h-100">

      <!-- bootstrap container -->
      <div class="container">

        <!-- bootstrap row -->
        <div class="row">

          <!-- otc title -->
          <TacoTitle level="h2" emoji="📌" title="More Information" class="mt-4" style="padding-left: 1rem !important;"/>

          <!-- flex container -->
          <div class="info d-flex gap-4 mt-4 p-0
                      taco-container taco-container--l1">

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
                          <span class="taco-text-black-to-white ms-auto"> 0.00 ICP ($0.00 USD)</span>

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
                          <span class="taco-text-black-to-white ms-auto">7,777,777 TACO</span>

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
                          <span class="taco-text-black-to-white ms-auto">2,049,666 TACO (26.353%)</span>

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
                          <span class="taco-text-black-to-white ms-auto">999,999 TACO (12.857%)</span>

                      </div>

                  </li>

                  <!-- list item -->
                  <li class="taco-list__item          
                            list-group-item">

                      <!-- key value pair -->
                      <div class="taco-list__kvp ps-3">

                          <!-- title -->
                          <span class="taco-text-black-to-white"><i class="fa-solid fa-corner fa-rotate-180 me-2 taco-text-black-to-white" style="opacity: 0.5;"></i> Frontend Dev Allocation:</span>

                          <!-- data -->
                          <span class="taco-text-black-to-white ms-auto">155,555 TACO  (2%)</span>

                      </div>

                  </li>

                  <!-- list item -->
                  <li class="taco-list__item          
                            list-group-item">

                      <!-- key value pair -->
                      <div class="taco-list__kvp ps-3">

                          <!-- title -->
                          <span class="taco-text-black-to-white"><i class="fa-solid fa-corner fa-rotate-180 me-2 taco-text-black-to-white" style="opacity: 0.5;"></i> Advisor Allocation:</span>

                          <!-- data -->
                          <span class="taco-text-black-to-white ms-auto">115,077 TACO (1.479%)</span>

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
                          <span class="taco-text-black-to-white ms-auto">77,777 TACO (1%)</span>

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
                          <span class="taco-text-black-to-white ms-auto">700,000 TACO (9%)</span>

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
                          <span class="taco-text-black-to-white ms-auto">395,975 TACO (5.091%)</span>

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
                          <span class="taco-text-black-to-white ms-auto">930,975 TACO (11.97%)</span>

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
                          <span class="taco-text-black-to-white ms-auto">2,352,753 TACO (30.25%)</span>

                      </div>

                  </li>                     

              </ul>

            </div>

            <!-- taco team -->
            <div class="info__area 
                        d-flex flex-column gap-2 pe-0 pe-sm-4">

              <!-- team title -->
              <TacoTitle level="h2" emoji="🙌" title="Taco Team"/>

              <!-- team list -->
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

                  <span class="taco-text-black-to-white"><span class="fw-bold taco-text-black-to-white">Tirex</span> - Backend & Frontend Development</span>

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

              <!-- contributors title -->
              <TacoTitle level="h2" emoji="🤝" title="Taco Contributors" class="mt-4" />

              <!-- contributors list -->
              <ul class="taco-bs-list 
                        list-group">

                <!-- list item -->
                <li class="standard-focus standard-focus--negative-offset
                          list-group-item d-flex flex-nowrap py-3 gap-3"
                    tabindex="0">

                  <span class="taco-text-black-to-white"><a class="taco-text-blue-to-light-blue fw-bold" href="https://egidoval.com/" target="_blank">EgidoVal</a> - Art & Design</span>

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

                <!-- list item - whitepaper -->
                <li class="standard-focus standard-focus--negative-offset
                          list-group-item d-flex flex-nowrap py-3 gap-3"
                    tabindex="0">

                  <span class="taco-text-black-to-white text-nowrap">📄 <a class="taco-text-blue-to-light-blue" href="/Taco_Dao_Whitepaper_v7.78_latest.pdf" target="_blank">Whitepaper</a></span>

                </li>                        

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

              </ul>            

            </div>

          </div>

          <!-- past sales title -->
          <TacoTitle level="h2" emoji="🏆" title="Past Sales" class="mt-5 justify-content-center"/>

          <!-- past sales -->
          <div class="taco-container
                      taco-container--l1
                      w-100">

            <div class="d-flex w-100">

              <table class="taco-table
                            table table-sm m-0">

                <thead>
                  <tr>
                    <th class="fw-bold text-start" scope="col">Started</th>
                    <th class="fw-bold ps-2 ps-sm-4 pe-2 pe-sm-3" scope="col">Name</th>
                    <th class="fw-bold ps-2 ps-sm-4 pe-2 pe-sm-3 text-center d-none d-sm-table-cell" scope="col">Duration</th>
                    <th class="fw-bold ps-2 ps-sm-4 pe-2 pe-sm-3 text-end" scope="col">Commitment</th>
                    <th class="fw-bold ps-2 ps-sm-4 pe-2 pe-sm-3 text-center" scope="col">View</th>
                  </tr>
                </thead>

                <tbody>
                  <tr>
                    <td class="ps-3">May 9, 2025</td>
                    <td class="ps-2 ps-sm-4 pe-2 pe-sm-3">SNS Decentralization Sale</td>
                    <td class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-center d-none d-sm-table-cell">2 Weeks</td>
                    <td class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">127,077 ICP</td>
                    <td class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-center">
                      <a href="https://nns.ic0.app/project/?project=lacdn-3iaaa-aaaaq-aae3a-cai" target="_blank" style="color: var(--gold);">
                        <i class="fa-solid fa-arrow-up-right-from-square"></i>
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td class="ps-3">May 3, 2024</td>
                    <td class="ps-2 ps-sm-4 pe-2 pe-sm-3">DKP Swap</td>
                    <td class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-center d-none d-sm-table-cell">3 Days</td>
                    <td class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">21,750,358 DKP</td>
                    <td class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-center">
                      <span style="color: var(--gold); opacity: 0.5;" title="DKP Swap page removed">
                        <i class="fa-solid fa-arrow-up-right-from-square"></i>
                      </span>
                    </td>
                  </tr>
                </tbody>

              </table>

            </div>

          </div>

          <!-- source code title -->
          <TacoTitle level="h2" emoji="💻" title="Source Code" class="mt-5 justify-content-center"/>

          <!-- source code -->
          <div class="taco-container
                      taco-container--l1
                      w-100 p-4 d-flex flex-column align-items-center gap-3">

            <span style="color: rgba(255,255,255,0.85); text-align: center;">
              Taco DAO is fully open source. View the code, contribute, or verify on-chain contracts.
            </span>

            <a href="https://github.com/tacodaoicp"
               target="_blank"
               class="btn taco-btn taco-btn--green d-inline-flex align-items-center gap-2"
               style="text-decoration: none;">
              <i class="fa-brands fa-github" style="font-size: 1.25rem;"></i>
              <span style="color: var(--white);">View on GitHub</span>
            </a>

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
      border-right: 1px solid var(--card-border) !important;
      padding-top: 0.5rem;

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

  import { ref } from "vue";
  import TacoTitle from '../components/misc/TacoTitle.vue';

  /////////////////////
  // local variables //
  /////////////////////

  // has proposals
  // const test = ref(false);

</script>