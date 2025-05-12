<template>

  <div class="standard-view">

    <!-- header bar -->
    <HeaderBar />

    <!-- scroll container - app util class -->
    <div class="scroll-y-container h-100">  

      <!-- bootstrap container -->
      <div class="container h-100">

        <!-- bootstrap row -->
        <div class="row h-100 d-flex flex-column flex-nowrap overflow-hidden px-2 px-sm-0">

          <!-- active sales title -->
          <TacoTitle level="h2" emoji="📊" title="Active Sales" class="mt-4 justify-content-center"/>

          <!-- active sales -->
          <div class="taco-container 
                      taco-container--l1
                      w-100"
               style="background-color: var(--orange-to-brown);">

            <!-- if no active sales -->
            <span v-if="!hasActiveSale" 
                  class="taco-text-black-to-white
                         d-inline-block pt-2 pb-1 w-100 text-center fst-italic">no active sales</span>

            <!-- scrollable container -->
            <div v-if="hasActiveSale"
                class="all-sales__scrollable-cont 
                        d-flex w-100">

              <!-- active sales table -->
              <table class="taco-table
                            table table-sm table-responsive m-0">

                <!-- table head -->
                <thead>

                  <!-- head row -->
                  <tr>

                    <th class="fw-bold text-start" 
                        scope="col">
                      Started
                    </th>

                    <th class="fw-bold ps-2 ps-sm-4 pe-2 pe-sm-3"
                        scope="col">
                      Name
                    </th>

                    <th class="fw-bold ps-2 ps-sm-4 pe-2 pe-sm-3 text-center"
                        scope="col">
                      Duration
                    </th>

                    <th class="fw-bold ps-2 ps-sm-4 pe-2 pe-sm-3 text-center"
                        scope="col">
                      Participants
                    </th>

                    <th class="fw-bold ps-2 ps-sm-4 pe-2 pe-sm-3 text-center"
                        scope="col">
                      Commitment
                    </th>
                    
                    <th class="fw-bold ps-2 ps-sm-4 pe-2 pe-sm-3"
                        scope="col">
                      Deadline
                    </th>
                    
                    <th class="fw-bold ps-2 ps-sm-4 pe-2 pe-sm-3"
                        scope="col">
                      View
                    </th>

                  </tr>

                </thead>

                <!-- table body -->
                <tbody>

                  <tr>

                    <td data-label="Started:" class="ps-3">MON DD, YYYY</td>

                    <td data-label="Name:" class="ps-2 ps-sm-4 pe-2 pe-sm-3">Sale Name</td>

                    <td data-label="Duration:" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-center">X Days</td>

                    <td data-label="Participants:" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-center">X</td>

                    <td data-label="Commitment:" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-center">X XYZ</td>

                    <td data-label="Deadline:" class="ps-2 ps-sm-4 pe-2 pe-sm-3">

                      <!-- countdown -->
                      <span class="taco-badge taco-force-text-black
                                  badge shadow">0D 0H 0M 0S</span>

                    </td>

                    <td data-label="View:" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-center">

                      <router-link to="/sales/dkp-swap" style="background-color: transparent; color: var(--black);">
                        
                        <i class="fa-solid fa-arrow-up-right-from-square taco-text-brown"></i>
                      
                      </router-link>
                    
                    </td>

                  </tr>          

                </tbody>

              </table>

            </div>

          </div>

          <!-- past sales title -->
          <TacoTitle level="h2" emoji="🏆" title="Past Sales" class="mt-5 justify-content-center"/>

          <!-- past sales-->
          <div class="taco-container 
                      taco-container--l1
                      w-100"
               style="background-color: var(--orange-to-brown);">

            <!-- scrollable container -->
            <div class="all-sales__scrollable-cont 
                        d-flex w-100">

              <!-- past sales table - hardcoded for now, saves cycles -->
              <table class="taco-table
                            table table-sm table-responsive m-0">

                <!-- table head -->
                <thead>

                  <!-- head row -->
                  <tr>

                    <th class="fw-bold text-start" 
                        scope="col">
                      Started
                    </th>

                    <th class="fw-bold ps-2 ps-sm-4 pe-2 pe-sm-3"
                        scope="col">
                      Name
                    </th>

                    <th class="fw-bold ps-2 ps-sm-4 pe-2 pe-sm-3 text-center"
                        scope="col">
                      Duration
                    </th>

                    <th class="fw-bold ps-2 ps-sm-4 pe-2 pe-sm-3 text-center"
                        scope="col">
                      Participants
                    </th>

                    <th class="fw-bold ps-2 ps-sm-4 pe-2 pe-sm-3 text-center"
                        scope="col">
                      Commitment
                    </th>
                    
                    <th class="fw-bold ps-2 ps-sm-4 pe-2 pe-sm-3"
                        scope="col">
                      Status
                    </th>  
                    
                    <th class="fw-bold ps-2 ps-sm-4 pe-2 pe-sm-3 text-center"
                        scope="col">
                      View
                    </th>                

                  </tr>

                </thead>

                <!-- table body -->
                <tbody>

                  <tr>

                    <td data-label="Started:" class="ps-3">May 3, 2024</td>

                    <td data-label="Name:" class="ps-2 ps-sm-4 pe-2 pe-sm-3">DKP Swap</td>

                    <td data-label="Duration:" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-center">3 Days</td>

                    <td data-label="Participants:" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-center">76</td>

                    <td data-label="Commitment:" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-center">21,750,358 DKP</td>

                    <td data-label="Status:" class="ps-2 ps-sm-4 pe-2 pe-sm-3">
                      <span class="d-flex align-items-center" style="gap: 0.5rem;">
                        <span class="taco-text-black-to-white">Completed</span>
                        <i class="fa-solid fa-check small"
                           style="color: var(--light-green-to-success-green-hover);"></i>
                      </span>
                    </td>

                    <td data-label="View:" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-center">

                      <router-link to="/sales/dkp-swap" style="background-color: transparent; color: var(--black);">
                      
                        <i class="fa-solid fa-arrow-up-right-from-square taco-text-brown-to-white"></i>
                      
                      </router-link>

                    </td>

                  </tr>

                </tbody>

              </table>

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
  
  // all sales
  .all-sales {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    min-height: 100%;
    overflow-x: hidden;
    overflow-y: auto;
    padding-top: 3rem;
    padding-bottom: 8rem;

    // all sales container
    &__container {
      width: 100%;
      max-width: fit-content;
    }

    // all sales titles
    h2 {
      margin-bottom: 0;
      font-size: 1.5rem;
      font-weight: 500;
      color: var(--brown);
      font-family: "Rubik Mono One", monospace;
    }

    // countdown badge
    .badge {
      transition: transform 0.5s;

      &:hover,
      &:focus,
      &:active {
        transform: scale(1.1, 1.1);
      }

      &:focus,
      &:focus:focus-visible {
        outline: 3px solid var(--dark-orange);
        outline-offset: 2px;
      }
    }

    // scrollable container
    &__scrollable-cont {
      overflow-y: hidden; 
      overflow-x: auto;
    }

  }

  ///////////////////
  // media queries //
  ///////////////////

  // phone protrait
  @media (max-width: 575.98px) {
    
    .initial-sale {
      margin-top: 1rem;
      padding: 0.5rem;
      padding-top: 1rem;

      // change header font size
      h2 span {
        font-size: 1.25rem !important;
      }

      // change everything except buttons font size
      *:not(button) {
        font-size: 0.75rem;
      }

      // change table font size
      table {
        font-size: 0.75rem;
      }

    }

    //////////////////////////////
    // change table orientation //
    //////////////////////////////

    // table head
    table thead {
      clip: rect(0 0 0 0);
      // height: 1px;
      // margin: -1px;
      overflow: hidden;
      // padding: 0;
      position: absolute;
      width: 1px;
    }
    
    // table rows
    table tr {
      border-bottom: 1px solid var(--brown);
      display: block;
      margin: 0;
      padding: 1rem;
    }

    // remove border from last row
    table tbody tr:last-of-type {
      border-bottom: none;
    }
    
    // table cells
    table td {
      display: flex;
      gap: 1rem;
      // font-size: .8em;
      // text-align: right;
      width: fit-content;
      padding: 0 !important;
    }
    
    // table cells before
    table td::before {
      content: attr(data-label);
      font-weight: bold;
    }

    //////////////////////////////////
    // end change table orientation //
    //////////////////////////////////
  }
  
  // phone landscape
  @media (min-width: 576px) and (max-width: 767.98px) {
    
    //////////////////////////////
    // change table orientation //
    //////////////////////////////

    // table head
    table thead {
      clip: rect(0 0 0 0);
      // height: 1px;
      // margin: -1px;
      overflow: hidden;
      // padding: 0;
      position: absolute;
      width: 1px;
    }
    
    // table rows
    table tr {
      border-bottom: 1px solid var(--brown);
      display: block;
      margin: 0;
      padding: 1rem;
    }

    // remove border from last row
    table tbody tr:last-of-type {
      border-bottom: none;
    }
    
    // table cells
    table td {
      display: flex;
      gap: 1rem;
      // font-size: .8em;
      // text-align: right;
      width: fit-content;
      padding: 0 !important;
    }
    
    // table cells before
    table td::before {
      content: attr(data-label);
      font-weight: bold;
    }

    //////////////////////////////////
    // end change table orientation //
    //////////////////////////////////

  }

  // tablet
  @media (min-width: 767px) and (max-width: 991.98px) {

    //////////////////////////////
    // change table orientation //
    //////////////////////////////

    // table head
    table thead {
      clip: rect(0 0 0 0);
      // height: 1px;
      // margin: -1px;
      overflow: hidden;
      // padding: 0;
      position: absolute;
      width: 1px;
    }
    
    // table rows
    table tr {
      border-bottom: 1px solid var(--brown);
      display: block;
      margin: 0;
      padding: 1rem;
    }

    // remove border from last row
    table tbody tr:last-of-type {
      border-bottom: none;
    }
    
    // table cells
    table td {
      display: flex;
      gap: 1rem;
      // font-size: .8em;
      // text-align: right;
      width: fit-content;
      padding: 0 !important;
    }
    
    // table cells before
    table td::before {
      content: attr(data-label);
      font-weight: bold;
    }

    //////////////////////////////////
    // end change table orientation //
    //////////////////////////////////
    
  }

  // small daktop
  @media (min-width: 992px) and (max-width: 1199.98px) {

    //////////////////////////////
    // change table orientation //
    //////////////////////////////

    // table head
    table thead {
      clip: rect(0 0 0 0);
      // height: 1px;
      // margin: -1px;
      overflow: hidden;
      // padding: 0;
      position: absolute;
      width: 1px;
    }
    
    // table rows
    table tr {
      border-bottom: 1px solid var(--brown);
      display: block;
      margin: 0;
      padding: 1rem;
    }

    // remove border from last row
    table tbody tr:last-of-type {
      border-bottom: none;
    }
    
    // table cells
    table td {
      display: flex;
      gap: 1rem;
      // font-size: .8em;
      // text-align: right;
      width: fit-content;
      padding: 0 !important;
    }
    
    // table cells before
    table td::before {
      content: attr(data-label);
      font-weight: bold;
    }

    //////////////////////////////////
    // end change table orientation //
    //////////////////////////////////

  }

  // medium desktop
  @media (min-width: 1200px) and (max-width: 1399.98px) {
    
  }

</style>

<script setup lang="ts">

  /////////////
  // Imports //
  /////////////

  import HeaderBar from "../components/HeaderBar.vue";
  import FooterBar from "../components/FooterBar.vue";
  import {ref} from "vue";
  import TacoTitle from '../components/misc/TacoTitle.vue';

  /////////////////////////
  // Reference Variables //
  /////////////////////////

  // show/hide active sales table and 'no active sales' message
  const hasActiveSale = ref(false);

</script>