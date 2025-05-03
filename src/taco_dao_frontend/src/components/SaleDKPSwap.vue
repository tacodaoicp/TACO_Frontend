<template>

  <div class="dkp-swap">

    <!-- header bar -->
    <HeaderBar />

    <!-- sale details container -->
    <div class="dkp-swap__cont">

      <!-- back button container -->
      <div class="sale-details__back-btn-cont
                  px-3 pb-2 w-100">

        <!-- back button -->
        <RouterLink to="/sales"
                    class="sale-details__back-btn">

          <i class="fa-solid fa-arrow-left taco-text-brown-to-white"></i>

        </RouterLink>

      </div>

      <!-- sale details -->
      <div class="sale-details">

        <!-- title container -->
        <div class="sale-details__title-container">

            <!-- page title -->
            <h1 class="sale-details__title">

                <!-- "initial" -->
                <span class="taco-force-text-black
                             sale-details__title__bottom 
                             pb-1">Initial</span>

                <!-- "taco dao" -->
                <span class="sale-details__title__top 
                             d-inline-flex">

                    <span class="taco-force-text-black
                                 sale-title">Taco</span>

                    <span class="taco-force-text-black
                                 sale-title">DAO</span>

                </span>

                <!-- dkp logo and "dkp swap" -->
                <span class="taco-force-text-black
                             sale-details__title__bottom 
                             w-100 text-end">

                    <span class="d-inline-flex align-items-center" style="gap: 0.375rem">

                        <!-- dkp logo -->
                        <img src="@/assets/tokens/dkp.png" alt="Taco DAO Logo" style="width: 24px" />

                        <!-- "dkp swap" -->
                        <span>DKP Swap</span>

                    </span>

                </span>

            </h1>

        </div>

        <!-- sale details and status container -->
        <div class="d-flex flex-column w-100" style="gap: 0.75rem">

          <!-- sale details and status -->
          <div class="sale-details__rl-cont">

              <!-- left -->
              <div class="sale-details__details 
                          w-100">

                  <!-- sale details -->
                  <div class="h-100">

                      <!-- list -->
                      <ul class="taco-list 
                                 list-group h-100"
                          style="background-color: var(--orange-to-brown);">

                          <!-- title -->
                          <li class="taco-list__item 
                                     taco-list__item--title
                                     taco-list__item--no-hover           
                                     list-group-item">

                            <!-- otc title -->
                            <TacoTitle level="h2" emoji="ℹ️" title="Details" style="margin-bottom: 0 !important; padding: 0 !important;" />

                          </li>

                          <!-- key value pair -->
                          <li class="taco-list__item          
                                     list-group-item">

                              <!-- token name -->
                              <div class="taco-list__kvp">

                                  <!-- title -->
                                  <span class="taco-text-black-to-white">Token Name:</span>

                                  <!-- data -->
                                  <span class="taco-text-black-to-white">TACO DAO</span>

                              </div>

                          </li>

                          <!-- key value pair - token symbol -->
                          <li class="taco-list__item          
                                     list-group-item">

                              <!-- token symbol -->
                              <div class="taco-list__kvp">

                                  <!-- title -->
                                  <span class="taco-text-black-to-white">Token Symbol:</span>

                                  <!-- data -->
                                  <span class="taco-text-black-to-white">TACO</span>

                              </div>

                          </li>

                          <!-- key value pair - token supply -->
                          <li class="taco-list__item          
                                     list-group-item">

                              <!-- token supply -->
                              <div class="taco-list__kvp">

                                  <!-- title -->
                                  <span class="taco-text-black-to-white">Token Supply:</span>

                                  <!-- data -->
                                  <span class="taco-text-black-to-white">7,777,777 TACO</span>

                              </div>

                          </li>

                          <!-- key value pair - this sale -->
                          <li class="taco-list__item          
                                     list-group-item">

                              <!-- this sale -->
                              <div class="taco-list__kvp">

                                  <!-- title -->
                                  <span class="taco-text-black-to-white">This Sale:</span>

                                  <!-- data -->
                                  <span class="taco-text-black-to-white">700,000 TACO</span>

                              </div>

                          </li>

                          <!-- key value pair - minimum participant comitment -->
                          <li class="taco-list__item          
                                     d-none list-group-item">

                              <!-- minimum participant commitment -->
                              <div class="taco-list__kvp">

                                  <!-- title -->
                                  <span class="taco-text-black-to-white">Minimum Participant Commitment:</span>

                                  <!-- data -->
                                  <span class="taco-text-black-to-white">1 DKP</span>
                                  
                              </div>

                          </li>

                          <!-- key value pair - minimum commitment -->
                          <li class="taco-list__item          
                                     list-group-item">

                              <!-- minimum commitment -->
                              <div class="taco-list__kvp">

                                  <!-- title -->
                                  <span class="taco-text-black-to-white">Minimum Commitment:</span>

                                  <!-- data -->
                                  <span class="taco-text-black-to-white">50 DKP<i class="fa-solid fa-check ps-1" style="color: var(--light-green-to-success-green-hover);"></i></span>

                              </div>

                          </li>

                          <!-- key value pair - maximum commitment -->
                          <li class="taco-list__item          
                                     list-group-item">

                              <!-- maximum commitment -->
                              <div class="taco-list__kvp">

                                  <!-- title -->
                                  <span class="taco-text-black-to-white">Maximum Commitment:</span>

                                  <!-- data -->
                                  <span class="taco-text-black-to-white">&infin;</span>
                                  
                              </div>

                          </li>

                      </ul>

                  </div>

              </div>

              <!-- right -->
              <div class="sale-details__status 
                          w-100">

                  <!-- sale status -->
                  <div class="h-100">

                      <!-- list -->
                      <ul class="taco-list
                                 list-group h-100"
                          style="background-color: var(--orange-to-brown);">

                          <!-- title -->
                          <li class="taco-list__item 
                                     taco-list__item--title
                                     taco-list__item--no-hover           
                                     list-group-item">

                            <!-- otc title -->
                            <TacoTitle level="h2" emoji="📊" title="Status" style="margin-bottom: 0 !important; padding: 0 !important;" />

                          </li>

                          <!-- key value pair - sale status -->
                          <li class="taco-list__item          
                                     list-group-item">

                              <!-- participation status -->
                              <div class="taco-list__kvp">

                                  <!-- title -->
                                  <span class="taco-text-black-to-white">Sale Status:</span>

                                  <!-- data -->
                                  <span class="badge bg-success border border-success taco-force-text-white">Completed</span>
                              
                              </div>

                          </li>

                          <!-- key value pair - current participants -->
                          <li class="taco-list__item          
                                     list-group-item">

                              <!-- current participants -->
                              <div class="taco-list__kvp">

                                  <!-- title -->
                                  <span class="taco-text-black-to-white">Unique Participants:</span>

                                  <!-- data -->
                                  <span class="taco-text-black-to-white">76</span>

                              </div>

                          </li>

                          <!-- key value pair - current commitment -->
                          <li class="taco-list__item          
                                     list-group-item">

                              <!-- current commitment -->
                              <div class="taco-list__kvp">

                                  <!-- title -->
                                  <span class="taco-text-black-to-white">Commitment:</span>

                                  <!-- data -->
                                  <span class="taco-text-black-to-white">21,750,358</span>

                              </div>

                          </li>

                          <!-- key value pair - swap ends -->
                          <li class="taco-list__item          
                                     list-group-item">

                              <!-- swap ends -->
                              <div class="taco-list__kvp">

                                  <!-- title -->
                                  <span class="taco-text-black-to-white">Swap Ended:</span>

                                  <!-- data -->
                                  <span class="taco-text-black-to-white">May 6 2024, 12:01 AM EST</span>

                              </div>

                          </li>

                          <!-- key value pair - deadline -->
                          <li class="taco-list__item          
                                     list-group-item">

                              <!-- deadline -->
                              <div class="taco-list__kvp">

                                  <!-- title -->
                                  <span class="taco-text-black-to-white">Deadline:</span>

                                  <!-- data -->
                                  <span tabindex="0" 
                                        class=" taco-badge taco-force-text-black
                                                badge shadow">0D 0H 0M 0S</span>

                              </div>

                          </li>

                      </ul>

                  </div>

              </div>

          </div>

          <!-- participants -->
          <div class="taco-container 
                      taco-container--l1
                      d-flex flex-column align-items-center"
                      style="gap: 1rem; background-color: var(--orange-to-brown);">

              <!-- participants title -->
              <h2 class="taco-title mb-0" style="font-size: 1.5rem;">

                  <span class="taco-text-brown-to-white">🕺</span>

                  <span class="taco-text-brown-to-white">Participants</span>

                  <span class="taco-text-brown-to-white">💃</span>

              </h2>

              <!-- scrollable container -->
              <div class="sale-details__scrollable-cont 
                          d-flex w-100">

                <!-- participants table -->
                <table class="taco-table 
                                table table-sm table-responsive">
                    <thead>
                        <tr>
                            <th class="fw-bold text-start" scope="col">Principal</th>
                            <th class="fw-bold ps-2 ps-sm-4 pe-2 pe-sm-3 text-end" scope="col">
                                <img src="@/assets/tokens/dkp.png" alt="Draggin Karma Points" class="me-1"
                                    style="width: 18px" /><span class="taco-text-black-to-white">DKP</span>
                            </th>
                            <th class="fw-bold ps-2 ps-sm-4 pe-2 pe-sm-3 text-end" scope="col">
                                <span class="me-1 taco-text-black-to-white">🌮</span>
                                <span class="taco-text-black-to-white">TACO</span>
                            </th>
                            <th class="fw-bold ps-2 ps-sm-4 pe-2 pe-sm-3 text-end" scope="col">
                                Rank
                            </th>
                        </tr>
                    </thead>
                    <tbody data-v-2b1a95c4="">
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">xuvka...uo5qe</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">3,200,000</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">102,993.241</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">1</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">mqirh...fvyae</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">2,776,241</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">89,354.393</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">2</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">xcdmb...4okqe</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">2,222,221</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">71,523.045</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">3</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">qh4re...fyaae</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">2,220,628</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">71,471.773</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">4</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">dew4p...vrvae</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">2,200,001</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">70,807.885</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">5</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">th65x...ybuae</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">2,000,000</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">64,370.776</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">6</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">zp44o...zqiqe</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">1,179,998</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">37,978.693</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">7</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">pdhei...xsgqe</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">600,000</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">19,311.233</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">8</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">xgid6...gdxqe</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">557,333</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">17,937.979</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">9</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">tqmhw...we5qe</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">555,710</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">17,885.742</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">10</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">k2nbp...ofrae</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">505,037</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">16,254.812</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">11</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">kzbxd...zylqe</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">500,000</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">16,092.694</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">12</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">vwgrw...gcbae</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">444,444</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">14,304.603</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">13</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">vfyof...l43ae</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">375,277</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">12,078.436</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">14</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">bk5xz...3nqae</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">249,999</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">8,046.315</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">15</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">fywqa...hj2qe</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">224,999</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">7,241.68</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">16</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">ldxgi...lrtae</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">158,096</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">5,088.381</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">17</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">xvfo2...7itae</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">110,000</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">3,540.393</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">18</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">3cey4...5o6qe</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">107,952</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">3,474.477</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">19</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">vxcwu...kyxqe</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">100,000</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">3,218.539</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">20</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">akt5s...fk7qe</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">100,000</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">3,218.539</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">21</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">avvcg...vqaae</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">100,000</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">3,218.539</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">22</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">2wmby...lwgqe</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">99,999</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">3,218.507</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">23</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">rzrt4...x7qqe</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">96,297</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">3,099.356</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">24</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">wti6j...7lrae</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">89,579</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">2,883.135</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">25</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">vfhdx...gvjae</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">88,888</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">2,860.895</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">26</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">7cde5...qyjae</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">80,000</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">2,574.831</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">27</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">nhy7q...mzzqe</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">76,878</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">2,474.348</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">28</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">dhuwx...cbxae</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">62,000</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">1,995.494</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">29</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">3anjr...tqgae</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">54,458</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">1,752.752</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">30</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">6pboj...6i5qe</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">52,419</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">1,687.126</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">31</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">urk53...wljqe</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">50,000</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">1,609.269</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">32</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">5pzsx...7whqe</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">50,000</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">1,609.269</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">33</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">vwj6s...ujjae</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">50,000</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">1,609.269</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">34</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">qjrwc...uwkae</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">49,007</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">1,577.309</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">35</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">rypm6...ydoae</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">40,005</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">1,287.576</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">36</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">3fzac...4goae</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">33,313</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">1,072.192</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">37</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">gw2tx...it2qe</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">30,000</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">965.562</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">38</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">xpgm6...455ae</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">30,000</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">965.562</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">39</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">yh6dk...3bqqe</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">25,997</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">836.724</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">40</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">wqb4a...tgcqe</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">25,000</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">804.635</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">41</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">novsc...i4nae</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">20,420</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">657.226</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">42</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">yldyg...n3nae</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">18,496</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">595.301</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">43</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">da75w...3p4qe</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">16,831</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">541.712</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">44</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">hwhf2...yhiqe</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">13,683</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">440.393</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">45</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">hxdpn...hkcqe</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">10,000</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">321.854</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">46</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">fiwvk...6evqe</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">10,000</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">321.854</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">47</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">zeukl...j2bqe</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">10,000</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">321.854</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">48</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">s2swy...t2oqe</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">9,687</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">311.78</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">49</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">6lrxa...wttqe</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">8,999</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">289.636</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">50</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">xdrff...qfiae</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">7,776</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">250.274</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">51</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">dhr23...w7iae</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">6,074</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">195.494</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">52</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">h2x7q...kkzqe</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">5,000</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">160.927</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">53</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">udwan...dtgae</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">4,030</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">129.707</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">54</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">sbmbj...pbxae</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">3,995</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">128.581</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">55</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">bkvir...yhkqe</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">3,500</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">112.649</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">56</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">ynrus...fhaqe</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">2,536</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">81.622</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">57</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">5eqqt...aovae</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">2,437</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">78.436</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">58</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">bl27y...k7cae</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">2,435</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">78.371</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">59</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">du2hj...3fpae</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">2,000</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">64.371</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">60</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">kw4sb...lpsae</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">1,999</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">64.339</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">61</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">23jeh...aaxqe</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">1,999</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">64.339</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">62</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">peg2s...vpoqe</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">1,869</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">60.154</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">63</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">uwpik...5wzae</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">1,776</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">57.161</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">64</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">27vqm...sshqe</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">1,693</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">54.49</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">65</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">a7fmp...4snae</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">1,630</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">52.462</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">66</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">d5jbw...u4qqe</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">1,539</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">49.533</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">67</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">u5lmu...5zgae</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">1,511</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">48.632</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">68</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">6fr5a...dzlae</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">1,499</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">48.246</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">69</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">hzvyx...knlae</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">998</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">32.121</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">70</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">nhcrb...auwqe</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">979</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">31.509</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">71</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">kijn6...tfxae</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">866</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">27.873</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">72</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">ne7kl...zmyqe</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">770</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">24.783</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">73</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">55zes...7axqe</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">701</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">22.562</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">74</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">ts5dq...q4eqe</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">528</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">16.994</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">75</td>
                        </tr>
                        <tr data-v-2b1a95c4="">
                            <th data-v-2b1a95c4="" class="fw-bold" scope="row">jlnim...cb3qe</th>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">286</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">9.205</td>
                            <td data-v-2b1a95c4="" class="ps-2 ps-sm-4 pe-2 pe-sm-3 text-end">76</td>
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
    // Component Style //
    /////////////////////

    // page container
    .dkp-swap {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;

    // content container
    &__cont {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
        overflow-x: hidden;
        overflow-y: auto;
        padding-top: 2rem;
        padding-bottom: 3rem;
    }
    }

    // sale details
    .sale-details {
    display: flex;
    flex-direction: column;
    align-items: center;
    height: fit-content;
    margin: 0;
    padding: 1.5rem 1.5rem 1.5rem 1.5rem;
    flex-wrap: wrap;
    width: 100%;
    max-width: 750px;
    background-color: var(--green-to-yellow);
    border-radius: 1rem;
    border: 1px solid var(--dark-green);

    // back button container
    &__back-btn-cont {
        max-width: 750px;
    }

    // back button
    &__back-btn {

        // back button icon
        i {
        font-size: 2.5rem;
        }

    }

    // sale details title
    &__title {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        margin-bottom: 0;
        padding: 0;

        // page title conatainer
        &-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 100%;
        }

        // smaller text
        &__top {
            white-space: nowrap; 
            gap: 1rem;
            
            span {
                font-size: 3rem;
                font-family: Rubik Mono One, monospace;
                line-height: 1;
            }
        }

        // larger text
        &__bottom {
            font-size: 1.375rem;
            font-family: Rubik;
            line-height: 1;

            * {
                font-family: Rubik;
            }
        }
    }

    // right and left containers
    &__rl-cont {
        display: flex;
        flex-wrap: nowrap;
        padding: 1rem 0 0;
        gap: 0.75rem;
    }

    // solo container
    &__solo-cont {
        padding: 1.25rem 1rem 0;
    }

    // scrollable container
    &__scrollable-cont {
        justify-content: center;
        overflow-y: hidden; 
        overflow-x: auto;
    }

    }

    ///////////////////
    // media queries //
    ///////////////////

    // phone protrait
    @media (max-width: 575.98px) {

        .sale-details {
            padding: 0.5rem;
            padding-top: 1rem;

            h2 span {
                font-size: 1.25rem !important;
            }

            .sale-details__title__top span {
                font-size: 2rem;
            }

            .list-group-item:not(.list-group-item--title) {
                font-size: 0.75rem;
            }

            table {
                font-size: 0.75rem;
            }
        }

        // show details, status, and participants in a column
        .sale-details__rl-cont {
            flex-direction: column;
        }

        // lower font size
        .sale-title {
            font-size: 2.25rem;
        }

        // reduce title gap
        .sale-details__title__top {
            gap: 0.25rem !important;
        }

        // justify scrollable container flex start
        .sale-details__scrollable-cont {
            justify-content: flex-start
        }

        // reduce top padding of page container
        .dkp-swap__cont {
            padding-top: 1rem;
        }

    }

    // phone landscape
    @media (min-width: 576px) and (max-width: 767.98px) {

        // show details, status, and participants in a column
        .sale-details__rl-cont {
            flex-direction: column;
        }

    }

</style>

<script setup lang="ts">

    /////////////
    // Imports //
    /////////////

    import HeaderBar from "./HeaderBar.vue";
    import FooterBar from "./FooterBar.vue";
    import TacoTitle from '../components/ui/TacoTitle.vue'

</script>