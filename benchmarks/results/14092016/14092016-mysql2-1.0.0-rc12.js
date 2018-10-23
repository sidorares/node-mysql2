'use strict';

window.mysql2Data = [
  {
    opts: {
      path: '../wrk2/wrk',
      rate: 9000,
      duration: '300s',
      threads: 4,
      connections: 200,
      printLatency: true,
      url: 'http://107.21.1.157/queryU'
    },
    result: {
      transferPerSec: '4.82MB',
      requestsPerSec: 8996.56,
      non2xx3xx: 192,
      requestsTotal: 2698975,
      durationActual: '5.00m',
      transferTotal: '1.41GB',
      latencyAvg: 'calibration:',
      latencyStdev: 'mean',
      latencyMax: 'lat.:',
      latencyStdevPerc: null,
      rpsAvg: 'calibration:',
      rpsStdev: 'mean',
      rpsMax: 'lat.:',
      rpsStdevPerc: null,
      histogram: [
        {
          latency: 1.618,
          percentile: 0.1,
          total: 261032
        },
        {
          latency: 1.831,
          percentile: 0.2,
          total: 522257
        },
        {
          latency: 2.009,
          percentile: 0.3,
          total: 782760
        },
        {
          latency: 2.175,
          percentile: 0.4,
          total: 1043626
        },
        {
          latency: 2.341,
          percentile: 0.5,
          total: 1305149
        },
        {
          latency: 2.427,
          percentile: 0.55,
          total: 1435523
        },
        {
          latency: 2.519,
          percentile: 0.6,
          total: 1567239
        },
        {
          latency: 2.617,
          percentile: 0.65,
          total: 1696662
        },
        {
          latency: 2.727,
          percentile: 0.7,
          total: 1827195
        },
        {
          latency: 2.853,
          percentile: 0.75,
          total: 1956243
        },
        {
          latency: 2.927,
          percentile: 0.775,
          total: 2022584
        },
        {
          latency: 3.007,
          percentile: 0.8,
          total: 2086878
        },
        {
          latency: 3.099,
          percentile: 0.825,
          total: 2151761
        },
        {
          latency: 3.205,
          percentile: 0.85,
          total: 2216870
        },
        {
          latency: 3.333,
          percentile: 0.875,
          total: 2282586
        },
        {
          latency: 3.407,
          percentile: 0.8875,
          total: 2315104
        },
        {
          latency: 3.489,
          percentile: 0.9,
          total: 2347038
        },
        {
          latency: 3.587,
          percentile: 0.9125,
          total: 2380077
        },
        {
          latency: 3.699,
          percentile: 0.925,
          total: 2412458
        },
        {
          latency: 3.837,
          percentile: 0.9375,
          total: 2445127
        },
        {
          latency: 3.919,
          percentile: 0.94375,
          total: 2461327
        },
        {
          latency: 4.011,
          percentile: 0.95,
          total: 2477495
        },
        {
          latency: 4.119,
          percentile: 0.95625,
          total: 2493747
        },
        {
          latency: 4.247,
          percentile: 0.9625,
          total: 2510105
        },
        {
          latency: 4.411,
          percentile: 0.96875,
          total: 2526610
        },
        {
          latency: 4.507,
          percentile: 0.971875,
          total: 2534715
        },
        {
          latency: 4.619,
          percentile: 0.975,
          total: 2542831
        },
        {
          latency: 4.751,
          percentile: 0.978125,
          total: 2550828
        },
        {
          latency: 4.907,
          percentile: 0.98125,
          total: 2558969
        },
        {
          latency: 5.103,
          percentile: 0.984375,
          total: 2567094
        },
        {
          latency: 5.223,
          percentile: 0.985938,
          total: 2571149
        },
        {
          latency: 5.371,
          percentile: 0.9875,
          total: 2575189
        },
        {
          latency: 5.543,
          percentile: 0.989062,
          total: 2579250
        },
        {
          latency: 5.759,
          percentile: 0.990625,
          total: 2583332
        },
        {
          latency: 6.031,
          percentile: 0.992188,
          total: 2587376
        },
        {
          latency: 6.199,
          percentile: 0.992969,
          total: 2589448
        },
        {
          latency: 6.403,
          percentile: 0.99375,
          total: 2591456
        },
        {
          latency: 6.639,
          percentile: 0.994531,
          total: 2593511
        },
        {
          latency: 6.935,
          percentile: 0.995313,
          total: 2595548
        },
        {
          latency: 7.295,
          percentile: 0.996094,
          total: 2597579
        },
        {
          latency: 7.503,
          percentile: 0.996484,
          total: 2598592
        },
        {
          latency: 7.743,
          percentile: 0.996875,
          total: 2599614
        },
        {
          latency: 7.991,
          percentile: 0.997266,
          total: 2600621
        },
        {
          latency: 8.287,
          percentile: 0.997656,
          total: 2601641
        },
        {
          latency: 8.639,
          percentile: 0.998047,
          total: 2602674
        },
        {
          latency: 8.831,
          percentile: 0.998242,
          total: 2603190
        },
        {
          latency: 9.031,
          percentile: 0.998437,
          total: 2603691
        },
        {
          latency: 9.295,
          percentile: 0.998633,
          total: 2604198
        },
        {
          latency: 9.591,
          percentile: 0.998828,
          total: 2604697
        },
        {
          latency: 9.959,
          percentile: 0.999023,
          total: 2605204
        },
        {
          latency: 10.159,
          percentile: 0.999121,
          total: 2605470
        },
        {
          latency: 10.407,
          percentile: 0.999219,
          total: 2605719
        },
        {
          latency: 10.679,
          percentile: 0.999316,
          total: 2605970
        },
        {
          latency: 11.007,
          percentile: 0.999414,
          total: 2606223
        },
        {
          latency: 11.431,
          percentile: 0.999512,
          total: 2606477
        },
        {
          latency: 11.695,
          percentile: 0.999561,
          total: 2606604
        },
        {
          latency: 11.983,
          percentile: 0.999609,
          total: 2606733
        },
        {
          latency: 12.311,
          percentile: 0.999658,
          total: 2606858
        },
        {
          latency: 12.727,
          percentile: 0.999707,
          total: 2606987
        },
        {
          latency: 13.287,
          percentile: 0.999756,
          total: 2607113
        },
        {
          latency: 13.759,
          percentile: 0.99978,
          total: 2607177
        },
        {
          latency: 14.367,
          percentile: 0.999805,
          total: 2607240
        },
        {
          latency: 15.311,
          percentile: 0.999829,
          total: 2607304
        },
        {
          latency: 17.151,
          percentile: 0.999854,
          total: 2607369
        },
        {
          latency: 20.479,
          percentile: 0.999878,
          total: 2607431
        },
        {
          latency: 23.119,
          percentile: 0.99989,
          total: 2607463
        },
        {
          latency: 40.383,
          percentile: 0.999902,
          total: 2607495
        },
        {
          latency: 62.975,
          percentile: 0.999915,
          total: 2607527
        },
        {
          latency: 85.055,
          percentile: 0.999927,
          total: 2607559
        },
        {
          latency: 107.455,
          percentile: 0.999939,
          total: 2607590
        },
        {
          latency: 123.007,
          percentile: 0.999945,
          total: 2607608
        },
        {
          latency: 138.751,
          percentile: 0.999951,
          total: 2607622
        },
        {
          latency: 144.383,
          percentile: 0.999957,
          total: 2607638
        },
        {
          latency: 161.919,
          percentile: 0.999963,
          total: 2607654
        },
        {
          latency: 166.399,
          percentile: 0.999969,
          total: 2607670
        },
        {
          latency: 181.503,
          percentile: 0.999973,
          total: 2607678
        },
        {
          latency: 183.167,
          percentile: 0.999976,
          total: 2607686
        },
        {
          latency: 184.447,
          percentile: 0.999979,
          total: 2607694
        },
        {
          latency: 188.287,
          percentile: 0.999982,
          total: 2607702
        },
        {
          latency: 203.263,
          percentile: 0.999985,
          total: 2607710
        },
        {
          latency: 203.903,
          percentile: 0.999986,
          total: 2607714
        },
        {
          latency: 204.415,
          percentile: 0.999988,
          total: 2607720
        },
        {
          latency: 205.183,
          percentile: 0.999989,
          total: 2607722
        },
        {
          latency: 205.695,
          percentile: 0.999991,
          total: 2607726
        },
        {
          latency: 221.439,
          percentile: 0.999992,
          total: 2607730
        },
        {
          latency: 222.591,
          percentile: 0.999993,
          total: 2607732
        },
        {
          latency: 223.103,
          percentile: 0.999994,
          total: 2607736
        },
        {
          latency: 223.103,
          percentile: 0.999995,
          total: 2607736
        },
        {
          latency: 223.359,
          percentile: 0.999995,
          total: 2607739
        },
        {
          latency: 223.999,
          percentile: 0.999996,
          total: 2607740
        },
        {
          latency: 224.255,
          percentile: 0.999997,
          total: 2607741
        },
        {
          latency: 224.383,
          percentile: 0.999997,
          total: 2607743
        },
        {
          latency: 224.383,
          percentile: 0.999997,
          total: 2607743
        },
        {
          latency: 225.023,
          percentile: 0.999998,
          total: 2607745
        },
        {
          latency: 225.023,
          percentile: 0.999998,
          total: 2607745
        },
        {
          latency: 225.023,
          percentile: 0.999998,
          total: 2607745
        },
        {
          latency: 225.407,
          percentile: 0.999998,
          total: 2607746
        },
        {
          latency: 225.407,
          percentile: 0.999999,
          total: 2607746
        },
        {
          latency: 225.535,
          percentile: 0.999999,
          total: 2607747
        },
        {
          latency: 225.535,
          percentile: 0.999999,
          total: 2607747
        },
        {
          latency: 225.535,
          percentile: 0.999999,
          total: 2607747
        },
        {
          latency: 225.791,
          percentile: 0.999999,
          total: 2607748
        },
        {
          latency: 225.791,
          percentile: 0.999999,
          total: 2607748
        },
        {
          latency: 225.791,
          percentile: 0.999999,
          total: 2607748
        },
        {
          latency: 225.791,
          percentile: 1,
          total: 2607748
        },
        {
          latency: 225.791,
          percentile: 1,
          total: 2607748
        },
        {
          latency: 226.047,
          percentile: 1,
          total: 2607749
        },
        {
          latency: 226.047,
          percentile: 1,
          total: 2607749
        }
      ]
    }
  },
  {
    opts: {
      path: '../wrk2/wrk',
      rate: 9100,
      duration: '300s',
      threads: 4,
      connections: 200,
      printLatency: true,
      url: 'http://107.21.1.157/queryU'
    },
    result: {
      transferPerSec: '4.88MB',
      requestsPerSec: 9096.51,
      connectErrors: '0',
      readErrors: '0',
      writeErrors: '0',
      timeoutErrors: '2',
      non2xx3xx: 37,
      requestsTotal: 2728952,
      durationActual: '5.00m',
      transferTotal: '1.43GB',
      latencyAvg: 'calibration:',
      latencyStdev: 'mean',
      latencyMax: 'lat.:',
      latencyStdevPerc: null,
      rpsAvg: 'calibration:',
      rpsStdev: 'mean',
      rpsMax: 'lat.:',
      rpsStdevPerc: null,
      histogram: [
        {
          latency: 1.624,
          percentile: 0.1,
          total: 264067
        },
        {
          latency: 1.829,
          percentile: 0.2,
          total: 528387
        },
        {
          latency: 1.998,
          percentile: 0.3,
          total: 791810
        },
        {
          latency: 2.155,
          percentile: 0.4,
          total: 1056246
        },
        {
          latency: 2.309,
          percentile: 0.5,
          total: 1319665
        },
        {
          latency: 2.389,
          percentile: 0.55,
          total: 1451191
        },
        {
          latency: 2.473,
          percentile: 0.6,
          total: 1583846
        },
        {
          latency: 2.563,
          percentile: 0.65,
          total: 1716367
        },
        {
          latency: 2.661,
          percentile: 0.7,
          total: 1847471
        },
        {
          latency: 2.773,
          percentile: 0.75,
          total: 1979324
        },
        {
          latency: 2.837,
          percentile: 0.775,
          total: 2045345
        },
        {
          latency: 2.907,
          percentile: 0.8,
          total: 2110033
        },
        {
          latency: 2.989,
          percentile: 0.825,
          total: 2176715
        },
        {
          latency: 3.081,
          percentile: 0.85,
          total: 2241572
        },
        {
          latency: 3.193,
          percentile: 0.875,
          total: 2307600
        },
        {
          latency: 3.257,
          percentile: 0.8875,
          total: 2340124
        },
        {
          latency: 3.333,
          percentile: 0.9,
          total: 2373567
        },
        {
          latency: 3.419,
          percentile: 0.9125,
          total: 2406657
        },
        {
          latency: 3.519,
          percentile: 0.925,
          total: 2439129
        },
        {
          latency: 3.643,
          percentile: 0.9375,
          total: 2472157
        },
        {
          latency: 3.717,
          percentile: 0.94375,
          total: 2488767
        },
        {
          latency: 3.801,
          percentile: 0.95,
          total: 2505072
        },
        {
          latency: 3.899,
          percentile: 0.95625,
          total: 2521607
        },
        {
          latency: 4.017,
          percentile: 0.9625,
          total: 2538010
        },
        {
          latency: 4.163,
          percentile: 0.96875,
          total: 2554581
        },
        {
          latency: 4.247,
          percentile: 0.971875,
          total: 2562564
        },
        {
          latency: 4.351,
          percentile: 0.975,
          total: 2570935
        },
        {
          latency: 4.471,
          percentile: 0.978125,
          total: 2579095
        },
        {
          latency: 4.623,
          percentile: 0.98125,
          total: 2587383
        },
        {
          latency: 4.811,
          percentile: 0.984375,
          total: 2595554
        },
        {
          latency: 4.931,
          percentile: 0.985938,
          total: 2599687
        },
        {
          latency: 5.067,
          percentile: 0.9875,
          total: 2603839
        },
        {
          latency: 5.235,
          percentile: 0.989062,
          total: 2607939
        },
        {
          latency: 5.431,
          percentile: 0.990625,
          total: 2611995
        },
        {
          latency: 5.695,
          percentile: 0.992188,
          total: 2616121
        },
        {
          latency: 5.867,
          percentile: 0.992969,
          total: 2618210
        },
        {
          latency: 6.063,
          percentile: 0.99375,
          total: 2620251
        },
        {
          latency: 6.307,
          percentile: 0.994531,
          total: 2622315
        },
        {
          latency: 6.607,
          percentile: 0.995313,
          total: 2624369
        },
        {
          latency: 6.983,
          percentile: 0.996094,
          total: 2626414
        },
        {
          latency: 7.207,
          percentile: 0.996484,
          total: 2627449
        },
        {
          latency: 7.455,
          percentile: 0.996875,
          total: 2628486
        },
        {
          latency: 7.735,
          percentile: 0.997266,
          total: 2629505
        },
        {
          latency: 8.051,
          percentile: 0.997656,
          total: 2630534
        },
        {
          latency: 8.431,
          percentile: 0.998047,
          total: 2631567
        },
        {
          latency: 8.639,
          percentile: 0.998242,
          total: 2632085
        },
        {
          latency: 8.895,
          percentile: 0.998437,
          total: 2632593
        },
        {
          latency: 9.167,
          percentile: 0.998633,
          total: 2633106
        },
        {
          latency: 9.495,
          percentile: 0.998828,
          total: 2633626
        },
        {
          latency: 9.895,
          percentile: 0.999023,
          total: 2634144
        },
        {
          latency: 10.111,
          percentile: 0.999121,
          total: 2634394
        },
        {
          latency: 10.415,
          percentile: 0.999219,
          total: 2634655
        },
        {
          latency: 10.751,
          percentile: 0.999316,
          total: 2634909
        },
        {
          latency: 11.183,
          percentile: 0.999414,
          total: 2635166
        },
        {
          latency: 11.775,
          percentile: 0.999512,
          total: 2635426
        },
        {
          latency: 12.183,
          percentile: 0.999561,
          total: 2635552
        },
        {
          latency: 12.783,
          percentile: 0.999609,
          total: 2635684
        },
        {
          latency: 13.703,
          percentile: 0.999658,
          total: 2635809
        },
        {
          latency: 15.575,
          percentile: 0.999707,
          total: 2635938
        },
        {
          latency: 46.975,
          percentile: 0.999756,
          total: 2636067
        },
        {
          latency: 83.903,
          percentile: 0.99978,
          total: 2636131
        },
        {
          latency: 123.263,
          percentile: 0.999805,
          total: 2636196
        },
        {
          latency: 153.599,
          percentile: 0.999829,
          total: 2636260
        },
        {
          latency: 184.959,
          percentile: 0.999854,
          total: 2636324
        },
        {
          latency: 225.407,
          percentile: 0.999878,
          total: 2636390
        },
        {
          latency: 754.175,
          percentile: 0.99989,
          total: 2636421
        },
        {
          latency: 1399.807,
          percentile: 0.999902,
          total: 2636453
        },
        {
          latency: 2031.615,
          percentile: 0.999915,
          total: 2636485
        },
        {
          latency: 2672.639,
          percentile: 0.999927,
          total: 2636517
        },
        {
          latency: 3340.287,
          percentile: 0.999939,
          total: 2636550
        },
        {
          latency: 3667.967,
          percentile: 0.999945,
          total: 2636566
        },
        {
          latency: 3993.599,
          percentile: 0.999951,
          total: 2636582
        },
        {
          latency: 4308.991,
          percentile: 0.999957,
          total: 2636598
        },
        {
          latency: 4620.287,
          percentile: 0.999963,
          total: 2636614
        },
        {
          latency: 4927.487,
          percentile: 0.999969,
          total: 2636630
        },
        {
          latency: 5087.231,
          percentile: 0.999973,
          total: 2636638
        },
        {
          latency: 5246.975,
          percentile: 0.999976,
          total: 2636646
        },
        {
          latency: 5410.815,
          percentile: 0.999979,
          total: 2636654
        },
        {
          latency: 5574.655,
          percentile: 0.999982,
          total: 2636662
        },
        {
          latency: 5734.399,
          percentile: 0.999985,
          total: 2636670
        },
        {
          latency: 5816.319,
          percentile: 0.999986,
          total: 2636674
        },
        {
          latency: 5898.239,
          percentile: 0.999988,
          total: 2636678
        },
        {
          latency: 5980.159,
          percentile: 0.999989,
          total: 2636682
        },
        {
          latency: 6062.079,
          percentile: 0.999991,
          total: 2636686
        },
        {
          latency: 6139.903,
          percentile: 0.999992,
          total: 2636690
        },
        {
          latency: 6180.863,
          percentile: 0.999993,
          total: 2636692
        },
        {
          latency: 6221.823,
          percentile: 0.999994,
          total: 2636694
        },
        {
          latency: 6258.687,
          percentile: 0.999995,
          total: 2636696
        },
        {
          latency: 6299.647,
          percentile: 0.999995,
          total: 2636698
        },
        {
          latency: 6340.607,
          percentile: 0.999996,
          total: 2636700
        },
        {
          latency: 6361.087,
          percentile: 0.999997,
          total: 2636701
        },
        {
          latency: 6381.567,
          percentile: 0.999997,
          total: 2636702
        },
        {
          latency: 6402.047,
          percentile: 0.999997,
          total: 2636703
        },
        {
          latency: 6422.527,
          percentile: 0.999998,
          total: 2636704
        },
        {
          latency: 6443.007,
          percentile: 0.999998,
          total: 2636705
        },
        {
          latency: 6463.487,
          percentile: 0.999998,
          total: 2636706
        },
        {
          latency: 6463.487,
          percentile: 0.999998,
          total: 2636706
        },
        {
          latency: 6483.967,
          percentile: 0.999999,
          total: 2636707
        },
        {
          latency: 6483.967,
          percentile: 0.999999,
          total: 2636707
        },
        {
          latency: 6504.447,
          percentile: 0.999999,
          total: 2636708
        },
        {
          latency: 6504.447,
          percentile: 0.999999,
          total: 2636708
        },
        {
          latency: 6504.447,
          percentile: 0.999999,
          total: 2636708
        },
        {
          latency: 6520.831,
          percentile: 0.999999,
          total: 2636709
        },
        {
          latency: 6520.831,
          percentile: 0.999999,
          total: 2636709
        },
        {
          latency: 6520.831,
          percentile: 1,
          total: 2636709
        },
        {
          latency: 6520.831,
          percentile: 1,
          total: 2636709
        },
        {
          latency: 6520.831,
          percentile: 1,
          total: 2636709
        },
        {
          latency: 6541.311,
          percentile: 1,
          total: 2636710
        },
        {
          latency: 6541.311,
          percentile: 1,
          total: 2636710
        }
      ]
    }
  },
  {
    opts: {
      path: '../wrk2/wrk',
      rate: 9200,
      duration: '300s',
      threads: 4,
      connections: 200,
      printLatency: true,
      url: 'http://107.21.1.157/queryU'
    },
    result: {
      transferPerSec: '4.93MB',
      requestsPerSec: 9196.49,
      non2xx3xx: 20,
      requestsTotal: 2758943,
      durationActual: '5.00m',
      transferTotal: '1.44GB',
      latencyAvg: 'calibration:',
      latencyStdev: 'mean',
      latencyMax: 'lat.:',
      latencyStdevPerc: null,
      rpsAvg: 'calibration:',
      rpsStdev: 'mean',
      rpsMax: 'lat.:',
      rpsStdevPerc: null,
      histogram: [
        {
          latency: 1.621,
          percentile: 0.1,
          total: 267282
        },
        {
          latency: 1.812,
          percentile: 0.2,
          total: 534556
        },
        {
          latency: 1.967,
          percentile: 0.3,
          total: 800553
        },
        {
          latency: 2.111,
          percentile: 0.4,
          total: 1069497
        },
        {
          latency: 2.251,
          percentile: 0.5,
          total: 1335519
        },
        {
          latency: 2.323,
          percentile: 0.55,
          total: 1469606
        },
        {
          latency: 2.397,
          percentile: 0.6,
          total: 1602295
        },
        {
          latency: 2.475,
          percentile: 0.65,
          total: 1734234
        },
        {
          latency: 2.561,
          percentile: 0.7,
          total: 1868110
        },
        {
          latency: 2.657,
          percentile: 0.75,
          total: 2000712
        },
        {
          latency: 2.711,
          percentile: 0.775,
          total: 2067183
        },
        {
          latency: 2.771,
          percentile: 0.8,
          total: 2133312
        },
        {
          latency: 2.839,
          percentile: 0.825,
          total: 2199700
        },
        {
          latency: 2.919,
          percentile: 0.85,
          total: 2266402
        },
        {
          latency: 3.017,
          percentile: 0.875,
          total: 2333627
        },
        {
          latency: 3.075,
          percentile: 0.8875,
          total: 2366876
        },
        {
          latency: 3.141,
          percentile: 0.9,
          total: 2399994
        },
        {
          latency: 3.217,
          percentile: 0.9125,
          total: 2432447
        },
        {
          latency: 3.311,
          percentile: 0.925,
          total: 2466191
        },
        {
          latency: 3.427,
          percentile: 0.9375,
          total: 2499227
        },
        {
          latency: 3.497,
          percentile: 0.94375,
          total: 2515802
        },
        {
          latency: 3.579,
          percentile: 0.95,
          total: 2532784
        },
        {
          latency: 3.671,
          percentile: 0.95625,
          total: 2549079
        },
        {
          latency: 3.785,
          percentile: 0.9625,
          total: 2565812
        },
        {
          latency: 3.927,
          percentile: 0.96875,
          total: 2582454
        },
        {
          latency: 4.011,
          percentile: 0.971875,
          total: 2590740
        },
        {
          latency: 4.111,
          percentile: 0.975,
          total: 2599068
        },
        {
          latency: 4.231,
          percentile: 0.978125,
          total: 2607491
        },
        {
          latency: 4.379,
          percentile: 0.98125,
          total: 2615731
        },
        {
          latency: 4.571,
          percentile: 0.984375,
          total: 2624064
        },
        {
          latency: 4.691,
          percentile: 0.985938,
          total: 2628335
        },
        {
          latency: 4.831,
          percentile: 0.9875,
          total: 2632482
        },
        {
          latency: 4.999,
          percentile: 0.989062,
          total: 2636625
        },
        {
          latency: 5.199,
          percentile: 0.990625,
          total: 2640727
        },
        {
          latency: 5.459,
          percentile: 0.992188,
          total: 2644892
        },
        {
          latency: 5.623,
          percentile: 0.992969,
          total: 2646979
        },
        {
          latency: 5.815,
          percentile: 0.99375,
          total: 2649042
        },
        {
          latency: 6.047,
          percentile: 0.994531,
          total: 2651134
        },
        {
          latency: 6.319,
          percentile: 0.995313,
          total: 2653198
        },
        {
          latency: 6.667,
          percentile: 0.996094,
          total: 2655277
        },
        {
          latency: 6.871,
          percentile: 0.996484,
          total: 2656318
        },
        {
          latency: 7.115,
          percentile: 0.996875,
          total: 2657368
        },
        {
          latency: 7.379,
          percentile: 0.997266,
          total: 2658404
        },
        {
          latency: 7.675,
          percentile: 0.997656,
          total: 2659455
        },
        {
          latency: 8.043,
          percentile: 0.998047,
          total: 2660487
        },
        {
          latency: 8.247,
          percentile: 0.998242,
          total: 2661024
        },
        {
          latency: 8.487,
          percentile: 0.998437,
          total: 2661528
        },
        {
          latency: 8.743,
          percentile: 0.998633,
          total: 2662048
        },
        {
          latency: 9.071,
          percentile: 0.998828,
          total: 2662578
        },
        {
          latency: 9.455,
          percentile: 0.999023,
          total: 2663086
        },
        {
          latency: 9.703,
          percentile: 0.999121,
          total: 2663353
        },
        {
          latency: 9.983,
          percentile: 0.999219,
          total: 2663610
        },
        {
          latency: 10.311,
          percentile: 0.999316,
          total: 2663869
        },
        {
          latency: 10.711,
          percentile: 0.999414,
          total: 2664128
        },
        {
          latency: 11.207,
          percentile: 0.999512,
          total: 2664388
        },
        {
          latency: 11.519,
          percentile: 0.999561,
          total: 2664519
        },
        {
          latency: 11.959,
          percentile: 0.999609,
          total: 2664650
        },
        {
          latency: 12.503,
          percentile: 0.999658,
          total: 2664778
        },
        {
          latency: 13.319,
          percentile: 0.999707,
          total: 2664909
        },
        {
          latency: 14.831,
          percentile: 0.999756,
          total: 2665039
        },
        {
          latency: 17.903,
          percentile: 0.99978,
          total: 2665104
        },
        {
          latency: 30.991,
          percentile: 0.999805,
          total: 2665169
        },
        {
          latency: 56.863,
          percentile: 0.999829,
          total: 2665234
        },
        {
          latency: 83.903,
          percentile: 0.999854,
          total: 2665299
        },
        {
          latency: 105.855,
          percentile: 0.999878,
          total: 2665364
        },
        {
          latency: 119.615,
          percentile: 0.99989,
          total: 2665397
        },
        {
          latency: 126.719,
          percentile: 0.999902,
          total: 2665429
        },
        {
          latency: 144.511,
          percentile: 0.999915,
          total: 2665462
        },
        {
          latency: 151.423,
          percentile: 0.999927,
          total: 2665494
        },
        {
          latency: 165.503,
          percentile: 0.999939,
          total: 2665528
        },
        {
          latency: 167.295,
          percentile: 0.999945,
          total: 2665543
        },
        {
          latency: 183.039,
          percentile: 0.999951,
          total: 2665560
        },
        {
          latency: 184.831,
          percentile: 0.999957,
          total: 2665578
        },
        {
          latency: 186.367,
          percentile: 0.999963,
          total: 2665592
        },
        {
          latency: 201.599,
          percentile: 0.999969,
          total: 2665608
        },
        {
          latency: 203.391,
          percentile: 0.999973,
          total: 2665616
        },
        {
          latency: 204.031,
          percentile: 0.999976,
          total: 2665624
        },
        {
          latency: 204.543,
          percentile: 0.999979,
          total: 2665633
        },
        {
          latency: 205.439,
          percentile: 0.999982,
          total: 2665641
        },
        {
          latency: 206.335,
          percentile: 0.999985,
          total: 2665649
        },
        {
          latency: 211.583,
          percentile: 0.999986,
          total: 2665653
        },
        {
          latency: 219.647,
          percentile: 0.999988,
          total: 2665657
        },
        {
          latency: 221.823,
          percentile: 0.999989,
          total: 2665662
        },
        {
          latency: 222.719,
          percentile: 0.999991,
          total: 2665665
        },
        {
          latency: 223.487,
          percentile: 0.999992,
          total: 2665670
        },
        {
          latency: 223.743,
          percentile: 0.999993,
          total: 2665673
        },
        {
          latency: 223.743,
          percentile: 0.999994,
          total: 2665673
        },
        {
          latency: 224.255,
          percentile: 0.999995,
          total: 2665675
        },
        {
          latency: 224.383,
          percentile: 0.999995,
          total: 2665677
        },
        {
          latency: 224.767,
          percentile: 0.999996,
          total: 2665679
        },
        {
          latency: 224.895,
          percentile: 0.999997,
          total: 2665680
        },
        {
          latency: 225.151,
          percentile: 0.999997,
          total: 2665681
        },
        {
          latency: 225.407,
          percentile: 0.999997,
          total: 2665682
        },
        {
          latency: 225.535,
          percentile: 0.999998,
          total: 2665683
        },
        {
          latency: 225.791,
          percentile: 0.999998,
          total: 2665684
        },
        {
          latency: 226.431,
          percentile: 0.999998,
          total: 2665686
        },
        {
          latency: 226.431,
          percentile: 0.999998,
          total: 2665686
        },
        {
          latency: 226.431,
          percentile: 0.999999,
          total: 2665686
        },
        {
          latency: 226.431,
          percentile: 0.999999,
          total: 2665686
        },
        {
          latency: 227.327,
          percentile: 0.999999,
          total: 2665687
        },
        {
          latency: 227.327,
          percentile: 0.999999,
          total: 2665687
        },
        {
          latency: 227.327,
          percentile: 0.999999,
          total: 2665687
        },
        {
          latency: 227.839,
          percentile: 0.999999,
          total: 2665688
        },
        {
          latency: 227.839,
          percentile: 0.999999,
          total: 2665688
        },
        {
          latency: 227.839,
          percentile: 1,
          total: 2665688
        },
        {
          latency: 227.839,
          percentile: 1,
          total: 2665688
        },
        {
          latency: 227.839,
          percentile: 1,
          total: 2665688
        },
        {
          latency: 231.551,
          percentile: 1,
          total: 2665689
        },
        {
          latency: 231.551,
          percentile: 1,
          total: 2665689
        }
      ]
    }
  },
  {
    opts: {
      path: '../wrk2/wrk',
      rate: 9300,
      duration: '300s',
      threads: 4,
      connections: 200,
      printLatency: true,
      url: 'http://107.21.1.157/queryU'
    },
    result: {
      transferPerSec: '4.98MB',
      requestsPerSec: 9296.43,
      non2xx3xx: 35,
      requestsTotal: 2788924,
      durationActual: '5.00m',
      transferTotal: '1.46GB',
      latencyAvg: 'calibration:',
      latencyStdev: 'mean',
      latencyMax: 'lat.:',
      latencyStdevPerc: null,
      rpsAvg: 'calibration:',
      rpsStdev: 'mean',
      rpsMax: 'lat.:',
      rpsStdevPerc: null,
      histogram: [
        {
          latency: 1.646,
          percentile: 0.1,
          total: 270329
        },
        {
          latency: 1.854,
          percentile: 0.2,
          total: 539593
        },
        {
          latency: 2.024,
          percentile: 0.3,
          total: 809977
        },
        {
          latency: 2.181,
          percentile: 0.4,
          total: 1081329
        },
        {
          latency: 2.337,
          percentile: 0.5,
          total: 1350595
        },
        {
          latency: 2.419,
          percentile: 0.55,
          total: 1483906
        },
        {
          latency: 2.507,
          percentile: 0.6,
          total: 1619589
        },
        {
          latency: 2.601,
          percentile: 0.65,
          total: 1752194
        },
        {
          latency: 2.709,
          percentile: 0.7,
          total: 1888166
        },
        {
          latency: 2.835,
          percentile: 0.75,
          total: 2022747
        },
        {
          latency: 2.907,
          percentile: 0.775,
          total: 2089640
        },
        {
          latency: 2.987,
          percentile: 0.8,
          total: 2155917
        },
        {
          latency: 3.081,
          percentile: 0.825,
          total: 2223974
        },
        {
          latency: 3.189,
          percentile: 0.85,
          total: 2290729
        },
        {
          latency: 3.321,
          percentile: 0.875,
          total: 2358718
        },
        {
          latency: 3.397,
          percentile: 0.8875,
          total: 2392025
        },
        {
          latency: 3.485,
          percentile: 0.9,
          total: 2425426
        },
        {
          latency: 3.589,
          percentile: 0.9125,
          total: 2459446
        },
        {
          latency: 3.711,
          percentile: 0.925,
          total: 2492785
        },
        {
          latency: 3.861,
          percentile: 0.9375,
          total: 2526307
        },
        {
          latency: 3.951,
          percentile: 0.94375,
          total: 2543154
        },
        {
          latency: 4.053,
          percentile: 0.95,
          total: 2560024
        },
        {
          latency: 4.171,
          percentile: 0.95625,
          total: 2576812
        },
        {
          latency: 4.311,
          percentile: 0.9625,
          total: 2593634
        },
        {
          latency: 4.483,
          percentile: 0.96875,
          total: 2610523
        },
        {
          latency: 4.587,
          percentile: 0.971875,
          total: 2618890
        },
        {
          latency: 4.707,
          percentile: 0.975,
          total: 2627293
        },
        {
          latency: 4.851,
          percentile: 0.978125,
          total: 2635886
        },
        {
          latency: 5.023,
          percentile: 0.98125,
          total: 2644196
        },
        {
          latency: 5.235,
          percentile: 0.984375,
          total: 2652570
        },
        {
          latency: 5.367,
          percentile: 0.985938,
          total: 2656841
        },
        {
          latency: 5.519,
          percentile: 0.9875,
          total: 2661037
        },
        {
          latency: 5.699,
          percentile: 0.989062,
          total: 2665221
        },
        {
          latency: 5.919,
          percentile: 0.990625,
          total: 2669453
        },
        {
          latency: 6.191,
          percentile: 0.992188,
          total: 2673644
        },
        {
          latency: 6.355,
          percentile: 0.992969,
          total: 2675714
        },
        {
          latency: 6.551,
          percentile: 0.99375,
          total: 2677826
        },
        {
          latency: 6.783,
          percentile: 0.994531,
          total: 2679960
        },
        {
          latency: 7.055,
          percentile: 0.995313,
          total: 2682037
        },
        {
          latency: 7.387,
          percentile: 0.996094,
          total: 2684148
        },
        {
          latency: 7.587,
          percentile: 0.996484,
          total: 2685198
        },
        {
          latency: 7.791,
          percentile: 0.996875,
          total: 2686240
        },
        {
          latency: 8.019,
          percentile: 0.997266,
          total: 2687303
        },
        {
          latency: 8.287,
          percentile: 0.997656,
          total: 2688362
        },
        {
          latency: 8.615,
          percentile: 0.998047,
          total: 2689404
        },
        {
          latency: 8.807,
          percentile: 0.998242,
          total: 2689931
        },
        {
          latency: 9.007,
          percentile: 0.998437,
          total: 2690449
        },
        {
          latency: 9.279,
          percentile: 0.998633,
          total: 2690988
        },
        {
          latency: 9.591,
          percentile: 0.998828,
          total: 2691507
        },
        {
          latency: 9.967,
          percentile: 0.999023,
          total: 2692027
        },
        {
          latency: 10.215,
          percentile: 0.999121,
          total: 2692292
        },
        {
          latency: 10.495,
          percentile: 0.999219,
          total: 2692556
        },
        {
          latency: 10.807,
          percentile: 0.999316,
          total: 2692818
        },
        {
          latency: 11.183,
          percentile: 0.999414,
          total: 2693081
        },
        {
          latency: 11.679,
          percentile: 0.999512,
          total: 2693345
        },
        {
          latency: 11.983,
          percentile: 0.999561,
          total: 2693477
        },
        {
          latency: 12.327,
          percentile: 0.999609,
          total: 2693607
        },
        {
          latency: 12.815,
          percentile: 0.999658,
          total: 2693738
        },
        {
          latency: 13.535,
          percentile: 0.999707,
          total: 2693869
        },
        {
          latency: 14.631,
          percentile: 0.999756,
          total: 2694001
        },
        {
          latency: 15.463,
          percentile: 0.99978,
          total: 2694066
        },
        {
          latency: 17.791,
          percentile: 0.999805,
          total: 2694132
        },
        {
          latency: 34.751,
          percentile: 0.999829,
          total: 2694198
        },
        {
          latency: 63.679,
          percentile: 0.999854,
          total: 2694264
        },
        {
          latency: 88.127,
          percentile: 0.999878,
          total: 2694330
        },
        {
          latency: 104.511,
          percentile: 0.99989,
          total: 2694362
        },
        {
          latency: 120.383,
          percentile: 0.999902,
          total: 2694395
        },
        {
          latency: 128.447,
          percentile: 0.999915,
          total: 2694428
        },
        {
          latency: 145.791,
          percentile: 0.999927,
          total: 2694461
        },
        {
          latency: 161.663,
          percentile: 0.999939,
          total: 2694494
        },
        {
          latency: 165.119,
          percentile: 0.999945,
          total: 2694510
        },
        {
          latency: 168.703,
          percentile: 0.999951,
          total: 2694527
        },
        {
          latency: 183.423,
          percentile: 0.999957,
          total: 2694544
        },
        {
          latency: 185.343,
          percentile: 0.999963,
          total: 2694561
        },
        {
          latency: 188.927,
          percentile: 0.999969,
          total: 2694576
        },
        {
          latency: 199.551,
          percentile: 0.999973,
          total: 2694584
        },
        {
          latency: 203.007,
          percentile: 0.999976,
          total: 2694593
        },
        {
          latency: 203.903,
          percentile: 0.999979,
          total: 2694601
        },
        {
          latency: 205.311,
          percentile: 0.999982,
          total: 2694610
        },
        {
          latency: 206.463,
          percentile: 0.999985,
          total: 2694618
        },
        {
          latency: 206.719,
          percentile: 0.999986,
          total: 2694621
        },
        {
          latency: 218.751,
          percentile: 0.999988,
          total: 2694626
        },
        {
          latency: 219.391,
          percentile: 0.999989,
          total: 2694630
        },
        {
          latency: 222.207,
          percentile: 0.999991,
          total: 2694634
        },
        {
          latency: 222.591,
          percentile: 0.999992,
          total: 2694638
        },
        {
          latency: 223.359,
          percentile: 0.999993,
          total: 2694640
        },
        {
          latency: 223.487,
          percentile: 0.999994,
          total: 2694642
        },
        {
          latency: 223.999,
          percentile: 0.999995,
          total: 2694647
        },
        {
          latency: 223.999,
          percentile: 0.999995,
          total: 2694647
        },
        {
          latency: 224.383,
          percentile: 0.999996,
          total: 2694648
        },
        {
          latency: 224.511,
          percentile: 0.999997,
          total: 2694649
        },
        {
          latency: 224.767,
          percentile: 0.999997,
          total: 2694650
        },
        {
          latency: 225.023,
          percentile: 0.999997,
          total: 2694651
        },
        {
          latency: 225.279,
          percentile: 0.999998,
          total: 2694652
        },
        {
          latency: 225.407,
          percentile: 0.999998,
          total: 2694653
        },
        {
          latency: 225.535,
          percentile: 0.999998,
          total: 2694655
        },
        {
          latency: 225.535,
          percentile: 0.999998,
          total: 2694655
        },
        {
          latency: 225.535,
          percentile: 0.999999,
          total: 2694655
        },
        {
          latency: 225.535,
          percentile: 0.999999,
          total: 2694655
        },
        {
          latency: 225.919,
          percentile: 0.999999,
          total: 2694656
        },
        {
          latency: 225.919,
          percentile: 0.999999,
          total: 2694656
        },
        {
          latency: 225.919,
          percentile: 0.999999,
          total: 2694656
        },
        {
          latency: 226.047,
          percentile: 0.999999,
          total: 2694658
        },
        {
          latency: 226.047,
          percentile: 1,
          total: 2694658
        }
      ]
    }
  },
  {
    opts: {
      path: '../wrk2/wrk',
      rate: 9400,
      duration: '300s',
      threads: 4,
      connections: 200,
      printLatency: true,
      url: 'http://107.21.1.157/queryU'
    },
    result: {
      transferPerSec: '5.04MB',
      requestsPerSec: 9396.4,
      non2xx3xx: 29,
      requestsTotal: 2818917,
      durationActual: '5.00m',
      transferTotal: '1.48GB',
      latencyAvg: 'calibration:',
      latencyStdev: 'mean',
      latencyMax: 'lat.:',
      latencyStdevPerc: null,
      rpsAvg: 'calibration:',
      rpsStdev: 'mean',
      rpsMax: 'lat.:',
      rpsStdevPerc: null,
      histogram: [
        {
          latency: 1.665,
          percentile: 0.1,
          total: 272608
        },
        {
          latency: 1.882,
          percentile: 0.2,
          total: 544898
        },
        {
          latency: 2.059,
          percentile: 0.3,
          total: 817851
        },
        {
          latency: 2.221,
          percentile: 0.4,
          total: 1091371
        },
        {
          latency: 2.379,
          percentile: 0.5,
          total: 1362049
        },
        {
          latency: 2.463,
          percentile: 0.55,
          total: 1500669
        },
        {
          latency: 2.551,
          percentile: 0.6,
          total: 1635907
        },
        {
          latency: 2.647,
          percentile: 0.65,
          total: 1771153
        },
        {
          latency: 2.757,
          percentile: 0.7,
          total: 1906575
        },
        {
          latency: 2.893,
          percentile: 0.75,
          total: 2044480
        },
        {
          latency: 2.973,
          percentile: 0.775,
          total: 2111551
        },
        {
          latency: 3.067,
          percentile: 0.8,
          total: 2180073
        },
        {
          latency: 3.175,
          percentile: 0.825,
          total: 2247139
        },
        {
          latency: 3.305,
          percentile: 0.85,
          total: 2315293
        },
        {
          latency: 3.463,
          percentile: 0.875,
          total: 2383569
        },
        {
          latency: 3.557,
          percentile: 0.8875,
          total: 2417856
        },
        {
          latency: 3.661,
          percentile: 0.9,
          total: 2451341
        },
        {
          latency: 3.785,
          percentile: 0.9125,
          total: 2485693
        },
        {
          latency: 3.929,
          percentile: 0.925,
          total: 2519388
        },
        {
          latency: 4.107,
          percentile: 0.9375,
          total: 2553448
        },
        {
          latency: 4.215,
          percentile: 0.94375,
          total: 2570723
        },
        {
          latency: 4.335,
          percentile: 0.95,
          total: 2587642
        },
        {
          latency: 4.475,
          percentile: 0.95625,
          total: 2604758
        },
        {
          latency: 4.643,
          percentile: 0.9625,
          total: 2621600
        },
        {
          latency: 4.859,
          percentile: 0.96875,
          total: 2638763
        },
        {
          latency: 4.987,
          percentile: 0.971875,
          total: 2647192
        },
        {
          latency: 5.143,
          percentile: 0.975,
          total: 2655708
        },
        {
          latency: 5.319,
          percentile: 0.978125,
          total: 2664117
        },
        {
          latency: 5.535,
          percentile: 0.98125,
          total: 2672626
        },
        {
          latency: 5.803,
          percentile: 0.984375,
          total: 2681129
        },
        {
          latency: 5.963,
          percentile: 0.985938,
          total: 2685398
        },
        {
          latency: 6.143,
          percentile: 0.9875,
          total: 2689617
        },
        {
          latency: 6.347,
          percentile: 0.989062,
          total: 2693909
        },
        {
          latency: 6.587,
          percentile: 0.990625,
          total: 2698117
        },
        {
          latency: 6.891,
          percentile: 0.992188,
          total: 2702429
        },
        {
          latency: 7.063,
          percentile: 0.992969,
          total: 2704516
        },
        {
          latency: 7.267,
          percentile: 0.99375,
          total: 2706637
        },
        {
          latency: 7.507,
          percentile: 0.994531,
          total: 2708780
        },
        {
          latency: 7.779,
          percentile: 0.995313,
          total: 2710899
        },
        {
          latency: 8.111,
          percentile: 0.996094,
          total: 2713009
        },
        {
          latency: 8.303,
          percentile: 0.996484,
          total: 2714099
        },
        {
          latency: 8.519,
          percentile: 0.996875,
          total: 2715135
        },
        {
          latency: 8.767,
          percentile: 0.997266,
          total: 2716200
        },
        {
          latency: 9.063,
          percentile: 0.997656,
          total: 2717280
        },
        {
          latency: 9.415,
          percentile: 0.998047,
          total: 2718348
        },
        {
          latency: 9.615,
          percentile: 0.998242,
          total: 2718866
        },
        {
          latency: 9.855,
          percentile: 0.998437,
          total: 2719399
        },
        {
          latency: 10.103,
          percentile: 0.998633,
          total: 2719932
        },
        {
          latency: 10.399,
          percentile: 0.998828,
          total: 2720466
        },
        {
          latency: 10.751,
          percentile: 0.999023,
          total: 2720990
        },
        {
          latency: 10.975,
          percentile: 0.999121,
          total: 2721267
        },
        {
          latency: 11.255,
          percentile: 0.999219,
          total: 2721526
        },
        {
          latency: 11.583,
          percentile: 0.999316,
          total: 2721792
        },
        {
          latency: 11.975,
          percentile: 0.999414,
          total: 2722053
        },
        {
          latency: 12.631,
          percentile: 0.999512,
          total: 2722318
        },
        {
          latency: 13.031,
          percentile: 0.999561,
          total: 2722450
        },
        {
          latency: 13.623,
          percentile: 0.999609,
          total: 2722583
        },
        {
          latency: 14.503,
          percentile: 0.999658,
          total: 2722717
        },
        {
          latency: 16.023,
          percentile: 0.999707,
          total: 2722849
        },
        {
          latency: 29.119,
          percentile: 0.999756,
          total: 2722982
        },
        {
          latency: 48.927,
          percentile: 0.99978,
          total: 2723048
        },
        {
          latency: 68.287,
          percentile: 0.999805,
          total: 2723115
        },
        {
          latency: 88.319,
          percentile: 0.999829,
          total: 2723181
        },
        {
          latency: 108.095,
          percentile: 0.999854,
          total: 2723249
        },
        {
          latency: 127.167,
          percentile: 0.999878,
          total: 2723314
        },
        {
          latency: 142.719,
          percentile: 0.99989,
          total: 2723348
        },
        {
          latency: 147.199,
          percentile: 0.999902,
          total: 2723382
        },
        {
          latency: 162.943,
          percentile: 0.999915,
          total: 2723414
        },
        {
          latency: 166.655,
          percentile: 0.999927,
          total: 2723447
        },
        {
          latency: 183.167,
          percentile: 0.999939,
          total: 2723480
        },
        {
          latency: 185.471,
          percentile: 0.999945,
          total: 2723500
        },
        {
          latency: 186.623,
          percentile: 0.999951,
          total: 2723515
        },
        {
          latency: 200.703,
          percentile: 0.999957,
          total: 2723530
        },
        {
          latency: 203.519,
          percentile: 0.999963,
          total: 2723547
        },
        {
          latency: 204.543,
          percentile: 0.999969,
          total: 2723563
        },
        {
          latency: 205.823,
          percentile: 0.999973,
          total: 2723573
        },
        {
          latency: 207.103,
          percentile: 0.999976,
          total: 2723580
        },
        {
          latency: 218.879,
          percentile: 0.999979,
          total: 2723588
        },
        {
          latency: 220.671,
          percentile: 0.999982,
          total: 2723598
        },
        {
          latency: 221.311,
          percentile: 0.999985,
          total: 2723605
        },
        {
          latency: 222.591,
          percentile: 0.999986,
          total: 2723609
        },
        {
          latency: 223.615,
          percentile: 0.999988,
          total: 2723613
        },
        {
          latency: 224.511,
          percentile: 0.999989,
          total: 2723618
        },
        {
          latency: 227.199,
          percentile: 0.999991,
          total: 2723622
        },
        {
          latency: 262.399,
          percentile: 0.999992,
          total: 2723626
        },
        {
          latency: 300.287,
          percentile: 0.999993,
          total: 2723628
        },
        {
          latency: 337.919,
          percentile: 0.999994,
          total: 2723630
        },
        {
          latency: 376.831,
          percentile: 0.999995,
          total: 2723632
        },
        {
          latency: 416.255,
          percentile: 0.999995,
          total: 2723634
        },
        {
          latency: 455.423,
          percentile: 0.999996,
          total: 2723636
        },
        {
          latency: 475.135,
          percentile: 0.999997,
          total: 2723637
        },
        {
          latency: 494.079,
          percentile: 0.999997,
          total: 2723638
        },
        {
          latency: 514.047,
          percentile: 0.999997,
          total: 2723639
        },
        {
          latency: 533.503,
          percentile: 0.999998,
          total: 2723640
        },
        {
          latency: 552.447,
          percentile: 0.999998,
          total: 2723641
        },
        {
          latency: 569.855,
          percentile: 0.999998,
          total: 2723642
        },
        {
          latency: 569.855,
          percentile: 0.999998,
          total: 2723642
        },
        {
          latency: 588.799,
          percentile: 0.999999,
          total: 2723643
        },
        {
          latency: 588.799,
          percentile: 0.999999,
          total: 2723643
        },
        {
          latency: 606.719,
          percentile: 0.999999,
          total: 2723644
        },
        {
          latency: 606.719,
          percentile: 0.999999,
          total: 2723644
        },
        {
          latency: 606.719,
          percentile: 0.999999,
          total: 2723644
        },
        {
          latency: 626.175,
          percentile: 0.999999,
          total: 2723645
        },
        {
          latency: 626.175,
          percentile: 0.999999,
          total: 2723645
        },
        {
          latency: 626.175,
          percentile: 1,
          total: 2723645
        },
        {
          latency: 626.175,
          percentile: 1,
          total: 2723645
        },
        {
          latency: 626.175,
          percentile: 1,
          total: 2723645
        },
        {
          latency: 646.143,
          percentile: 1,
          total: 2723646
        },
        {
          latency: 646.143,
          percentile: 1,
          total: 2723646
        }
      ]
    }
  },
  {
    opts: {
      path: '../wrk2/wrk',
      rate: 9500,
      duration: '300s',
      threads: 4,
      connections: 200,
      printLatency: true,
      url: 'http://107.21.1.157/queryU'
    },
    result: {
      transferPerSec: '5.09MB',
      requestsPerSec: 9496.29,
      non2xx3xx: 286,
      requestsTotal: 2848886,
      durationActual: '5.00m',
      transferTotal: '1.49GB',
      latencyAvg: 'calibration:',
      latencyStdev: 'mean',
      latencyMax: 'lat.:',
      latencyStdevPerc: null,
      rpsAvg: 'calibration:',
      rpsStdev: 'mean',
      rpsMax: 'lat.:',
      rpsStdevPerc: null,
      histogram: [
        {
          latency: 1.733,
          percentile: 0.1,
          total: 275691
        },
        {
          latency: 1.986,
          percentile: 0.2,
          total: 550912
        },
        {
          latency: 2.199,
          percentile: 0.3,
          total: 826097
        },
        {
          latency: 2.401,
          percentile: 0.4,
          total: 1101699
        },
        {
          latency: 2.609,
          percentile: 0.5,
          total: 1377302
        },
        {
          latency: 2.721,
          percentile: 0.55,
          total: 1515437
        },
        {
          latency: 2.845,
          percentile: 0.6,
          total: 1652939
        },
        {
          latency: 2.987,
          percentile: 0.65,
          total: 1790073
        },
        {
          latency: 3.159,
          percentile: 0.7,
          total: 1927467
        },
        {
          latency: 3.377,
          percentile: 0.75,
          total: 2064840
        },
        {
          latency: 3.507,
          percentile: 0.775,
          total: 2133598
        },
        {
          latency: 3.655,
          percentile: 0.8,
          total: 2202837
        },
        {
          latency: 3.819,
          percentile: 0.825,
          total: 2271169
        },
        {
          latency: 4.005,
          percentile: 0.85,
          total: 2339773
        },
        {
          latency: 4.227,
          percentile: 0.875,
          total: 2409625
        },
        {
          latency: 4.351,
          percentile: 0.8875,
          total: 2443335
        },
        {
          latency: 4.491,
          percentile: 0.9,
          total: 2477522
        },
        {
          latency: 4.651,
          percentile: 0.9125,
          total: 2512081
        },
        {
          latency: 4.839,
          percentile: 0.925,
          total: 2546814
        },
        {
          latency: 5.059,
          percentile: 0.9375,
          total: 2580844
        },
        {
          latency: 5.191,
          percentile: 0.94375,
          total: 2598112
        },
        {
          latency: 5.339,
          percentile: 0.95,
          total: 2615337
        },
        {
          latency: 5.507,
          percentile: 0.95625,
          total: 2632458
        },
        {
          latency: 5.707,
          percentile: 0.9625,
          total: 2649539
        },
        {
          latency: 5.951,
          percentile: 0.96875,
          total: 2666650
        },
        {
          latency: 6.099,
          percentile: 0.971875,
          total: 2675343
        },
        {
          latency: 6.267,
          percentile: 0.975,
          total: 2683965
        },
        {
          latency: 6.459,
          percentile: 0.978125,
          total: 2692503
        },
        {
          latency: 6.687,
          percentile: 0.98125,
          total: 2701096
        },
        {
          latency: 6.955,
          percentile: 0.984375,
          total: 2709676
        },
        {
          latency: 7.107,
          percentile: 0.985938,
          total: 2713899
        },
        {
          latency: 7.291,
          percentile: 0.9875,
          total: 2718304
        },
        {
          latency: 7.495,
          percentile: 0.989062,
          total: 2722516
        },
        {
          latency: 7.751,
          percentile: 0.990625,
          total: 2726853
        },
        {
          latency: 8.063,
          percentile: 0.992188,
          total: 2731119
        },
        {
          latency: 8.263,
          percentile: 0.992969,
          total: 2733322
        },
        {
          latency: 8.487,
          percentile: 0.99375,
          total: 2735430
        },
        {
          latency: 8.735,
          percentile: 0.994531,
          total: 2737559
        },
        {
          latency: 9.039,
          percentile: 0.995313,
          total: 2739715
        },
        {
          latency: 9.415,
          percentile: 0.996094,
          total: 2741853
        },
        {
          latency: 9.655,
          percentile: 0.996484,
          total: 2742954
        },
        {
          latency: 9.911,
          percentile: 0.996875,
          total: 2744026
        },
        {
          latency: 10.215,
          percentile: 0.997266,
          total: 2745095
        },
        {
          latency: 10.591,
          percentile: 0.997656,
          total: 2746156
        },
        {
          latency: 11.055,
          percentile: 0.998047,
          total: 2747238
        },
        {
          latency: 11.343,
          percentile: 0.998242,
          total: 2747767
        },
        {
          latency: 11.687,
          percentile: 0.998437,
          total: 2748313
        },
        {
          latency: 12.055,
          percentile: 0.998633,
          total: 2748851
        },
        {
          latency: 12.495,
          percentile: 0.998828,
          total: 2749391
        },
        {
          latency: 13.079,
          percentile: 0.999023,
          total: 2749918
        },
        {
          latency: 13.399,
          percentile: 0.999121,
          total: 2750187
        },
        {
          latency: 13.831,
          percentile: 0.999219,
          total: 2750455
        },
        {
          latency: 14.415,
          percentile: 0.999316,
          total: 2750728
        },
        {
          latency: 15.207,
          percentile: 0.999414,
          total: 2750995
        },
        {
          latency: 16.399,
          percentile: 0.999512,
          total: 2751262
        },
        {
          latency: 17.215,
          percentile: 0.999561,
          total: 2751396
        },
        {
          latency: 18.303,
          percentile: 0.999609,
          total: 2751532
        },
        {
          latency: 20.623,
          percentile: 0.999658,
          total: 2751665
        },
        {
          latency: 27.231,
          percentile: 0.999707,
          total: 2751799
        },
        {
          latency: 51.935,
          percentile: 0.999756,
          total: 2751933
        },
        {
          latency: 70.271,
          percentile: 0.99978,
          total: 2752001
        },
        {
          latency: 87.807,
          percentile: 0.999805,
          total: 2752068
        },
        {
          latency: 105.791,
          percentile: 0.999829,
          total: 2752137
        },
        {
          latency: 123.711,
          percentile: 0.999854,
          total: 2752202
        },
        {
          latency: 142.719,
          percentile: 0.999878,
          total: 2752269
        },
        {
          latency: 145.791,
          percentile: 0.99989,
          total: 2752303
        },
        {
          latency: 161.279,
          percentile: 0.999902,
          total: 2752338
        },
        {
          latency: 164.095,
          percentile: 0.999915,
          total: 2752370
        },
        {
          latency: 180.095,
          percentile: 0.999927,
          total: 2752405
        },
        {
          latency: 183.039,
          percentile: 0.999939,
          total: 2752437
        },
        {
          latency: 185.215,
          percentile: 0.999945,
          total: 2752457
        },
        {
          latency: 187.775,
          percentile: 0.999951,
          total: 2752471
        },
        {
          latency: 200.319,
          percentile: 0.999957,
          total: 2752488
        },
        {
          latency: 201.983,
          percentile: 0.999963,
          total: 2752507
        },
        {
          latency: 203.263,
          percentile: 0.999969,
          total: 2752521
        },
        {
          latency: 204.031,
          percentile: 0.999973,
          total: 2752530
        },
        {
          latency: 204.927,
          percentile: 0.999976,
          total: 2752538
        },
        {
          latency: 206.463,
          percentile: 0.999979,
          total: 2752547
        },
        {
          latency: 219.391,
          percentile: 0.999982,
          total: 2752558
        },
        {
          latency: 220.031,
          percentile: 0.999985,
          total: 2752569
        },
        {
          latency: 220.031,
          percentile: 0.999986,
          total: 2752569
        },
        {
          latency: 220.415,
          percentile: 0.999988,
          total: 2752572
        },
        {
          latency: 221.055,
          percentile: 0.999989,
          total: 2752577
        },
        {
          latency: 221.311,
          percentile: 0.999991,
          total: 2752584
        },
        {
          latency: 221.311,
          percentile: 0.999992,
          total: 2752584
        },
        {
          latency: 221.567,
          percentile: 0.999993,
          total: 2752587
        },
        {
          latency: 221.695,
          percentile: 0.999994,
          total: 2752589
        },
        {
          latency: 221.823,
          percentile: 0.999995,
          total: 2752594
        },
        {
          latency: 221.823,
          percentile: 0.999995,
          total: 2752594
        },
        {
          latency: 222.079,
          percentile: 0.999996,
          total: 2752596
        },
        {
          latency: 222.079,
          percentile: 0.999997,
          total: 2752596
        },
        {
          latency: 222.207,
          percentile: 0.999997,
          total: 2752597
        },
        {
          latency: 222.591,
          percentile: 0.999997,
          total: 2752598
        },
        {
          latency: 222.847,
          percentile: 0.999998,
          total: 2752600
        },
        {
          latency: 222.847,
          percentile: 0.999998,
          total: 2752600
        },
        {
          latency: 223.231,
          percentile: 0.999998,
          total: 2752601
        },
        {
          latency: 223.231,
          percentile: 0.999998,
          total: 2752601
        },
        {
          latency: 223.615,
          percentile: 0.999999,
          total: 2752602
        },
        {
          latency: 223.615,
          percentile: 0.999999,
          total: 2752602
        },
        {
          latency: 223.871,
          percentile: 0.999999,
          total: 2752603
        },
        {
          latency: 223.871,
          percentile: 0.999999,
          total: 2752603
        },
        {
          latency: 223.871,
          percentile: 0.999999,
          total: 2752603
        },
        {
          latency: 223.999,
          percentile: 0.999999,
          total: 2752604
        },
        {
          latency: 223.999,
          percentile: 0.999999,
          total: 2752604
        },
        {
          latency: 223.999,
          percentile: 1,
          total: 2752604
        },
        {
          latency: 223.999,
          percentile: 1,
          total: 2752604
        },
        {
          latency: 223.999,
          percentile: 1,
          total: 2752604
        },
        {
          latency: 225.407,
          percentile: 1,
          total: 2752605
        },
        {
          latency: 225.407,
          percentile: 1,
          total: 2752605
        }
      ]
    }
  },
  {
    opts: {
      path: '../wrk2/wrk',
      rate: 9600,
      duration: '300s',
      threads: 4,
      connections: 200,
      printLatency: true,
      url: 'http://107.21.1.157/queryU'
    },
    result: {
      transferPerSec: '5.14MB',
      requestsPerSec: 9596.29,
      non2xx3xx: 877,
      requestsTotal: 2878884,
      durationActual: '5.00m',
      transferTotal: '1.51GB',
      latencyAvg: 'calibration:',
      latencyStdev: 'mean',
      latencyMax: 'lat.:',
      latencyStdevPerc: null,
      rpsAvg: 'calibration:',
      rpsStdev: 'mean',
      rpsMax: 'lat.:',
      rpsStdevPerc: null,
      histogram: [
        {
          latency: 1.777,
          percentile: 0.1,
          total: 278862
        },
        {
          latency: 2.044,
          percentile: 0.2,
          total: 557234
        },
        {
          latency: 2.279,
          percentile: 0.3,
          total: 834484
        },
        {
          latency: 2.517,
          percentile: 0.4,
          total: 1114270
        },
        {
          latency: 2.775,
          percentile: 0.5,
          total: 1391927
        },
        {
          latency: 2.919,
          percentile: 0.55,
          total: 1531198
        },
        {
          latency: 3.077,
          percentile: 0.6,
          total: 1670447
        },
        {
          latency: 3.251,
          percentile: 0.65,
          total: 1808954
        },
        {
          latency: 3.453,
          percentile: 0.7,
          total: 1948139
        },
        {
          latency: 3.697,
          percentile: 0.75,
          total: 2087134
        },
        {
          latency: 3.839,
          percentile: 0.775,
          total: 2156049
        },
        {
          latency: 4.003,
          percentile: 0.8,
          total: 2225642
        },
        {
          latency: 4.195,
          percentile: 0.825,
          total: 2295630
        },
        {
          latency: 4.423,
          percentile: 0.85,
          total: 2364507
        },
        {
          latency: 4.711,
          percentile: 0.875,
          total: 2434671
        },
        {
          latency: 4.879,
          percentile: 0.8875,
          total: 2468940
        },
        {
          latency: 5.075,
          percentile: 0.9,
          total: 2503755
        },
        {
          latency: 5.299,
          percentile: 0.9125,
          total: 2538265
        },
        {
          latency: 5.563,
          percentile: 0.925,
          total: 2573088
        },
        {
          latency: 5.875,
          percentile: 0.9375,
          total: 2607877
        },
        {
          latency: 6.051,
          percentile: 0.94375,
          total: 2625284
        },
        {
          latency: 6.247,
          percentile: 0.95,
          total: 2642690
        },
        {
          latency: 6.463,
          percentile: 0.95625,
          total: 2660103
        },
        {
          latency: 6.711,
          percentile: 0.9625,
          total: 2677484
        },
        {
          latency: 7.007,
          percentile: 0.96875,
          total: 2694694
        },
        {
          latency: 7.187,
          percentile: 0.971875,
          total: 2703546
        },
        {
          latency: 7.379,
          percentile: 0.975,
          total: 2712199
        },
        {
          latency: 7.603,
          percentile: 0.978125,
          total: 2720833
        },
        {
          latency: 7.863,
          percentile: 0.98125,
          total: 2729477
        },
        {
          latency: 8.187,
          percentile: 0.984375,
          total: 2738204
        },
        {
          latency: 8.375,
          percentile: 0.985938,
          total: 2742553
        },
        {
          latency: 8.591,
          percentile: 0.9875,
          total: 2746947
        },
        {
          latency: 8.839,
          percentile: 0.989062,
          total: 2751257
        },
        {
          latency: 9.119,
          percentile: 0.990625,
          total: 2755610
        },
        {
          latency: 9.455,
          percentile: 0.992188,
          total: 2759941
        },
        {
          latency: 9.647,
          percentile: 0.992969,
          total: 2762100
        },
        {
          latency: 9.863,
          percentile: 0.99375,
          total: 2764218
        },
        {
          latency: 10.135,
          percentile: 0.994531,
          total: 2766430
        },
        {
          latency: 10.447,
          percentile: 0.995313,
          total: 2768572
        },
        {
          latency: 10.847,
          percentile: 0.996094,
          total: 2770760
        },
        {
          latency: 11.087,
          percentile: 0.996484,
          total: 2771824
        },
        {
          latency: 11.359,
          percentile: 0.996875,
          total: 2772915
        },
        {
          latency: 11.679,
          percentile: 0.997266,
          total: 2774006
        },
        {
          latency: 12.063,
          percentile: 0.997656,
          total: 2775089
        },
        {
          latency: 12.575,
          percentile: 0.998047,
          total: 2776178
        },
        {
          latency: 12.863,
          percentile: 0.998242,
          total: 2776717
        },
        {
          latency: 13.191,
          percentile: 0.998437,
          total: 2777260
        },
        {
          latency: 13.559,
          percentile: 0.998633,
          total: 2777805
        },
        {
          latency: 14.031,
          percentile: 0.998828,
          total: 2778344
        },
        {
          latency: 14.655,
          percentile: 0.999023,
          total: 2778888
        },
        {
          latency: 15.039,
          percentile: 0.999121,
          total: 2779158
        },
        {
          latency: 15.471,
          percentile: 0.999219,
          total: 2779432
        },
        {
          latency: 16.023,
          percentile: 0.999316,
          total: 2779703
        },
        {
          latency: 16.799,
          percentile: 0.999414,
          total: 2779975
        },
        {
          latency: 17.839,
          percentile: 0.999512,
          total: 2780244
        },
        {
          latency: 18.575,
          percentile: 0.999561,
          total: 2780380
        },
        {
          latency: 19.631,
          percentile: 0.999609,
          total: 2780517
        },
        {
          latency: 21.407,
          percentile: 0.999658,
          total: 2780652
        },
        {
          latency: 25.775,
          percentile: 0.999707,
          total: 2780788
        },
        {
          latency: 51.999,
          percentile: 0.999756,
          total: 2780923
        },
        {
          latency: 69.887,
          percentile: 0.99978,
          total: 2780991
        },
        {
          latency: 87.679,
          percentile: 0.999805,
          total: 2781059
        },
        {
          latency: 105.471,
          percentile: 0.999829,
          total: 2781127
        },
        {
          latency: 124.095,
          percentile: 0.999854,
          total: 2781196
        },
        {
          latency: 142.975,
          percentile: 0.999878,
          total: 2781264
        },
        {
          latency: 146.559,
          percentile: 0.99989,
          total: 2781299
        },
        {
          latency: 161.407,
          percentile: 0.999902,
          total: 2781331
        },
        {
          latency: 164.479,
          percentile: 0.999915,
          total: 2781365
        },
        {
          latency: 179.967,
          percentile: 0.999927,
          total: 2781399
        },
        {
          latency: 183.295,
          percentile: 0.999939,
          total: 2781434
        },
        {
          latency: 184.703,
          percentile: 0.999945,
          total: 2781450
        },
        {
          latency: 189.695,
          percentile: 0.999951,
          total: 2781467
        },
        {
          latency: 200.831,
          percentile: 0.999957,
          total: 2781484
        },
        {
          latency: 202.367,
          percentile: 0.999963,
          total: 2781503
        },
        {
          latency: 203.391,
          percentile: 0.999969,
          total: 2781518
        },
        {
          latency: 203.775,
          percentile: 0.999973,
          total: 2781526
        },
        {
          latency: 205.183,
          percentile: 0.999976,
          total: 2781536
        },
        {
          latency: 218.623,
          percentile: 0.999979,
          total: 2781543
        },
        {
          latency: 219.775,
          percentile: 0.999982,
          total: 2781556
        },
        {
          latency: 220.031,
          percentile: 0.999985,
          total: 2781560
        },
        {
          latency: 220.671,
          percentile: 0.999986,
          total: 2781565
        },
        {
          latency: 221.183,
          percentile: 0.999988,
          total: 2781569
        },
        {
          latency: 221.567,
          percentile: 0.999989,
          total: 2781573
        },
        {
          latency: 221.823,
          percentile: 0.999991,
          total: 2781577
        },
        {
          latency: 222.079,
          percentile: 0.999992,
          total: 2781583
        },
        {
          latency: 222.079,
          percentile: 0.999993,
          total: 2781583
        },
        {
          latency: 222.335,
          percentile: 0.999994,
          total: 2781586
        },
        {
          latency: 222.591,
          percentile: 0.999995,
          total: 2781589
        },
        {
          latency: 222.719,
          percentile: 0.999995,
          total: 2781592
        },
        {
          latency: 222.719,
          percentile: 0.999996,
          total: 2781592
        },
        {
          latency: 222.847,
          percentile: 0.999997,
          total: 2781595
        },
        {
          latency: 222.847,
          percentile: 0.999997,
          total: 2781595
        },
        {
          latency: 222.847,
          percentile: 0.999997,
          total: 2781595
        },
        {
          latency: 222.975,
          percentile: 0.999998,
          total: 2781597
        },
        {
          latency: 222.975,
          percentile: 0.999998,
          total: 2781597
        },
        {
          latency: 223.231,
          percentile: 0.999998,
          total: 2781598
        },
        {
          latency: 223.231,
          percentile: 0.999998,
          total: 2781598
        },
        {
          latency: 223.359,
          percentile: 0.999999,
          total: 2781599
        },
        {
          latency: 223.359,
          percentile: 0.999999,
          total: 2781599
        },
        {
          latency: 224.255,
          percentile: 0.999999,
          total: 2781600
        },
        {
          latency: 224.255,
          percentile: 0.999999,
          total: 2781600
        },
        {
          latency: 224.255,
          percentile: 0.999999,
          total: 2781600
        },
        {
          latency: 224.383,
          percentile: 0.999999,
          total: 2781601
        },
        {
          latency: 224.383,
          percentile: 0.999999,
          total: 2781601
        },
        {
          latency: 224.383,
          percentile: 1,
          total: 2781601
        },
        {
          latency: 224.383,
          percentile: 1,
          total: 2781601
        },
        {
          latency: 224.383,
          percentile: 1,
          total: 2781601
        },
        {
          latency: 224.511,
          percentile: 1,
          total: 2781602
        },
        {
          latency: 224.511,
          percentile: 1,
          total: 2781602
        }
      ]
    }
  },
  {
    opts: {
      path: '../wrk2/wrk',
      rate: 9700,
      duration: '300s',
      threads: 4,
      connections: 200,
      printLatency: true,
      url: 'http://107.21.1.157/queryU'
    },
    result: {
      transferPerSec: '5.19MB',
      requestsPerSec: 9696.22,
      non2xx3xx: 3152,
      requestsTotal: 2908863,
      durationActual: '5.00m',
      transferTotal: '1.52GB',
      latencyAvg: 'calibration:',
      latencyStdev: 'mean',
      latencyMax: 'lat.:',
      latencyStdevPerc: null,
      rpsAvg: 'calibration:',
      rpsStdev: 'mean',
      rpsMax: 'lat.:',
      rpsStdevPerc: null,
      histogram: [
        {
          latency: 1.822,
          percentile: 0.1,
          total: 281204
        },
        {
          latency: 2.107,
          percentile: 0.2,
          total: 562221
        },
        {
          latency: 2.357,
          percentile: 0.3,
          total: 844808
        },
        {
          latency: 2.623,
          percentile: 0.4,
          total: 1125927
        },
        {
          latency: 2.935,
          percentile: 0.5,
          total: 1405398
        },
        {
          latency: 3.117,
          percentile: 0.55,
          total: 1546851
        },
        {
          latency: 3.315,
          percentile: 0.6,
          total: 1686734
        },
        {
          latency: 3.539,
          percentile: 0.65,
          total: 1827903
        },
        {
          latency: 3.797,
          percentile: 0.7,
          total: 1967776
        },
        {
          latency: 4.107,
          percentile: 0.75,
          total: 2109449
        },
        {
          latency: 4.279,
          percentile: 0.775,
          total: 2179188
        },
        {
          latency: 4.475,
          percentile: 0.8,
          total: 2249286
        },
        {
          latency: 4.703,
          percentile: 0.825,
          total: 2319395
        },
        {
          latency: 4.971,
          percentile: 0.85,
          total: 2389134
        },
        {
          latency: 5.303,
          percentile: 0.875,
          total: 2459854
        },
        {
          latency: 5.491,
          percentile: 0.8875,
          total: 2494691
        },
        {
          latency: 5.699,
          percentile: 0.9,
          total: 2529640
        },
        {
          latency: 5.923,
          percentile: 0.9125,
          total: 2565009
        },
        {
          latency: 6.175,
          percentile: 0.925,
          total: 2600042
        },
        {
          latency: 6.475,
          percentile: 0.9375,
          total: 2635041
        },
        {
          latency: 6.655,
          percentile: 0.94375,
          total: 2652639
        },
        {
          latency: 6.855,
          percentile: 0.95,
          total: 2670116
        },
        {
          latency: 7.087,
          percentile: 0.95625,
          total: 2687692
        },
        {
          latency: 7.363,
          percentile: 0.9625,
          total: 2705159
        },
        {
          latency: 7.707,
          percentile: 0.96875,
          total: 2722755
        },
        {
          latency: 7.907,
          percentile: 0.971875,
          total: 2731577
        },
        {
          latency: 8.127,
          percentile: 0.975,
          total: 2740424
        },
        {
          latency: 8.359,
          percentile: 0.978125,
          total: 2749101
        },
        {
          latency: 8.631,
          percentile: 0.98125,
          total: 2757981
        },
        {
          latency: 8.959,
          percentile: 0.984375,
          total: 2766789
        },
        {
          latency: 9.151,
          percentile: 0.985938,
          total: 2771171
        },
        {
          latency: 9.359,
          percentile: 0.9875,
          total: 2775476
        },
        {
          latency: 9.607,
          percentile: 0.989062,
          total: 2779819
        },
        {
          latency: 9.903,
          percentile: 0.990625,
          total: 2784214
        },
        {
          latency: 10.247,
          percentile: 0.992188,
          total: 2788598
        },
        {
          latency: 10.455,
          percentile: 0.992969,
          total: 2790867
        },
        {
          latency: 10.679,
          percentile: 0.99375,
          total: 2793030
        },
        {
          latency: 10.935,
          percentile: 0.994531,
          total: 2795180
        },
        {
          latency: 11.255,
          percentile: 0.995313,
          total: 2797377
        },
        {
          latency: 11.631,
          percentile: 0.996094,
          total: 2799591
        },
        {
          latency: 11.847,
          percentile: 0.996484,
          total: 2800678
        },
        {
          latency: 12.103,
          percentile: 0.996875,
          total: 2801774
        },
        {
          latency: 12.415,
          percentile: 0.997266,
          total: 2802876
        },
        {
          latency: 12.759,
          percentile: 0.997656,
          total: 2803962
        },
        {
          latency: 13.215,
          percentile: 0.998047,
          total: 2805060
        },
        {
          latency: 13.479,
          percentile: 0.998242,
          total: 2805609
        },
        {
          latency: 13.775,
          percentile: 0.998437,
          total: 2806163
        },
        {
          latency: 14.135,
          percentile: 0.998633,
          total: 2806708
        },
        {
          latency: 14.567,
          percentile: 0.998828,
          total: 2807262
        },
        {
          latency: 15.135,
          percentile: 0.999023,
          total: 2807810
        },
        {
          latency: 15.503,
          percentile: 0.999121,
          total: 2808079
        },
        {
          latency: 15.919,
          percentile: 0.999219,
          total: 2808353
        },
        {
          latency: 16.447,
          percentile: 0.999316,
          total: 2808631
        },
        {
          latency: 17.103,
          percentile: 0.999414,
          total: 2808905
        },
        {
          latency: 18.239,
          percentile: 0.999512,
          total: 2809178
        },
        {
          latency: 19.071,
          percentile: 0.999561,
          total: 2809314
        },
        {
          latency: 20.591,
          percentile: 0.999609,
          total: 2809451
        },
        {
          latency: 23.071,
          percentile: 0.999658,
          total: 2809588
        },
        {
          latency: 43.679,
          percentile: 0.999707,
          total: 2809725
        },
        {
          latency: 74.815,
          percentile: 0.999756,
          total: 2809862
        },
        {
          latency: 91.327,
          percentile: 0.99978,
          total: 2809931
        },
        {
          latency: 107.327,
          percentile: 0.999805,
          total: 2810000
        },
        {
          latency: 122.815,
          percentile: 0.999829,
          total: 2810068
        },
        {
          latency: 135.807,
          percentile: 0.999854,
          total: 2810137
        },
        {
          latency: 149.503,
          percentile: 0.999878,
          total: 2810205
        },
        {
          latency: 162.047,
          percentile: 0.99989,
          total: 2810240
        },
        {
          latency: 165.503,
          percentile: 0.999902,
          total: 2810274
        },
        {
          latency: 174.591,
          percentile: 0.999915,
          total: 2810308
        },
        {
          latency: 182.655,
          percentile: 0.999927,
          total: 2810343
        },
        {
          latency: 187.007,
          percentile: 0.999939,
          total: 2810377
        },
        {
          latency: 190.847,
          percentile: 0.999945,
          total: 2810394
        },
        {
          latency: 200.831,
          percentile: 0.999951,
          total: 2810412
        },
        {
          latency: 201.983,
          percentile: 0.999957,
          total: 2810430
        },
        {
          latency: 203.775,
          percentile: 0.999963,
          total: 2810449
        },
        {
          latency: 205.439,
          percentile: 0.999969,
          total: 2810465
        },
        {
          latency: 205.951,
          percentile: 0.999973,
          total: 2810473
        },
        {
          latency: 210.815,
          percentile: 0.999976,
          total: 2810480
        },
        {
          latency: 218.623,
          percentile: 0.999979,
          total: 2810489
        },
        {
          latency: 220.159,
          percentile: 0.999982,
          total: 2810499
        },
        {
          latency: 220.671,
          percentile: 0.999985,
          total: 2810508
        },
        {
          latency: 220.799,
          percentile: 0.999986,
          total: 2810510
        },
        {
          latency: 221.055,
          percentile: 0.999988,
          total: 2810515
        },
        {
          latency: 221.183,
          percentile: 0.999989,
          total: 2810518
        },
        {
          latency: 221.567,
          percentile: 0.999991,
          total: 2810523
        },
        {
          latency: 221.823,
          percentile: 0.999992,
          total: 2810527
        },
        {
          latency: 222.079,
          percentile: 0.999993,
          total: 2810529
        },
        {
          latency: 222.207,
          percentile: 0.999994,
          total: 2810531
        },
        {
          latency: 222.463,
          percentile: 0.999995,
          total: 2810533
        },
        {
          latency: 223.103,
          percentile: 0.999995,
          total: 2810539
        },
        {
          latency: 223.103,
          percentile: 0.999996,
          total: 2810539
        },
        {
          latency: 223.103,
          percentile: 0.999997,
          total: 2810539
        },
        {
          latency: 223.231,
          percentile: 0.999997,
          total: 2810542
        },
        {
          latency: 223.231,
          percentile: 0.999997,
          total: 2810542
        },
        {
          latency: 223.231,
          percentile: 0.999998,
          total: 2810542
        },
        {
          latency: 223.359,
          percentile: 0.999998,
          total: 2810543
        },
        {
          latency: 223.871,
          percentile: 0.999998,
          total: 2810544
        },
        {
          latency: 223.871,
          percentile: 0.999998,
          total: 2810544
        },
        {
          latency: 224.255,
          percentile: 0.999999,
          total: 2810545
        },
        {
          latency: 224.255,
          percentile: 0.999999,
          total: 2810545
        },
        {
          latency: 224.383,
          percentile: 0.999999,
          total: 2810546
        },
        {
          latency: 224.383,
          percentile: 0.999999,
          total: 2810546
        },
        {
          latency: 224.383,
          percentile: 0.999999,
          total: 2810546
        },
        {
          latency: 226.047,
          percentile: 0.999999,
          total: 2810547
        },
        {
          latency: 226.047,
          percentile: 0.999999,
          total: 2810547
        },
        {
          latency: 226.047,
          percentile: 1,
          total: 2810547
        },
        {
          latency: 226.047,
          percentile: 1,
          total: 2810547
        },
        {
          latency: 226.047,
          percentile: 1,
          total: 2810547
        },
        {
          latency: 228.863,
          percentile: 1,
          total: 2810548
        },
        {
          latency: 228.863,
          percentile: 1,
          total: 2810548
        }
      ]
    }
  },
  {
    opts: {
      path: '../wrk2/wrk',
      rate: 9800,
      duration: '300s',
      threads: 4,
      connections: 200,
      printLatency: true,
      url: 'http://107.21.1.157/queryU'
    },
    result: {
      transferPerSec: '5.24MB',
      requestsPerSec: 9796.2,
      non2xx3xx: 6582,
      requestsTotal: 2938856,
      durationActual: '5.00m',
      transferTotal: '1.54GB',
      latencyAvg: 'calibration:',
      latencyStdev: 'mean',
      latencyMax: 'lat.:',
      latencyStdevPerc: null,
      rpsAvg: 'calibration:',
      rpsStdev: 'mean',
      rpsMax: 'lat.:',
      rpsStdevPerc: null,
      histogram: [
        {
          latency: 1.836,
          percentile: 0.1,
          total: 284247
        },
        {
          latency: 2.183,
          percentile: 0.2,
          total: 568596
        },
        {
          latency: 2.501,
          percentile: 0.3,
          total: 853485
        },
        {
          latency: 2.823,
          percentile: 0.4,
          total: 1137320
        },
        {
          latency: 3.173,
          percentile: 0.5,
          total: 1420798
        },
        {
          latency: 3.361,
          percentile: 0.55,
          total: 1562437
        },
        {
          latency: 3.565,
          percentile: 0.6,
          total: 1703866
        },
        {
          latency: 3.799,
          percentile: 0.65,
          total: 1845769
        },
        {
          latency: 4.071,
          percentile: 0.7,
          total: 1987968
        },
        {
          latency: 4.391,
          percentile: 0.75,
          total: 2130026
        },
        {
          latency: 4.579,
          percentile: 0.775,
          total: 2201474
        },
        {
          latency: 4.795,
          percentile: 0.8,
          total: 2272426
        },
        {
          latency: 5.043,
          percentile: 0.825,
          total: 2343148
        },
        {
          latency: 5.323,
          percentile: 0.85,
          total: 2413824
        },
        {
          latency: 5.659,
          percentile: 0.875,
          total: 2485286
        },
        {
          latency: 5.851,
          percentile: 0.8875,
          total: 2520178
        },
        {
          latency: 6.071,
          percentile: 0.9,
          total: 2555905
        },
        {
          latency: 6.311,
          percentile: 0.9125,
          total: 2591353
        },
        {
          latency: 6.587,
          percentile: 0.925,
          total: 2626962
        },
        {
          latency: 6.911,
          percentile: 0.9375,
          total: 2662216
        },
        {
          latency: 7.103,
          percentile: 0.94375,
          total: 2679967
        },
        {
          latency: 7.311,
          percentile: 0.95,
          total: 2697672
        },
        {
          latency: 7.547,
          percentile: 0.95625,
          total: 2715435
        },
        {
          latency: 7.815,
          percentile: 0.9625,
          total: 2733111
        },
        {
          latency: 8.131,
          percentile: 0.96875,
          total: 2750854
        },
        {
          latency: 8.319,
          percentile: 0.971875,
          total: 2759995
        },
        {
          latency: 8.519,
          percentile: 0.975,
          total: 2768837
        },
        {
          latency: 8.751,
          percentile: 0.978125,
          total: 2777665
        },
        {
          latency: 9.023,
          percentile: 0.98125,
          total: 2786331
        },
        {
          latency: 9.367,
          percentile: 0.984375,
          total: 2795236
        },
        {
          latency: 9.575,
          percentile: 0.985938,
          total: 2799612
        },
        {
          latency: 9.799,
          percentile: 0.9875,
          total: 2804141
        },
        {
          latency: 10.031,
          percentile: 0.989062,
          total: 2808481
        },
        {
          latency: 10.319,
          percentile: 0.990625,
          total: 2812972
        },
        {
          latency: 10.663,
          percentile: 0.992188,
          total: 2817394
        },
        {
          latency: 10.863,
          percentile: 0.992969,
          total: 2819626
        },
        {
          latency: 11.079,
          percentile: 0.99375,
          total: 2821817
        },
        {
          latency: 11.343,
          percentile: 0.994531,
          total: 2824061
        },
        {
          latency: 11.655,
          percentile: 0.995313,
          total: 2826252
        },
        {
          latency: 12.031,
          percentile: 0.996094,
          total: 2828483
        },
        {
          latency: 12.247,
          percentile: 0.996484,
          total: 2829577
        },
        {
          latency: 12.495,
          percentile: 0.996875,
          total: 2830669
        },
        {
          latency: 12.791,
          percentile: 0.997266,
          total: 2831790
        },
        {
          latency: 13.127,
          percentile: 0.997656,
          total: 2832887
        },
        {
          latency: 13.535,
          percentile: 0.998047,
          total: 2834004
        },
        {
          latency: 13.775,
          percentile: 0.998242,
          total: 2834545
        },
        {
          latency: 14.055,
          percentile: 0.998437,
          total: 2835104
        },
        {
          latency: 14.399,
          percentile: 0.998633,
          total: 2835655
        },
        {
          latency: 14.839,
          percentile: 0.998828,
          total: 2836218
        },
        {
          latency: 15.351,
          percentile: 0.999023,
          total: 2836770
        },
        {
          latency: 15.679,
          percentile: 0.999121,
          total: 2837044
        },
        {
          latency: 16.055,
          percentile: 0.999219,
          total: 2837319
        },
        {
          latency: 16.543,
          percentile: 0.999316,
          total: 2837601
        },
        {
          latency: 17.183,
          percentile: 0.999414,
          total: 2837875
        },
        {
          latency: 18.063,
          percentile: 0.999512,
          total: 2838151
        },
        {
          latency: 18.687,
          percentile: 0.999561,
          total: 2838290
        },
        {
          latency: 19.727,
          percentile: 0.999609,
          total: 2838427
        },
        {
          latency: 21.119,
          percentile: 0.999658,
          total: 2838566
        },
        {
          latency: 28.111,
          percentile: 0.999707,
          total: 2838705
        },
        {
          latency: 57.759,
          percentile: 0.999756,
          total: 2838843
        },
        {
          latency: 75.583,
          percentile: 0.99978,
          total: 2838913
        },
        {
          latency: 93.759,
          percentile: 0.999805,
          total: 2838983
        },
        {
          latency: 112.319,
          percentile: 0.999829,
          total: 2839053
        },
        {
          latency: 129.599,
          percentile: 0.999854,
          total: 2839121
        },
        {
          latency: 146.431,
          percentile: 0.999878,
          total: 2839190
        },
        {
          latency: 151.295,
          percentile: 0.99989,
          total: 2839225
        },
        {
          latency: 161.663,
          percentile: 0.999902,
          total: 2839259
        },
        {
          latency: 169.343,
          percentile: 0.999915,
          total: 2839294
        },
        {
          latency: 178.303,
          percentile: 0.999927,
          total: 2839329
        },
        {
          latency: 185.855,
          percentile: 0.999939,
          total: 2839363
        },
        {
          latency: 188.159,
          percentile: 0.999945,
          total: 2839382
        },
        {
          latency: 191.487,
          percentile: 0.999951,
          total: 2839398
        },
        {
          latency: 201.215,
          percentile: 0.999957,
          total: 2839417
        },
        {
          latency: 203.135,
          percentile: 0.999963,
          total: 2839433
        },
        {
          latency: 205.439,
          percentile: 0.999969,
          total: 2839453
        },
        {
          latency: 206.079,
          percentile: 0.999973,
          total: 2839459
        },
        {
          latency: 207.103,
          percentile: 0.999976,
          total: 2839467
        },
        {
          latency: 209.279,
          percentile: 0.999979,
          total: 2839476
        },
        {
          latency: 219.135,
          percentile: 0.999982,
          total: 2839485
        },
        {
          latency: 220.159,
          percentile: 0.999985,
          total: 2839495
        },
        {
          latency: 220.415,
          percentile: 0.999986,
          total: 2839499
        },
        {
          latency: 220.543,
          percentile: 0.999988,
          total: 2839502
        },
        {
          latency: 220.799,
          percentile: 0.999989,
          total: 2839506
        },
        {
          latency: 221.439,
          percentile: 0.999991,
          total: 2839511
        },
        {
          latency: 221.951,
          percentile: 0.999992,
          total: 2839516
        },
        {
          latency: 222.591,
          percentile: 0.999993,
          total: 2839519
        },
        {
          latency: 222.591,
          percentile: 0.999994,
          total: 2839519
        },
        {
          latency: 222.975,
          percentile: 0.999995,
          total: 2839521
        },
        {
          latency: 223.231,
          percentile: 0.999995,
          total: 2839525
        },
        {
          latency: 223.359,
          percentile: 0.999996,
          total: 2839526
        },
        {
          latency: 223.487,
          percentile: 0.999997,
          total: 2839528
        },
        {
          latency: 223.487,
          percentile: 0.999997,
          total: 2839528
        },
        {
          latency: 223.615,
          percentile: 0.999997,
          total: 2839529
        },
        {
          latency: 223.999,
          percentile: 0.999998,
          total: 2839530
        },
        {
          latency: 224.127,
          percentile: 0.999998,
          total: 2839531
        },
        {
          latency: 224.639,
          percentile: 0.999998,
          total: 2839533
        },
        {
          latency: 224.639,
          percentile: 0.999998,
          total: 2839533
        },
        {
          latency: 224.639,
          percentile: 0.999999,
          total: 2839533
        },
        {
          latency: 224.639,
          percentile: 0.999999,
          total: 2839533
        },
        {
          latency: 225.151,
          percentile: 0.999999,
          total: 2839534
        },
        {
          latency: 225.151,
          percentile: 0.999999,
          total: 2839534
        },
        {
          latency: 225.151,
          percentile: 0.999999,
          total: 2839534
        },
        {
          latency: 226.559,
          percentile: 0.999999,
          total: 2839535
        },
        {
          latency: 226.559,
          percentile: 0.999999,
          total: 2839535
        },
        {
          latency: 226.559,
          percentile: 1,
          total: 2839535
        },
        {
          latency: 226.559,
          percentile: 1,
          total: 2839535
        },
        {
          latency: 226.559,
          percentile: 1,
          total: 2839535
        },
        {
          latency: 228.351,
          percentile: 1,
          total: 2839536
        },
        {
          latency: 228.351,
          percentile: 1,
          total: 2839536
        }
      ]
    }
  },
  {
    opts: {
      path: '../wrk2/wrk',
      rate: 9900,
      duration: '300s',
      threads: 4,
      connections: 200,
      printLatency: true,
      url: 'http://107.21.1.157/queryU'
    },
    result: {
      transferPerSec: '5.28MB',
      requestsPerSec: 9896.1,
      non2xx3xx: 13953,
      requestsTotal: 2968826,
      durationActual: '5.00m',
      transferTotal: '1.55GB',
      latencyAvg: 'calibration:',
      latencyStdev: 'mean',
      latencyMax: 'lat.:',
      latencyStdevPerc: null,
      rpsAvg: 'calibration:',
      rpsStdev: 'mean',
      rpsMax: 'lat.:',
      rpsStdevPerc: null,
      histogram: [
        {
          latency: 1.891,
          percentile: 0.1,
          total: 287087
        },
        {
          latency: 2.309,
          percentile: 0.2,
          total: 574619
        },
        {
          latency: 2.705,
          percentile: 0.3,
          total: 860569
        },
        {
          latency: 3.111,
          percentile: 0.4,
          total: 1147491
        },
        {
          latency: 3.547,
          percentile: 0.5,
          total: 1434327
        },
        {
          latency: 3.783,
          percentile: 0.55,
          total: 1578517
        },
        {
          latency: 4.031,
          percentile: 0.6,
          total: 1721136
        },
        {
          latency: 4.299,
          percentile: 0.65,
          total: 1866336
        },
        {
          latency: 4.595,
          percentile: 0.7,
          total: 2009548
        },
        {
          latency: 4.943,
          percentile: 0.75,
          total: 2152468
        },
        {
          latency: 5.143,
          percentile: 0.775,
          total: 2223957
        },
        {
          latency: 5.371,
          percentile: 0.8,
          total: 2295277
        },
        {
          latency: 5.643,
          percentile: 0.825,
          total: 2367317
        },
        {
          latency: 5.963,
          percentile: 0.85,
          total: 2438671
        },
        {
          latency: 6.335,
          percentile: 0.875,
          total: 2510257
        },
        {
          latency: 6.551,
          percentile: 0.8875,
          total: 2546330
        },
        {
          latency: 6.791,
          percentile: 0.9,
          total: 2581893
        },
        {
          latency: 7.059,
          percentile: 0.9125,
          total: 2617831
        },
        {
          latency: 7.367,
          percentile: 0.925,
          total: 2653652
        },
        {
          latency: 7.723,
          percentile: 0.9375,
          total: 2689352
        },
        {
          latency: 7.927,
          percentile: 0.94375,
          total: 2707452
        },
        {
          latency: 8.143,
          percentile: 0.95,
          total: 2725175
        },
        {
          latency: 8.383,
          percentile: 0.95625,
          total: 2743169
        },
        {
          latency: 8.647,
          percentile: 0.9625,
          total: 2761019
        },
        {
          latency: 8.951,
          percentile: 0.96875,
          total: 2778897
        },
        {
          latency: 9.127,
          percentile: 0.971875,
          total: 2787839
        },
        {
          latency: 9.335,
          percentile: 0.975,
          total: 2797076
        },
        {
          latency: 9.567,
          percentile: 0.978125,
          total: 2805860
        },
        {
          latency: 9.847,
          percentile: 0.98125,
          total: 2814923
        },
        {
          latency: 10.159,
          percentile: 0.984375,
          total: 2823702
        },
        {
          latency: 10.351,
          percentile: 0.985938,
          total: 2828275
        },
        {
          latency: 10.559,
          percentile: 0.9875,
          total: 2832724
        },
        {
          latency: 10.799,
          percentile: 0.989062,
          total: 2837199
        },
        {
          latency: 11.087,
          percentile: 0.990625,
          total: 2841676
        },
        {
          latency: 11.431,
          percentile: 0.992188,
          total: 2846133
        },
        {
          latency: 11.623,
          percentile: 0.992969,
          total: 2848347
        },
        {
          latency: 11.847,
          percentile: 0.99375,
          total: 2850639
        },
        {
          latency: 12.103,
          percentile: 0.994531,
          total: 2852849
        },
        {
          latency: 12.399,
          percentile: 0.995313,
          total: 2855098
        },
        {
          latency: 12.743,
          percentile: 0.996094,
          total: 2857301
        },
        {
          latency: 12.943,
          percentile: 0.996484,
          total: 2858465
        },
        {
          latency: 13.175,
          percentile: 0.996875,
          total: 2859571
        },
        {
          latency: 13.423,
          percentile: 0.997266,
          total: 2860661
        },
        {
          latency: 13.719,
          percentile: 0.997656,
          total: 2861787
        },
        {
          latency: 14.071,
          percentile: 0.998047,
          total: 2862914
        },
        {
          latency: 14.287,
          percentile: 0.998242,
          total: 2863468
        },
        {
          latency: 14.535,
          percentile: 0.998437,
          total: 2864034
        },
        {
          latency: 14.791,
          percentile: 0.998633,
          total: 2864597
        },
        {
          latency: 15.095,
          percentile: 0.998828,
          total: 2865143
        },
        {
          latency: 15.495,
          percentile: 0.999023,
          total: 2865709
        },
        {
          latency: 15.735,
          percentile: 0.999121,
          total: 2865994
        },
        {
          latency: 16.023,
          percentile: 0.999219,
          total: 2866268
        },
        {
          latency: 16.351,
          percentile: 0.999316,
          total: 2866546
        },
        {
          latency: 16.767,
          percentile: 0.999414,
          total: 2866824
        },
        {
          latency: 17.279,
          percentile: 0.999512,
          total: 2867107
        },
        {
          latency: 17.647,
          percentile: 0.999561,
          total: 2867245
        },
        {
          latency: 18.047,
          percentile: 0.999609,
          total: 2867388
        },
        {
          latency: 18.559,
          percentile: 0.999658,
          total: 2867524
        },
        {
          latency: 19.135,
          percentile: 0.999707,
          total: 2867665
        },
        {
          latency: 20.143,
          percentile: 0.999756,
          total: 2867804
        },
        {
          latency: 21.071,
          percentile: 0.99978,
          total: 2867874
        },
        {
          latency: 23.039,
          percentile: 0.999805,
          total: 2867944
        },
        {
          latency: 34.527,
          percentile: 0.999829,
          total: 2868014
        },
        {
          latency: 59.615,
          percentile: 0.999854,
          total: 2868084
        },
        {
          latency: 91.903,
          percentile: 0.999878,
          total: 2868154
        },
        {
          latency: 102.271,
          percentile: 0.99989,
          total: 2868189
        },
        {
          latency: 116.159,
          percentile: 0.999902,
          total: 2868224
        },
        {
          latency: 132.095,
          percentile: 0.999915,
          total: 2868260
        },
        {
          latency: 148.095,
          percentile: 0.999927,
          total: 2868295
        },
        {
          latency: 162.559,
          percentile: 0.999939,
          total: 2868329
        },
        {
          latency: 168.191,
          percentile: 0.999945,
          total: 2868347
        },
        {
          latency: 172.799,
          percentile: 0.999951,
          total: 2868364
        },
        {
          latency: 183.679,
          percentile: 0.999957,
          total: 2868382
        },
        {
          latency: 188.031,
          percentile: 0.999963,
          total: 2868399
        },
        {
          latency: 199.039,
          percentile: 0.999969,
          total: 2868417
        },
        {
          latency: 202.367,
          percentile: 0.999973,
          total: 2868427
        },
        {
          latency: 203.263,
          percentile: 0.999976,
          total: 2868435
        },
        {
          latency: 205.183,
          percentile: 0.999979,
          total: 2868443
        },
        {
          latency: 207.871,
          percentile: 0.999982,
          total: 2868452
        },
        {
          latency: 217.727,
          percentile: 0.999985,
          total: 2868461
        },
        {
          latency: 219.007,
          percentile: 0.999986,
          total: 2868465
        },
        {
          latency: 219.775,
          percentile: 0.999988,
          total: 2868469
        },
        {
          latency: 220.671,
          percentile: 0.999989,
          total: 2868474
        },
        {
          latency: 221.311,
          percentile: 0.999991,
          total: 2868478
        },
        {
          latency: 222.079,
          percentile: 0.999992,
          total: 2868484
        },
        {
          latency: 222.207,
          percentile: 0.999993,
          total: 2868485
        },
        {
          latency: 222.463,
          percentile: 0.999994,
          total: 2868487
        },
        {
          latency: 223.103,
          percentile: 0.999995,
          total: 2868489
        },
        {
          latency: 224.383,
          percentile: 0.999995,
          total: 2868491
        },
        {
          latency: 261.247,
          percentile: 0.999996,
          total: 2868494
        },
        {
          latency: 280.319,
          percentile: 0.999997,
          total: 2868495
        },
        {
          latency: 299.263,
          percentile: 0.999997,
          total: 2868496
        },
        {
          latency: 318.207,
          percentile: 0.999997,
          total: 2868497
        },
        {
          latency: 333.823,
          percentile: 0.999998,
          total: 2868498
        },
        {
          latency: 349.951,
          percentile: 0.999998,
          total: 2868499
        },
        {
          latency: 365.311,
          percentile: 0.999998,
          total: 2868500
        },
        {
          latency: 365.311,
          percentile: 0.999998,
          total: 2868500
        },
        {
          latency: 383.743,
          percentile: 0.999999,
          total: 2868501
        },
        {
          latency: 383.743,
          percentile: 0.999999,
          total: 2868501
        },
        {
          latency: 402.431,
          percentile: 0.999999,
          total: 2868502
        },
        {
          latency: 402.431,
          percentile: 0.999999,
          total: 2868502
        },
        {
          latency: 402.431,
          percentile: 0.999999,
          total: 2868502
        },
        {
          latency: 421.375,
          percentile: 0.999999,
          total: 2868503
        },
        {
          latency: 421.375,
          percentile: 0.999999,
          total: 2868503
        },
        {
          latency: 421.375,
          percentile: 1,
          total: 2868503
        },
        {
          latency: 421.375,
          percentile: 1,
          total: 2868503
        },
        {
          latency: 421.375,
          percentile: 1,
          total: 2868503
        },
        {
          latency: 440.063,
          percentile: 1,
          total: 2868504
        },
        {
          latency: 440.063,
          percentile: 1,
          total: 2868504
        }
      ]
    }
  },
  {
    opts: {
      path: '../wrk2/wrk',
      rate: 10000,
      duration: '300s',
      threads: 4,
      connections: 200,
      printLatency: true,
      url: 'http://107.21.1.157/queryU'
    },
    result: {
      transferPerSec: '5.19MB',
      requestsPerSec: 9996.09,
      non2xx3xx: 124183,
      requestsTotal: 2998821,
      durationActual: '5.00m',
      transferTotal: '1.52GB',
      latencyAvg: 'calibration:',
      latencyStdev: 'mean',
      latencyMax: 'lat.:',
      latencyStdevPerc: null,
      rpsAvg: 'calibration:',
      rpsStdev: 'mean',
      rpsMax: 'lat.:',
      rpsStdevPerc: null,
      histogram: [
        {
          latency: 1.95,
          percentile: 0.1,
          total: 289847
        },
        {
          latency: 2.527,
          percentile: 0.2,
          total: 580040
        },
        {
          latency: 3.065,
          percentile: 0.3,
          total: 870223
        },
        {
          latency: 3.611,
          percentile: 0.4,
          total: 1159905
        },
        {
          latency: 4.187,
          percentile: 0.5,
          total: 1450638
        },
        {
          latency: 4.487,
          percentile: 0.55,
          total: 1594044
        },
        {
          latency: 4.811,
          percentile: 0.6,
          total: 1739376
        },
        {
          latency: 5.167,
          percentile: 0.65,
          total: 1884006
        },
        {
          latency: 5.559,
          percentile: 0.7,
          total: 2029075
        },
        {
          latency: 6.011,
          percentile: 0.75,
          total: 2173432
        },
        {
          latency: 6.259,
          percentile: 0.775,
          total: 2245608
        },
        {
          latency: 6.539,
          percentile: 0.8,
          total: 2318878
        },
        {
          latency: 6.843,
          percentile: 0.825,
          total: 2390474
        },
        {
          latency: 7.183,
          percentile: 0.85,
          total: 2462943
        },
        {
          latency: 7.579,
          percentile: 0.875,
          total: 2535474
        },
        {
          latency: 7.807,
          percentile: 0.8875,
          total: 2571567
        },
        {
          latency: 8.063,
          percentile: 0.9,
          total: 2607933
        },
        {
          latency: 8.351,
          percentile: 0.9125,
          total: 2644112
        },
        {
          latency: 8.679,
          percentile: 0.925,
          total: 2680672
        },
        {
          latency: 9.055,
          percentile: 0.9375,
          total: 2716684
        },
        {
          latency: 9.271,
          percentile: 0.94375,
          total: 2734864
        },
        {
          latency: 9.503,
          percentile: 0.95,
          total: 2752710
        },
        {
          latency: 9.767,
          percentile: 0.95625,
          total: 2770871
        },
        {
          latency: 10.071,
          percentile: 0.9625,
          total: 2789080
        },
        {
          latency: 10.431,
          percentile: 0.96875,
          total: 2806972
        },
        {
          latency: 10.655,
          percentile: 0.971875,
          total: 2816244
        },
        {
          latency: 10.895,
          percentile: 0.975,
          total: 2825113
        },
        {
          latency: 11.175,
          percentile: 0.978125,
          total: 2834294
        },
        {
          latency: 11.495,
          percentile: 0.98125,
          total: 2843329
        },
        {
          latency: 11.879,
          percentile: 0.984375,
          total: 2852447
        },
        {
          latency: 12.087,
          percentile: 0.985938,
          total: 2856775
        },
        {
          latency: 12.327,
          percentile: 0.9875,
          total: 2861443
        },
        {
          latency: 12.575,
          percentile: 0.989062,
          total: 2865813
        },
        {
          latency: 12.863,
          percentile: 0.990625,
          total: 2870343
        },
        {
          latency: 13.215,
          percentile: 0.992188,
          total: 2874941
        },
        {
          latency: 13.407,
          percentile: 0.992969,
          total: 2877127
        },
        {
          latency: 13.623,
          percentile: 0.99375,
          total: 2879393
        },
        {
          latency: 13.879,
          percentile: 0.994531,
          total: 2881655
        },
        {
          latency: 14.183,
          percentile: 0.995313,
          total: 2883969
        },
        {
          latency: 14.535,
          percentile: 0.996094,
          total: 2886209
        },
        {
          latency: 14.743,
          percentile: 0.996484,
          total: 2887362
        },
        {
          latency: 14.967,
          percentile: 0.996875,
          total: 2888484
        },
        {
          latency: 15.247,
          percentile: 0.997266,
          total: 2889588
        },
        {
          latency: 15.583,
          percentile: 0.997656,
          total: 2890729
        },
        {
          latency: 16.007,
          percentile: 0.998047,
          total: 2891846
        },
        {
          latency: 16.279,
          percentile: 0.998242,
          total: 2892421
        },
        {
          latency: 16.575,
          percentile: 0.998437,
          total: 2892983
        },
        {
          latency: 16.911,
          percentile: 0.998633,
          total: 2893541
        },
        {
          latency: 17.311,
          percentile: 0.998828,
          total: 2894122
        },
        {
          latency: 17.791,
          percentile: 0.999023,
          total: 2894686
        },
        {
          latency: 18.047,
          percentile: 0.999121,
          total: 2894968
        },
        {
          latency: 18.287,
          percentile: 0.999219,
          total: 2895237
        },
        {
          latency: 18.607,
          percentile: 0.999316,
          total: 2895524
        },
        {
          latency: 19.039,
          percentile: 0.999414,
          total: 2895802
        },
        {
          latency: 19.535,
          percentile: 0.999512,
          total: 2896084
        },
        {
          latency: 19.919,
          percentile: 0.999561,
          total: 2896232
        },
        {
          latency: 20.367,
          percentile: 0.999609,
          total: 2896372
        },
        {
          latency: 21.023,
          percentile: 0.999658,
          total: 2896508
        },
        {
          latency: 22.111,
          percentile: 0.999707,
          total: 2896651
        },
        {
          latency: 24.447,
          percentile: 0.999756,
          total: 2896792
        },
        {
          latency: 28.895,
          percentile: 0.99978,
          total: 2896862
        },
        {
          latency: 47.775,
          percentile: 0.999805,
          total: 2896933
        },
        {
          latency: 72.831,
          percentile: 0.999829,
          total: 2897003
        },
        {
          latency: 94.207,
          percentile: 0.999854,
          total: 2897074
        },
        {
          latency: 115.711,
          percentile: 0.999878,
          total: 2897145
        },
        {
          latency: 130.239,
          percentile: 0.99989,
          total: 2897181
        },
        {
          latency: 136.447,
          percentile: 0.999902,
          total: 2897216
        },
        {
          latency: 151.167,
          percentile: 0.999915,
          total: 2897251
        },
        {
          latency: 164.607,
          percentile: 0.999927,
          total: 2897286
        },
        {
          latency: 172.287,
          percentile: 0.999939,
          total: 2897322
        },
        {
          latency: 180.095,
          percentile: 0.999945,
          total: 2897340
        },
        {
          latency: 186.111,
          percentile: 0.999951,
          total: 2897357
        },
        {
          latency: 190.591,
          percentile: 0.999957,
          total: 2897377
        },
        {
          latency: 195.199,
          percentile: 0.999963,
          total: 2897392
        },
        {
          latency: 202.623,
          percentile: 0.999969,
          total: 2897410
        },
        {
          latency: 204.031,
          percentile: 0.999973,
          total: 2897419
        },
        {
          latency: 206.975,
          percentile: 0.999976,
          total: 2897430
        },
        {
          latency: 209.151,
          percentile: 0.999979,
          total: 2897437
        },
        {
          latency: 210.303,
          percentile: 0.999982,
          total: 2897445
        },
        {
          latency: 218.623,
          percentile: 0.999985,
          total: 2897454
        },
        {
          latency: 219.519,
          percentile: 0.999986,
          total: 2897459
        },
        {
          latency: 220.159,
          percentile: 0.999988,
          total: 2897463
        },
        {
          latency: 220.799,
          percentile: 0.999989,
          total: 2897468
        },
        {
          latency: 221.183,
          percentile: 0.999991,
          total: 2897473
        },
        {
          latency: 222.079,
          percentile: 0.999992,
          total: 2897477
        },
        {
          latency: 222.335,
          percentile: 0.999993,
          total: 2897479
        },
        {
          latency: 222.719,
          percentile: 0.999994,
          total: 2897482
        },
        {
          latency: 222.975,
          percentile: 0.999995,
          total: 2897484
        },
        {
          latency: 223.231,
          percentile: 0.999995,
          total: 2897485
        },
        {
          latency: 224.255,
          percentile: 0.999996,
          total: 2897487
        },
        {
          latency: 226.687,
          percentile: 0.999997,
          total: 2897489
        },
        {
          latency: 228.351,
          percentile: 0.999997,
          total: 2897490
        },
        {
          latency: 231.935,
          percentile: 0.999997,
          total: 2897491
        },
        {
          latency: 250.495,
          percentile: 0.999998,
          total: 2897492
        },
        {
          latency: 269.567,
          percentile: 0.999998,
          total: 2897493
        },
        {
          latency: 288.511,
          percentile: 0.999998,
          total: 2897494
        },
        {
          latency: 288.511,
          percentile: 0.999998,
          total: 2897494
        },
        {
          latency: 306.687,
          percentile: 0.999999,
          total: 2897495
        },
        {
          latency: 306.687,
          percentile: 0.999999,
          total: 2897495
        },
        {
          latency: 323.583,
          percentile: 0.999999,
          total: 2897496
        },
        {
          latency: 323.583,
          percentile: 0.999999,
          total: 2897496
        },
        {
          latency: 323.583,
          percentile: 0.999999,
          total: 2897496
        },
        {
          latency: 340.735,
          percentile: 0.999999,
          total: 2897497
        },
        {
          latency: 340.735,
          percentile: 0.999999,
          total: 2897497
        },
        {
          latency: 340.735,
          percentile: 1,
          total: 2897497
        },
        {
          latency: 340.735,
          percentile: 1,
          total: 2897497
        },
        {
          latency: 340.735,
          percentile: 1,
          total: 2897497
        },
        {
          latency: 359.167,
          percentile: 1,
          total: 2897498
        },
        {
          latency: 359.167,
          percentile: 1,
          total: 2897498
        }
      ]
    }
  },
  {
    opts: {
      path: '../wrk2/wrk',
      rate: 10100,
      duration: '300s',
      threads: 4,
      connections: 200,
      printLatency: true,
      url: 'http://107.21.1.157/queryU'
    },
    result: {
      transferPerSec: '5.38MB',
      requestsPerSec: 10096.05,
      non2xx3xx: 24721,
      requestsTotal: 3028809,
      durationActual: '5.00m',
      transferTotal: '1.58GB',
      latencyAvg: 'calibration:',
      latencyStdev: 'mean',
      latencyMax: 'lat.:',
      latencyStdevPerc: null,
      rpsAvg: 'calibration:',
      rpsStdev: 'mean',
      rpsMax: 'lat.:',
      rpsStdevPerc: null,
      histogram: [
        {
          latency: 1.92,
          percentile: 0.1,
          total: 292710
        },
        {
          latency: 2.357,
          percentile: 0.2,
          total: 585920
        },
        {
          latency: 2.797,
          percentile: 0.3,
          total: 878228
        },
        {
          latency: 3.263,
          percentile: 0.4,
          total: 1170808
        },
        {
          latency: 3.755,
          percentile: 0.5,
          total: 1464116
        },
        {
          latency: 4.017,
          percentile: 0.55,
          total: 1610474
        },
        {
          latency: 4.299,
          percentile: 0.6,
          total: 1757361
        },
        {
          latency: 4.595,
          percentile: 0.65,
          total: 1903848
        },
        {
          latency: 4.923,
          percentile: 0.7,
          total: 2048849
        },
        {
          latency: 5.315,
          percentile: 0.75,
          total: 2195595
        },
        {
          latency: 5.539,
          percentile: 0.775,
          total: 2268622
        },
        {
          latency: 5.795,
          percentile: 0.8,
          total: 2342027
        },
        {
          latency: 6.079,
          percentile: 0.825,
          total: 2415089
        },
        {
          latency: 6.399,
          percentile: 0.85,
          total: 2487738
        },
        {
          latency: 6.787,
          percentile: 0.875,
          total: 2560851
        },
        {
          latency: 7.011,
          percentile: 0.8875,
          total: 2597767
        },
        {
          latency: 7.255,
          percentile: 0.9,
          total: 2634166
        },
        {
          latency: 7.523,
          percentile: 0.9125,
          total: 2670564
        },
        {
          latency: 7.835,
          percentile: 0.925,
          total: 2707319
        },
        {
          latency: 8.187,
          percentile: 0.9375,
          total: 2743738
        },
        {
          latency: 8.383,
          percentile: 0.94375,
          total: 2762063
        },
        {
          latency: 8.599,
          percentile: 0.95,
          total: 2780245
        },
        {
          latency: 8.839,
          percentile: 0.95625,
          total: 2798480
        },
        {
          latency: 9.119,
          percentile: 0.9625,
          total: 2816846
        },
        {
          latency: 9.447,
          percentile: 0.96875,
          total: 2835090
        },
        {
          latency: 9.647,
          percentile: 0.971875,
          total: 2844501
        },
        {
          latency: 9.863,
          percentile: 0.975,
          total: 2853403
        },
        {
          latency: 10.119,
          percentile: 0.978125,
          total: 2862731
        },
        {
          latency: 10.399,
          percentile: 0.98125,
          total: 2871651
        },
        {
          latency: 10.743,
          percentile: 0.984375,
          total: 2880877
        },
        {
          latency: 10.935,
          percentile: 0.985938,
          total: 2885334
        },
        {
          latency: 11.159,
          percentile: 0.9875,
          total: 2889921
        },
        {
          latency: 11.407,
          percentile: 0.989062,
          total: 2894611
        },
        {
          latency: 11.687,
          percentile: 0.990625,
          total: 2899085
        },
        {
          latency: 12.015,
          percentile: 0.992188,
          total: 2903607
        },
        {
          latency: 12.207,
          percentile: 0.992969,
          total: 2905892
        },
        {
          latency: 12.431,
          percentile: 0.99375,
          total: 2908249
        },
        {
          latency: 12.671,
          percentile: 0.994531,
          total: 2910530
        },
        {
          latency: 12.951,
          percentile: 0.995313,
          total: 2912749
        },
        {
          latency: 13.287,
          percentile: 0.996094,
          total: 2915050
        },
        {
          latency: 13.487,
          percentile: 0.996484,
          total: 2916226
        },
        {
          latency: 13.687,
          percentile: 0.996875,
          total: 2917335
        },
        {
          latency: 13.935,
          percentile: 0.997266,
          total: 2918466
        },
        {
          latency: 14.231,
          percentile: 0.997656,
          total: 2919614
        },
        {
          latency: 14.591,
          percentile: 0.998047,
          total: 2920751
        },
        {
          latency: 14.815,
          percentile: 0.998242,
          total: 2921326
        },
        {
          latency: 15.047,
          percentile: 0.998437,
          total: 2921900
        },
        {
          latency: 15.319,
          percentile: 0.998633,
          total: 2922468
        },
        {
          latency: 15.639,
          percentile: 0.998828,
          total: 2923044
        },
        {
          latency: 16.055,
          percentile: 0.999023,
          total: 2923614
        },
        {
          latency: 16.303,
          percentile: 0.999121,
          total: 2923898
        },
        {
          latency: 16.575,
          percentile: 0.999219,
          total: 2924180
        },
        {
          latency: 16.911,
          percentile: 0.999316,
          total: 2924477
        },
        {
          latency: 17.295,
          percentile: 0.999414,
          total: 2924754
        },
        {
          latency: 17.855,
          percentile: 0.999512,
          total: 2925041
        },
        {
          latency: 18.143,
          percentile: 0.999561,
          total: 2925183
        },
        {
          latency: 18.511,
          percentile: 0.999609,
          total: 2925324
        },
        {
          latency: 19.055,
          percentile: 0.999658,
          total: 2925468
        },
        {
          latency: 19.807,
          percentile: 0.999707,
          total: 2925613
        },
        {
          latency: 21.183,
          percentile: 0.999756,
          total: 2925752
        },
        {
          latency: 23.279,
          percentile: 0.99978,
          total: 2925823
        },
        {
          latency: 33.535,
          percentile: 0.999805,
          total: 2925895
        },
        {
          latency: 59.135,
          percentile: 0.999829,
          total: 2925966
        },
        {
          latency: 79.231,
          percentile: 0.999854,
          total: 2926038
        },
        {
          latency: 104.703,
          percentile: 0.999878,
          total: 2926109
        },
        {
          latency: 115.647,
          percentile: 0.99989,
          total: 2926145
        },
        {
          latency: 131.967,
          percentile: 0.999902,
          total: 2926181
        },
        {
          latency: 137.599,
          percentile: 0.999915,
          total: 2926216
        },
        {
          latency: 152.319,
          percentile: 0.999927,
          total: 2926252
        },
        {
          latency: 169.343,
          percentile: 0.999939,
          total: 2926290
        },
        {
          latency: 170.751,
          percentile: 0.999945,
          total: 2926306
        },
        {
          latency: 176.255,
          percentile: 0.999951,
          total: 2926324
        },
        {
          latency: 187.263,
          percentile: 0.999957,
          total: 2926341
        },
        {
          latency: 189.055,
          percentile: 0.999963,
          total: 2926359
        },
        {
          latency: 197.503,
          percentile: 0.999969,
          total: 2926377
        },
        {
          latency: 203.775,
          percentile: 0.999973,
          total: 2926387
        },
        {
          latency: 205.183,
          percentile: 0.999976,
          total: 2926395
        },
        {
          latency: 206.079,
          percentile: 0.999979,
          total: 2926404
        },
        {
          latency: 207.103,
          percentile: 0.999982,
          total: 2926415
        },
        {
          latency: 209.663,
          percentile: 0.999985,
          total: 2926423
        },
        {
          latency: 210.303,
          percentile: 0.999986,
          total: 2926426
        },
        {
          latency: 216.703,
          percentile: 0.999988,
          total: 2926431
        },
        {
          latency: 219.135,
          percentile: 0.999989,
          total: 2926436
        },
        {
          latency: 220.671,
          percentile: 0.999991,
          total: 2926441
        },
        {
          latency: 221.695,
          percentile: 0.999992,
          total: 2926444
        },
        {
          latency: 221.823,
          percentile: 0.999993,
          total: 2926446
        },
        {
          latency: 222.463,
          percentile: 0.999994,
          total: 2926449
        },
        {
          latency: 222.719,
          percentile: 0.999995,
          total: 2926452
        },
        {
          latency: 222.847,
          percentile: 0.999995,
          total: 2926453
        },
        {
          latency: 223.103,
          percentile: 0.999996,
          total: 2926455
        },
        {
          latency: 223.231,
          percentile: 0.999997,
          total: 2926457
        },
        {
          latency: 223.359,
          percentile: 0.999997,
          total: 2926458
        },
        {
          latency: 223.487,
          percentile: 0.999997,
          total: 2926460
        },
        {
          latency: 223.487,
          percentile: 0.999998,
          total: 2926460
        },
        {
          latency: 223.871,
          percentile: 0.999998,
          total: 2926461
        },
        {
          latency: 223.871,
          percentile: 0.999998,
          total: 2926461
        },
        {
          latency: 223.999,
          percentile: 0.999998,
          total: 2926462
        },
        {
          latency: 224.383,
          percentile: 0.999999,
          total: 2926463
        },
        {
          latency: 224.383,
          percentile: 0.999999,
          total: 2926463
        },
        {
          latency: 225.535,
          percentile: 0.999999,
          total: 2926464
        },
        {
          latency: 225.535,
          percentile: 0.999999,
          total: 2926464
        },
        {
          latency: 225.535,
          percentile: 0.999999,
          total: 2926464
        },
        {
          latency: 226.431,
          percentile: 0.999999,
          total: 2926465
        },
        {
          latency: 226.431,
          percentile: 0.999999,
          total: 2926465
        },
        {
          latency: 226.431,
          percentile: 1,
          total: 2926465
        },
        {
          latency: 226.431,
          percentile: 1,
          total: 2926465
        },
        {
          latency: 226.431,
          percentile: 1,
          total: 2926465
        },
        {
          latency: 228.607,
          percentile: 1,
          total: 2926466
        },
        {
          latency: 228.607,
          percentile: 1,
          total: 2926466
        }
      ]
    }
  },
  {
    opts: {
      path: '../wrk2/wrk',
      rate: 10200,
      duration: '300s',
      threads: 4,
      connections: 200,
      printLatency: true,
      url: 'http://107.21.1.157/queryU'
    },
    result: {
      transferPerSec: '5.44MB',
      requestsPerSec: 10196.01,
      non2xx3xx: 18083,
      requestsTotal: 3058812,
      durationActual: '5.00m',
      transferTotal: '1.59GB',
      latencyAvg: 'calibration:',
      latencyStdev: 'mean',
      latencyMax: 'lat.:',
      latencyStdevPerc: null,
      rpsAvg: 'calibration:',
      rpsStdev: 'mean',
      rpsMax: 'lat.:',
      rpsStdevPerc: null,
      histogram: [
        {
          latency: 1.88,
          percentile: 0.1,
          total: 296055
        },
        {
          latency: 2.259,
          percentile: 0.2,
          total: 592320
        },
        {
          latency: 2.611,
          percentile: 0.3,
          total: 887981
        },
        {
          latency: 2.979,
          percentile: 0.4,
          total: 1183006
        },
        {
          latency: 3.385,
          percentile: 0.5,
          total: 1479036
        },
        {
          latency: 3.607,
          percentile: 0.55,
          total: 1625720
        },
        {
          latency: 3.855,
          percentile: 0.6,
          total: 1773890
        },
        {
          latency: 4.135,
          percentile: 0.65,
          total: 1922003
        },
        {
          latency: 4.455,
          percentile: 0.7,
          total: 2069815
        },
        {
          latency: 4.843,
          percentile: 0.75,
          total: 2217328
        },
        {
          latency: 5.067,
          percentile: 0.775,
          total: 2290723
        },
        {
          latency: 5.319,
          percentile: 0.8,
          total: 2364697
        },
        {
          latency: 5.603,
          percentile: 0.825,
          total: 2438582
        },
        {
          latency: 5.923,
          percentile: 0.85,
          total: 2512306
        },
        {
          latency: 6.295,
          percentile: 0.875,
          total: 2586221
        },
        {
          latency: 6.511,
          percentile: 0.8875,
          total: 2623362
        },
        {
          latency: 6.747,
          percentile: 0.9,
          total: 2659912
        },
        {
          latency: 7.019,
          percentile: 0.9125,
          total: 2696896
        },
        {
          latency: 7.327,
          percentile: 0.925,
          total: 2734246
        },
        {
          latency: 7.667,
          percentile: 0.9375,
          total: 2770957
        },
        {
          latency: 7.859,
          percentile: 0.94375,
          total: 2789230
        },
        {
          latency: 8.079,
          percentile: 0.95,
          total: 2807942
        },
        {
          latency: 8.327,
          percentile: 0.95625,
          total: 2826512
        },
        {
          latency: 8.607,
          percentile: 0.9625,
          total: 2844857
        },
        {
          latency: 8.943,
          percentile: 0.96875,
          total: 2863289
        },
        {
          latency: 9.135,
          percentile: 0.971875,
          total: 2872533
        },
        {
          latency: 9.343,
          percentile: 0.975,
          total: 2881652
        },
        {
          latency: 9.591,
          percentile: 0.978125,
          total: 2890927
        },
        {
          latency: 9.879,
          percentile: 0.98125,
          total: 2900284
        },
        {
          latency: 10.207,
          percentile: 0.984375,
          total: 2909430
        },
        {
          latency: 10.399,
          percentile: 0.985938,
          total: 2914072
        },
        {
          latency: 10.623,
          percentile: 0.9875,
          total: 2918662
        },
        {
          latency: 10.855,
          percentile: 0.989062,
          total: 2923150
        },
        {
          latency: 11.127,
          percentile: 0.990625,
          total: 2927812
        },
        {
          latency: 11.439,
          percentile: 0.992188,
          total: 2932414
        },
        {
          latency: 11.615,
          percentile: 0.992969,
          total: 2934675
        },
        {
          latency: 11.823,
          percentile: 0.99375,
          total: 2937039
        },
        {
          latency: 12.071,
          percentile: 0.994531,
          total: 2939346
        },
        {
          latency: 12.359,
          percentile: 0.995313,
          total: 2941624
        },
        {
          latency: 12.719,
          percentile: 0.996094,
          total: 2943922
        },
        {
          latency: 12.935,
          percentile: 0.996484,
          total: 2945094
        },
        {
          latency: 13.167,
          percentile: 0.996875,
          total: 2946234
        },
        {
          latency: 13.423,
          percentile: 0.997266,
          total: 2947378
        },
        {
          latency: 13.743,
          percentile: 0.997656,
          total: 2948543
        },
        {
          latency: 14.095,
          percentile: 0.998047,
          total: 2949683
        },
        {
          latency: 14.303,
          percentile: 0.998242,
          total: 2950276
        },
        {
          latency: 14.551,
          percentile: 0.998437,
          total: 2950840
        },
        {
          latency: 14.839,
          percentile: 0.998633,
          total: 2951420
        },
        {
          latency: 15.167,
          percentile: 0.998828,
          total: 2951998
        },
        {
          latency: 15.607,
          percentile: 0.999023,
          total: 2952569
        },
        {
          latency: 15.863,
          percentile: 0.999121,
          total: 2952863
        },
        {
          latency: 16.151,
          percentile: 0.999219,
          total: 2953145
        },
        {
          latency: 16.511,
          percentile: 0.999316,
          total: 2953435
        },
        {
          latency: 16.959,
          percentile: 0.999414,
          total: 2953721
        },
        {
          latency: 17.487,
          percentile: 0.999512,
          total: 2954011
        },
        {
          latency: 17.887,
          percentile: 0.999561,
          total: 2954154
        },
        {
          latency: 18.287,
          percentile: 0.999609,
          total: 2954302
        },
        {
          latency: 18.863,
          percentile: 0.999658,
          total: 2954444
        },
        {
          latency: 19.807,
          percentile: 0.999707,
          total: 2954588
        },
        {
          latency: 21.599,
          percentile: 0.999756,
          total: 2954731
        },
        {
          latency: 23.567,
          percentile: 0.99978,
          total: 2954802
        },
        {
          latency: 40.415,
          percentile: 0.999805,
          total: 2954874
        },
        {
          latency: 61.855,
          percentile: 0.999829,
          total: 2954946
        },
        {
          latency: 85.247,
          percentile: 0.999854,
          total: 2955019
        },
        {
          latency: 110.527,
          percentile: 0.999878,
          total: 2955091
        },
        {
          latency: 117.119,
          percentile: 0.99989,
          total: 2955127
        },
        {
          latency: 132.607,
          percentile: 0.999902,
          total: 2955164
        },
        {
          latency: 146.431,
          percentile: 0.999915,
          total: 2955199
        },
        {
          latency: 153.087,
          percentile: 0.999927,
          total: 2955235
        },
        {
          latency: 168.703,
          percentile: 0.999939,
          total: 2955272
        },
        {
          latency: 170.879,
          percentile: 0.999945,
          total: 2955290
        },
        {
          latency: 182.399,
          percentile: 0.999951,
          total: 2955307
        },
        {
          latency: 186.495,
          percentile: 0.999957,
          total: 2955325
        },
        {
          latency: 188.927,
          percentile: 0.999963,
          total: 2955345
        },
        {
          latency: 200.831,
          percentile: 0.999969,
          total: 2955361
        },
        {
          latency: 202.495,
          percentile: 0.999973,
          total: 2955371
        },
        {
          latency: 203.903,
          percentile: 0.999976,
          total: 2955379
        },
        {
          latency: 205.567,
          percentile: 0.999979,
          total: 2955388
        },
        {
          latency: 206.463,
          percentile: 0.999982,
          total: 2955397
        },
        {
          latency: 208.767,
          percentile: 0.999985,
          total: 2955407
        },
        {
          latency: 210.559,
          percentile: 0.999986,
          total: 2955411
        },
        {
          latency: 217.855,
          percentile: 0.999988,
          total: 2955415
        },
        {
          latency: 218.879,
          percentile: 0.999989,
          total: 2955421
        },
        {
          latency: 219.007,
          percentile: 0.999991,
          total: 2955424
        },
        {
          latency: 219.903,
          percentile: 0.999992,
          total: 2955430
        },
        {
          latency: 220.159,
          percentile: 0.999993,
          total: 2955431
        },
        {
          latency: 220.287,
          percentile: 0.999994,
          total: 2955433
        },
        {
          latency: 221.183,
          percentile: 0.999995,
          total: 2955436
        },
        {
          latency: 221.311,
          percentile: 0.999995,
          total: 2955438
        },
        {
          latency: 222.207,
          percentile: 0.999996,
          total: 2955440
        },
        {
          latency: 222.847,
          percentile: 0.999997,
          total: 2955441
        },
        {
          latency: 223.103,
          percentile: 0.999997,
          total: 2955442
        },
        {
          latency: 223.359,
          percentile: 0.999997,
          total: 2955445
        },
        {
          latency: 223.359,
          percentile: 0.999998,
          total: 2955445
        },
        {
          latency: 223.487,
          percentile: 0.999998,
          total: 2955446
        },
        {
          latency: 223.487,
          percentile: 0.999998,
          total: 2955446
        },
        {
          latency: 223.999,
          percentile: 0.999998,
          total: 2955447
        },
        {
          latency: 225.023,
          percentile: 0.999999,
          total: 2955448
        },
        {
          latency: 225.023,
          percentile: 0.999999,
          total: 2955448
        },
        {
          latency: 226.815,
          percentile: 0.999999,
          total: 2955449
        },
        {
          latency: 226.815,
          percentile: 0.999999,
          total: 2955449
        },
        {
          latency: 226.815,
          percentile: 0.999999,
          total: 2955449
        },
        {
          latency: 227.583,
          percentile: 0.999999,
          total: 2955450
        },
        {
          latency: 227.583,
          percentile: 0.999999,
          total: 2955450
        },
        {
          latency: 227.583,
          percentile: 1,
          total: 2955450
        },
        {
          latency: 227.583,
          percentile: 1,
          total: 2955450
        },
        {
          latency: 227.583,
          percentile: 1,
          total: 2955450
        },
        {
          latency: 228.991,
          percentile: 1,
          total: 2955451
        },
        {
          latency: 228.991,
          percentile: 1,
          total: 2955451
        }
      ]
    }
  },
  {
    opts: {
      path: '../wrk2/wrk',
      rate: 10300,
      duration: '300s',
      threads: 4,
      connections: 200,
      printLatency: true,
      url: 'http://107.21.1.157/queryU'
    },
    result: {
      transferPerSec: '5.52MB',
      requestsPerSec: 10295.97,
      non2xx3xx: 1851,
      requestsTotal: 3088783,
      durationActual: '5.00m',
      transferTotal: '1.62GB',
      latencyAvg: 'calibration:',
      latencyStdev: 'mean',
      latencyMax: 'lat.:',
      latencyStdevPerc: null,
      rpsAvg: 'calibration:',
      rpsStdev: 'mean',
      rpsMax: 'lat.:',
      rpsStdevPerc: null,
      histogram: [
        {
          latency: 1.882,
          percentile: 0.1,
          total: 298871
        },
        {
          latency: 2.221,
          percentile: 0.2,
          total: 597711
        },
        {
          latency: 2.535,
          percentile: 0.3,
          total: 896653
        },
        {
          latency: 2.873,
          percentile: 0.4,
          total: 1195360
        },
        {
          latency: 3.273,
          percentile: 0.5,
          total: 1493530
        },
        {
          latency: 3.491,
          percentile: 0.55,
          total: 1642301
        },
        {
          latency: 3.731,
          percentile: 0.6,
          total: 1791295
        },
        {
          latency: 4.005,
          percentile: 0.65,
          total: 1940646
        },
        {
          latency: 4.319,
          percentile: 0.7,
          total: 2090203
        },
        {
          latency: 4.687,
          percentile: 0.75,
          total: 2238634
        },
        {
          latency: 4.903,
          percentile: 0.775,
          total: 2313410
        },
        {
          latency: 5.147,
          percentile: 0.8,
          total: 2388310
        },
        {
          latency: 5.419,
          percentile: 0.825,
          total: 2462360
        },
        {
          latency: 5.731,
          percentile: 0.85,
          total: 2536982
        },
        {
          latency: 6.091,
          percentile: 0.875,
          total: 2611950
        },
        {
          latency: 6.295,
          percentile: 0.8875,
          total: 2649274
        },
        {
          latency: 6.519,
          percentile: 0.9,
          total: 2686550
        },
        {
          latency: 6.771,
          percentile: 0.9125,
          total: 2723514
        },
        {
          latency: 7.067,
          percentile: 0.925,
          total: 2760657
        },
        {
          latency: 7.431,
          percentile: 0.9375,
          total: 2798228
        },
        {
          latency: 7.643,
          percentile: 0.94375,
          total: 2816810
        },
        {
          latency: 7.879,
          percentile: 0.95,
          total: 2835404
        },
        {
          latency: 8.147,
          percentile: 0.95625,
          total: 2854029
        },
        {
          latency: 8.447,
          percentile: 0.9625,
          total: 2872671
        },
        {
          latency: 8.791,
          percentile: 0.96875,
          total: 2891202
        },
        {
          latency: 8.991,
          percentile: 0.971875,
          total: 2900714
        },
        {
          latency: 9.207,
          percentile: 0.975,
          total: 2910066
        },
        {
          latency: 9.439,
          percentile: 0.978125,
          total: 2919154
        },
        {
          latency: 9.719,
          percentile: 0.98125,
          total: 2928570
        },
        {
          latency: 10.055,
          percentile: 0.984375,
          total: 2937848
        },
        {
          latency: 10.263,
          percentile: 0.985938,
          total: 2942537
        },
        {
          latency: 10.495,
          percentile: 0.9875,
          total: 2947196
        },
        {
          latency: 10.767,
          percentile: 0.989062,
          total: 2951834
        },
        {
          latency: 11.071,
          percentile: 0.990625,
          total: 2956434
        },
        {
          latency: 11.431,
          percentile: 0.992188,
          total: 2961159
        },
        {
          latency: 11.623,
          percentile: 0.992969,
          total: 2963481
        },
        {
          latency: 11.831,
          percentile: 0.99375,
          total: 2965792
        },
        {
          latency: 12.063,
          percentile: 0.994531,
          total: 2968090
        },
        {
          latency: 12.359,
          percentile: 0.995313,
          total: 2970469
        },
        {
          latency: 12.719,
          percentile: 0.996094,
          total: 2972772
        },
        {
          latency: 12.935,
          percentile: 0.996484,
          total: 2973921
        },
        {
          latency: 13.191,
          percentile: 0.996875,
          total: 2975073
        },
        {
          latency: 13.495,
          percentile: 0.997266,
          total: 2976267
        },
        {
          latency: 13.847,
          percentile: 0.997656,
          total: 2977414
        },
        {
          latency: 14.279,
          percentile: 0.998047,
          total: 2978581
        },
        {
          latency: 14.527,
          percentile: 0.998242,
          total: 2979159
        },
        {
          latency: 14.807,
          percentile: 0.998437,
          total: 2979744
        },
        {
          latency: 15.151,
          percentile: 0.998633,
          total: 2980322
        },
        {
          latency: 15.575,
          percentile: 0.998828,
          total: 2980911
        },
        {
          latency: 16.063,
          percentile: 0.999023,
          total: 2981493
        },
        {
          latency: 16.383,
          percentile: 0.999121,
          total: 2981776
        },
        {
          latency: 16.751,
          percentile: 0.999219,
          total: 2982070
        },
        {
          latency: 17.199,
          percentile: 0.999316,
          total: 2982362
        },
        {
          latency: 17.807,
          percentile: 0.999414,
          total: 2982658
        },
        {
          latency: 18.559,
          percentile: 0.999512,
          total: 2982943
        },
        {
          latency: 19.151,
          percentile: 0.999561,
          total: 2983090
        },
        {
          latency: 20.143,
          percentile: 0.999609,
          total: 2983237
        },
        {
          latency: 22.319,
          percentile: 0.999658,
          total: 2983379
        },
        {
          latency: 38.783,
          percentile: 0.999707,
          total: 2983525
        },
        {
          latency: 71.359,
          percentile: 0.999756,
          total: 2983671
        },
        {
          latency: 84.863,
          percentile: 0.99978,
          total: 2983744
        },
        {
          latency: 99.519,
          percentile: 0.999805,
          total: 2983817
        },
        {
          latency: 115.263,
          percentile: 0.999829,
          total: 2983889
        },
        {
          latency: 131.839,
          percentile: 0.999854,
          total: 2983962
        },
        {
          latency: 149.247,
          percentile: 0.999878,
          total: 2984035
        },
        {
          latency: 152.831,
          percentile: 0.99989,
          total: 2984074
        },
        {
          latency: 166.655,
          percentile: 0.999902,
          total: 2984109
        },
        {
          latency: 169.983,
          percentile: 0.999915,
          total: 2984144
        },
        {
          latency: 182.783,
          percentile: 0.999927,
          total: 2984181
        },
        {
          latency: 187.135,
          percentile: 0.999939,
          total: 2984218
        },
        {
          latency: 188.927,
          percentile: 0.999945,
          total: 2984236
        },
        {
          latency: 197.631,
          percentile: 0.999951,
          total: 2984254
        },
        {
          latency: 202.623,
          percentile: 0.999957,
          total: 2984272
        },
        {
          latency: 203.903,
          percentile: 0.999963,
          total: 2984290
        },
        {
          latency: 205.823,
          percentile: 0.999969,
          total: 2984308
        },
        {
          latency: 206.975,
          percentile: 0.999973,
          total: 2984319
        },
        {
          latency: 209.535,
          percentile: 0.999976,
          total: 2984327
        },
        {
          latency: 216.959,
          percentile: 0.999979,
          total: 2984336
        },
        {
          latency: 218.495,
          percentile: 0.999982,
          total: 2984345
        },
        {
          latency: 219.391,
          percentile: 0.999985,
          total: 2984354
        },
        {
          latency: 219.903,
          percentile: 0.999986,
          total: 2984359
        },
        {
          latency: 220.543,
          percentile: 0.999988,
          total: 2984363
        },
        {
          latency: 221.055,
          percentile: 0.999989,
          total: 2984369
        },
        {
          latency: 221.311,
          percentile: 0.999991,
          total: 2984375
        },
        {
          latency: 221.439,
          percentile: 0.999992,
          total: 2984378
        },
        {
          latency: 221.695,
          percentile: 0.999993,
          total: 2984380
        },
        {
          latency: 222.207,
          percentile: 0.999994,
          total: 2984381
        },
        {
          latency: 222.335,
          percentile: 0.999995,
          total: 2984384
        },
        {
          latency: 222.463,
          percentile: 0.999995,
          total: 2984386
        },
        {
          latency: 222.719,
          percentile: 0.999996,
          total: 2984389
        },
        {
          latency: 222.719,
          percentile: 0.999997,
          total: 2984389
        },
        {
          latency: 223.103,
          percentile: 0.999997,
          total: 2984390
        },
        {
          latency: 223.231,
          percentile: 0.999997,
          total: 2984392
        },
        {
          latency: 223.743,
          percentile: 0.999998,
          total: 2984393
        },
        {
          latency: 224.255,
          percentile: 0.999998,
          total: 2984394
        },
        {
          latency: 224.255,
          percentile: 0.999998,
          total: 2984394
        },
        {
          latency: 224.383,
          percentile: 0.999998,
          total: 2984395
        },
        {
          latency: 226.431,
          percentile: 0.999999,
          total: 2984396
        },
        {
          latency: 226.431,
          percentile: 0.999999,
          total: 2984396
        },
        {
          latency: 227.199,
          percentile: 0.999999,
          total: 2984397
        },
        {
          latency: 227.199,
          percentile: 0.999999,
          total: 2984397
        },
        {
          latency: 227.199,
          percentile: 0.999999,
          total: 2984397
        },
        {
          latency: 227.711,
          percentile: 0.999999,
          total: 2984398
        },
        {
          latency: 227.711,
          percentile: 0.999999,
          total: 2984398
        },
        {
          latency: 227.711,
          percentile: 1,
          total: 2984398
        },
        {
          latency: 227.711,
          percentile: 1,
          total: 2984398
        },
        {
          latency: 227.711,
          percentile: 1,
          total: 2984398
        },
        {
          latency: 231.039,
          percentile: 1,
          total: 2984399
        },
        {
          latency: 231.039,
          percentile: 1,
          total: 2984399
        }
      ]
    }
  },
  {
    opts: {
      path: '../wrk2/wrk',
      rate: 10400,
      duration: '300s',
      threads: 4,
      connections: 200,
      printLatency: true,
      url: 'http://107.21.1.157/queryU'
    },
    result: {
      transferPerSec: '5.57MB',
      requestsPerSec: 10395.93,
      non2xx3xx: 825,
      requestsTotal: 3118776,
      durationActual: '5.00m',
      transferTotal: '1.63GB',
      latencyAvg: 'calibration:',
      latencyStdev: 'mean',
      latencyMax: 'lat.:',
      latencyStdevPerc: null,
      rpsAvg: 'calibration:',
      rpsStdev: 'mean',
      rpsMax: 'lat.:',
      rpsStdevPerc: null,
      histogram: [
        {
          latency: 1.789,
          percentile: 0.1,
          total: 301457
        },
        {
          latency: 2.077,
          percentile: 0.2,
          total: 603308
        },
        {
          latency: 2.335,
          percentile: 0.3,
          total: 905330
        },
        {
          latency: 2.599,
          percentile: 0.4,
          total: 1205833
        },
        {
          latency: 2.899,
          percentile: 0.5,
          total: 1508476
        },
        {
          latency: 3.067,
          percentile: 0.55,
          total: 1658961
        },
        {
          latency: 3.247,
          percentile: 0.6,
          total: 1808516
        },
        {
          latency: 3.445,
          percentile: 0.65,
          total: 1958915
        },
        {
          latency: 3.675,
          percentile: 0.7,
          total: 2110343
        },
        {
          latency: 3.947,
          percentile: 0.75,
          total: 2260186
        },
        {
          latency: 4.103,
          percentile: 0.775,
          total: 2335922
        },
        {
          latency: 4.275,
          percentile: 0.8,
          total: 2412401
        },
        {
          latency: 4.467,
          percentile: 0.825,
          total: 2487055
        },
        {
          latency: 4.691,
          percentile: 0.85,
          total: 2562558
        },
        {
          latency: 4.955,
          percentile: 0.875,
          total: 2637558
        },
        {
          latency: 5.107,
          percentile: 0.8875,
          total: 2675147
        },
        {
          latency: 5.275,
          percentile: 0.9,
          total: 2712099
        },
        {
          latency: 5.471,
          percentile: 0.9125,
          total: 2749993
        },
        {
          latency: 5.695,
          percentile: 0.925,
          total: 2787477
        },
        {
          latency: 5.963,
          percentile: 0.9375,
          total: 2825236
        },
        {
          latency: 6.119,
          percentile: 0.94375,
          total: 2843965
        },
        {
          latency: 6.295,
          percentile: 0.95,
          total: 2862721
        },
        {
          latency: 6.499,
          percentile: 0.95625,
          total: 2881680
        },
        {
          latency: 6.739,
          percentile: 0.9625,
          total: 2900527
        },
        {
          latency: 7.019,
          percentile: 0.96875,
          total: 2919320
        },
        {
          latency: 7.183,
          percentile: 0.971875,
          total: 2928685
        },
        {
          latency: 7.371,
          percentile: 0.975,
          total: 2938069
        },
        {
          latency: 7.591,
          percentile: 0.978125,
          total: 2947538
        },
        {
          latency: 7.851,
          percentile: 0.98125,
          total: 2956933
        },
        {
          latency: 8.167,
          percentile: 0.984375,
          total: 2966373
        },
        {
          latency: 8.359,
          percentile: 0.985938,
          total: 2971105
        },
        {
          latency: 8.575,
          percentile: 0.9875,
          total: 2975733
        },
        {
          latency: 8.831,
          percentile: 0.989062,
          total: 2980479
        },
        {
          latency: 9.135,
          percentile: 0.990625,
          total: 2985207
        },
        {
          latency: 9.511,
          percentile: 0.992188,
          total: 2989874
        },
        {
          latency: 9.727,
          percentile: 0.992969,
          total: 2992215
        },
        {
          latency: 9.991,
          percentile: 0.99375,
          total: 2994627
        },
        {
          latency: 10.279,
          percentile: 0.994531,
          total: 2996955
        },
        {
          latency: 10.607,
          percentile: 0.995313,
          total: 2999290
        },
        {
          latency: 11.007,
          percentile: 0.996094,
          total: 3001632
        },
        {
          latency: 11.247,
          percentile: 0.996484,
          total: 3002808
        },
        {
          latency: 11.519,
          percentile: 0.996875,
          total: 3003999
        },
        {
          latency: 11.799,
          percentile: 0.997266,
          total: 3005152
        },
        {
          latency: 12.143,
          percentile: 0.997656,
          total: 3006335
        },
        {
          latency: 12.543,
          percentile: 0.998047,
          total: 3007507
        },
        {
          latency: 12.783,
          percentile: 0.998242,
          total: 3008090
        },
        {
          latency: 13.055,
          percentile: 0.998437,
          total: 3008689
        },
        {
          latency: 13.367,
          percentile: 0.998633,
          total: 3009282
        },
        {
          latency: 13.727,
          percentile: 0.998828,
          total: 3009868
        },
        {
          latency: 14.175,
          percentile: 0.999023,
          total: 3010445
        },
        {
          latency: 14.455,
          percentile: 0.999121,
          total: 3010744
        },
        {
          latency: 14.815,
          percentile: 0.999219,
          total: 3011037
        },
        {
          latency: 15.215,
          percentile: 0.999316,
          total: 3011327
        },
        {
          latency: 15.687,
          percentile: 0.999414,
          total: 3011623
        },
        {
          latency: 16.399,
          percentile: 0.999512,
          total: 3011915
        },
        {
          latency: 16.991,
          percentile: 0.999561,
          total: 3012063
        },
        {
          latency: 17.647,
          percentile: 0.999609,
          total: 3012209
        },
        {
          latency: 18.543,
          percentile: 0.999658,
          total: 3012359
        },
        {
          latency: 19.919,
          percentile: 0.999707,
          total: 3012503
        },
        {
          latency: 24.863,
          percentile: 0.999756,
          total: 3012650
        },
        {
          latency: 35.647,
          percentile: 0.99978,
          total: 3012723
        },
        {
          latency: 58.303,
          percentile: 0.999805,
          total: 3012797
        },
        {
          latency: 78.975,
          percentile: 0.999829,
          total: 3012871
        },
        {
          latency: 98.687,
          percentile: 0.999854,
          total: 3012944
        },
        {
          latency: 117.951,
          percentile: 0.999878,
          total: 3013018
        },
        {
          latency: 131.007,
          percentile: 0.99989,
          total: 3013054
        },
        {
          latency: 139.775,
          percentile: 0.999902,
          total: 3013092
        },
        {
          latency: 150.911,
          percentile: 0.999915,
          total: 3013129
        },
        {
          latency: 164.991,
          percentile: 0.999927,
          total: 3013165
        },
        {
          latency: 170.495,
          percentile: 0.999939,
          total: 3013204
        },
        {
          latency: 178.815,
          percentile: 0.999945,
          total: 3013220
        },
        {
          latency: 184.831,
          percentile: 0.999951,
          total: 3013241
        },
        {
          latency: 187.263,
          percentile: 0.999957,
          total: 3013258
        },
        {
          latency: 191.103,
          percentile: 0.999963,
          total: 3013275
        },
        {
          latency: 202.239,
          percentile: 0.999969,
          total: 3013294
        },
        {
          latency: 203.007,
          percentile: 0.999973,
          total: 3013303
        },
        {
          latency: 204.159,
          percentile: 0.999976,
          total: 3013312
        },
        {
          latency: 205.055,
          percentile: 0.999979,
          total: 3013321
        },
        {
          latency: 206.079,
          percentile: 0.999982,
          total: 3013331
        },
        {
          latency: 212.351,
          percentile: 0.999985,
          total: 3013340
        },
        {
          latency: 218.367,
          percentile: 0.999986,
          total: 3013344
        },
        {
          latency: 219.519,
          percentile: 0.999988,
          total: 3013349
        },
        {
          latency: 219.903,
          percentile: 0.999989,
          total: 3013353
        },
        {
          latency: 220.287,
          percentile: 0.999991,
          total: 3013358
        },
        {
          latency: 220.671,
          percentile: 0.999992,
          total: 3013363
        },
        {
          latency: 220.799,
          percentile: 0.999993,
          total: 3013365
        },
        {
          latency: 221.311,
          percentile: 0.999994,
          total: 3013368
        },
        {
          latency: 221.439,
          percentile: 0.999995,
          total: 3013369
        },
        {
          latency: 221.951,
          percentile: 0.999995,
          total: 3013373
        },
        {
          latency: 222.079,
          percentile: 0.999996,
          total: 3013375
        },
        {
          latency: 222.079,
          percentile: 0.999997,
          total: 3013375
        },
        {
          latency: 222.207,
          percentile: 0.999997,
          total: 3013376
        },
        {
          latency: 222.335,
          percentile: 0.999997,
          total: 3013377
        },
        {
          latency: 222.463,
          percentile: 0.999998,
          total: 3013379
        },
        {
          latency: 222.975,
          percentile: 0.999998,
          total: 3013380
        },
        {
          latency: 222.975,
          percentile: 0.999998,
          total: 3013380
        },
        {
          latency: 223.103,
          percentile: 0.999998,
          total: 3013381
        },
        {
          latency: 223.103,
          percentile: 0.999999,
          total: 3013381
        },
        {
          latency: 223.359,
          percentile: 0.999999,
          total: 3013382
        },
        {
          latency: 224.383,
          percentile: 0.999999,
          total: 3013383
        },
        {
          latency: 224.383,
          percentile: 0.999999,
          total: 3013383
        },
        {
          latency: 224.383,
          percentile: 0.999999,
          total: 3013383
        },
        {
          latency: 224.383,
          percentile: 0.999999,
          total: 3013383
        },
        {
          latency: 224.639,
          percentile: 0.999999,
          total: 3013384
        },
        {
          latency: 224.639,
          percentile: 1,
          total: 3013384
        },
        {
          latency: 224.639,
          percentile: 1,
          total: 3013384
        },
        {
          latency: 224.639,
          percentile: 1,
          total: 3013384
        },
        {
          latency: 224.639,
          percentile: 1,
          total: 3013384
        },
        {
          latency: 226.559,
          percentile: 1,
          total: 3013385
        },
        {
          latency: 226.559,
          percentile: 1,
          total: 3013385
        }
      ]
    }
  },
  {
    opts: {
      path: '../wrk2/wrk',
      rate: 10500,
      duration: '300s',
      threads: 4,
      connections: 200,
      printLatency: true,
      url: 'http://107.21.1.157/queryU'
    },
    result: {
      transferPerSec: '5.62MB',
      requestsPerSec: 10495.9,
      non2xx3xx: 881,
      requestsTotal: 3148763,
      durationActual: '5.00m',
      transferTotal: '1.65GB',
      latencyAvg: 'calibration:',
      latencyStdev: 'mean',
      latencyMax: 'lat.:',
      latencyStdevPerc: null,
      rpsAvg: 'calibration:',
      rpsStdev: 'mean',
      rpsMax: 'lat.:',
      rpsStdevPerc: null,
      histogram: [
        {
          latency: 1.797,
          percentile: 0.1,
          total: 304611
        },
        {
          latency: 2.075,
          percentile: 0.2,
          total: 609834
        },
        {
          latency: 2.309,
          percentile: 0.3,
          total: 913799
        },
        {
          latency: 2.535,
          percentile: 0.4,
          total: 1217762
        },
        {
          latency: 2.783,
          percentile: 0.5,
          total: 1522516
        },
        {
          latency: 2.925,
          percentile: 0.55,
          total: 1674246
        },
        {
          latency: 3.083,
          percentile: 0.6,
          total: 1826964
        },
        {
          latency: 3.255,
          percentile: 0.65,
          total: 1978316
        },
        {
          latency: 3.451,
          percentile: 0.7,
          total: 2130770
        },
        {
          latency: 3.685,
          percentile: 0.75,
          total: 2282429
        },
        {
          latency: 3.825,
          percentile: 0.775,
          total: 2358730
        },
        {
          latency: 3.987,
          percentile: 0.8,
          total: 2433906
        },
        {
          latency: 4.183,
          percentile: 0.825,
          total: 2510998
        },
        {
          latency: 4.415,
          percentile: 0.85,
          total: 2586639
        },
        {
          latency: 4.699,
          percentile: 0.875,
          total: 2662524
        },
        {
          latency: 4.867,
          percentile: 0.8875,
          total: 2700764
        },
        {
          latency: 5.051,
          percentile: 0.9,
          total: 2738675
        },
        {
          latency: 5.255,
          percentile: 0.9125,
          total: 2776271
        },
        {
          latency: 5.491,
          percentile: 0.925,
          total: 2814764
        },
        {
          latency: 5.771,
          percentile: 0.9375,
          total: 2852420
        },
        {
          latency: 5.939,
          percentile: 0.94375,
          total: 2871542
        },
        {
          latency: 6.127,
          percentile: 0.95,
          total: 2890531
        },
        {
          latency: 6.339,
          percentile: 0.95625,
          total: 2909280
        },
        {
          latency: 6.591,
          percentile: 0.9625,
          total: 2928283
        },
        {
          latency: 6.895,
          percentile: 0.96875,
          total: 2947496
        },
        {
          latency: 7.071,
          percentile: 0.971875,
          total: 2956911
        },
        {
          latency: 7.267,
          percentile: 0.975,
          total: 2966410
        },
        {
          latency: 7.495,
          percentile: 0.978125,
          total: 2975914
        },
        {
          latency: 7.759,
          percentile: 0.98125,
          total: 2985413
        },
        {
          latency: 8.075,
          percentile: 0.984375,
          total: 2994861
        },
        {
          latency: 8.263,
          percentile: 0.985938,
          total: 2999615
        },
        {
          latency: 8.479,
          percentile: 0.9875,
          total: 3004340
        },
        {
          latency: 8.735,
          percentile: 0.989062,
          total: 3009156
        },
        {
          latency: 9.031,
          percentile: 0.990625,
          total: 3013916
        },
        {
          latency: 9.399,
          percentile: 0.992188,
          total: 3018604
        },
        {
          latency: 9.615,
          percentile: 0.992969,
          total: 3021001
        },
        {
          latency: 9.863,
          percentile: 0.99375,
          total: 3023415
        },
        {
          latency: 10.167,
          percentile: 0.994531,
          total: 3025766
        },
        {
          latency: 10.503,
          percentile: 0.995313,
          total: 3028137
        },
        {
          latency: 10.911,
          percentile: 0.996094,
          total: 3030500
        },
        {
          latency: 11.151,
          percentile: 0.996484,
          total: 3031663
        },
        {
          latency: 11.431,
          percentile: 0.996875,
          total: 3032859
        },
        {
          latency: 11.735,
          percentile: 0.997266,
          total: 3034059
        },
        {
          latency: 12.087,
          percentile: 0.997656,
          total: 3035225
        },
        {
          latency: 12.527,
          percentile: 0.998047,
          total: 3036430
        },
        {
          latency: 12.775,
          percentile: 0.998242,
          total: 3037010
        },
        {
          latency: 13.071,
          percentile: 0.998437,
          total: 3037609
        },
        {
          latency: 13.399,
          percentile: 0.998633,
          total: 3038199
        },
        {
          latency: 13.807,
          percentile: 0.998828,
          total: 3038795
        },
        {
          latency: 14.319,
          percentile: 0.999023,
          total: 3039389
        },
        {
          latency: 14.583,
          percentile: 0.999121,
          total: 3039690
        },
        {
          latency: 14.911,
          percentile: 0.999219,
          total: 3039984
        },
        {
          latency: 15.359,
          percentile: 0.999316,
          total: 3040276
        },
        {
          latency: 15.927,
          percentile: 0.999414,
          total: 3040573
        },
        {
          latency: 16.591,
          percentile: 0.999512,
          total: 3040870
        },
        {
          latency: 17.071,
          percentile: 0.999561,
          total: 3041026
        },
        {
          latency: 17.663,
          percentile: 0.999609,
          total: 3041169
        },
        {
          latency: 18.495,
          percentile: 0.999658,
          total: 3041317
        },
        {
          latency: 19.599,
          percentile: 0.999707,
          total: 3041465
        },
        {
          latency: 21.503,
          percentile: 0.999756,
          total: 3041613
        },
        {
          latency: 22.767,
          percentile: 0.99978,
          total: 3041687
        },
        {
          latency: 25.903,
          percentile: 0.999805,
          total: 3041761
        },
        {
          latency: 46.815,
          percentile: 0.999829,
          total: 3041836
        },
        {
          latency: 70.271,
          percentile: 0.999854,
          total: 3041910
        },
        {
          latency: 97.855,
          percentile: 0.999878,
          total: 3041984
        },
        {
          latency: 107.711,
          percentile: 0.99989,
          total: 3042021
        },
        {
          latency: 121.535,
          percentile: 0.999902,
          total: 3042058
        },
        {
          latency: 134.655,
          percentile: 0.999915,
          total: 3042096
        },
        {
          latency: 150.015,
          percentile: 0.999927,
          total: 3042133
        },
        {
          latency: 160.383,
          percentile: 0.999939,
          total: 3042170
        },
        {
          latency: 168.319,
          percentile: 0.999945,
          total: 3042190
        },
        {
          latency: 172.287,
          percentile: 0.999951,
          total: 3042207
        },
        {
          latency: 182.911,
          percentile: 0.999957,
          total: 3042226
        },
        {
          latency: 186.239,
          percentile: 0.999963,
          total: 3042244
        },
        {
          latency: 191.231,
          percentile: 0.999969,
          total: 3042263
        },
        {
          latency: 199.167,
          percentile: 0.999973,
          total: 3042272
        },
        {
          latency: 202.495,
          percentile: 0.999976,
          total: 3042281
        },
        {
          latency: 203.647,
          percentile: 0.999979,
          total: 3042292
        },
        {
          latency: 204.671,
          percentile: 0.999982,
          total: 3042300
        },
        {
          latency: 206.847,
          percentile: 0.999985,
          total: 3042309
        },
        {
          latency: 209.663,
          percentile: 0.999986,
          total: 3042314
        },
        {
          latency: 212.607,
          percentile: 0.999988,
          total: 3042318
        },
        {
          latency: 217.983,
          percentile: 0.999989,
          total: 3042323
        },
        {
          latency: 220.031,
          percentile: 0.999991,
          total: 3042329
        },
        {
          latency: 220.671,
          percentile: 0.999992,
          total: 3042332
        },
        {
          latency: 221.439,
          percentile: 0.999993,
          total: 3042335
        },
        {
          latency: 221.567,
          percentile: 0.999994,
          total: 3042339
        },
        {
          latency: 221.567,
          percentile: 0.999995,
          total: 3042339
        },
        {
          latency: 222.079,
          percentile: 0.999995,
          total: 3042343
        },
        {
          latency: 222.463,
          percentile: 0.999996,
          total: 3042344
        },
        {
          latency: 222.847,
          percentile: 0.999997,
          total: 3042345
        },
        {
          latency: 224.127,
          percentile: 0.999997,
          total: 3042346
        },
        {
          latency: 224.895,
          percentile: 0.999997,
          total: 3042347
        },
        {
          latency: 227.711,
          percentile: 0.999998,
          total: 3042349
        },
        {
          latency: 244.991,
          percentile: 0.999998,
          total: 3042350
        },
        {
          latency: 244.991,
          percentile: 0.999998,
          total: 3042350
        },
        {
          latency: 262.399,
          percentile: 0.999998,
          total: 3042351
        },
        {
          latency: 262.399,
          percentile: 0.999999,
          total: 3042351
        },
        {
          latency: 280.063,
          percentile: 0.999999,
          total: 3042352
        },
        {
          latency: 297.727,
          percentile: 0.999999,
          total: 3042353
        },
        {
          latency: 297.727,
          percentile: 0.999999,
          total: 3042353
        },
        {
          latency: 297.727,
          percentile: 0.999999,
          total: 3042353
        },
        {
          latency: 297.727,
          percentile: 0.999999,
          total: 3042353
        },
        {
          latency: 314.623,
          percentile: 0.999999,
          total: 3042354
        },
        {
          latency: 314.623,
          percentile: 1,
          total: 3042354
        },
        {
          latency: 314.623,
          percentile: 1,
          total: 3042354
        },
        {
          latency: 314.623,
          percentile: 1,
          total: 3042354
        },
        {
          latency: 314.623,
          percentile: 1,
          total: 3042354
        },
        {
          latency: 332.543,
          percentile: 1,
          total: 3042355
        },
        {
          latency: 332.543,
          percentile: 1,
          total: 3042355
        }
      ]
    }
  },
  {
    opts: {
      path: '../wrk2/wrk',
      rate: 10600,
      duration: '300s',
      threads: 4,
      connections: 200,
      printLatency: true,
      url: 'http://107.21.1.157/queryU'
    },
    result: {
      transferPerSec: '5.68MB',
      requestsPerSec: 10595.86,
      non2xx3xx: 532,
      requestsTotal: 3178752,
      durationActual: '5.00m',
      transferTotal: '1.66GB',
      latencyAvg: 'calibration:',
      latencyStdev: 'mean',
      latencyMax: 'lat.:',
      latencyStdevPerc: null,
      rpsAvg: 'calibration:',
      rpsStdev: 'mean',
      rpsMax: 'lat.:',
      rpsStdevPerc: null,
      histogram: [
        {
          latency: 1.772,
          percentile: 0.1,
          total: 308151
        },
        {
          latency: 2.02,
          percentile: 0.2,
          total: 614430
        },
        {
          latency: 2.229,
          percentile: 0.3,
          total: 921946
        },
        {
          latency: 2.427,
          percentile: 0.4,
          total: 1230615
        },
        {
          latency: 2.633,
          percentile: 0.5,
          total: 1538045
        },
        {
          latency: 2.747,
          percentile: 0.55,
          total: 1691677
        },
        {
          latency: 2.873,
          percentile: 0.6,
          total: 1844429
        },
        {
          latency: 3.017,
          percentile: 0.65,
          total: 1997724
        },
        {
          latency: 3.185,
          percentile: 0.7,
          total: 2150419
        },
        {
          latency: 3.391,
          percentile: 0.75,
          total: 2304521
        },
        {
          latency: 3.511,
          percentile: 0.775,
          total: 2380928
        },
        {
          latency: 3.645,
          percentile: 0.8,
          total: 2457361
        },
        {
          latency: 3.801,
          percentile: 0.825,
          total: 2534757
        },
        {
          latency: 3.977,
          percentile: 0.85,
          total: 2611051
        },
        {
          latency: 4.187,
          percentile: 0.875,
          total: 2687476
        },
        {
          latency: 4.311,
          percentile: 0.8875,
          total: 2726295
        },
        {
          latency: 4.451,
          percentile: 0.9,
          total: 2764804
        },
        {
          latency: 4.611,
          percentile: 0.9125,
          total: 2803286
        },
        {
          latency: 4.795,
          percentile: 0.925,
          total: 2841204
        },
        {
          latency: 5.019,
          percentile: 0.9375,
          total: 2879648
        },
        {
          latency: 5.151,
          percentile: 0.94375,
          total: 2898888
        },
        {
          latency: 5.299,
          percentile: 0.95,
          total: 2917818
        },
        {
          latency: 5.475,
          percentile: 0.95625,
          total: 2936977
        },
        {
          latency: 5.687,
          percentile: 0.9625,
          total: 2956246
        },
        {
          latency: 5.955,
          percentile: 0.96875,
          total: 2975614
        },
        {
          latency: 6.115,
          percentile: 0.971875,
          total: 2985157
        },
        {
          latency: 6.299,
          percentile: 0.975,
          total: 2994580
        },
        {
          latency: 6.527,
          percentile: 0.978125,
          total: 3004238
        },
        {
          latency: 6.795,
          percentile: 0.98125,
          total: 3013802
        },
        {
          latency: 7.119,
          percentile: 0.984375,
          total: 3023424
        },
        {
          latency: 7.315,
          percentile: 0.985938,
          total: 3028213
        },
        {
          latency: 7.535,
          percentile: 0.9875,
          total: 3032969
        },
        {
          latency: 7.807,
          percentile: 0.989062,
          total: 3037792
        },
        {
          latency: 8.135,
          percentile: 0.990625,
          total: 3042564
        },
        {
          latency: 8.559,
          percentile: 0.992188,
          total: 3047354
        },
        {
          latency: 8.831,
          percentile: 0.992969,
          total: 3049742
        },
        {
          latency: 9.151,
          percentile: 0.99375,
          total: 3052165
        },
        {
          latency: 9.519,
          percentile: 0.994531,
          total: 3054564
        },
        {
          latency: 9.927,
          percentile: 0.995313,
          total: 3056951
        },
        {
          latency: 10.415,
          percentile: 0.996094,
          total: 3059356
        },
        {
          latency: 10.703,
          percentile: 0.996484,
          total: 3060554
        },
        {
          latency: 11.039,
          percentile: 0.996875,
          total: 3061743
        },
        {
          latency: 11.399,
          percentile: 0.997266,
          total: 3062952
        },
        {
          latency: 11.831,
          percentile: 0.997656,
          total: 3064140
        },
        {
          latency: 12.351,
          percentile: 0.998047,
          total: 3065332
        },
        {
          latency: 12.663,
          percentile: 0.998242,
          total: 3065933
        },
        {
          latency: 13.071,
          percentile: 0.998437,
          total: 3066542
        },
        {
          latency: 13.575,
          percentile: 0.998633,
          total: 3067137
        },
        {
          latency: 14.175,
          percentile: 0.998828,
          total: 3067731
        },
        {
          latency: 15.079,
          percentile: 0.999023,
          total: 3068330
        },
        {
          latency: 15.647,
          percentile: 0.999121,
          total: 3068629
        },
        {
          latency: 16.351,
          percentile: 0.999219,
          total: 3068929
        },
        {
          latency: 17.183,
          percentile: 0.999316,
          total: 3069235
        },
        {
          latency: 18.559,
          percentile: 0.999414,
          total: 3069528
        },
        {
          latency: 20.879,
          percentile: 0.999512,
          total: 3069829
        },
        {
          latency: 23.007,
          percentile: 0.999561,
          total: 3069978
        },
        {
          latency: 29.327,
          percentile: 0.999609,
          total: 3070128
        },
        {
          latency: 52.863,
          percentile: 0.999658,
          total: 3070278
        },
        {
          latency: 74.943,
          percentile: 0.999707,
          total: 3070428
        },
        {
          latency: 102.207,
          percentile: 0.999756,
          total: 3070579
        },
        {
          latency: 116.095,
          percentile: 0.99978,
          total: 3070654
        },
        {
          latency: 123.263,
          percentile: 0.999805,
          total: 3070728
        },
        {
          latency: 136.959,
          percentile: 0.999829,
          total: 3070804
        },
        {
          latency: 151.039,
          percentile: 0.999854,
          total: 3070878
        },
        {
          latency: 162.431,
          percentile: 0.999878,
          total: 3070953
        },
        {
          latency: 168.959,
          percentile: 0.99989,
          total: 3070990
        },
        {
          latency: 171.775,
          percentile: 0.999902,
          total: 3071028
        },
        {
          latency: 183.935,
          percentile: 0.999915,
          total: 3071065
        },
        {
          latency: 186.879,
          percentile: 0.999927,
          total: 3071103
        },
        {
          latency: 189.823,
          percentile: 0.999939,
          total: 3071140
        },
        {
          latency: 195.327,
          percentile: 0.999945,
          total: 3071159
        },
        {
          latency: 202.751,
          percentile: 0.999951,
          total: 3071178
        },
        {
          latency: 203.647,
          percentile: 0.999957,
          total: 3071198
        },
        {
          latency: 204.671,
          percentile: 0.999963,
          total: 3071215
        },
        {
          latency: 205.823,
          percentile: 0.999969,
          total: 3071236
        },
        {
          latency: 206.335,
          percentile: 0.999973,
          total: 3071245
        },
        {
          latency: 207.487,
          percentile: 0.999976,
          total: 3071253
        },
        {
          latency: 218.623,
          percentile: 0.999979,
          total: 3071264
        },
        {
          latency: 219.391,
          percentile: 0.999982,
          total: 3071271
        },
        {
          latency: 220.159,
          percentile: 0.999985,
          total: 3071284
        },
        {
          latency: 220.287,
          percentile: 0.999986,
          total: 3071288
        },
        {
          latency: 220.415,
          percentile: 0.999988,
          total: 3071291
        },
        {
          latency: 220.799,
          percentile: 0.999989,
          total: 3071298
        },
        {
          latency: 220.927,
          percentile: 0.999991,
          total: 3071301
        },
        {
          latency: 221.311,
          percentile: 0.999992,
          total: 3071306
        },
        {
          latency: 221.311,
          percentile: 0.999993,
          total: 3071306
        },
        {
          latency: 221.439,
          percentile: 0.999994,
          total: 3071310
        },
        {
          latency: 221.567,
          percentile: 0.999995,
          total: 3071312
        },
        {
          latency: 221.695,
          percentile: 0.999995,
          total: 3071314
        },
        {
          latency: 222.335,
          percentile: 0.999996,
          total: 3071316
        },
        {
          latency: 222.591,
          percentile: 0.999997,
          total: 3071318
        },
        {
          latency: 222.591,
          percentile: 0.999997,
          total: 3071318
        },
        {
          latency: 222.719,
          percentile: 0.999997,
          total: 3071320
        },
        {
          latency: 222.719,
          percentile: 0.999998,
          total: 3071320
        },
        {
          latency: 223.359,
          percentile: 0.999998,
          total: 3071322
        },
        {
          latency: 223.359,
          percentile: 0.999998,
          total: 3071322
        },
        {
          latency: 223.871,
          percentile: 0.999998,
          total: 3071323
        },
        {
          latency: 223.871,
          percentile: 0.999999,
          total: 3071323
        },
        {
          latency: 224.127,
          percentile: 0.999999,
          total: 3071324
        },
        {
          latency: 224.767,
          percentile: 0.999999,
          total: 3071325
        },
        {
          latency: 224.767,
          percentile: 0.999999,
          total: 3071325
        },
        {
          latency: 224.767,
          percentile: 0.999999,
          total: 3071325
        },
        {
          latency: 224.767,
          percentile: 0.999999,
          total: 3071325
        },
        {
          latency: 225.023,
          percentile: 0.999999,
          total: 3071326
        },
        {
          latency: 225.023,
          percentile: 1,
          total: 3071326
        },
        {
          latency: 225.023,
          percentile: 1,
          total: 3071326
        },
        {
          latency: 225.023,
          percentile: 1,
          total: 3071326
        },
        {
          latency: 225.023,
          percentile: 1,
          total: 3071326
        },
        {
          latency: 229.247,
          percentile: 1,
          total: 3071327
        },
        {
          latency: 229.247,
          percentile: 1,
          total: 3071327
        }
      ]
    }
  },
  {
    opts: {
      path: '../wrk2/wrk',
      rate: 10700,
      duration: '300s',
      threads: 4,
      connections: 200,
      printLatency: true,
      url: 'http://107.21.1.157/queryU'
    },
    result: {
      transferPerSec: '5.73MB',
      requestsPerSec: 10695.79,
      non2xx3xx: 509,
      requestsTotal: 3208743,
      durationActual: '5.00m',
      transferTotal: '1.68GB',
      latencyAvg: 'calibration:',
      latencyStdev: 'mean',
      latencyMax: 'lat.:',
      latencyStdevPerc: null,
      rpsAvg: 'calibration:',
      rpsStdev: 'mean',
      rpsMax: 'lat.:',
      rpsStdevPerc: null,
      histogram: [
        {
          latency: 1.715,
          percentile: 0.1,
          total: 310049
        },
        {
          latency: 1.935,
          percentile: 0.2,
          total: 620989
        },
        {
          latency: 2.115,
          percentile: 0.3,
          total: 930839
        },
        {
          latency: 2.283,
          percentile: 0.4,
          total: 1241865
        },
        {
          latency: 2.453,
          percentile: 0.5,
          total: 1552132
        },
        {
          latency: 2.545,
          percentile: 0.55,
          total: 1707852
        },
        {
          latency: 2.645,
          percentile: 0.6,
          total: 1862338
        },
        {
          latency: 2.757,
          percentile: 0.65,
          total: 2015878
        },
        {
          latency: 2.891,
          percentile: 0.7,
          total: 2171938
        },
        {
          latency: 3.053,
          percentile: 0.75,
          total: 2325540
        },
        {
          latency: 3.151,
          percentile: 0.775,
          total: 2403102
        },
        {
          latency: 3.263,
          percentile: 0.8,
          total: 2480980
        },
        {
          latency: 3.393,
          percentile: 0.825,
          total: 2558841
        },
        {
          latency: 3.541,
          percentile: 0.85,
          total: 2635288
        },
        {
          latency: 3.721,
          percentile: 0.875,
          total: 2713464
        },
        {
          latency: 3.827,
          percentile: 0.8875,
          total: 2752179
        },
        {
          latency: 3.947,
          percentile: 0.9,
          total: 2790680
        },
        {
          latency: 4.087,
          percentile: 0.9125,
          total: 2829495
        },
        {
          latency: 4.251,
          percentile: 0.925,
          total: 2867970
        },
        {
          latency: 4.455,
          percentile: 0.9375,
          total: 2906805
        },
        {
          latency: 4.575,
          percentile: 0.94375,
          total: 2926088
        },
        {
          latency: 4.715,
          percentile: 0.95,
          total: 2945572
        },
        {
          latency: 4.875,
          percentile: 0.95625,
          total: 2964859
        },
        {
          latency: 5.063,
          percentile: 0.9625,
          total: 2984084
        },
        {
          latency: 5.295,
          percentile: 0.96875,
          total: 3003470
        },
        {
          latency: 5.443,
          percentile: 0.971875,
          total: 3013157
        },
        {
          latency: 5.619,
          percentile: 0.975,
          total: 3022915
        },
        {
          latency: 5.827,
          percentile: 0.978125,
          total: 3032631
        },
        {
          latency: 6.083,
          percentile: 0.98125,
          total: 3042199
        },
        {
          latency: 6.419,
          percentile: 0.984375,
          total: 3051966
        },
        {
          latency: 6.627,
          percentile: 0.985938,
          total: 3056790
        },
        {
          latency: 6.871,
          percentile: 0.9875,
          total: 3061582
        },
        {
          latency: 7.167,
          percentile: 0.989062,
          total: 3066416
        },
        {
          latency: 7.535,
          percentile: 0.990625,
          total: 3071282
        },
        {
          latency: 7.999,
          percentile: 0.992188,
          total: 3076122
        },
        {
          latency: 8.279,
          percentile: 0.992969,
          total: 3078526
        },
        {
          latency: 8.607,
          percentile: 0.99375,
          total: 3080958
        },
        {
          latency: 8.983,
          percentile: 0.994531,
          total: 3083359
        },
        {
          latency: 9.431,
          percentile: 0.995313,
          total: 3085812
        },
        {
          latency: 9.967,
          percentile: 0.996094,
          total: 3088216
        },
        {
          latency: 10.271,
          percentile: 0.996484,
          total: 3089434
        },
        {
          latency: 10.607,
          percentile: 0.996875,
          total: 3090625
        },
        {
          latency: 11.007,
          percentile: 0.997266,
          total: 3091854
        },
        {
          latency: 11.471,
          percentile: 0.997656,
          total: 3093065
        },
        {
          latency: 12.047,
          percentile: 0.998047,
          total: 3094271
        },
        {
          latency: 12.407,
          percentile: 0.998242,
          total: 3094871
        },
        {
          latency: 12.823,
          percentile: 0.998437,
          total: 3095488
        },
        {
          latency: 13.303,
          percentile: 0.998633,
          total: 3096078
        },
        {
          latency: 13.927,
          percentile: 0.998828,
          total: 3096688
        },
        {
          latency: 14.703,
          percentile: 0.999023,
          total: 3097286
        },
        {
          latency: 15.151,
          percentile: 0.999121,
          total: 3097594
        },
        {
          latency: 15.631,
          percentile: 0.999219,
          total: 3097895
        },
        {
          latency: 16.247,
          percentile: 0.999316,
          total: 3098199
        },
        {
          latency: 17.071,
          percentile: 0.999414,
          total: 3098497
        },
        {
          latency: 18.063,
          percentile: 0.999512,
          total: 3098804
        },
        {
          latency: 18.655,
          percentile: 0.999561,
          total: 3098951
        },
        {
          latency: 19.407,
          percentile: 0.999609,
          total: 3099104
        },
        {
          latency: 20.399,
          percentile: 0.999658,
          total: 3099255
        },
        {
          latency: 21.679,
          percentile: 0.999707,
          total: 3099405
        },
        {
          latency: 23.503,
          percentile: 0.999756,
          total: 3099557
        },
        {
          latency: 24.639,
          percentile: 0.99978,
          total: 3099633
        },
        {
          latency: 26.863,
          percentile: 0.999805,
          total: 3099708
        },
        {
          latency: 30.111,
          percentile: 0.999829,
          total: 3099784
        },
        {
          latency: 55.103,
          percentile: 0.999854,
          total: 3099859
        },
        {
          latency: 85.887,
          percentile: 0.999878,
          total: 3099935
        },
        {
          latency: 101.759,
          percentile: 0.99989,
          total: 3099973
        },
        {
          latency: 117.311,
          percentile: 0.999902,
          total: 3100011
        },
        {
          latency: 127.743,
          percentile: 0.999915,
          total: 3100049
        },
        {
          latency: 140.671,
          percentile: 0.999927,
          total: 3100086
        },
        {
          latency: 156.543,
          percentile: 0.999939,
          total: 3100124
        },
        {
          latency: 168.831,
          percentile: 0.999945,
          total: 3100143
        },
        {
          latency: 171.903,
          percentile: 0.999951,
          total: 3100162
        },
        {
          latency: 185.471,
          percentile: 0.999957,
          total: 3100181
        },
        {
          latency: 188.671,
          percentile: 0.999963,
          total: 3100200
        },
        {
          latency: 201.343,
          percentile: 0.999969,
          total: 3100219
        },
        {
          latency: 203.135,
          percentile: 0.999973,
          total: 3100228
        },
        {
          latency: 204.031,
          percentile: 0.999976,
          total: 3100241
        },
        {
          latency: 204.671,
          percentile: 0.999979,
          total: 3100247
        },
        {
          latency: 214.783,
          percentile: 0.999982,
          total: 3100257
        },
        {
          latency: 219.391,
          percentile: 0.999985,
          total: 3100267
        },
        {
          latency: 220.031,
          percentile: 0.999986,
          total: 3100271
        },
        {
          latency: 220.543,
          percentile: 0.999988,
          total: 3100276
        },
        {
          latency: 221.183,
          percentile: 0.999989,
          total: 3100280
        },
        {
          latency: 221.695,
          percentile: 0.999991,
          total: 3100285
        },
        {
          latency: 243.071,
          percentile: 0.999992,
          total: 3100290
        },
        {
          latency: 256.639,
          percentile: 0.999993,
          total: 3100292
        },
        {
          latency: 277.247,
          percentile: 0.999994,
          total: 3100295
        },
        {
          latency: 293.375,
          percentile: 0.999995,
          total: 3100297
        },
        {
          latency: 310.783,
          percentile: 0.999995,
          total: 3100299
        },
        {
          latency: 328.191,
          percentile: 0.999996,
          total: 3100302
        },
        {
          latency: 337.663,
          percentile: 0.999997,
          total: 3100303
        },
        {
          latency: 345.599,
          percentile: 0.999997,
          total: 3100304
        },
        {
          latency: 350.207,
          percentile: 0.999997,
          total: 3100305
        },
        {
          latency: 362.751,
          percentile: 0.999998,
          total: 3100306
        },
        {
          latency: 378.623,
          percentile: 0.999998,
          total: 3100308
        },
        {
          latency: 378.623,
          percentile: 0.999998,
          total: 3100308
        },
        {
          latency: 380.159,
          percentile: 0.999998,
          total: 3100309
        },
        {
          latency: 380.159,
          percentile: 0.999999,
          total: 3100309
        },
        {
          latency: 395.775,
          percentile: 0.999999,
          total: 3100310
        },
        {
          latency: 396.287,
          percentile: 0.999999,
          total: 3100311
        },
        {
          latency: 396.287,
          percentile: 0.999999,
          total: 3100311
        },
        {
          latency: 396.287,
          percentile: 0.999999,
          total: 3100311
        },
        {
          latency: 396.287,
          percentile: 0.999999,
          total: 3100311
        },
        {
          latency: 410.367,
          percentile: 0.999999,
          total: 3100312
        },
        {
          latency: 410.367,
          percentile: 1,
          total: 3100312
        },
        {
          latency: 410.367,
          percentile: 1,
          total: 3100312
        },
        {
          latency: 410.367,
          percentile: 1,
          total: 3100312
        },
        {
          latency: 410.367,
          percentile: 1,
          total: 3100312
        },
        {
          latency: 412.927,
          percentile: 1,
          total: 3100313
        },
        {
          latency: 412.927,
          percentile: 1,
          total: 3100313
        }
      ]
    }
  },
  {
    opts: {
      path: '../wrk2/wrk',
      rate: 10800,
      duration: '300s',
      threads: 4,
      connections: 200,
      printLatency: true,
      url: 'http://107.21.1.157/queryU'
    },
    result: {
      transferPerSec: '5.79MB',
      requestsPerSec: 10795.78,
      non2xx3xx: 430,
      requestsTotal: 3238723,
      durationActual: '5.00m',
      transferTotal: '1.69GB',
      latencyAvg: 'calibration:',
      latencyStdev: 'mean',
      latencyMax: 'lat.:',
      latencyStdevPerc: null,
      rpsAvg: 'calibration:',
      rpsStdev: 'mean',
      rpsMax: 'lat.:',
      rpsStdevPerc: null,
      histogram: [
        {
          latency: 1.714,
          percentile: 0.1,
          total: 313499
        },
        {
          latency: 1.923,
          percentile: 0.2,
          total: 625984
        },
        {
          latency: 2.093,
          percentile: 0.3,
          total: 938808
        },
        {
          latency: 2.249,
          percentile: 0.4,
          total: 1251796
        },
        {
          latency: 2.407,
          percentile: 0.5,
          total: 1568212
        },
        {
          latency: 2.489,
          percentile: 0.55,
          total: 1723721
        },
        {
          latency: 2.577,
          percentile: 0.6,
          total: 1879637
        },
        {
          latency: 2.673,
          percentile: 0.65,
          total: 2034618
        },
        {
          latency: 2.785,
          percentile: 0.7,
          total: 2192658
        },
        {
          latency: 2.917,
          percentile: 0.75,
          total: 2347636
        },
        {
          latency: 2.995,
          percentile: 0.775,
          total: 2426029
        },
        {
          latency: 3.083,
          percentile: 0.8,
          total: 2503910
        },
        {
          latency: 3.185,
          percentile: 0.825,
          total: 2581915
        },
        {
          latency: 3.305,
          percentile: 0.85,
          total: 2660766
        },
        {
          latency: 3.449,
          percentile: 0.875,
          total: 2738764
        },
        {
          latency: 3.533,
          percentile: 0.8875,
          total: 2777435
        },
        {
          latency: 3.629,
          percentile: 0.9,
          total: 2816464
        },
        {
          latency: 3.741,
          percentile: 0.9125,
          total: 2855530
        },
        {
          latency: 3.877,
          percentile: 0.925,
          total: 2894991
        },
        {
          latency: 4.041,
          percentile: 0.9375,
          total: 2933930
        },
        {
          latency: 4.143,
          percentile: 0.94375,
          total: 2953906
        },
        {
          latency: 4.259,
          percentile: 0.95,
          total: 2973369
        },
        {
          latency: 4.399,
          percentile: 0.95625,
          total: 2992719
        },
        {
          latency: 4.575,
          percentile: 0.9625,
          total: 3012104
        },
        {
          latency: 4.807,
          percentile: 0.96875,
          total: 3031706
        },
        {
          latency: 4.947,
          percentile: 0.971875,
          total: 3041334
        },
        {
          latency: 5.119,
          percentile: 0.975,
          total: 3051087
        },
        {
          latency: 5.331,
          percentile: 0.978125,
          total: 3060964
        },
        {
          latency: 5.599,
          percentile: 0.98125,
          total: 3070655
        },
        {
          latency: 5.963,
          percentile: 0.984375,
          total: 3080481
        },
        {
          latency: 6.195,
          percentile: 0.985938,
          total: 3085338
        },
        {
          latency: 6.483,
          percentile: 0.9875,
          total: 3090198
        },
        {
          latency: 6.847,
          percentile: 0.989062,
          total: 3095078
        },
        {
          latency: 7.287,
          percentile: 0.990625,
          total: 3099955
        },
        {
          latency: 7.847,
          percentile: 0.992188,
          total: 3104865
        },
        {
          latency: 8.187,
          percentile: 0.992969,
          total: 3107302
        },
        {
          latency: 8.575,
          percentile: 0.99375,
          total: 3109760
        },
        {
          latency: 9.007,
          percentile: 0.994531,
          total: 3112198
        },
        {
          latency: 9.519,
          percentile: 0.995313,
          total: 3114628
        },
        {
          latency: 10.135,
          percentile: 0.996094,
          total: 3117093
        },
        {
          latency: 10.471,
          percentile: 0.996484,
          total: 3118294
        },
        {
          latency: 10.839,
          percentile: 0.996875,
          total: 3119507
        },
        {
          latency: 11.271,
          percentile: 0.997266,
          total: 3120735
        },
        {
          latency: 11.775,
          percentile: 0.997656,
          total: 3121952
        },
        {
          latency: 12.431,
          percentile: 0.998047,
          total: 3123176
        },
        {
          latency: 12.847,
          percentile: 0.998242,
          total: 3123787
        },
        {
          latency: 13.319,
          percentile: 0.998437,
          total: 3124410
        },
        {
          latency: 13.855,
          percentile: 0.998633,
          total: 3125012
        },
        {
          latency: 14.543,
          percentile: 0.998828,
          total: 3125619
        },
        {
          latency: 15.463,
          percentile: 0.999023,
          total: 3126232
        },
        {
          latency: 15.967,
          percentile: 0.999121,
          total: 3126538
        },
        {
          latency: 16.591,
          percentile: 0.999219,
          total: 3126847
        },
        {
          latency: 17.343,
          percentile: 0.999316,
          total: 3127151
        },
        {
          latency: 18.287,
          percentile: 0.999414,
          total: 3127456
        },
        {
          latency: 19.503,
          percentile: 0.999512,
          total: 3127759
        },
        {
          latency: 20.207,
          percentile: 0.999561,
          total: 3127916
        },
        {
          latency: 21.055,
          percentile: 0.999609,
          total: 3128065
        },
        {
          latency: 22.047,
          percentile: 0.999658,
          total: 3128218
        },
        {
          latency: 23.167,
          percentile: 0.999707,
          total: 3128371
        },
        {
          latency: 25.007,
          percentile: 0.999756,
          total: 3128527
        },
        {
          latency: 26.095,
          percentile: 0.99978,
          total: 3128599
        },
        {
          latency: 27.567,
          percentile: 0.999805,
          total: 3128675
        },
        {
          latency: 34.655,
          percentile: 0.999829,
          total: 3128752
        },
        {
          latency: 57.311,
          percentile: 0.999854,
          total: 3128828
        },
        {
          latency: 88.511,
          percentile: 0.999878,
          total: 3128906
        },
        {
          latency: 103.231,
          percentile: 0.99989,
          total: 3128943
        },
        {
          latency: 117.823,
          percentile: 0.999902,
          total: 3128981
        },
        {
          latency: 126.783,
          percentile: 0.999915,
          total: 3129019
        },
        {
          latency: 140.671,
          percentile: 0.999927,
          total: 3129057
        },
        {
          latency: 155.391,
          percentile: 0.999939,
          total: 3129096
        },
        {
          latency: 169.087,
          percentile: 0.999945,
          total: 3129116
        },
        {
          latency: 171.007,
          percentile: 0.999951,
          total: 3129134
        },
        {
          latency: 181.887,
          percentile: 0.999957,
          total: 3129153
        },
        {
          latency: 187.775,
          percentile: 0.999963,
          total: 3129175
        },
        {
          latency: 189.695,
          percentile: 0.999969,
          total: 3129191
        },
        {
          latency: 201.855,
          percentile: 0.999973,
          total: 3129201
        },
        {
          latency: 203.263,
          percentile: 0.999976,
          total: 3129210
        },
        {
          latency: 204.671,
          percentile: 0.999979,
          total: 3129223
        },
        {
          latency: 205.439,
          percentile: 0.999982,
          total: 3129230
        },
        {
          latency: 207.615,
          percentile: 0.999985,
          total: 3129239
        },
        {
          latency: 218.239,
          percentile: 0.999986,
          total: 3129244
        },
        {
          latency: 219.007,
          percentile: 0.999988,
          total: 3129248
        },
        {
          latency: 219.775,
          percentile: 0.999989,
          total: 3129253
        },
        {
          latency: 221.055,
          percentile: 0.999991,
          total: 3129261
        },
        {
          latency: 221.567,
          percentile: 0.999992,
          total: 3129264
        },
        {
          latency: 221.695,
          percentile: 0.999993,
          total: 3129265
        },
        {
          latency: 221.823,
          percentile: 0.999994,
          total: 3129269
        },
        {
          latency: 221.951,
          percentile: 0.999995,
          total: 3129270
        },
        {
          latency: 222.463,
          percentile: 0.999995,
          total: 3129272
        },
        {
          latency: 223.487,
          percentile: 0.999996,
          total: 3129275
        },
        {
          latency: 227.455,
          percentile: 0.999997,
          total: 3129276
        },
        {
          latency: 230.399,
          percentile: 0.999997,
          total: 3129277
        },
        {
          latency: 243.967,
          percentile: 0.999997,
          total: 3129278
        },
        {
          latency: 260.607,
          percentile: 0.999998,
          total: 3129279
        },
        {
          latency: 293.119,
          percentile: 0.999998,
          total: 3129281
        },
        {
          latency: 293.119,
          percentile: 0.999998,
          total: 3129281
        },
        {
          latency: 308.991,
          percentile: 0.999998,
          total: 3129282
        },
        {
          latency: 308.991,
          percentile: 0.999999,
          total: 3129282
        },
        {
          latency: 325.887,
          percentile: 0.999999,
          total: 3129283
        },
        {
          latency: 342.271,
          percentile: 0.999999,
          total: 3129284
        },
        {
          latency: 342.271,
          percentile: 0.999999,
          total: 3129284
        },
        {
          latency: 342.271,
          percentile: 0.999999,
          total: 3129284
        },
        {
          latency: 342.271,
          percentile: 0.999999,
          total: 3129284
        },
        {
          latency: 358.399,
          percentile: 0.999999,
          total: 3129285
        },
        {
          latency: 358.399,
          percentile: 1,
          total: 3129285
        },
        {
          latency: 358.399,
          percentile: 1,
          total: 3129285
        },
        {
          latency: 358.399,
          percentile: 1,
          total: 3129285
        },
        {
          latency: 358.399,
          percentile: 1,
          total: 3129285
        },
        {
          latency: 375.295,
          percentile: 1,
          total: 3129286
        },
        {
          latency: 375.295,
          percentile: 1,
          total: 3129286
        }
      ]
    }
  },
  {
    opts: {
      path: '../wrk2/wrk',
      rate: 10900,
      duration: '300s',
      threads: 4,
      connections: 200,
      printLatency: true,
      url: 'http://107.21.1.157/queryU'
    },
    result: {
      transferPerSec: '5.83MB',
      requestsPerSec: 10887.78,
      non2xx3xx: 693,
      requestsTotal: 3266331,
      durationActual: '5.00m',
      transferTotal: '1.71GB',
      latencyAvg: 'calibration:',
      latencyStdev: 'mean',
      latencyMax: 'lat.:',
      latencyStdevPerc: null,
      rpsAvg: 'calibration:',
      rpsStdev: 'mean',
      rpsMax: 'lat.:',
      rpsStdevPerc: null,
      histogram: [
        {
          latency: 1.77,
          percentile: 0.1,
          total: 315885
        },
        {
          latency: 2.057,
          percentile: 0.2,
          total: 633757
        },
        {
          latency: 2.311,
          percentile: 0.3,
          total: 949430
        },
        {
          latency: 2.571,
          percentile: 0.4,
          total: 1265267
        },
        {
          latency: 2.867,
          percentile: 0.5,
          total: 1579652
        },
        {
          latency: 3.043,
          percentile: 0.55,
          total: 1737957
        },
        {
          latency: 3.239,
          percentile: 0.6,
          total: 1895020
        },
        {
          latency: 3.463,
          percentile: 0.65,
          total: 2054144
        },
        {
          latency: 3.719,
          percentile: 0.7,
          total: 2211809
        },
        {
          latency: 4.019,
          percentile: 0.75,
          total: 2368928
        },
        {
          latency: 4.187,
          percentile: 0.775,
          total: 2448644
        },
        {
          latency: 4.363,
          percentile: 0.8,
          total: 2527159
        },
        {
          latency: 4.559,
          percentile: 0.825,
          total: 2606941
        },
        {
          latency: 4.775,
          percentile: 0.85,
          total: 2684598
        },
        {
          latency: 5.027,
          percentile: 0.875,
          total: 2764630
        },
        {
          latency: 5.159,
          percentile: 0.8875,
          total: 2802986
        },
        {
          latency: 5.303,
          percentile: 0.9,
          total: 2842527
        },
        {
          latency: 5.463,
          percentile: 0.9125,
          total: 2882386
        },
        {
          latency: 5.647,
          percentile: 0.925,
          total: 2922127
        },
        {
          latency: 5.863,
          percentile: 0.9375,
          total: 2961012
        },
        {
          latency: 5.991,
          percentile: 0.94375,
          total: 2980807
        },
        {
          latency: 6.131,
          percentile: 0.95,
          total: 3000540
        },
        {
          latency: 6.295,
          percentile: 0.95625,
          total: 3020535
        },
        {
          latency: 6.483,
          percentile: 0.9625,
          total: 3040107
        },
        {
          latency: 6.715,
          percentile: 0.96875,
          total: 3059709
        },
        {
          latency: 6.855,
          percentile: 0.971875,
          total: 3069523
        },
        {
          latency: 7.015,
          percentile: 0.975,
          total: 3079441
        },
        {
          latency: 7.195,
          percentile: 0.978125,
          total: 3089280
        },
        {
          latency: 7.407,
          percentile: 0.98125,
          total: 3099137
        },
        {
          latency: 7.671,
          percentile: 0.984375,
          total: 3109051
        },
        {
          latency: 7.827,
          percentile: 0.985938,
          total: 3113929
        },
        {
          latency: 8.011,
          percentile: 0.9875,
          total: 3118839
        },
        {
          latency: 8.247,
          percentile: 0.989062,
          total: 3123849
        },
        {
          latency: 8.535,
          percentile: 0.990625,
          total: 3128684
        },
        {
          latency: 8.919,
          percentile: 0.992188,
          total: 3133623
        },
        {
          latency: 9.175,
          percentile: 0.992969,
          total: 3136114
        },
        {
          latency: 9.471,
          percentile: 0.99375,
          total: 3138571
        },
        {
          latency: 9.855,
          percentile: 0.994531,
          total: 3141062
        },
        {
          latency: 10.279,
          percentile: 0.995313,
          total: 3143503
        },
        {
          latency: 10.815,
          percentile: 0.996094,
          total: 3145968
        },
        {
          latency: 11.143,
          percentile: 0.996484,
          total: 3147181
        },
        {
          latency: 11.511,
          percentile: 0.996875,
          total: 3148440
        },
        {
          latency: 11.879,
          percentile: 0.997266,
          total: 3149649
        },
        {
          latency: 12.335,
          percentile: 0.997656,
          total: 3150885
        },
        {
          latency: 12.879,
          percentile: 0.998047,
          total: 3152124
        },
        {
          latency: 13.199,
          percentile: 0.998242,
          total: 3152736
        },
        {
          latency: 13.599,
          percentile: 0.998437,
          total: 3153355
        },
        {
          latency: 14.031,
          percentile: 0.998633,
          total: 3153966
        },
        {
          latency: 14.567,
          percentile: 0.998828,
          total: 3154590
        },
        {
          latency: 15.279,
          percentile: 0.999023,
          total: 3155201
        },
        {
          latency: 15.775,
          percentile: 0.999121,
          total: 3155507
        },
        {
          latency: 16.335,
          percentile: 0.999219,
          total: 3155819
        },
        {
          latency: 16.975,
          percentile: 0.999316,
          total: 3156124
        },
        {
          latency: 17.711,
          percentile: 0.999414,
          total: 3156438
        },
        {
          latency: 18.831,
          percentile: 0.999512,
          total: 3156745
        },
        {
          latency: 19.551,
          percentile: 0.999561,
          total: 3156897
        },
        {
          latency: 20.431,
          percentile: 0.999609,
          total: 3157049
        },
        {
          latency: 21.503,
          percentile: 0.999658,
          total: 3157204
        },
        {
          latency: 22.815,
          percentile: 0.999707,
          total: 3157358
        },
        {
          latency: 24.847,
          percentile: 0.999756,
          total: 3157511
        },
        {
          latency: 26.399,
          percentile: 0.99978,
          total: 3157589
        },
        {
          latency: 28.895,
          percentile: 0.999805,
          total: 3157667
        },
        {
          latency: 33.887,
          percentile: 0.999829,
          total: 3157743
        },
        {
          latency: 42.559,
          percentile: 0.999854,
          total: 3157820
        },
        {
          latency: 70.527,
          percentile: 0.999878,
          total: 3157897
        },
        {
          latency: 86.079,
          percentile: 0.99989,
          total: 3157936
        },
        {
          latency: 100.223,
          percentile: 0.999902,
          total: 3157974
        },
        {
          latency: 115.519,
          percentile: 0.999915,
          total: 3158013
        },
        {
          latency: 130.943,
          percentile: 0.999927,
          total: 3158051
        },
        {
          latency: 146.431,
          percentile: 0.999939,
          total: 3158090
        },
        {
          latency: 155.007,
          percentile: 0.999945,
          total: 3158110
        },
        {
          latency: 161.407,
          percentile: 0.999951,
          total: 3158129
        },
        {
          latency: 171.135,
          percentile: 0.999957,
          total: 3158148
        },
        {
          latency: 177.279,
          percentile: 0.999963,
          total: 3158168
        },
        {
          latency: 187.135,
          percentile: 0.999969,
          total: 3158186
        },
        {
          latency: 188.543,
          percentile: 0.999973,
          total: 3158196
        },
        {
          latency: 190.463,
          percentile: 0.999976,
          total: 3158205
        },
        {
          latency: 200.959,
          percentile: 0.999979,
          total: 3158215
        },
        {
          latency: 203.007,
          percentile: 0.999982,
          total: 3158225
        },
        {
          latency: 204.287,
          percentile: 0.999985,
          total: 3158234
        },
        {
          latency: 205.439,
          percentile: 0.999986,
          total: 3158241
        },
        {
          latency: 206.207,
          percentile: 0.999988,
          total: 3158245
        },
        {
          latency: 208.255,
          percentile: 0.999989,
          total: 3158249
        },
        {
          latency: 216.191,
          percentile: 0.999991,
          total: 3158254
        },
        {
          latency: 218.239,
          percentile: 0.999992,
          total: 3158258
        },
        {
          latency: 219.007,
          percentile: 0.999993,
          total: 3158261
        },
        {
          latency: 219.135,
          percentile: 0.999994,
          total: 3158263
        },
        {
          latency: 219.519,
          percentile: 0.999995,
          total: 3158266
        },
        {
          latency: 220.031,
          percentile: 0.999995,
          total: 3158268
        },
        {
          latency: 220.415,
          percentile: 0.999996,
          total: 3158271
        },
        {
          latency: 220.927,
          percentile: 0.999997,
          total: 3158272
        },
        {
          latency: 221.183,
          percentile: 0.999997,
          total: 3158273
        },
        {
          latency: 221.311,
          percentile: 0.999997,
          total: 3158275
        },
        {
          latency: 221.311,
          percentile: 0.999998,
          total: 3158275
        },
        {
          latency: 221.567,
          percentile: 0.999998,
          total: 3158276
        },
        {
          latency: 222.079,
          percentile: 0.999998,
          total: 3158277
        },
        {
          latency: 222.335,
          percentile: 0.999998,
          total: 3158278
        },
        {
          latency: 222.335,
          percentile: 0.999999,
          total: 3158278
        },
        {
          latency: 222.463,
          percentile: 0.999999,
          total: 3158279
        },
        {
          latency: 222.463,
          percentile: 0.999999,
          total: 3158279
        },
        {
          latency: 222.591,
          percentile: 0.999999,
          total: 3158280
        },
        {
          latency: 222.591,
          percentile: 0.999999,
          total: 3158280
        },
        {
          latency: 222.591,
          percentile: 0.999999,
          total: 3158280
        },
        {
          latency: 224.767,
          percentile: 0.999999,
          total: 3158281
        },
        {
          latency: 224.767,
          percentile: 1,
          total: 3158281
        },
        {
          latency: 224.767,
          percentile: 1,
          total: 3158281
        },
        {
          latency: 224.767,
          percentile: 1,
          total: 3158281
        },
        {
          latency: 224.767,
          percentile: 1,
          total: 3158281
        },
        {
          latency: 226.175,
          percentile: 1,
          total: 3158282
        },
        {
          latency: 226.175,
          percentile: 1,
          total: 3158282
        }
      ]
    }
  },
  {
    opts: {
      path: '../wrk2/wrk',
      rate: 11000,
      duration: '300s',
      threads: 4,
      connections: 200,
      printLatency: true,
      url: 'http://107.21.1.157/queryU'
    },
    result: {
      transferPerSec: '5.89MB',
      requestsPerSec: 10995.69,
      connectErrors: '0',
      readErrors: '0',
      writeErrors: '0',
      timeoutErrors: '6',
      non2xx3xx: 1024,
      requestsTotal: 3298703,
      durationActual: '5.00m',
      transferTotal: '1.73GB',
      latencyAvg: 'calibration:',
      latencyStdev: 'mean',
      latencyMax: 'lat.:',
      latencyStdevPerc: null,
      rpsAvg: 'calibration:',
      rpsStdev: 'mean',
      rpsMax: 'lat.:',
      rpsStdevPerc: null,
      histogram: [
        {
          latency: 1.726,
          percentile: 0.1,
          total: 318916
        },
        {
          latency: 1.947,
          percentile: 0.2,
          total: 638978
        },
        {
          latency: 2.129,
          percentile: 0.3,
          total: 959478
        },
        {
          latency: 2.297,
          percentile: 0.4,
          total: 1277303
        },
        {
          latency: 2.469,
          percentile: 0.5,
          total: 1597458
        },
        {
          latency: 2.559,
          percentile: 0.55,
          total: 1754536
        },
        {
          latency: 2.657,
          percentile: 0.6,
          total: 1913282
        },
        {
          latency: 2.767,
          percentile: 0.65,
          total: 2074087
        },
        {
          latency: 2.891,
          percentile: 0.7,
          total: 2232608
        },
        {
          latency: 3.039,
          percentile: 0.75,
          total: 2391062
        },
        {
          latency: 3.127,
          percentile: 0.775,
          total: 2471771
        },
        {
          latency: 3.225,
          percentile: 0.8,
          total: 2550480
        },
        {
          latency: 3.341,
          percentile: 0.825,
          total: 2630080
        },
        {
          latency: 3.481,
          percentile: 0.85,
          total: 2710341
        },
        {
          latency: 3.653,
          percentile: 0.875,
          total: 2790087
        },
        {
          latency: 3.755,
          percentile: 0.8875,
          total: 2829381
        },
        {
          latency: 3.875,
          percentile: 0.9,
          total: 2869506
        },
        {
          latency: 4.011,
          percentile: 0.9125,
          total: 2909046
        },
        {
          latency: 4.179,
          percentile: 0.925,
          total: 2949314
        },
        {
          latency: 4.383,
          percentile: 0.9375,
          total: 2988648
        },
        {
          latency: 4.511,
          percentile: 0.94375,
          total: 3008420
        },
        {
          latency: 4.659,
          percentile: 0.95,
          total: 3028390
        },
        {
          latency: 4.839,
          percentile: 0.95625,
          total: 3048411
        },
        {
          latency: 5.059,
          percentile: 0.9625,
          total: 3068344
        },
        {
          latency: 5.347,
          percentile: 0.96875,
          total: 3088129
        },
        {
          latency: 5.535,
          percentile: 0.971875,
          total: 3098245
        },
        {
          latency: 5.755,
          percentile: 0.975,
          total: 3108140
        },
        {
          latency: 6.031,
          percentile: 0.978125,
          total: 3118001
        },
        {
          latency: 6.387,
          percentile: 0.98125,
          total: 3128002
        },
        {
          latency: 6.851,
          percentile: 0.984375,
          total: 3137929
        },
        {
          latency: 7.143,
          percentile: 0.985938,
          total: 3142928
        },
        {
          latency: 7.503,
          percentile: 0.9875,
          total: 3147887
        },
        {
          latency: 7.931,
          percentile: 0.989062,
          total: 3152888
        },
        {
          latency: 8.431,
          percentile: 0.990625,
          total: 3157870
        },
        {
          latency: 9.055,
          percentile: 0.992188,
          total: 3162824
        },
        {
          latency: 9.439,
          percentile: 0.992969,
          total: 3165348
        },
        {
          latency: 9.863,
          percentile: 0.99375,
          total: 3167814
        },
        {
          latency: 10.367,
          percentile: 0.994531,
          total: 3170319
        },
        {
          latency: 10.935,
          percentile: 0.995313,
          total: 3172798
        },
        {
          latency: 11.647,
          percentile: 0.996094,
          total: 3175296
        },
        {
          latency: 12.111,
          percentile: 0.996484,
          total: 3176537
        },
        {
          latency: 12.647,
          percentile: 0.996875,
          total: 3177764
        },
        {
          latency: 13.311,
          percentile: 0.997266,
          total: 3179017
        },
        {
          latency: 14.151,
          percentile: 0.997656,
          total: 3180265
        },
        {
          latency: 15.279,
          percentile: 0.998047,
          total: 3181500
        },
        {
          latency: 15.967,
          percentile: 0.998242,
          total: 3182122
        },
        {
          latency: 16.783,
          percentile: 0.998437,
          total: 3182755
        },
        {
          latency: 17.807,
          percentile: 0.998633,
          total: 3183366
        },
        {
          latency: 19.215,
          percentile: 0.998828,
          total: 3183988
        },
        {
          latency: 21.295,
          percentile: 0.999023,
          total: 3184610
        },
        {
          latency: 23.183,
          percentile: 0.999121,
          total: 3184923
        },
        {
          latency: 26.143,
          percentile: 0.999219,
          total: 3185233
        },
        {
          latency: 32.511,
          percentile: 0.999316,
          total: 3185544
        },
        {
          latency: 78.271,
          percentile: 0.999414,
          total: 3185856
        },
        {
          latency: 152.063,
          percentile: 0.999512,
          total: 3186167
        },
        {
          latency: 186.623,
          percentile: 0.999561,
          total: 3186325
        },
        {
          latency: 220.671,
          percentile: 0.999609,
          total: 3186478
        },
        {
          latency: 926.719,
          percentile: 0.999658,
          total: 3186634
        },
        {
          latency: 1748.991,
          percentile: 0.999707,
          total: 3186790
        },
        {
          latency: 2566.143,
          percentile: 0.999756,
          total: 3186945
        },
        {
          latency: 2977.791,
          percentile: 0.99978,
          total: 3187023
        },
        {
          latency: 3389.439,
          percentile: 0.999805,
          total: 3187101
        },
        {
          latency: 3799.039,
          percentile: 0.999829,
          total: 3187179
        },
        {
          latency: 4202.495,
          percentile: 0.999854,
          total: 3187257
        },
        {
          latency: 4603.903,
          percentile: 0.999878,
          total: 3187334
        },
        {
          latency: 4800.511,
          percentile: 0.99989,
          total: 3187374
        },
        {
          latency: 4984.831,
          percentile: 0.999902,
          total: 3187413
        },
        {
          latency: 5160.959,
          percentile: 0.999915,
          total: 3187451
        },
        {
          latency: 5365.759,
          percentile: 0.999927,
          total: 3187491
        },
        {
          latency: 5570.559,
          percentile: 0.999939,
          total: 3187529
        },
        {
          latency: 5668.863,
          percentile: 0.999945,
          total: 3187548
        },
        {
          latency: 5775.359,
          percentile: 0.999951,
          total: 3187568
        },
        {
          latency: 5877.759,
          percentile: 0.999957,
          total: 3187588
        },
        {
          latency: 5976.063,
          percentile: 0.999963,
          total: 3187607
        },
        {
          latency: 6082.559,
          percentile: 0.999969,
          total: 3187627
        },
        {
          latency: 6127.615,
          percentile: 0.999973,
          total: 3187636
        },
        {
          latency: 6180.863,
          percentile: 0.999976,
          total: 3187646
        },
        {
          latency: 6221.823,
          percentile: 0.999979,
          total: 3187655
        },
        {
          latency: 6270.975,
          percentile: 0.999982,
          total: 3187665
        },
        {
          latency: 6328.319,
          percentile: 0.999985,
          total: 3187677
        },
        {
          latency: 6344.703,
          percentile: 0.999986,
          total: 3187680
        },
        {
          latency: 6369.279,
          percentile: 0.999988,
          total: 3187685
        },
        {
          latency: 6385.663,
          percentile: 0.999989,
          total: 3187689
        },
        {
          latency: 6414.335,
          percentile: 0.999991,
          total: 3187695
        },
        {
          latency: 6434.815,
          percentile: 0.999992,
          total: 3187699
        },
        {
          latency: 6451.199,
          percentile: 0.999993,
          total: 3187703
        },
        {
          latency: 6455.295,
          percentile: 0.999994,
          total: 3187704
        },
        {
          latency: 6463.487,
          percentile: 0.999995,
          total: 3187706
        },
        {
          latency: 6479.871,
          percentile: 0.999995,
          total: 3187709
        },
        {
          latency: 6492.159,
          percentile: 0.999996,
          total: 3187711
        },
        {
          latency: 6496.255,
          percentile: 0.999997,
          total: 3187713
        },
        {
          latency: 6504.447,
          percentile: 0.999997,
          total: 3187714
        },
        {
          latency: 6512.639,
          percentile: 0.999997,
          total: 3187716
        },
        {
          latency: 6512.639,
          percentile: 0.999998,
          total: 3187716
        },
        {
          latency: 6516.735,
          percentile: 0.999998,
          total: 3187717
        },
        {
          latency: 6529.023,
          percentile: 0.999998,
          total: 3187720
        },
        {
          latency: 6529.023,
          percentile: 0.999998,
          total: 3187720
        },
        {
          latency: 6529.023,
          percentile: 0.999999,
          total: 3187720
        },
        {
          latency: 6529.023,
          percentile: 0.999999,
          total: 3187720
        },
        {
          latency: 6529.023,
          percentile: 0.999999,
          total: 3187720
        },
        {
          latency: 6541.311,
          percentile: 0.999999,
          total: 3187721
        },
        {
          latency: 6541.311,
          percentile: 0.999999,
          total: 3187721
        },
        {
          latency: 6541.311,
          percentile: 0.999999,
          total: 3187721
        },
        {
          latency: 6545.407,
          percentile: 0.999999,
          total: 3187723
        },
        {
          latency: 6545.407,
          percentile: 1,
          total: 3187723
        }
      ]
    }
  },
  {
    opts: {
      path: '../wrk2/wrk',
      rate: 11100,
      duration: '300s',
      threads: 4,
      connections: 200,
      printLatency: true,
      url: 'http://107.21.1.157/queryU'
    },
    result: {
      transferPerSec: '5.95MB',
      requestsPerSec: 11095.65,
      non2xx3xx: 825,
      requestsTotal: 3328693,
      durationActual: '5.00m',
      transferTotal: '1.74GB',
      latencyAvg: 'calibration:',
      latencyStdev: 'mean',
      latencyMax: 'lat.:',
      latencyStdevPerc: null,
      rpsAvg: 'calibration:',
      rpsStdev: 'mean',
      rpsMax: 'lat.:',
      rpsStdevPerc: null,
      histogram: [
        {
          latency: 1.738,
          percentile: 0.1,
          total: 322402
        },
        {
          latency: 1.965,
          percentile: 0.2,
          total: 643576
        },
        {
          latency: 2.155,
          percentile: 0.3,
          total: 966351
        },
        {
          latency: 2.333,
          percentile: 0.4,
          total: 1286935
        },
        {
          latency: 2.517,
          percentile: 0.5,
          total: 1610946
        },
        {
          latency: 2.615,
          percentile: 0.55,
          total: 1771628
        },
        {
          latency: 2.721,
          percentile: 0.6,
          total: 1931990
        },
        {
          latency: 2.839,
          percentile: 0.65,
          total: 2091550
        },
        {
          latency: 2.975,
          percentile: 0.7,
          total: 2252299
        },
        {
          latency: 3.133,
          percentile: 0.75,
          total: 2412298
        },
        {
          latency: 3.225,
          percentile: 0.775,
          total: 2493243
        },
        {
          latency: 3.327,
          percentile: 0.8,
          total: 2573080
        },
        {
          latency: 3.447,
          percentile: 0.825,
          total: 2654554
        },
        {
          latency: 3.585,
          percentile: 0.85,
          total: 2733844
        },
        {
          latency: 3.759,
          percentile: 0.875,
          total: 2814996
        },
        {
          latency: 3.861,
          percentile: 0.8875,
          total: 2854921
        },
        {
          latency: 3.977,
          percentile: 0.9,
          total: 2894962
        },
        {
          latency: 4.111,
          percentile: 0.9125,
          total: 2935105
        },
        {
          latency: 4.275,
          percentile: 0.925,
          total: 2975859
        },
        {
          latency: 4.475,
          percentile: 0.9375,
          total: 3015331
        },
        {
          latency: 4.599,
          percentile: 0.94375,
          total: 3035488
        },
        {
          latency: 4.747,
          percentile: 0.95,
          total: 3055766
        },
        {
          latency: 4.923,
          percentile: 0.95625,
          total: 3075891
        },
        {
          latency: 5.139,
          percentile: 0.9625,
          total: 3095733
        },
        {
          latency: 5.427,
          percentile: 0.96875,
          total: 3115885
        },
        {
          latency: 5.607,
          percentile: 0.971875,
          total: 3125906
        },
        {
          latency: 5.819,
          percentile: 0.975,
          total: 3135826
        },
        {
          latency: 6.091,
          percentile: 0.978125,
          total: 3145891
        },
        {
          latency: 6.443,
          percentile: 0.98125,
          total: 3155925
        },
        {
          latency: 6.923,
          percentile: 0.984375,
          total: 3166007
        },
        {
          latency: 7.215,
          percentile: 0.985938,
          total: 3171040
        },
        {
          latency: 7.571,
          percentile: 0.9875,
          total: 3176060
        },
        {
          latency: 8.023,
          percentile: 0.989062,
          total: 3181069
        },
        {
          latency: 8.551,
          percentile: 0.990625,
          total: 3186075
        },
        {
          latency: 9.191,
          percentile: 0.992188,
          total: 3191115
        },
        {
          latency: 9.567,
          percentile: 0.992969,
          total: 3193601
        },
        {
          latency: 9.983,
          percentile: 0.99375,
          total: 3196127
        },
        {
          latency: 10.487,
          percentile: 0.994531,
          total: 3198649
        },
        {
          latency: 11.063,
          percentile: 0.995313,
          total: 3201143
        },
        {
          latency: 11.759,
          percentile: 0.996094,
          total: 3203655
        },
        {
          latency: 12.191,
          percentile: 0.996484,
          total: 3204918
        },
        {
          latency: 12.711,
          percentile: 0.996875,
          total: 3206187
        },
        {
          latency: 13.287,
          percentile: 0.997266,
          total: 3207424
        },
        {
          latency: 13.999,
          percentile: 0.997656,
          total: 3208684
        },
        {
          latency: 14.911,
          percentile: 0.998047,
          total: 3209941
        },
        {
          latency: 15.479,
          percentile: 0.998242,
          total: 3210575
        },
        {
          latency: 16.119,
          percentile: 0.998437,
          total: 3211190
        },
        {
          latency: 16.863,
          percentile: 0.998633,
          total: 3211829
        },
        {
          latency: 17.791,
          percentile: 0.998828,
          total: 3212447
        },
        {
          latency: 19.055,
          percentile: 0.999023,
          total: 3213082
        },
        {
          latency: 19.743,
          percentile: 0.999121,
          total: 3213389
        },
        {
          latency: 20.575,
          percentile: 0.999219,
          total: 3213703
        },
        {
          latency: 21.615,
          percentile: 0.999316,
          total: 3214018
        },
        {
          latency: 22.799,
          percentile: 0.999414,
          total: 3214331
        },
        {
          latency: 24.319,
          percentile: 0.999512,
          total: 3214648
        },
        {
          latency: 25.199,
          percentile: 0.999561,
          total: 3214802
        },
        {
          latency: 26.271,
          percentile: 0.999609,
          total: 3214960
        },
        {
          latency: 28.063,
          percentile: 0.999658,
          total: 3215117
        },
        {
          latency: 30.159,
          percentile: 0.999707,
          total: 3215276
        },
        {
          latency: 33.279,
          percentile: 0.999756,
          total: 3215430
        },
        {
          latency: 36.095,
          percentile: 0.99978,
          total: 3215510
        },
        {
          latency: 40.575,
          percentile: 0.999805,
          total: 3215587
        },
        {
          latency: 50.143,
          percentile: 0.999829,
          total: 3215666
        },
        {
          latency: 73.983,
          percentile: 0.999854,
          total: 3215745
        },
        {
          latency: 100.863,
          percentile: 0.999878,
          total: 3215823
        },
        {
          latency: 114.687,
          percentile: 0.99989,
          total: 3215862
        },
        {
          latency: 127.423,
          percentile: 0.999902,
          total: 3215901
        },
        {
          latency: 142.591,
          percentile: 0.999915,
          total: 3215941
        },
        {
          latency: 156.927,
          percentile: 0.999927,
          total: 3215981
        },
        {
          latency: 172.543,
          percentile: 0.999939,
          total: 3216019
        },
        {
          latency: 176.639,
          percentile: 0.999945,
          total: 3216039
        },
        {
          latency: 187.391,
          percentile: 0.999951,
          total: 3216058
        },
        {
          latency: 190.463,
          percentile: 0.999957,
          total: 3216079
        },
        {
          latency: 202.623,
          percentile: 0.999963,
          total: 3216099
        },
        {
          latency: 205.311,
          percentile: 0.999969,
          total: 3216118
        },
        {
          latency: 207.231,
          percentile: 0.999973,
          total: 3216127
        },
        {
          latency: 217.599,
          percentile: 0.999976,
          total: 3216137
        },
        {
          latency: 219.519,
          percentile: 0.999979,
          total: 3216147
        },
        {
          latency: 221.439,
          percentile: 0.999982,
          total: 3216157
        },
        {
          latency: 239.103,
          percentile: 0.999985,
          total: 3216166
        },
        {
          latency: 271.103,
          percentile: 0.999986,
          total: 3216171
        },
        {
          latency: 291.839,
          percentile: 0.999988,
          total: 3216176
        },
        {
          latency: 319.743,
          percentile: 0.999989,
          total: 3216181
        },
        {
          latency: 347.391,
          percentile: 0.999991,
          total: 3216186
        },
        {
          latency: 368.639,
          percentile: 0.999992,
          total: 3216191
        },
        {
          latency: 381.183,
          percentile: 0.999993,
          total: 3216193
        },
        {
          latency: 399.359,
          percentile: 0.999994,
          total: 3216196
        },
        {
          latency: 414.975,
          percentile: 0.999995,
          total: 3216198
        },
        {
          latency: 441.599,
          percentile: 0.999995,
          total: 3216201
        },
        {
          latency: 456.959,
          percentile: 0.999996,
          total: 3216203
        },
        {
          latency: 472.575,
          percentile: 0.999997,
          total: 3216204
        },
        {
          latency: 502.015,
          percentile: 0.999997,
          total: 3216206
        },
        {
          latency: 514.815,
          percentile: 0.999997,
          total: 3216207
        },
        {
          latency: 529.407,
          percentile: 0.999998,
          total: 3216208
        },
        {
          latency: 544.255,
          percentile: 0.999998,
          total: 3216209
        },
        {
          latency: 559.103,
          percentile: 0.999998,
          total: 3216210
        },
        {
          latency: 572.927,
          percentile: 0.999998,
          total: 3216211
        },
        {
          latency: 572.927,
          percentile: 0.999999,
          total: 3216211
        },
        {
          latency: 586.239,
          percentile: 0.999999,
          total: 3216212
        },
        {
          latency: 586.239,
          percentile: 0.999999,
          total: 3216212
        },
        {
          latency: 600.063,
          percentile: 0.999999,
          total: 3216213
        },
        {
          latency: 600.063,
          percentile: 0.999999,
          total: 3216213
        },
        {
          latency: 600.063,
          percentile: 0.999999,
          total: 3216213
        },
        {
          latency: 615.423,
          percentile: 0.999999,
          total: 3216214
        },
        {
          latency: 615.423,
          percentile: 1,
          total: 3216214
        },
        {
          latency: 615.423,
          percentile: 1,
          total: 3216214
        },
        {
          latency: 615.423,
          percentile: 1,
          total: 3216214
        },
        {
          latency: 615.423,
          percentile: 1,
          total: 3216214
        },
        {
          latency: 631.807,
          percentile: 1,
          total: 3216215
        },
        {
          latency: 631.807,
          percentile: 1,
          total: 3216215
        }
      ]
    }
  },
  {
    opts: {
      path: '../wrk2/wrk',
      rate: 11200,
      duration: '300s',
      threads: 4,
      connections: 200,
      printLatency: true,
      url: 'http://107.21.1.157/queryU'
    },
    result: {
      transferPerSec: '6.00MB',
      requestsPerSec: 11195.61,
      non2xx3xx: 1381,
      requestsTotal: 3358681,
      durationActual: '5.00m',
      transferTotal: '1.76GB',
      latencyAvg: 'calibration:',
      latencyStdev: 'mean',
      latencyMax: 'lat.:',
      latencyStdevPerc: null,
      rpsAvg: 'calibration:',
      rpsStdev: 'mean',
      rpsMax: 'lat.:',
      rpsStdevPerc: null,
      histogram: [
        {
          latency: 1.741,
          percentile: 0.1,
          total: 325458
        },
        {
          latency: 1.968,
          percentile: 0.2,
          total: 649894
        },
        {
          latency: 2.157,
          percentile: 0.3,
          total: 974847
        },
        {
          latency: 2.333,
          percentile: 0.4,
          total: 1298661
        },
        {
          latency: 2.513,
          percentile: 0.5,
          total: 1625189
        },
        {
          latency: 2.607,
          percentile: 0.55,
          total: 1785541
        },
        {
          latency: 2.711,
          percentile: 0.6,
          total: 1949630
        },
        {
          latency: 2.825,
          percentile: 0.65,
          total: 2111421
        },
        {
          latency: 2.953,
          percentile: 0.7,
          total: 2272041
        },
        {
          latency: 3.105,
          percentile: 0.75,
          total: 2434450
        },
        {
          latency: 3.193,
          percentile: 0.775,
          total: 2516146
        },
        {
          latency: 3.291,
          percentile: 0.8,
          total: 2596990
        },
        {
          latency: 3.405,
          percentile: 0.825,
          total: 2678368
        },
        {
          latency: 3.539,
          percentile: 0.85,
          total: 2759444
        },
        {
          latency: 3.703,
          percentile: 0.875,
          total: 2839858
        },
        {
          latency: 3.803,
          percentile: 0.8875,
          total: 2880291
        },
        {
          latency: 3.919,
          percentile: 0.9,
          total: 2920772
        },
        {
          latency: 4.055,
          percentile: 0.9125,
          total: 2961311
        },
        {
          latency: 4.219,
          percentile: 0.925,
          total: 3001839
        },
        {
          latency: 4.431,
          percentile: 0.9375,
          total: 3042790
        },
        {
          latency: 4.563,
          percentile: 0.94375,
          total: 3063094
        },
        {
          latency: 4.715,
          percentile: 0.95,
          total: 3083073
        },
        {
          latency: 4.903,
          percentile: 0.95625,
          total: 3103339
        },
        {
          latency: 5.139,
          percentile: 0.9625,
          total: 3123501
        },
        {
          latency: 5.455,
          percentile: 0.96875,
          total: 3143771
        },
        {
          latency: 5.663,
          percentile: 0.971875,
          total: 3154041
        },
        {
          latency: 5.915,
          percentile: 0.975,
          total: 3164140
        },
        {
          latency: 6.227,
          percentile: 0.978125,
          total: 3174194
        },
        {
          latency: 6.639,
          percentile: 0.98125,
          total: 3184386
        },
        {
          latency: 7.191,
          percentile: 0.984375,
          total: 3194490
        },
        {
          latency: 7.543,
          percentile: 0.985938,
          total: 3199597
        },
        {
          latency: 7.951,
          percentile: 0.9875,
          total: 3204621
        },
        {
          latency: 8.455,
          percentile: 0.989062,
          total: 3209693
        },
        {
          latency: 9.063,
          percentile: 0.990625,
          total: 3214799
        },
        {
          latency: 9.767,
          percentile: 0.992188,
          total: 3219853
        },
        {
          latency: 10.167,
          percentile: 0.992969,
          total: 3222376
        },
        {
          latency: 10.615,
          percentile: 0.99375,
          total: 3224903
        },
        {
          latency: 11.135,
          percentile: 0.994531,
          total: 3227434
        },
        {
          latency: 11.759,
          percentile: 0.995313,
          total: 3229991
        },
        {
          latency: 12.559,
          percentile: 0.996094,
          total: 3232513
        },
        {
          latency: 13.047,
          percentile: 0.996484,
          total: 3233788
        },
        {
          latency: 13.663,
          percentile: 0.996875,
          total: 3235053
        },
        {
          latency: 14.343,
          percentile: 0.997266,
          total: 3236326
        },
        {
          latency: 15.127,
          percentile: 0.997656,
          total: 3237575
        },
        {
          latency: 16.231,
          percentile: 0.998047,
          total: 3238846
        },
        {
          latency: 16.831,
          percentile: 0.998242,
          total: 3239478
        },
        {
          latency: 17.535,
          percentile: 0.998437,
          total: 3240117
        },
        {
          latency: 18.383,
          percentile: 0.998633,
          total: 3240754
        },
        {
          latency: 19.359,
          percentile: 0.998828,
          total: 3241378
        },
        {
          latency: 20.623,
          percentile: 0.999023,
          total: 3242017
        },
        {
          latency: 21.407,
          percentile: 0.999121,
          total: 3242345
        },
        {
          latency: 22.207,
          percentile: 0.999219,
          total: 3242646
        },
        {
          latency: 23.199,
          percentile: 0.999316,
          total: 3242967
        },
        {
          latency: 24.607,
          percentile: 0.999414,
          total: 3243280
        },
        {
          latency: 26.319,
          percentile: 0.999512,
          total: 3243598
        },
        {
          latency: 27.567,
          percentile: 0.999561,
          total: 3243754
        },
        {
          latency: 28.991,
          percentile: 0.999609,
          total: 3243913
        },
        {
          latency: 30.879,
          percentile: 0.999658,
          total: 3244071
        },
        {
          latency: 33.215,
          percentile: 0.999707,
          total: 3244230
        },
        {
          latency: 37.023,
          percentile: 0.999756,
          total: 3244389
        },
        {
          latency: 41.535,
          percentile: 0.99978,
          total: 3244467
        },
        {
          latency: 51.839,
          percentile: 0.999805,
          total: 3244548
        },
        {
          latency: 74.559,
          percentile: 0.999829,
          total: 3244626
        },
        {
          latency: 94.015,
          percentile: 0.999854,
          total: 3244706
        },
        {
          latency: 114.047,
          percentile: 0.999878,
          total: 3244784
        },
        {
          latency: 125.695,
          percentile: 0.99989,
          total: 3244824
        },
        {
          latency: 138.751,
          percentile: 0.999902,
          total: 3244865
        },
        {
          latency: 145.407,
          percentile: 0.999915,
          total: 3244903
        },
        {
          latency: 157.823,
          percentile: 0.999927,
          total: 3244943
        },
        {
          latency: 171.391,
          percentile: 0.999939,
          total: 3244982
        },
        {
          latency: 174.079,
          percentile: 0.999945,
          total: 3245003
        },
        {
          latency: 178.559,
          percentile: 0.999951,
          total: 3245022
        },
        {
          latency: 187.007,
          percentile: 0.999957,
          total: 3245044
        },
        {
          latency: 189.695,
          percentile: 0.999963,
          total: 3245062
        },
        {
          latency: 194.431,
          percentile: 0.999969,
          total: 3245081
        },
        {
          latency: 201.471,
          percentile: 0.999973,
          total: 3245091
        },
        {
          latency: 203.007,
          percentile: 0.999976,
          total: 3245102
        },
        {
          latency: 203.775,
          percentile: 0.999979,
          total: 3245111
        },
        {
          latency: 204.927,
          percentile: 0.999982,
          total: 3245121
        },
        {
          latency: 206.207,
          percentile: 0.999985,
          total: 3245131
        },
        {
          latency: 208.895,
          percentile: 0.999986,
          total: 3245136
        },
        {
          latency: 216.447,
          percentile: 0.999988,
          total: 3245141
        },
        {
          latency: 217.343,
          percentile: 0.999989,
          total: 3245146
        },
        {
          latency: 218.111,
          percentile: 0.999991,
          total: 3245151
        },
        {
          latency: 219.007,
          percentile: 0.999992,
          total: 3245156
        },
        {
          latency: 219.135,
          percentile: 0.999993,
          total: 3245158
        },
        {
          latency: 219.391,
          percentile: 0.999994,
          total: 3245161
        },
        {
          latency: 219.775,
          percentile: 0.999995,
          total: 3245164
        },
        {
          latency: 220.031,
          percentile: 0.999995,
          total: 3245166
        },
        {
          latency: 220.415,
          percentile: 0.999996,
          total: 3245170
        },
        {
          latency: 220.415,
          percentile: 0.999997,
          total: 3245170
        },
        {
          latency: 221.055,
          percentile: 0.999997,
          total: 3245171
        },
        {
          latency: 221.183,
          percentile: 0.999997,
          total: 3245172
        },
        {
          latency: 221.311,
          percentile: 0.999998,
          total: 3245173
        },
        {
          latency: 221.567,
          percentile: 0.999998,
          total: 3245174
        },
        {
          latency: 222.079,
          percentile: 0.999998,
          total: 3245175
        },
        {
          latency: 222.463,
          percentile: 0.999998,
          total: 3245176
        },
        {
          latency: 222.463,
          percentile: 0.999999,
          total: 3245176
        },
        {
          latency: 222.591,
          percentile: 0.999999,
          total: 3245178
        },
        {
          latency: 222.591,
          percentile: 0.999999,
          total: 3245178
        },
        {
          latency: 222.591,
          percentile: 0.999999,
          total: 3245178
        },
        {
          latency: 222.591,
          percentile: 0.999999,
          total: 3245178
        },
        {
          latency: 222.591,
          percentile: 0.999999,
          total: 3245178
        },
        {
          latency: 223.487,
          percentile: 0.999999,
          total: 3245179
        },
        {
          latency: 223.487,
          percentile: 1,
          total: 3245179
        },
        {
          latency: 223.487,
          percentile: 1,
          total: 3245179
        },
        {
          latency: 223.487,
          percentile: 1,
          total: 3245179
        },
        {
          latency: 223.487,
          percentile: 1,
          total: 3245179
        },
        {
          latency: 224.511,
          percentile: 1,
          total: 3245180
        },
        {
          latency: 224.511,
          percentile: 1,
          total: 3245180
        }
      ]
    }
  },
  {
    opts: {
      path: '../wrk2/wrk',
      rate: 11300,
      duration: '300s',
      threads: 4,
      connections: 200,
      printLatency: true,
      url: 'http://107.21.1.157/queryU'
    },
    result: {
      transferPerSec: '6.05MB',
      requestsPerSec: 11295.57,
      non2xx3xx: 1496,
      requestsTotal: 3388664,
      durationActual: '5.00m',
      transferTotal: '1.77GB',
      latencyAvg: 'calibration:',
      latencyStdev: 'mean',
      latencyMax: 'lat.:',
      latencyStdevPerc: null,
      rpsAvg: 'calibration:',
      rpsStdev: 'mean',
      rpsMax: 'lat.:',
      rpsStdevPerc: null,
      histogram: [
        {
          latency: 1.729,
          percentile: 0.1,
          total: 328637
        },
        {
          latency: 1.95,
          percentile: 0.2,
          total: 655886
        },
        {
          latency: 2.135,
          percentile: 0.3,
          total: 983995
        },
        {
          latency: 2.305,
          percentile: 0.4,
          total: 1310677
        },
        {
          latency: 2.475,
          percentile: 0.5,
          total: 1637461
        },
        {
          latency: 2.565,
          percentile: 0.55,
          total: 1802860
        },
        {
          latency: 2.659,
          percentile: 0.6,
          total: 1964712
        },
        {
          latency: 2.765,
          percentile: 0.65,
          total: 2130496
        },
        {
          latency: 2.883,
          percentile: 0.7,
          total: 2293624
        },
        {
          latency: 3.021,
          percentile: 0.75,
          total: 2456367
        },
        {
          latency: 3.103,
          percentile: 0.775,
          total: 2538893
        },
        {
          latency: 3.195,
          percentile: 0.8,
          total: 2620900
        },
        {
          latency: 3.299,
          percentile: 0.825,
          total: 2701568
        },
        {
          latency: 3.423,
          percentile: 0.85,
          total: 2783745
        },
        {
          latency: 3.573,
          percentile: 0.875,
          total: 2865008
        },
        {
          latency: 3.663,
          percentile: 0.8875,
          total: 2905916
        },
        {
          latency: 3.767,
          percentile: 0.9,
          total: 2946800
        },
        {
          latency: 3.889,
          percentile: 0.9125,
          total: 2987661
        },
        {
          latency: 4.041,
          percentile: 0.925,
          total: 3028901
        },
        {
          latency: 4.235,
          percentile: 0.9375,
          total: 3069704
        },
        {
          latency: 4.355,
          percentile: 0.94375,
          total: 3090121
        },
        {
          latency: 4.503,
          percentile: 0.95,
          total: 3110721
        },
        {
          latency: 4.683,
          percentile: 0.95625,
          total: 3131132
        },
        {
          latency: 4.915,
          percentile: 0.9625,
          total: 3151595
        },
        {
          latency: 5.227,
          percentile: 0.96875,
          total: 3171869
        },
        {
          latency: 5.435,
          percentile: 0.971875,
          total: 3182205
        },
        {
          latency: 5.691,
          percentile: 0.975,
          total: 3192318
        },
        {
          latency: 6.031,
          percentile: 0.978125,
          total: 3202572
        },
        {
          latency: 6.487,
          percentile: 0.98125,
          total: 3212766
        },
        {
          latency: 7.123,
          percentile: 0.984375,
          total: 3223003
        },
        {
          latency: 7.523,
          percentile: 0.985938,
          total: 3228145
        },
        {
          latency: 7.971,
          percentile: 0.9875,
          total: 3233245
        },
        {
          latency: 8.495,
          percentile: 0.989062,
          total: 3238360
        },
        {
          latency: 9.095,
          percentile: 0.990625,
          total: 3243511
        },
        {
          latency: 9.815,
          percentile: 0.992188,
          total: 3248600
        },
        {
          latency: 10.223,
          percentile: 0.992969,
          total: 3251167
        },
        {
          latency: 10.679,
          percentile: 0.99375,
          total: 3253689
        },
        {
          latency: 11.231,
          percentile: 0.994531,
          total: 3256258
        },
        {
          latency: 11.871,
          percentile: 0.995313,
          total: 3258826
        },
        {
          latency: 12.639,
          percentile: 0.996094,
          total: 3261374
        },
        {
          latency: 13.135,
          percentile: 0.996484,
          total: 3262655
        },
        {
          latency: 13.719,
          percentile: 0.996875,
          total: 3263922
        },
        {
          latency: 14.383,
          percentile: 0.997266,
          total: 3265208
        },
        {
          latency: 15.207,
          percentile: 0.997656,
          total: 3266482
        },
        {
          latency: 16.271,
          percentile: 0.998047,
          total: 3267763
        },
        {
          latency: 16.847,
          percentile: 0.998242,
          total: 3268395
        },
        {
          latency: 17.567,
          percentile: 0.998437,
          total: 3269039
        },
        {
          latency: 18.335,
          percentile: 0.998633,
          total: 3269681
        },
        {
          latency: 19.199,
          percentile: 0.998828,
          total: 3270323
        },
        {
          latency: 20.287,
          percentile: 0.999023,
          total: 3270953
        },
        {
          latency: 20.895,
          percentile: 0.999121,
          total: 3271272
        },
        {
          latency: 21.583,
          percentile: 0.999219,
          total: 3271593
        },
        {
          latency: 22.463,
          percentile: 0.999316,
          total: 3271916
        },
        {
          latency: 23.359,
          percentile: 0.999414,
          total: 3272231
        },
        {
          latency: 24.511,
          percentile: 0.999512,
          total: 3272554
        },
        {
          latency: 25.295,
          percentile: 0.999561,
          total: 3272717
        },
        {
          latency: 26.239,
          percentile: 0.999609,
          total: 3272875
        },
        {
          latency: 27.263,
          percentile: 0.999658,
          total: 3273035
        },
        {
          latency: 28.575,
          percentile: 0.999707,
          total: 3273190
        },
        {
          latency: 30.431,
          percentile: 0.999756,
          total: 3273351
        },
        {
          latency: 31.855,
          percentile: 0.99978,
          total: 3273431
        },
        {
          latency: 33.663,
          percentile: 0.999805,
          total: 3273512
        },
        {
          latency: 35.743,
          percentile: 0.999829,
          total: 3273590
        },
        {
          latency: 39.647,
          percentile: 0.999854,
          total: 3273670
        },
        {
          latency: 58.143,
          percentile: 0.999878,
          total: 3273750
        },
        {
          latency: 74.495,
          percentile: 0.99989,
          total: 3273790
        },
        {
          latency: 89.663,
          percentile: 0.999902,
          total: 3273830
        },
        {
          latency: 107.711,
          percentile: 0.999915,
          total: 3273870
        },
        {
          latency: 124.479,
          percentile: 0.999927,
          total: 3273910
        },
        {
          latency: 141.055,
          percentile: 0.999939,
          total: 3273950
        },
        {
          latency: 145.279,
          percentile: 0.999945,
          total: 3273972
        },
        {
          latency: 157.183,
          percentile: 0.999951,
          total: 3273990
        },
        {
          latency: 161.023,
          percentile: 0.999957,
          total: 3274010
        },
        {
          latency: 173.055,
          percentile: 0.999963,
          total: 3274030
        },
        {
          latency: 180.991,
          percentile: 0.999969,
          total: 3274050
        },
        {
          latency: 186.367,
          percentile: 0.999973,
          total: 3274060
        },
        {
          latency: 189.055,
          percentile: 0.999976,
          total: 3274070
        },
        {
          latency: 190.847,
          percentile: 0.999979,
          total: 3274080
        },
        {
          latency: 200.063,
          percentile: 0.999982,
          total: 3274090
        },
        {
          latency: 203.647,
          percentile: 0.999985,
          total: 3274100
        },
        {
          latency: 204.415,
          percentile: 0.999986,
          total: 3274105
        },
        {
          latency: 205.055,
          percentile: 0.999988,
          total: 3274111
        },
        {
          latency: 205.823,
          percentile: 0.999989,
          total: 3274115
        },
        {
          latency: 206.975,
          percentile: 0.999991,
          total: 3274120
        },
        {
          latency: 214.911,
          percentile: 0.999992,
          total: 3274125
        },
        {
          latency: 215.679,
          percentile: 0.999993,
          total: 3274127
        },
        {
          latency: 217.087,
          percentile: 0.999994,
          total: 3274130
        },
        {
          latency: 218.879,
          percentile: 0.999995,
          total: 3274132
        },
        {
          latency: 219.519,
          percentile: 0.999995,
          total: 3274135
        },
        {
          latency: 220.799,
          percentile: 0.999996,
          total: 3274139
        },
        {
          latency: 220.799,
          percentile: 0.999997,
          total: 3274139
        },
        {
          latency: 221.055,
          percentile: 0.999997,
          total: 3274140
        },
        {
          latency: 221.183,
          percentile: 0.999997,
          total: 3274141
        },
        {
          latency: 221.567,
          percentile: 0.999998,
          total: 3274143
        },
        {
          latency: 221.567,
          percentile: 0.999998,
          total: 3274143
        },
        {
          latency: 221.695,
          percentile: 0.999998,
          total: 3274144
        },
        {
          latency: 222.079,
          percentile: 0.999998,
          total: 3274146
        },
        {
          latency: 222.079,
          percentile: 0.999999,
          total: 3274146
        },
        {
          latency: 222.079,
          percentile: 0.999999,
          total: 3274146
        },
        {
          latency: 222.079,
          percentile: 0.999999,
          total: 3274146
        },
        {
          latency: 222.207,
          percentile: 0.999999,
          total: 3274147
        },
        {
          latency: 222.207,
          percentile: 0.999999,
          total: 3274147
        },
        {
          latency: 222.207,
          percentile: 0.999999,
          total: 3274147
        },
        {
          latency: 222.335,
          percentile: 0.999999,
          total: 3274148
        },
        {
          latency: 222.335,
          percentile: 1,
          total: 3274148
        },
        {
          latency: 222.335,
          percentile: 1,
          total: 3274148
        },
        {
          latency: 222.335,
          percentile: 1,
          total: 3274148
        },
        {
          latency: 222.335,
          percentile: 1,
          total: 3274148
        },
        {
          latency: 223.231,
          percentile: 1,
          total: 3274149
        },
        {
          latency: 223.231,
          percentile: 1,
          total: 3274149
        }
      ]
    }
  },
  {
    opts: {
      path: '../wrk2/wrk',
      rate: 11400,
      duration: '300s',
      threads: 4,
      connections: 200,
      printLatency: true,
      url: 'http://107.21.1.157/queryU'
    },
    result: {
      transferPerSec: '6.11MB',
      requestsPerSec: 11395.54,
      non2xx3xx: 1324,
      requestsTotal: 3418655,
      durationActual: '5.00m',
      transferTotal: '1.79GB',
      latencyAvg: 'calibration:',
      latencyStdev: 'mean',
      latencyMax: 'lat.:',
      latencyStdevPerc: null,
      rpsAvg: 'calibration:',
      rpsStdev: 'mean',
      rpsMax: 'lat.:',
      rpsStdevPerc: null,
      histogram: [
        {
          latency: 1.763,
          percentile: 0.1,
          total: 330431
        },
        {
          latency: 1.999,
          percentile: 0.2,
          total: 661862
        },
        {
          latency: 2.197,
          percentile: 0.3,
          total: 991731
        },
        {
          latency: 2.383,
          percentile: 0.4,
          total: 1324388
        },
        {
          latency: 2.567,
          percentile: 0.5,
          total: 1652286
        },
        {
          latency: 2.665,
          percentile: 0.55,
          total: 1817554
        },
        {
          latency: 2.771,
          percentile: 0.6,
          total: 1984679
        },
        {
          latency: 2.885,
          percentile: 0.65,
          total: 2148377
        },
        {
          latency: 3.013,
          percentile: 0.7,
          total: 2312357
        },
        {
          latency: 3.163,
          percentile: 0.75,
          total: 2478613
        },
        {
          latency: 3.249,
          percentile: 0.775,
          total: 2561538
        },
        {
          latency: 3.343,
          percentile: 0.8,
          total: 2642681
        },
        {
          latency: 3.453,
          percentile: 0.825,
          total: 2725170
        },
        {
          latency: 3.585,
          percentile: 0.85,
          total: 2808733
        },
        {
          latency: 3.747,
          percentile: 0.875,
          total: 2891031
        },
        {
          latency: 3.845,
          percentile: 0.8875,
          total: 2931992
        },
        {
          latency: 3.961,
          percentile: 0.9,
          total: 2973017
        },
        {
          latency: 4.103,
          percentile: 0.9125,
          total: 3015026
        },
        {
          latency: 4.271,
          percentile: 0.925,
          total: 3055478
        },
        {
          latency: 4.495,
          percentile: 0.9375,
          total: 3097120
        },
        {
          latency: 4.631,
          percentile: 0.94375,
          total: 3117641
        },
        {
          latency: 4.795,
          percentile: 0.95,
          total: 3138078
        },
        {
          latency: 4.999,
          percentile: 0.95625,
          total: 3158656
        },
        {
          latency: 5.263,
          percentile: 0.9625,
          total: 3179308
        },
        {
          latency: 5.631,
          percentile: 0.96875,
          total: 3200110
        },
        {
          latency: 5.871,
          percentile: 0.971875,
          total: 3210253
        },
        {
          latency: 6.195,
          percentile: 0.975,
          total: 3220644
        },
        {
          latency: 6.615,
          percentile: 0.978125,
          total: 3230879
        },
        {
          latency: 7.179,
          percentile: 0.98125,
          total: 3241224
        },
        {
          latency: 7.923,
          percentile: 0.984375,
          total: 3251541
        },
        {
          latency: 8.399,
          percentile: 0.985938,
          total: 3256743
        },
        {
          latency: 8.943,
          percentile: 0.9875,
          total: 3261899
        },
        {
          latency: 9.583,
          percentile: 0.989062,
          total: 3267023
        },
        {
          latency: 10.279,
          percentile: 0.990625,
          total: 3272193
        },
        {
          latency: 11.135,
          percentile: 0.992188,
          total: 3277329
        },
        {
          latency: 11.655,
          percentile: 0.992969,
          total: 3279907
        },
        {
          latency: 12.287,
          percentile: 0.99375,
          total: 3282510
        },
        {
          latency: 12.967,
          percentile: 0.994531,
          total: 3285068
        },
        {
          latency: 13.815,
          percentile: 0.995313,
          total: 3287647
        },
        {
          latency: 14.895,
          percentile: 0.996094,
          total: 3290240
        },
        {
          latency: 15.527,
          percentile: 0.996484,
          total: 3291523
        },
        {
          latency: 16.247,
          percentile: 0.996875,
          total: 3292823
        },
        {
          latency: 17.135,
          percentile: 0.997266,
          total: 3294113
        },
        {
          latency: 18.143,
          percentile: 0.997656,
          total: 3295389
        },
        {
          latency: 19.439,
          percentile: 0.998047,
          total: 3296682
        },
        {
          latency: 20.127,
          percentile: 0.998242,
          total: 3297328
        },
        {
          latency: 20.975,
          percentile: 0.998437,
          total: 3297975
        },
        {
          latency: 21.919,
          percentile: 0.998633,
          total: 3298614
        },
        {
          latency: 23.055,
          percentile: 0.998828,
          total: 3299262
        },
        {
          latency: 24.447,
          percentile: 0.999023,
          total: 3299907
        },
        {
          latency: 25.279,
          percentile: 0.999121,
          total: 3300228
        },
        {
          latency: 26.079,
          percentile: 0.999219,
          total: 3300552
        },
        {
          latency: 27.135,
          percentile: 0.999316,
          total: 3300875
        },
        {
          latency: 28.319,
          percentile: 0.999414,
          total: 3301198
        },
        {
          latency: 29.711,
          percentile: 0.999512,
          total: 3301521
        },
        {
          latency: 30.543,
          percentile: 0.999561,
          total: 3301684
        },
        {
          latency: 31.471,
          percentile: 0.999609,
          total: 3301839
        },
        {
          latency: 32.495,
          percentile: 0.999658,
          total: 3302005
        },
        {
          latency: 33.919,
          percentile: 0.999707,
          total: 3302162
        },
        {
          latency: 35.807,
          percentile: 0.999756,
          total: 3302324
        },
        {
          latency: 37.151,
          percentile: 0.99978,
          total: 3302404
        },
        {
          latency: 38.623,
          percentile: 0.999805,
          total: 3302483
        },
        {
          latency: 42.655,
          percentile: 0.999829,
          total: 3302564
        },
        {
          latency: 50.559,
          percentile: 0.999854,
          total: 3302645
        },
        {
          latency: 79.423,
          percentile: 0.999878,
          total: 3302726
        },
        {
          latency: 92.927,
          percentile: 0.99989,
          total: 3302766
        },
        {
          latency: 107.455,
          percentile: 0.999902,
          total: 3302806
        },
        {
          latency: 120.639,
          percentile: 0.999915,
          total: 3302846
        },
        {
          latency: 133.119,
          percentile: 0.999927,
          total: 3302887
        },
        {
          latency: 146.815,
          percentile: 0.999939,
          total: 3302927
        },
        {
          latency: 156.927,
          percentile: 0.999945,
          total: 3302948
        },
        {
          latency: 161.151,
          percentile: 0.999951,
          total: 3302967
        },
        {
          latency: 172.159,
          percentile: 0.999957,
          total: 3302989
        },
        {
          latency: 175.871,
          percentile: 0.999963,
          total: 3303008
        },
        {
          latency: 187.391,
          percentile: 0.999969,
          total: 3303029
        },
        {
          latency: 188.159,
          percentile: 0.999973,
          total: 3303038
        },
        {
          latency: 190.207,
          percentile: 0.999976,
          total: 3303049
        },
        {
          latency: 200.063,
          percentile: 0.999979,
          total: 3303058
        },
        {
          latency: 202.623,
          percentile: 0.999982,
          total: 3303070
        },
        {
          latency: 203.647,
          percentile: 0.999985,
          total: 3303078
        },
        {
          latency: 204.159,
          percentile: 0.999986,
          total: 3303084
        },
        {
          latency: 204.799,
          percentile: 0.999988,
          total: 3303090
        },
        {
          latency: 205.567,
          percentile: 0.999989,
          total: 3303093
        },
        {
          latency: 207.615,
          percentile: 0.999991,
          total: 3303098
        },
        {
          latency: 216.447,
          percentile: 0.999992,
          total: 3303103
        },
        {
          latency: 216.831,
          percentile: 0.999993,
          total: 3303106
        },
        {
          latency: 217.471,
          percentile: 0.999994,
          total: 3303108
        },
        {
          latency: 218.111,
          percentile: 0.999995,
          total: 3303112
        },
        {
          latency: 218.239,
          percentile: 0.999995,
          total: 3303113
        },
        {
          latency: 219.007,
          percentile: 0.999996,
          total: 3303116
        },
        {
          latency: 219.135,
          percentile: 0.999997,
          total: 3303118
        },
        {
          latency: 219.135,
          percentile: 0.999997,
          total: 3303118
        },
        {
          latency: 220.031,
          percentile: 0.999997,
          total: 3303120
        },
        {
          latency: 220.287,
          percentile: 0.999998,
          total: 3303123
        },
        {
          latency: 220.287,
          percentile: 0.999998,
          total: 3303123
        },
        {
          latency: 220.287,
          percentile: 0.999998,
          total: 3303123
        },
        {
          latency: 220.287,
          percentile: 0.999998,
          total: 3303123
        },
        {
          latency: 220.415,
          percentile: 0.999999,
          total: 3303124
        },
        {
          latency: 220.543,
          percentile: 0.999999,
          total: 3303125
        },
        {
          latency: 220.543,
          percentile: 0.999999,
          total: 3303125
        },
        {
          latency: 220.671,
          percentile: 0.999999,
          total: 3303126
        },
        {
          latency: 220.671,
          percentile: 0.999999,
          total: 3303126
        },
        {
          latency: 220.671,
          percentile: 0.999999,
          total: 3303126
        },
        {
          latency: 221.567,
          percentile: 0.999999,
          total: 3303127
        },
        {
          latency: 221.567,
          percentile: 1,
          total: 3303127
        },
        {
          latency: 221.567,
          percentile: 1,
          total: 3303127
        },
        {
          latency: 221.567,
          percentile: 1,
          total: 3303127
        },
        {
          latency: 221.567,
          percentile: 1,
          total: 3303127
        },
        {
          latency: 223.103,
          percentile: 1,
          total: 3303128
        },
        {
          latency: 223.103,
          percentile: 1,
          total: 3303128
        }
      ]
    }
  },
  {
    opts: {
      path: '../wrk2/wrk',
      rate: 11500,
      duration: '300s',
      threads: 4,
      connections: 200,
      printLatency: true,
      url: 'http://107.21.1.157/queryU'
    },
    result: {
      transferPerSec: '6.16MB',
      requestsPerSec: 11495.48,
      non2xx3xx: 2445,
      requestsTotal: 3448643,
      durationActual: '5.00m',
      transferTotal: '1.80GB',
      latencyAvg: 'calibration:',
      latencyStdev: 'mean',
      latencyMax: 'lat.:',
      latencyStdevPerc: null,
      rpsAvg: 'calibration:',
      rpsStdev: 'mean',
      rpsMax: 'lat.:',
      rpsStdevPerc: null,
      histogram: [
        {
          latency: 1.765,
          percentile: 0.1,
          total: 334058
        },
        {
          latency: 1.998,
          percentile: 0.2,
          total: 667328
        },
        {
          latency: 2.191,
          percentile: 0.3,
          total: 1003032
        },
        {
          latency: 2.367,
          percentile: 0.4,
          total: 1335370
        },
        {
          latency: 2.545,
          percentile: 0.5,
          total: 1668915
        },
        {
          latency: 2.639,
          percentile: 0.55,
          total: 1833308
        },
        {
          latency: 2.743,
          percentile: 0.6,
          total: 2000354
        },
        {
          latency: 2.861,
          percentile: 0.65,
          total: 2168378
        },
        {
          latency: 2.993,
          percentile: 0.7,
          total: 2332519
        },
        {
          latency: 3.151,
          percentile: 0.75,
          total: 2500077
        },
        {
          latency: 3.241,
          percentile: 0.775,
          total: 2583062
        },
        {
          latency: 3.341,
          percentile: 0.8,
          total: 2665722
        },
        {
          latency: 3.459,
          percentile: 0.825,
          total: 2750127
        },
        {
          latency: 3.595,
          percentile: 0.85,
          total: 2832473
        },
        {
          latency: 3.765,
          percentile: 0.875,
          total: 2915720
        },
        {
          latency: 3.869,
          percentile: 0.8875,
          total: 2957382
        },
        {
          latency: 3.991,
          percentile: 0.9,
          total: 2999355
        },
        {
          latency: 4.135,
          percentile: 0.9125,
          total: 3040817
        },
        {
          latency: 4.315,
          percentile: 0.925,
          total: 3082488
        },
        {
          latency: 4.551,
          percentile: 0.9375,
          total: 3124345
        },
        {
          latency: 4.703,
          percentile: 0.94375,
          total: 3145059
        },
        {
          latency: 4.887,
          percentile: 0.95,
          total: 3165851
        },
        {
          latency: 5.115,
          percentile: 0.95625,
          total: 3186469
        },
        {
          latency: 5.419,
          percentile: 0.9625,
          total: 3207370
        },
        {
          latency: 5.839,
          percentile: 0.96875,
          total: 3228116
        },
        {
          latency: 6.127,
          percentile: 0.971875,
          total: 3238416
        },
        {
          latency: 6.503,
          percentile: 0.975,
          total: 3248889
        },
        {
          latency: 6.987,
          percentile: 0.978125,
          total: 3259249
        },
        {
          latency: 7.635,
          percentile: 0.98125,
          total: 3269692
        },
        {
          latency: 8.463,
          percentile: 0.984375,
          total: 3280096
        },
        {
          latency: 8.983,
          percentile: 0.985938,
          total: 3285345
        },
        {
          latency: 9.575,
          percentile: 0.9875,
          total: 3290484
        },
        {
          latency: 10.279,
          percentile: 0.989062,
          total: 3295734
        },
        {
          latency: 11.071,
          percentile: 0.990625,
          total: 3300930
        },
        {
          latency: 12.079,
          percentile: 0.992188,
          total: 3306113
        },
        {
          latency: 12.631,
          percentile: 0.992969,
          total: 3308720
        },
        {
          latency: 13.279,
          percentile: 0.99375,
          total: 3311311
        },
        {
          latency: 14.063,
          percentile: 0.994531,
          total: 3313932
        },
        {
          latency: 14.975,
          percentile: 0.995313,
          total: 3316513
        },
        {
          latency: 16.159,
          percentile: 0.996094,
          total: 3319124
        },
        {
          latency: 16.895,
          percentile: 0.996484,
          total: 3320418
        },
        {
          latency: 17.679,
          percentile: 0.996875,
          total: 3321726
        },
        {
          latency: 18.607,
          percentile: 0.997266,
          total: 3323032
        },
        {
          latency: 19.615,
          percentile: 0.997656,
          total: 3324335
        },
        {
          latency: 20.767,
          percentile: 0.998047,
          total: 3325638
        },
        {
          latency: 21.455,
          percentile: 0.998242,
          total: 3326277
        },
        {
          latency: 22.207,
          percentile: 0.998437,
          total: 3326935
        },
        {
          latency: 23.023,
          percentile: 0.998633,
          total: 3327582
        },
        {
          latency: 24.031,
          percentile: 0.998828,
          total: 3328238
        },
        {
          latency: 25.311,
          percentile: 0.999023,
          total: 3328879
        },
        {
          latency: 26.111,
          percentile: 0.999121,
          total: 3329212
        },
        {
          latency: 26.927,
          percentile: 0.999219,
          total: 3329532
        },
        {
          latency: 27.871,
          percentile: 0.999316,
          total: 3329858
        },
        {
          latency: 28.975,
          percentile: 0.999414,
          total: 3330181
        },
        {
          latency: 30.399,
          percentile: 0.999512,
          total: 3330507
        },
        {
          latency: 31.327,
          percentile: 0.999561,
          total: 3330671
        },
        {
          latency: 32.367,
          percentile: 0.999609,
          total: 3330831
        },
        {
          latency: 33.695,
          percentile: 0.999658,
          total: 3330995
        },
        {
          latency: 35.007,
          percentile: 0.999707,
          total: 3331159
        },
        {
          latency: 37.247,
          percentile: 0.999756,
          total: 3331321
        },
        {
          latency: 38.751,
          percentile: 0.99978,
          total: 3331401
        },
        {
          latency: 40.159,
          percentile: 0.999805,
          total: 3331483
        },
        {
          latency: 41.823,
          percentile: 0.999829,
          total: 3331563
        },
        {
          latency: 46.079,
          percentile: 0.999854,
          total: 3331644
        },
        {
          latency: 60.831,
          percentile: 0.999878,
          total: 3331726
        },
        {
          latency: 76.159,
          percentile: 0.99989,
          total: 3331766
        },
        {
          latency: 93.503,
          percentile: 0.999902,
          total: 3331807
        },
        {
          latency: 108.863,
          percentile: 0.999915,
          total: 3331848
        },
        {
          latency: 126.719,
          percentile: 0.999927,
          total: 3331888
        },
        {
          latency: 142.591,
          percentile: 0.999939,
          total: 3331929
        },
        {
          latency: 152.319,
          percentile: 0.999945,
          total: 3331949
        },
        {
          latency: 158.975,
          percentile: 0.999951,
          total: 3331971
        },
        {
          latency: 168.575,
          percentile: 0.999957,
          total: 3331990
        },
        {
          latency: 175.487,
          percentile: 0.999963,
          total: 3332010
        },
        {
          latency: 186.623,
          percentile: 0.999969,
          total: 3332031
        },
        {
          latency: 189.311,
          percentile: 0.999973,
          total: 3332041
        },
        {
          latency: 192.127,
          percentile: 0.999976,
          total: 3332052
        },
        {
          latency: 199.807,
          percentile: 0.999979,
          total: 3332061
        },
        {
          latency: 202.879,
          percentile: 0.999982,
          total: 3332071
        },
        {
          latency: 204.671,
          percentile: 0.999985,
          total: 3332082
        },
        {
          latency: 205.951,
          percentile: 0.999986,
          total: 3332087
        },
        {
          latency: 208.895,
          percentile: 0.999988,
          total: 3332092
        },
        {
          latency: 214.527,
          percentile: 0.999989,
          total: 3332097
        },
        {
          latency: 217.087,
          percentile: 0.999991,
          total: 3332102
        },
        {
          latency: 217.727,
          percentile: 0.999992,
          total: 3332107
        },
        {
          latency: 218.751,
          percentile: 0.999993,
          total: 3332110
        },
        {
          latency: 219.391,
          percentile: 0.999994,
          total: 3332112
        },
        {
          latency: 221.183,
          percentile: 0.999995,
          total: 3332115
        },
        {
          latency: 224.383,
          percentile: 0.999995,
          total: 3332117
        },
        {
          latency: 251.519,
          percentile: 0.999996,
          total: 3332120
        },
        {
          latency: 265.471,
          percentile: 0.999997,
          total: 3332121
        },
        {
          latency: 279.039,
          percentile: 0.999997,
          total: 3332122
        },
        {
          latency: 303.871,
          percentile: 0.999997,
          total: 3332124
        },
        {
          latency: 317.183,
          percentile: 0.999998,
          total: 3332125
        },
        {
          latency: 332.031,
          percentile: 0.999998,
          total: 3332126
        },
        {
          latency: 344.575,
          percentile: 0.999998,
          total: 3332127
        },
        {
          latency: 344.575,
          percentile: 0.999998,
          total: 3332127
        },
        {
          latency: 357.375,
          percentile: 0.999999,
          total: 3332128
        },
        {
          latency: 370.175,
          percentile: 0.999999,
          total: 3332129
        },
        {
          latency: 370.175,
          percentile: 0.999999,
          total: 3332129
        },
        {
          latency: 384.767,
          percentile: 0.999999,
          total: 3332130
        },
        {
          latency: 384.767,
          percentile: 0.999999,
          total: 3332130
        },
        {
          latency: 384.767,
          percentile: 0.999999,
          total: 3332130
        },
        {
          latency: 397.055,
          percentile: 0.999999,
          total: 3332131
        },
        {
          latency: 397.055,
          percentile: 1,
          total: 3332131
        },
        {
          latency: 397.055,
          percentile: 1,
          total: 3332131
        },
        {
          latency: 397.055,
          percentile: 1,
          total: 3332131
        },
        {
          latency: 397.055,
          percentile: 1,
          total: 3332131
        },
        {
          latency: 409.087,
          percentile: 1,
          total: 3332132
        },
        {
          latency: 409.087,
          percentile: 1,
          total: 3332132
        }
      ]
    }
  },
  {
    opts: {
      path: '../wrk2/wrk',
      rate: 11600,
      duration: '300s',
      threads: 4,
      connections: 200,
      printLatency: true,
      url: 'http://107.21.1.157/queryU'
    },
    result: {
      transferPerSec: '6.21MB',
      requestsPerSec: 11595.41,
      non2xx3xx: 2067,
      requestsTotal: 3478628,
      durationActual: '5.00m',
      transferTotal: '1.82GB',
      latencyAvg: 'calibration:',
      latencyStdev: 'mean',
      latencyMax: 'lat.:',
      latencyStdevPerc: null,
      rpsAvg: 'calibration:',
      rpsStdev: 'mean',
      rpsMax: 'lat.:',
      rpsStdevPerc: null,
      histogram: [
        {
          latency: 1.745,
          percentile: 0.1,
          total: 336593
        },
        {
          latency: 1.963,
          percentile: 0.2,
          total: 673381
        },
        {
          latency: 2.143,
          percentile: 0.3,
          total: 1012210
        },
        {
          latency: 2.307,
          percentile: 0.4,
          total: 1347493
        },
        {
          latency: 2.471,
          percentile: 0.5,
          total: 1682480
        },
        {
          latency: 2.557,
          percentile: 0.55,
          total: 1849186
        },
        {
          latency: 2.651,
          percentile: 0.6,
          total: 2019448
        },
        {
          latency: 2.753,
          percentile: 0.65,
          total: 2186686
        },
        {
          latency: 2.869,
          percentile: 0.7,
          total: 2353999
        },
        {
          latency: 3.007,
          percentile: 0.75,
          total: 2522670
        },
        {
          latency: 3.085,
          percentile: 0.775,
          total: 2605148
        },
        {
          latency: 3.175,
          percentile: 0.8,
          total: 2689476
        },
        {
          latency: 3.279,
          percentile: 0.825,
          total: 2773894
        },
        {
          latency: 3.401,
          percentile: 0.85,
          total: 2856961
        },
        {
          latency: 3.555,
          percentile: 0.875,
          total: 2941480
        },
        {
          latency: 3.649,
          percentile: 0.8875,
          total: 2983609
        },
        {
          latency: 3.759,
          percentile: 0.9,
          total: 3025271
        },
        {
          latency: 3.893,
          percentile: 0.9125,
          total: 3067058
        },
        {
          latency: 4.065,
          percentile: 0.925,
          total: 3109304
        },
        {
          latency: 4.291,
          percentile: 0.9375,
          total: 3151076
        },
        {
          latency: 4.439,
          percentile: 0.94375,
          total: 3172083
        },
        {
          latency: 4.623,
          percentile: 0.95,
          total: 3193300
        },
        {
          latency: 4.859,
          percentile: 0.95625,
          total: 3214039
        },
        {
          latency: 5.187,
          percentile: 0.9625,
          total: 3235156
        },
        {
          latency: 5.663,
          percentile: 0.96875,
          total: 3256180
        },
        {
          latency: 5.999,
          percentile: 0.971875,
          total: 3266647
        },
        {
          latency: 6.431,
          percentile: 0.975,
          total: 3277069
        },
        {
          latency: 6.999,
          percentile: 0.978125,
          total: 3287619
        },
        {
          latency: 7.719,
          percentile: 0.98125,
          total: 3298094
        },
        {
          latency: 8.623,
          percentile: 0.984375,
          total: 3308598
        },
        {
          latency: 9.175,
          percentile: 0.985938,
          total: 3313829
        },
        {
          latency: 9.783,
          percentile: 0.9875,
          total: 3319096
        },
        {
          latency: 10.495,
          percentile: 0.989062,
          total: 3324370
        },
        {
          latency: 11.295,
          percentile: 0.990625,
          total: 3329609
        },
        {
          latency: 12.271,
          percentile: 0.992188,
          total: 3334852
        },
        {
          latency: 12.847,
          percentile: 0.992969,
          total: 3337459
        },
        {
          latency: 13.511,
          percentile: 0.99375,
          total: 3340097
        },
        {
          latency: 14.335,
          percentile: 0.994531,
          total: 3342724
        },
        {
          latency: 15.279,
          percentile: 0.995313,
          total: 3345339
        },
        {
          latency: 16.399,
          percentile: 0.996094,
          total: 3347975
        },
        {
          latency: 17.103,
          percentile: 0.996484,
          total: 3349299
        },
        {
          latency: 17.871,
          percentile: 0.996875,
          total: 3350597
        },
        {
          latency: 18.751,
          percentile: 0.997266,
          total: 3351902
        },
        {
          latency: 19.807,
          percentile: 0.997656,
          total: 3353215
        },
        {
          latency: 21.039,
          percentile: 0.998047,
          total: 3354527
        },
        {
          latency: 21.759,
          percentile: 0.998242,
          total: 3355187
        },
        {
          latency: 22.543,
          percentile: 0.998437,
          total: 3355839
        },
        {
          latency: 23.423,
          percentile: 0.998633,
          total: 3356495
        },
        {
          latency: 24.527,
          percentile: 0.998828,
          total: 3357148
        },
        {
          latency: 25.903,
          percentile: 0.999023,
          total: 3357804
        },
        {
          latency: 26.815,
          percentile: 0.999121,
          total: 3358130
        },
        {
          latency: 27.679,
          percentile: 0.999219,
          total: 3358465
        },
        {
          latency: 28.655,
          percentile: 0.999316,
          total: 3358792
        },
        {
          latency: 29.775,
          percentile: 0.999414,
          total: 3359118
        },
        {
          latency: 31.231,
          percentile: 0.999512,
          total: 3359443
        },
        {
          latency: 32.047,
          percentile: 0.999561,
          total: 3359607
        },
        {
          latency: 33.183,
          percentile: 0.999609,
          total: 3359776
        },
        {
          latency: 34.431,
          percentile: 0.999658,
          total: 3359938
        },
        {
          latency: 35.839,
          percentile: 0.999707,
          total: 3360100
        },
        {
          latency: 38.207,
          percentile: 0.999756,
          total: 3360265
        },
        {
          latency: 40.159,
          percentile: 0.99978,
          total: 3360347
        },
        {
          latency: 42.655,
          percentile: 0.999805,
          total: 3360429
        },
        {
          latency: 46.655,
          percentile: 0.999829,
          total: 3360510
        },
        {
          latency: 55.839,
          percentile: 0.999854,
          total: 3360592
        },
        {
          latency: 83.519,
          percentile: 0.999878,
          total: 3360674
        },
        {
          latency: 97.727,
          percentile: 0.99989,
          total: 3360715
        },
        {
          latency: 112.575,
          percentile: 0.999902,
          total: 3360756
        },
        {
          latency: 125.823,
          percentile: 0.999915,
          total: 3360797
        },
        {
          latency: 140.031,
          percentile: 0.999927,
          total: 3360838
        },
        {
          latency: 154.879,
          percentile: 0.999939,
          total: 3360879
        },
        {
          latency: 158.975,
          percentile: 0.999945,
          total: 3360900
        },
        {
          latency: 169.983,
          percentile: 0.999951,
          total: 3360920
        },
        {
          latency: 173.823,
          percentile: 0.999957,
          total: 3360941
        },
        {
          latency: 183.935,
          percentile: 0.999963,
          total: 3360961
        },
        {
          latency: 188.159,
          percentile: 0.999969,
          total: 3360982
        },
        {
          latency: 190.847,
          percentile: 0.999973,
          total: 3360992
        },
        {
          latency: 198.015,
          percentile: 0.999976,
          total: 3361002
        },
        {
          latency: 201.599,
          percentile: 0.999979,
          total: 3361013
        },
        {
          latency: 202.367,
          percentile: 0.999982,
          total: 3361024
        },
        {
          latency: 204.287,
          percentile: 0.999985,
          total: 3361033
        },
        {
          latency: 206.719,
          percentile: 0.999986,
          total: 3361038
        },
        {
          latency: 210.431,
          percentile: 0.999988,
          total: 3361043
        },
        {
          latency: 214.911,
          percentile: 0.999989,
          total: 3361050
        },
        {
          latency: 215.935,
          percentile: 0.999991,
          total: 3361054
        },
        {
          latency: 216.447,
          percentile: 0.999992,
          total: 3361059
        },
        {
          latency: 216.575,
          percentile: 0.999993,
          total: 3361061
        },
        {
          latency: 217.087,
          percentile: 0.999994,
          total: 3361064
        },
        {
          latency: 217.343,
          percentile: 0.999995,
          total: 3361067
        },
        {
          latency: 217.599,
          percentile: 0.999995,
          total: 3361069
        },
        {
          latency: 218.239,
          percentile: 0.999996,
          total: 3361073
        },
        {
          latency: 218.239,
          percentile: 0.999997,
          total: 3361073
        },
        {
          latency: 218.367,
          percentile: 0.999997,
          total: 3361075
        },
        {
          latency: 218.623,
          percentile: 0.999997,
          total: 3361076
        },
        {
          latency: 219.135,
          percentile: 0.999998,
          total: 3361077
        },
        {
          latency: 219.391,
          percentile: 0.999998,
          total: 3361078
        },
        {
          latency: 219.519,
          percentile: 0.999998,
          total: 3361079
        },
        {
          latency: 219.519,
          percentile: 0.999998,
          total: 3361079
        },
        {
          latency: 219.647,
          percentile: 0.999999,
          total: 3361080
        },
        {
          latency: 219.775,
          percentile: 0.999999,
          total: 3361081
        },
        {
          latency: 219.775,
          percentile: 0.999999,
          total: 3361081
        },
        {
          latency: 221.823,
          percentile: 0.999999,
          total: 3361083
        },
        {
          latency: 221.823,
          percentile: 0.999999,
          total: 3361083
        },
        {
          latency: 221.823,
          percentile: 0.999999,
          total: 3361083
        },
        {
          latency: 221.823,
          percentile: 0.999999,
          total: 3361083
        },
        {
          latency: 221.823,
          percentile: 1,
          total: 3361083
        },
        {
          latency: 221.823,
          percentile: 1,
          total: 3361083
        },
        {
          latency: 221.823,
          percentile: 1,
          total: 3361083
        },
        {
          latency: 221.823,
          percentile: 1,
          total: 3361083
        },
        {
          latency: 224.639,
          percentile: 1,
          total: 3361084
        },
        {
          latency: 224.639,
          percentile: 1,
          total: 3361084
        }
      ]
    }
  },
  {
    opts: {
      path: '../wrk2/wrk',
      rate: 11700,
      duration: '300s',
      threads: 4,
      connections: 200,
      printLatency: true,
      url: 'http://107.21.1.157/queryU'
    },
    result: {
      transferPerSec: '6.26MB',
      requestsPerSec: 11695.37,
      non2xx3xx: 3426,
      requestsTotal: 3508614,
      durationActual: '5.00m',
      transferTotal: '1.84GB',
      latencyAvg: 'calibration:',
      latencyStdev: 'mean',
      latencyMax: 'lat.:',
      latencyStdevPerc: null,
      rpsAvg: 'calibration:',
      rpsStdev: 'mean',
      rpsMax: 'lat.:',
      rpsStdevPerc: null,
      histogram: [
        {
          latency: 1.738,
          percentile: 0.1,
          total: 339136
        },
        {
          latency: 1.973,
          percentile: 0.2,
          total: 679371
        },
        {
          latency: 2.173,
          percentile: 0.3,
          total: 1018110
        },
        {
          latency: 2.361,
          percentile: 0.4,
          total: 1356719
        },
        {
          latency: 2.551,
          percentile: 0.5,
          total: 1698014
        },
        {
          latency: 2.649,
          percentile: 0.55,
          total: 1865418
        },
        {
          latency: 2.755,
          percentile: 0.6,
          total: 2034932
        },
        {
          latency: 2.871,
          percentile: 0.65,
          total: 2204240
        },
        {
          latency: 3.003,
          percentile: 0.7,
          total: 2375117
        },
        {
          latency: 3.155,
          percentile: 0.75,
          total: 2544414
        },
        {
          latency: 3.241,
          percentile: 0.775,
          total: 2628224
        },
        {
          latency: 3.339,
          percentile: 0.8,
          total: 2713362
        },
        {
          latency: 3.451,
          percentile: 0.825,
          total: 2798207
        },
        {
          latency: 3.583,
          percentile: 0.85,
          total: 2881628
        },
        {
          latency: 3.751,
          percentile: 0.875,
          total: 2966305
        },
        {
          latency: 3.857,
          percentile: 0.8875,
          total: 3009097
        },
        {
          latency: 3.981,
          percentile: 0.9,
          total: 3051579
        },
        {
          latency: 4.131,
          percentile: 0.9125,
          total: 3093896
        },
        {
          latency: 4.323,
          percentile: 0.925,
          total: 3136524
        },
        {
          latency: 4.583,
          percentile: 0.9375,
          total: 3178745
        },
        {
          latency: 4.751,
          percentile: 0.94375,
          total: 3199473
        },
        {
          latency: 4.967,
          percentile: 0.95,
          total: 3220638
        },
        {
          latency: 5.251,
          percentile: 0.95625,
          total: 3241767
        },
        {
          latency: 5.639,
          percentile: 0.9625,
          total: 3262928
        },
        {
          latency: 6.191,
          percentile: 0.96875,
          total: 3284117
        },
        {
          latency: 6.587,
          percentile: 0.971875,
          total: 3294807
        },
        {
          latency: 7.079,
          percentile: 0.975,
          total: 3305336
        },
        {
          latency: 7.695,
          percentile: 0.978125,
          total: 3315900
        },
        {
          latency: 8.479,
          percentile: 0.98125,
          total: 3326551
        },
        {
          latency: 9.463,
          percentile: 0.984375,
          total: 3337101
        },
        {
          latency: 10.055,
          percentile: 0.985938,
          total: 3342443
        },
        {
          latency: 10.719,
          percentile: 0.9875,
          total: 3347708
        },
        {
          latency: 11.487,
          percentile: 0.989062,
          total: 3352980
        },
        {
          latency: 12.407,
          percentile: 0.990625,
          total: 3358315
        },
        {
          latency: 13.535,
          percentile: 0.992188,
          total: 3363578
        },
        {
          latency: 14.247,
          percentile: 0.992969,
          total: 3366230
        },
        {
          latency: 15.079,
          percentile: 0.99375,
          total: 3368880
        },
        {
          latency: 16.015,
          percentile: 0.994531,
          total: 3371519
        },
        {
          latency: 17.119,
          percentile: 0.995313,
          total: 3374164
        },
        {
          latency: 18.495,
          percentile: 0.996094,
          total: 3376824
        },
        {
          latency: 19.279,
          percentile: 0.996484,
          total: 3378146
        },
        {
          latency: 20.207,
          percentile: 0.996875,
          total: 3379490
        },
        {
          latency: 21.183,
          percentile: 0.997266,
          total: 3380785
        },
        {
          latency: 22.399,
          percentile: 0.997656,
          total: 3382119
        },
        {
          latency: 23.759,
          percentile: 0.998047,
          total: 3383438
        },
        {
          latency: 24.559,
          percentile: 0.998242,
          total: 3384096
        },
        {
          latency: 25.535,
          percentile: 0.998437,
          total: 3384763
        },
        {
          latency: 26.559,
          percentile: 0.998633,
          total: 3385423
        },
        {
          latency: 27.759,
          percentile: 0.998828,
          total: 3386080
        },
        {
          latency: 29.183,
          percentile: 0.999023,
          total: 3386747
        },
        {
          latency: 30.175,
          percentile: 0.999121,
          total: 3387074
        },
        {
          latency: 31.327,
          percentile: 0.999219,
          total: 3387405
        },
        {
          latency: 32.735,
          percentile: 0.999316,
          total: 3387738
        },
        {
          latency: 34.335,
          percentile: 0.999414,
          total: 3388070
        },
        {
          latency: 36.479,
          percentile: 0.999512,
          total: 3388397
        },
        {
          latency: 37.663,
          percentile: 0.999561,
          total: 3388563
        },
        {
          latency: 39.071,
          percentile: 0.999609,
          total: 3388731
        },
        {
          latency: 40.703,
          percentile: 0.999658,
          total: 3388894
        },
        {
          latency: 42.719,
          percentile: 0.999707,
          total: 3389061
        },
        {
          latency: 45.983,
          percentile: 0.999756,
          total: 3389225
        },
        {
          latency: 48.735,
          percentile: 0.99978,
          total: 3389308
        },
        {
          latency: 52.639,
          percentile: 0.999805,
          total: 3389390
        },
        {
          latency: 56.671,
          percentile: 0.999829,
          total: 3389474
        },
        {
          latency: 74.367,
          percentile: 0.999854,
          total: 3389556
        },
        {
          latency: 99.903,
          percentile: 0.999878,
          total: 3389639
        },
        {
          latency: 113.151,
          percentile: 0.99989,
          total: 3389680
        },
        {
          latency: 124.543,
          percentile: 0.999902,
          total: 3389721
        },
        {
          latency: 134.015,
          percentile: 0.999915,
          total: 3389763
        },
        {
          latency: 145.407,
          percentile: 0.999927,
          total: 3389804
        },
        {
          latency: 158.591,
          percentile: 0.999939,
          total: 3389847
        },
        {
          latency: 163.583,
          percentile: 0.999945,
          total: 3389866
        },
        {
          latency: 172.543,
          percentile: 0.999951,
          total: 3389887
        },
        {
          latency: 174.975,
          percentile: 0.999957,
          total: 3389909
        },
        {
          latency: 185.983,
          percentile: 0.999963,
          total: 3389928
        },
        {
          latency: 189.183,
          percentile: 0.999969,
          total: 3389950
        },
        {
          latency: 190.207,
          percentile: 0.999973,
          total: 3389959
        },
        {
          latency: 192.767,
          percentile: 0.999976,
          total: 3389970
        },
        {
          latency: 200.703,
          percentile: 0.999979,
          total: 3389980
        },
        {
          latency: 202.879,
          percentile: 0.999982,
          total: 3389992
        },
        {
          latency: 203.903,
          percentile: 0.999985,
          total: 3390001
        },
        {
          latency: 204.415,
          percentile: 0.999986,
          total: 3390006
        },
        {
          latency: 204.927,
          percentile: 0.999988,
          total: 3390011
        },
        {
          latency: 205.823,
          percentile: 0.999989,
          total: 3390016
        },
        {
          latency: 211.967,
          percentile: 0.999991,
          total: 3390021
        },
        {
          latency: 215.295,
          percentile: 0.999992,
          total: 3390027
        },
        {
          latency: 215.807,
          percentile: 0.999993,
          total: 3390029
        },
        {
          latency: 216.319,
          percentile: 0.999994,
          total: 3390032
        },
        {
          latency: 216.959,
          percentile: 0.999995,
          total: 3390034
        },
        {
          latency: 217.471,
          percentile: 0.999995,
          total: 3390038
        },
        {
          latency: 217.727,
          percentile: 0.999996,
          total: 3390040
        },
        {
          latency: 217.855,
          percentile: 0.999997,
          total: 3390041
        },
        {
          latency: 218.367,
          percentile: 0.999997,
          total: 3390043
        },
        {
          latency: 218.367,
          percentile: 0.999997,
          total: 3390043
        },
        {
          latency: 218.495,
          percentile: 0.999998,
          total: 3390045
        },
        {
          latency: 218.623,
          percentile: 0.999998,
          total: 3390046
        },
        {
          latency: 219.007,
          percentile: 0.999998,
          total: 3390047
        },
        {
          latency: 219.007,
          percentile: 0.999998,
          total: 3390047
        },
        {
          latency: 219.135,
          percentile: 0.999999,
          total: 3390049
        },
        {
          latency: 219.135,
          percentile: 0.999999,
          total: 3390049
        },
        {
          latency: 219.135,
          percentile: 0.999999,
          total: 3390049
        },
        {
          latency: 219.263,
          percentile: 0.999999,
          total: 3390050
        },
        {
          latency: 219.263,
          percentile: 0.999999,
          total: 3390050
        },
        {
          latency: 219.263,
          percentile: 0.999999,
          total: 3390050
        },
        {
          latency: 220.543,
          percentile: 0.999999,
          total: 3390051
        },
        {
          latency: 220.543,
          percentile: 1,
          total: 3390051
        },
        {
          latency: 220.543,
          percentile: 1,
          total: 3390051
        },
        {
          latency: 220.543,
          percentile: 1,
          total: 3390051
        },
        {
          latency: 220.543,
          percentile: 1,
          total: 3390051
        },
        {
          latency: 226.943,
          percentile: 1,
          total: 3390052
        },
        {
          latency: 226.943,
          percentile: 1,
          total: 3390052
        }
      ]
    }
  },
  {
    opts: {
      path: '../wrk2/wrk',
      rate: 11800,
      duration: '300s',
      threads: 4,
      connections: 200,
      printLatency: true,
      url: 'http://107.21.1.157/queryU'
    },
    result: {
      transferPerSec: '6.32MB',
      requestsPerSec: 11795.33,
      non2xx3xx: 3025,
      requestsTotal: 3538590,
      durationActual: '5.00m',
      transferTotal: '1.85GB',
      latencyAvg: 'calibration:',
      latencyStdev: 'mean',
      latencyMax: 'lat.:',
      latencyStdevPerc: null,
      rpsAvg: 'calibration:',
      rpsStdev: 'mean',
      rpsMax: 'lat.:',
      rpsStdevPerc: null,
      histogram: [
        {
          latency: 1.773,
          percentile: 0.1,
          total: 342073
        },
        {
          latency: 1.989,
          percentile: 0.2,
          total: 684880
        },
        {
          latency: 2.163,
          percentile: 0.3,
          total: 1026569
        },
        {
          latency: 2.323,
          percentile: 0.4,
          total: 1370710
        },
        {
          latency: 2.481,
          percentile: 0.5,
          total: 1710199
        },
        {
          latency: 2.565,
          percentile: 0.55,
          total: 1881114
        },
        {
          latency: 2.657,
          percentile: 0.6,
          total: 2054705
        },
        {
          latency: 2.757,
          percentile: 0.65,
          total: 2223995
        },
        {
          latency: 2.871,
          percentile: 0.7,
          total: 2393671
        },
        {
          latency: 3.009,
          percentile: 0.75,
          total: 2565232
        },
        {
          latency: 3.089,
          percentile: 0.775,
          total: 2649945
        },
        {
          latency: 3.181,
          percentile: 0.8,
          total: 2735543
        },
        {
          latency: 3.289,
          percentile: 0.825,
          total: 2821341
        },
        {
          latency: 3.419,
          percentile: 0.85,
          total: 2907303
        },
        {
          latency: 3.583,
          percentile: 0.875,
          total: 2992484
        },
        {
          latency: 3.685,
          percentile: 0.8875,
          total: 3034781
        },
        {
          latency: 3.809,
          percentile: 0.9,
          total: 3077494
        },
        {
          latency: 3.965,
          percentile: 0.9125,
          total: 3120208
        },
        {
          latency: 4.167,
          percentile: 0.925,
          total: 3162974
        },
        {
          latency: 4.451,
          percentile: 0.9375,
          total: 3205714
        },
        {
          latency: 4.647,
          percentile: 0.94375,
          total: 3226926
        },
        {
          latency: 4.899,
          percentile: 0.95,
          total: 3248188
        },
        {
          latency: 5.251,
          percentile: 0.95625,
          total: 3269644
        },
        {
          latency: 5.759,
          percentile: 0.9625,
          total: 3290815
        },
        {
          latency: 6.531,
          percentile: 0.96875,
          total: 3312172
        },
        {
          latency: 7.063,
          percentile: 0.971875,
          total: 3322876
        },
        {
          latency: 7.711,
          percentile: 0.975,
          total: 3333572
        },
        {
          latency: 8.519,
          percentile: 0.978125,
          total: 3344272
        },
        {
          latency: 9.487,
          percentile: 0.98125,
          total: 3354982
        },
        {
          latency: 10.655,
          percentile: 0.984375,
          total: 3365594
        },
        {
          latency: 11.343,
          percentile: 0.985938,
          total: 3370982
        },
        {
          latency: 12.127,
          percentile: 0.9875,
          total: 3376321
        },
        {
          latency: 13.031,
          percentile: 0.989062,
          total: 3381633
        },
        {
          latency: 14.159,
          percentile: 0.990625,
          total: 3386988
        },
        {
          latency: 15.583,
          percentile: 0.992188,
          total: 3392335
        },
        {
          latency: 16.415,
          percentile: 0.992969,
          total: 3394988
        },
        {
          latency: 17.375,
          percentile: 0.99375,
          total: 3397657
        },
        {
          latency: 18.415,
          percentile: 0.994531,
          total: 3400348
        },
        {
          latency: 19.631,
          percentile: 0.995313,
          total: 3402995
        },
        {
          latency: 21.151,
          percentile: 0.996094,
          total: 3405675
        },
        {
          latency: 21.999,
          percentile: 0.996484,
          total: 3406997
        },
        {
          latency: 22.959,
          percentile: 0.996875,
          total: 3408338
        },
        {
          latency: 24.111,
          percentile: 0.997266,
          total: 3409677
        },
        {
          latency: 25.455,
          percentile: 0.997656,
          total: 3411004
        },
        {
          latency: 27.087,
          percentile: 0.998047,
          total: 3412344
        },
        {
          latency: 27.967,
          percentile: 0.998242,
          total: 3413012
        },
        {
          latency: 29.007,
          percentile: 0.998437,
          total: 3413674
        },
        {
          latency: 30.287,
          percentile: 0.998633,
          total: 3414348
        },
        {
          latency: 31.791,
          percentile: 0.998828,
          total: 3415018
        },
        {
          latency: 33.695,
          percentile: 0.999023,
          total: 3415680
        },
        {
          latency: 34.687,
          percentile: 0.999121,
          total: 3416011
        },
        {
          latency: 35.903,
          percentile: 0.999219,
          total: 3416347
        },
        {
          latency: 37.119,
          percentile: 0.999316,
          total: 3416679
        },
        {
          latency: 38.655,
          percentile: 0.999414,
          total: 3417012
        },
        {
          latency: 40.639,
          percentile: 0.999512,
          total: 3417352
        },
        {
          latency: 41.631,
          percentile: 0.999561,
          total: 3417517
        },
        {
          latency: 42.911,
          percentile: 0.999609,
          total: 3417682
        },
        {
          latency: 44.543,
          percentile: 0.999658,
          total: 3417847
        },
        {
          latency: 46.655,
          percentile: 0.999707,
          total: 3418015
        },
        {
          latency: 49.855,
          percentile: 0.999756,
          total: 3418183
        },
        {
          latency: 53.183,
          percentile: 0.99978,
          total: 3418264
        },
        {
          latency: 58.687,
          percentile: 0.999805,
          total: 3418348
        },
        {
          latency: 73.087,
          percentile: 0.999829,
          total: 3418431
        },
        {
          latency: 97.151,
          percentile: 0.999854,
          total: 3418515
        },
        {
          latency: 114.751,
          percentile: 0.999878,
          total: 3418598
        },
        {
          latency: 126.527,
          percentile: 0.99989,
          total: 3418640
        },
        {
          latency: 137.215,
          percentile: 0.999902,
          total: 3418682
        },
        {
          latency: 144.895,
          percentile: 0.999915,
          total: 3418723
        },
        {
          latency: 157.183,
          percentile: 0.999927,
          total: 3418766
        },
        {
          latency: 169.983,
          percentile: 0.999939,
          total: 3418807
        },
        {
          latency: 173.055,
          percentile: 0.999945,
          total: 3418828
        },
        {
          latency: 176.255,
          percentile: 0.999951,
          total: 3418849
        },
        {
          latency: 186.367,
          percentile: 0.999957,
          total: 3418872
        },
        {
          latency: 188.415,
          percentile: 0.999963,
          total: 3418890
        },
        {
          latency: 191.743,
          percentile: 0.999969,
          total: 3418911
        },
        {
          latency: 200.191,
          percentile: 0.999973,
          total: 3418923
        },
        {
          latency: 201.215,
          percentile: 0.999976,
          total: 3418934
        },
        {
          latency: 202.495,
          percentile: 0.999979,
          total: 3418942
        },
        {
          latency: 203.903,
          percentile: 0.999982,
          total: 3418953
        },
        {
          latency: 205.439,
          percentile: 0.999985,
          total: 3418963
        },
        {
          latency: 212.607,
          percentile: 0.999986,
          total: 3418969
        },
        {
          latency: 214.655,
          percentile: 0.999988,
          total: 3418974
        },
        {
          latency: 214.911,
          percentile: 0.999989,
          total: 3418979
        },
        {
          latency: 215.423,
          percentile: 0.999991,
          total: 3418984
        },
        {
          latency: 215.807,
          percentile: 0.999992,
          total: 3418989
        },
        {
          latency: 216.319,
          percentile: 0.999993,
          total: 3418993
        },
        {
          latency: 216.447,
          percentile: 0.999994,
          total: 3418996
        },
        {
          latency: 216.575,
          percentile: 0.999995,
          total: 3418999
        },
        {
          latency: 216.703,
          percentile: 0.999995,
          total: 3419001
        },
        {
          latency: 217.087,
          percentile: 0.999996,
          total: 3419002
        },
        {
          latency: 217.471,
          percentile: 0.999997,
          total: 3419005
        },
        {
          latency: 217.471,
          percentile: 0.999997,
          total: 3419005
        },
        {
          latency: 217.983,
          percentile: 0.999997,
          total: 3419008
        },
        {
          latency: 217.983,
          percentile: 0.999998,
          total: 3419008
        },
        {
          latency: 218.111,
          percentile: 0.999998,
          total: 3419009
        },
        {
          latency: 218.239,
          percentile: 0.999998,
          total: 3419010
        },
        {
          latency: 218.239,
          percentile: 0.999998,
          total: 3419010
        },
        {
          latency: 218.367,
          percentile: 0.999999,
          total: 3419011
        },
        {
          latency: 218.623,
          percentile: 0.999999,
          total: 3419012
        },
        {
          latency: 218.623,
          percentile: 0.999999,
          total: 3419012
        },
        {
          latency: 219.263,
          percentile: 0.999999,
          total: 3419013
        },
        {
          latency: 219.263,
          percentile: 0.999999,
          total: 3419013
        },
        {
          latency: 219.263,
          percentile: 0.999999,
          total: 3419013
        },
        {
          latency: 219.903,
          percentile: 0.999999,
          total: 3419014
        },
        {
          latency: 219.903,
          percentile: 1,
          total: 3419014
        },
        {
          latency: 219.903,
          percentile: 1,
          total: 3419014
        },
        {
          latency: 219.903,
          percentile: 1,
          total: 3419014
        },
        {
          latency: 219.903,
          percentile: 1,
          total: 3419014
        },
        {
          latency: 223.231,
          percentile: 1,
          total: 3419015
        },
        {
          latency: 223.231,
          percentile: 1,
          total: 3419015
        }
      ]
    }
  },
  {
    opts: {
      path: '../wrk2/wrk',
      rate: 11900,
      duration: '300s',
      threads: 4,
      connections: 200,
      printLatency: true,
      url: 'http://107.21.1.157/queryU'
    },
    result: {
      transferPerSec: '6.37MB',
      requestsPerSec: 11895.34,
      non2xx3xx: 4331,
      requestsTotal: 3568601,
      durationActual: '5.00m',
      transferTotal: '1.87GB',
      latencyAvg: 'calibration:',
      latencyStdev: 'mean',
      latencyMax: 'lat.:',
      latencyStdevPerc: null,
      rpsAvg: 'calibration:',
      rpsStdev: 'mean',
      rpsMax: 'lat.:',
      rpsStdevPerc: null,
      histogram: [
        {
          latency: 1.785,
          percentile: 0.1,
          total: 345101
        },
        {
          latency: 2.008,
          percentile: 0.2,
          total: 690976
        },
        {
          latency: 2.185,
          percentile: 0.3,
          total: 1034544
        },
        {
          latency: 2.345,
          percentile: 0.4,
          total: 1380381
        },
        {
          latency: 2.503,
          percentile: 0.5,
          total: 1724381
        },
        {
          latency: 2.587,
          percentile: 0.55,
          total: 1897386
        },
        {
          latency: 2.677,
          percentile: 0.6,
          total: 2070671
        },
        {
          latency: 2.777,
          percentile: 0.65,
          total: 2243533
        },
        {
          latency: 2.891,
          percentile: 0.7,
          total: 2414420
        },
        {
          latency: 3.029,
          percentile: 0.75,
          total: 2586819
        },
        {
          latency: 3.111,
          percentile: 0.775,
          total: 2673836
        },
        {
          latency: 3.203,
          percentile: 0.8,
          total: 2759270
        },
        {
          latency: 3.313,
          percentile: 0.825,
          total: 2845807
        },
        {
          latency: 3.443,
          percentile: 0.85,
          total: 2931069
        },
        {
          latency: 3.611,
          percentile: 0.875,
          total: 3017645
        },
        {
          latency: 3.715,
          percentile: 0.8875,
          total: 3060515
        },
        {
          latency: 3.841,
          percentile: 0.9,
          total: 3103516
        },
        {
          latency: 3.999,
          percentile: 0.9125,
          total: 3146333
        },
        {
          latency: 4.211,
          percentile: 0.925,
          total: 3189930
        },
        {
          latency: 4.499,
          percentile: 0.9375,
          total: 3232678
        },
        {
          latency: 4.699,
          percentile: 0.94375,
          total: 3254247
        },
        {
          latency: 4.963,
          percentile: 0.95,
          total: 3275699
        },
        {
          latency: 5.327,
          percentile: 0.95625,
          total: 3297255
        },
        {
          latency: 5.859,
          percentile: 0.9625,
          total: 3318753
        },
        {
          latency: 6.671,
          percentile: 0.96875,
          total: 3340271
        },
        {
          latency: 7.195,
          percentile: 0.971875,
          total: 3351053
        },
        {
          latency: 7.835,
          percentile: 0.975,
          total: 3361862
        },
        {
          latency: 8.623,
          percentile: 0.978125,
          total: 3372670
        },
        {
          latency: 9.623,
          percentile: 0.98125,
          total: 3383415
        },
        {
          latency: 10.855,
          percentile: 0.984375,
          total: 3394161
        },
        {
          latency: 11.607,
          percentile: 0.985938,
          total: 3399533
        },
        {
          latency: 12.447,
          percentile: 0.9875,
          total: 3404951
        },
        {
          latency: 13.399,
          percentile: 0.989062,
          total: 3410328
        },
        {
          latency: 14.519,
          percentile: 0.990625,
          total: 3415694
        },
        {
          latency: 15.911,
          percentile: 0.992188,
          total: 3421103
        },
        {
          latency: 16.735,
          percentile: 0.992969,
          total: 3423776
        },
        {
          latency: 17.679,
          percentile: 0.99375,
          total: 3426480
        },
        {
          latency: 18.703,
          percentile: 0.994531,
          total: 3429170
        },
        {
          latency: 19.919,
          percentile: 0.995313,
          total: 3431886
        },
        {
          latency: 21.375,
          percentile: 0.996094,
          total: 3434558
        },
        {
          latency: 22.223,
          percentile: 0.996484,
          total: 3435909
        },
        {
          latency: 23.151,
          percentile: 0.996875,
          total: 3437253
        },
        {
          latency: 24.191,
          percentile: 0.997266,
          total: 3438607
        },
        {
          latency: 25.423,
          percentile: 0.997656,
          total: 3439951
        },
        {
          latency: 26.927,
          percentile: 0.998047,
          total: 3441284
        },
        {
          latency: 27.775,
          percentile: 0.998242,
          total: 3441964
        },
        {
          latency: 28.799,
          percentile: 0.998437,
          total: 3442631
        },
        {
          latency: 29.935,
          percentile: 0.998633,
          total: 3443306
        },
        {
          latency: 31.231,
          percentile: 0.998828,
          total: 3443980
        },
        {
          latency: 32.767,
          percentile: 0.999023,
          total: 3444653
        },
        {
          latency: 33.759,
          percentile: 0.999121,
          total: 3444989
        },
        {
          latency: 34.783,
          percentile: 0.999219,
          total: 3445325
        },
        {
          latency: 36.063,
          percentile: 0.999316,
          total: 3445669
        },
        {
          latency: 37.695,
          percentile: 0.999414,
          total: 3445998
        },
        {
          latency: 39.743,
          percentile: 0.999512,
          total: 3446337
        },
        {
          latency: 41.023,
          percentile: 0.999561,
          total: 3446504
        },
        {
          latency: 42.687,
          percentile: 0.999609,
          total: 3446676
        },
        {
          latency: 44.607,
          percentile: 0.999658,
          total: 3446841
        },
        {
          latency: 47.103,
          percentile: 0.999707,
          total: 3447007
        },
        {
          latency: 53.439,
          percentile: 0.999756,
          total: 3447176
        },
        {
          latency: 60.383,
          percentile: 0.99978,
          total: 3447260
        },
        {
          latency: 76.223,
          percentile: 0.999805,
          total: 3447344
        },
        {
          latency: 97.471,
          percentile: 0.999829,
          total: 3447428
        },
        {
          latency: 114.943,
          percentile: 0.999854,
          total: 3447513
        },
        {
          latency: 131.583,
          percentile: 0.999878,
          total: 3447597
        },
        {
          latency: 142.591,
          percentile: 0.99989,
          total: 3447639
        },
        {
          latency: 147.967,
          percentile: 0.999902,
          total: 3447681
        },
        {
          latency: 159.487,
          percentile: 0.999915,
          total: 3447724
        },
        {
          latency: 169.983,
          percentile: 0.999927,
          total: 3447765
        },
        {
          latency: 174.975,
          percentile: 0.999939,
          total: 3447808
        },
        {
          latency: 179.967,
          percentile: 0.999945,
          total: 3447828
        },
        {
          latency: 187.647,
          percentile: 0.999951,
          total: 3447851
        },
        {
          latency: 189.183,
          percentile: 0.999957,
          total: 3447870
        },
        {
          latency: 192.127,
          percentile: 0.999963,
          total: 3447891
        },
        {
          latency: 202.239,
          percentile: 0.999969,
          total: 3447912
        },
        {
          latency: 202.623,
          percentile: 0.999973,
          total: 3447923
        },
        {
          latency: 203.519,
          percentile: 0.999976,
          total: 3447935
        },
        {
          latency: 204.287,
          percentile: 0.999979,
          total: 3447946
        },
        {
          latency: 205.695,
          percentile: 0.999982,
          total: 3447956
        },
        {
          latency: 214.271,
          percentile: 0.999985,
          total: 3447965
        },
        {
          latency: 215.295,
          percentile: 0.999986,
          total: 3447970
        },
        {
          latency: 215.423,
          percentile: 0.999988,
          total: 3447975
        },
        {
          latency: 215.807,
          percentile: 0.999989,
          total: 3447981
        },
        {
          latency: 216.575,
          percentile: 0.999991,
          total: 3447986
        },
        {
          latency: 217.343,
          percentile: 0.999992,
          total: 3447991
        },
        {
          latency: 217.599,
          percentile: 0.999993,
          total: 3447994
        },
        {
          latency: 217.727,
          percentile: 0.999994,
          total: 3447996
        },
        {
          latency: 217.983,
          percentile: 0.999995,
          total: 3448003
        },
        {
          latency: 217.983,
          percentile: 0.999995,
          total: 3448003
        },
        {
          latency: 218.111,
          percentile: 0.999996,
          total: 3448004
        },
        {
          latency: 218.239,
          percentile: 0.999997,
          total: 3448006
        },
        {
          latency: 218.367,
          percentile: 0.999997,
          total: 3448007
        },
        {
          latency: 218.623,
          percentile: 0.999997,
          total: 3448008
        },
        {
          latency: 218.879,
          percentile: 0.999998,
          total: 3448010
        },
        {
          latency: 219.007,
          percentile: 0.999998,
          total: 3448013
        },
        {
          latency: 219.007,
          percentile: 0.999998,
          total: 3448013
        },
        {
          latency: 219.007,
          percentile: 0.999998,
          total: 3448013
        },
        {
          latency: 219.007,
          percentile: 0.999999,
          total: 3448013
        },
        {
          latency: 219.263,
          percentile: 0.999999,
          total: 3448015
        },
        {
          latency: 219.263,
          percentile: 0.999999,
          total: 3448015
        },
        {
          latency: 219.263,
          percentile: 0.999999,
          total: 3448015
        },
        {
          latency: 219.263,
          percentile: 0.999999,
          total: 3448015
        },
        {
          latency: 219.263,
          percentile: 0.999999,
          total: 3448015
        },
        {
          latency: 219.903,
          percentile: 0.999999,
          total: 3448016
        },
        {
          latency: 219.903,
          percentile: 1,
          total: 3448016
        },
        {
          latency: 219.903,
          percentile: 1,
          total: 3448016
        },
        {
          latency: 219.903,
          percentile: 1,
          total: 3448016
        },
        {
          latency: 219.903,
          percentile: 1,
          total: 3448016
        },
        {
          latency: 233.599,
          percentile: 1,
          total: 3448017
        },
        {
          latency: 233.599,
          percentile: 1,
          total: 3448017
        }
      ]
    }
  },
  {
    opts: {
      path: '../wrk2/wrk',
      rate: 12000,
      duration: '300s',
      threads: 4,
      connections: 200,
      printLatency: true,
      url: 'http://107.21.1.157/queryU'
    },
    result: {
      transferPerSec: '6.42MB',
      requestsPerSec: 11995.29,
      non2xx3xx: 4702,
      requestsTotal: 3598581,
      durationActual: '5.00m',
      transferTotal: '1.88GB',
      latencyAvg: 'calibration:',
      latencyStdev: 'mean',
      latencyMax: 'lat.:',
      latencyStdevPerc: null,
      rpsAvg: 'calibration:',
      rpsStdev: 'mean',
      rpsMax: 'lat.:',
      rpsStdevPerc: null,
      histogram: [
        {
          latency: 1.763,
          percentile: 0.1,
          total: 348300
        },
        {
          latency: 1.996,
          percentile: 0.2,
          total: 696427
        },
        {
          latency: 2.195,
          percentile: 0.3,
          total: 1044576
        },
        {
          latency: 2.381,
          percentile: 0.4,
          total: 1393236
        },
        {
          latency: 2.567,
          percentile: 0.5,
          total: 1739021
        },
        {
          latency: 2.667,
          percentile: 0.55,
          total: 1914901
        },
        {
          latency: 2.773,
          percentile: 0.6,
          total: 2089065
        },
        {
          latency: 2.889,
          percentile: 0.65,
          total: 2262551
        },
        {
          latency: 3.019,
          percentile: 0.7,
          total: 2435021
        },
        {
          latency: 3.171,
          percentile: 0.75,
          total: 2609052
        },
        {
          latency: 3.259,
          percentile: 0.775,
          total: 2695858
        },
        {
          latency: 3.359,
          percentile: 0.8,
          total: 2783055
        },
        {
          latency: 3.473,
          percentile: 0.825,
          total: 2869576
        },
        {
          latency: 3.609,
          percentile: 0.85,
          total: 2955579
        },
        {
          latency: 3.781,
          percentile: 0.875,
          total: 3042477
        },
        {
          latency: 3.891,
          percentile: 0.8875,
          total: 3086472
        },
        {
          latency: 4.021,
          percentile: 0.9,
          total: 3129471
        },
        {
          latency: 4.187,
          percentile: 0.9125,
          total: 3173460
        },
        {
          latency: 4.403,
          percentile: 0.925,
          total: 3216246
        },
        {
          latency: 4.723,
          percentile: 0.9375,
          total: 3260116
        },
        {
          latency: 4.939,
          percentile: 0.94375,
          total: 3281410
        },
        {
          latency: 5.239,
          percentile: 0.95,
          total: 3303230
        },
        {
          latency: 5.667,
          percentile: 0.95625,
          total: 3324886
        },
        {
          latency: 6.303,
          percentile: 0.9625,
          total: 3346680
        },
        {
          latency: 7.235,
          percentile: 0.96875,
          total: 3368393
        },
        {
          latency: 7.855,
          percentile: 0.971875,
          total: 3379202
        },
        {
          latency: 8.575,
          percentile: 0.975,
          total: 3390100
        },
        {
          latency: 9.431,
          percentile: 0.978125,
          total: 3400987
        },
        {
          latency: 10.511,
          percentile: 0.98125,
          total: 3411793
        },
        {
          latency: 11.879,
          percentile: 0.984375,
          total: 3422691
        },
        {
          latency: 12.703,
          percentile: 0.985938,
          total: 3428094
        },
        {
          latency: 13.671,
          percentile: 0.9875,
          total: 3433562
        },
        {
          latency: 14.751,
          percentile: 0.989062,
          total: 3438979
        },
        {
          latency: 16.039,
          percentile: 0.990625,
          total: 3444390
        },
        {
          latency: 17.583,
          percentile: 0.992188,
          total: 3449850
        },
        {
          latency: 18.463,
          percentile: 0.992969,
          total: 3452568
        },
        {
          latency: 19.503,
          percentile: 0.99375,
          total: 3455268
        },
        {
          latency: 20.671,
          percentile: 0.994531,
          total: 3457993
        },
        {
          latency: 22.063,
          percentile: 0.995313,
          total: 3460710
        },
        {
          latency: 23.631,
          percentile: 0.996094,
          total: 3463414
        },
        {
          latency: 24.527,
          percentile: 0.996484,
          total: 3464764
        },
        {
          latency: 25.551,
          percentile: 0.996875,
          total: 3466129
        },
        {
          latency: 26.655,
          percentile: 0.997266,
          total: 3467487
        },
        {
          latency: 27.919,
          percentile: 0.997656,
          total: 3468841
        },
        {
          latency: 29.423,
          percentile: 0.998047,
          total: 3470206
        },
        {
          latency: 30.239,
          percentile: 0.998242,
          total: 3470874
        },
        {
          latency: 31.263,
          percentile: 0.998437,
          total: 3471554
        },
        {
          latency: 32.367,
          percentile: 0.998633,
          total: 3472236
        },
        {
          latency: 33.663,
          percentile: 0.998828,
          total: 3472913
        },
        {
          latency: 35.199,
          percentile: 0.999023,
          total: 3473589
        },
        {
          latency: 36.127,
          percentile: 0.999121,
          total: 3473931
        },
        {
          latency: 37.119,
          percentile: 0.999219,
          total: 3474274
        },
        {
          latency: 38.335,
          percentile: 0.999316,
          total: 3474609
        },
        {
          latency: 40.063,
          percentile: 0.999414,
          total: 3474945
        },
        {
          latency: 42.079,
          percentile: 0.999512,
          total: 3475287
        },
        {
          latency: 43.359,
          percentile: 0.999561,
          total: 3475458
        },
        {
          latency: 44.863,
          percentile: 0.999609,
          total: 3475625
        },
        {
          latency: 47.391,
          percentile: 0.999658,
          total: 3475794
        },
        {
          latency: 51.199,
          percentile: 0.999707,
          total: 3475964
        },
        {
          latency: 60.991,
          percentile: 0.999756,
          total: 3476133
        },
        {
          latency: 73.791,
          percentile: 0.99978,
          total: 3476218
        },
        {
          latency: 89.023,
          percentile: 0.999805,
          total: 3476303
        },
        {
          latency: 105.343,
          percentile: 0.999829,
          total: 3476387
        },
        {
          latency: 121.471,
          percentile: 0.999854,
          total: 3476472
        },
        {
          latency: 140.671,
          percentile: 0.999878,
          total: 3476557
        },
        {
          latency: 146.559,
          percentile: 0.99989,
          total: 3476600
        },
        {
          latency: 157.311,
          percentile: 0.999902,
          total: 3476642
        },
        {
          latency: 162.303,
          percentile: 0.999915,
          total: 3476684
        },
        {
          latency: 172.927,
          percentile: 0.999927,
          total: 3476727
        },
        {
          latency: 179.839,
          percentile: 0.999939,
          total: 3476769
        },
        {
          latency: 186.623,
          percentile: 0.999945,
          total: 3476792
        },
        {
          latency: 188.031,
          percentile: 0.999951,
          total: 3476812
        },
        {
          latency: 190.847,
          percentile: 0.999957,
          total: 3476833
        },
        {
          latency: 200.191,
          percentile: 0.999963,
          total: 3476856
        },
        {
          latency: 201.855,
          percentile: 0.999969,
          total: 3476881
        },
        {
          latency: 202.367,
          percentile: 0.999973,
          total: 3476887
        },
        {
          latency: 203.519,
          percentile: 0.999976,
          total: 3476898
        },
        {
          latency: 204.671,
          percentile: 0.999979,
          total: 3476907
        },
        {
          latency: 210.687,
          percentile: 0.999982,
          total: 3476918
        },
        {
          latency: 214.911,
          percentile: 0.999985,
          total: 3476930
        },
        {
          latency: 215.167,
          percentile: 0.999986,
          total: 3476936
        },
        {
          latency: 215.295,
          percentile: 0.999988,
          total: 3476940
        },
        {
          latency: 215.551,
          percentile: 0.999989,
          total: 3476946
        },
        {
          latency: 215.807,
          percentile: 0.999991,
          total: 3476950
        },
        {
          latency: 216.447,
          percentile: 0.999992,
          total: 3476955
        },
        {
          latency: 216.831,
          percentile: 0.999993,
          total: 3476962
        },
        {
          latency: 216.831,
          percentile: 0.999994,
          total: 3476962
        },
        {
          latency: 216.959,
          percentile: 0.999995,
          total: 3476964
        },
        {
          latency: 217.727,
          percentile: 0.999995,
          total: 3476966
        },
        {
          latency: 218.111,
          percentile: 0.999996,
          total: 3476968
        },
        {
          latency: 218.239,
          percentile: 0.999997,
          total: 3476970
        },
        {
          latency: 218.495,
          percentile: 0.999997,
          total: 3476971
        },
        {
          latency: 219.135,
          percentile: 0.999997,
          total: 3476972
        },
        {
          latency: 219.391,
          percentile: 0.999998,
          total: 3476974
        },
        {
          latency: 219.519,
          percentile: 0.999998,
          total: 3476976
        },
        {
          latency: 219.519,
          percentile: 0.999998,
          total: 3476976
        },
        {
          latency: 219.519,
          percentile: 0.999998,
          total: 3476976
        },
        {
          latency: 220.927,
          percentile: 0.999999,
          total: 3476977
        },
        {
          latency: 224.767,
          percentile: 0.999999,
          total: 3476978
        },
        {
          latency: 224.767,
          percentile: 0.999999,
          total: 3476978
        },
        {
          latency: 231.039,
          percentile: 0.999999,
          total: 3476979
        },
        {
          latency: 231.039,
          percentile: 0.999999,
          total: 3476979
        },
        {
          latency: 231.039,
          percentile: 0.999999,
          total: 3476979
        },
        {
          latency: 243.967,
          percentile: 0.999999,
          total: 3476980
        },
        {
          latency: 243.967,
          percentile: 1,
          total: 3476980
        },
        {
          latency: 243.967,
          percentile: 1,
          total: 3476980
        },
        {
          latency: 243.967,
          percentile: 1,
          total: 3476980
        },
        {
          latency: 243.967,
          percentile: 1,
          total: 3476980
        },
        {
          latency: 258.943,
          percentile: 1,
          total: 3476981
        },
        {
          latency: 258.943,
          percentile: 1,
          total: 3476981
        }
      ]
    }
  }
];
