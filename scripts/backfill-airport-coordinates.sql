-- Source: OurAirports airports.csv (https://davidmegginson.github.io/ourairports-data/airports.csv)
-- Safe to rerun: existing non-null coordinates are kept.
BEGIN;

UPDATE "airports"
SET
  "latitude" = COALESCE(
    "latitude",
    CASE "iata_code"
      WHEN 'AMS' THEN 52.308601
      WHEN 'BKK' THEN 13.681100
      WHEN 'CDG' THEN 49.008960
      WHEN 'CGK' THEN -6.125570
      WHEN 'DEL' THEN 28.555630
      WHEN 'DPS' THEN -8.748409
      WHEN 'DXB' THEN 25.249790
      WHEN 'FRA' THEN 50.026706
      WHEN 'HKG' THEN 22.311840
      WHEN 'ICN' THEN 37.469101
      WHEN 'JFK' THEN 40.639447
      WHEN 'KUL' THEN 2.745580
      WHEN 'LAX' THEN 33.942501
      WHEN 'LHR' THEN 51.470748
      WHEN 'MEL' THEN -37.670732
      WHEN 'NRT' THEN 35.768580
      WHEN 'ORD' THEN 41.978600
      WHEN 'PEK' THEN 40.077349
      WHEN 'PVG' THEN 31.143400
      WHEN 'SIN' THEN 1.350190
      WHEN 'SUB' THEN -7.379830
      WHEN 'SYD' THEN -33.946098
      ELSE "latitude"
    END
  ),
  "longitude" = COALESCE(
    "longitude",
    CASE "iata_code"
      WHEN 'AMS' THEN 4.763890
      WHEN 'BKK' THEN 100.747002
      WHEN 'CDG' THEN 2.554117
      WHEN 'CGK' THEN 106.655998
      WHEN 'DEL' THEN 77.095190
      WHEN 'DPS' THEN 115.167123
      WHEN 'DXB' THEN 55.370992
      WHEN 'FRA' THEN 8.558350
      WHEN 'HKG' THEN 113.914862
      WHEN 'ICN' THEN 126.450996
      WHEN 'JFK' THEN -73.779317
      WHEN 'KUL' THEN 101.709999
      WHEN 'LAX' THEN -118.407997
      WHEN 'LHR' THEN -0.459909
      WHEN 'MEL' THEN 144.837898
      WHEN 'NRT' THEN 140.388714
      WHEN 'ORD' THEN -87.904800
      WHEN 'PEK' THEN 116.596702
      WHEN 'PVG' THEN 121.805000
      WHEN 'SIN' THEN 103.994003
      WHEN 'SUB' THEN 112.787003
      WHEN 'SYD' THEN 151.177002
      ELSE "longitude"
    END
  )
WHERE "iata_code" IN (
  'AMS', 'BKK', 'CDG', 'CGK', 'DEL', 'DPS', 'DXB', 'FRA', 'HKG', 'ICN', 'JFK',
  'KUL', 'LAX', 'LHR', 'MEL', 'NRT', 'ORD', 'PEK', 'PVG', 'SIN', 'SUB', 'SYD'
);

COMMIT;

SELECT "iata_code", "name", "latitude", "longitude"
FROM "airports"
ORDER BY "iata_code";
