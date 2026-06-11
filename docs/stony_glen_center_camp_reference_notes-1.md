# Stony Glen Center Camp Map Reference Notes

> Generated from the uploaded Stony Glen Camp “Center Camp Area” reference image. Coordinates are approximate visual estimates for game-layout planning, not survey-grade measurements.

## Coordinate Systems

- **Image pixel coordinates:** origin is top-left; image size is **1536 × 1152** pixels.
- **Normalized coordinates:** `x%` and `y%` are image-relative percentages from top-left.
- **Projected game coordinates:** approximate projection onto the current game map size **2400 × 1600**. Use these as starting points only; nudge for gameplay readability.
- **Rotation decision:** keep all in-game buildings axis-aligned for gameplay. Use relative placement, roads, terrain, and spacing to evoke the real map rather than rotating buildings.

## High-Level Layout Facts

- The image’s labeled **Center Camp Area** places the lake on the **east/right** side.
- The main camp core is west of the lake and centered around **Dining Hall**, paths, **Chapel**, **Gym**, and **Nurse Station**.
- **Welcome Center** and **Parking Lot** are northwest/west of Dining Hall.
- **Bathhouse** is east/southeast of Dining Hall.
- Cabins and small buildings wrap around the south/southwest loop: Hawthorne, Stoddard, Philippians, Beech, Mildon, Juniper, Hickory, Patrick, Maple, Cherry, Willow.
- The **bridge** near the lake connects toward the lower/southeastern Back 40 side: Pine, A-Frame, pavilion, Don’s Place.
- For Day 1, the bridge/Back 40 route should stay blocked or gated.

## Major Region Bounding Boxes

| Region | Image bbox px `(x1,y1)-(x2,y2)` | Normalized bbox `%` | Projected game bbox `(x1,y1)-(x2,y2)` | Notes |
|---|---:|---:|---:|---|
| Main Camp Core | `(500,280)-(880,650)` | `(32.6,24.3)-(57.3,56.4)` | `(781,389)-(1375,903)` | Dining Hall, Chapel, central roads, Nurse Station, field/oval. |
| Welcome / Parking Area | `(300,250)-(560,460)` | `(19.5,21.7)-(36.5,39.9)` | `(469,347)-(875,639)` | Parking Lot with Welcome Center above/northwest. |
| Cabin Loop West/South | `(220,500)-(760,900)` | `(14.3,43.4)-(49.5,78.1)` | `(344,694)-(1188,1250)` | Hawthorne, Stoddard, Philippians, Beech, Juniper, Hickory, Patrick. |
| Bathhouse / East Cabins | `(760,520)-(1050,730)` | `(49.5,45.1)-(68.4,63.4)` | `(1188,722)-(1641,1014)` | Bathhouse, Mildon, Cherry, Willow road approach. |
| Lake / Waterfront | `(1100,430)-(1535,900)` | `(71.6,37.3)-(99.9,78.1)` | `(1719,597)-(2398,1250)` | Waterfront and lake on eastern edge. |
| Bridge / Back 40 Gate | `(980,730)-(1120,880)` | `(63.8,63.4)-(72.9,76.4)` | `(1531,1014)-(1750,1222)` | Bridge near lake; should remain blocked for Day 1. |
| Back 40 South/East | `(620,880)-(1470,1120)` | `(40.4,76.4)-(95.7,97.2)` | `(969,1222)-(2297,1556)` | Pine, A-Frame, pavilion, Don's Place, lower-side buildings. |
| West Woods / Ranges | `(0,320)-(400,980)` | `(0.0,27.8)-(26.0,85.1)` | `(0,444)-(625,1361)` | Crusader, Archery Range, Stoddard edge, Gun Range. |
| North Woods / Walnut | `(150,60)-(650,240)` | `(9.8,5.2)-(42.3,20.8)` | `(234,83)-(1016,333)` | Walnut and wooded north edge. |

## Landmark / Building Center Points

| Name | Type | Image center px | Normalized center `%` | Projected game center | Notes |
|---|---|---:|---:|---:|---|
| Walnut | cabin/building | `(215,120)` | `(14.0,10.4)` | `(336,167)` | Small cabin far northwest, isolated in woods. |
| Crusader | cabin/building | `(100,360)` | `(6.5,31.2)` | `(156,500)` | Far west / northwest edge, near Archery Range. |
| Archery Range | activity area | `(70,440)` | `(4.6,38.2)` | `(109,611)` | West edge activity label; no clear building footprint visible. |
| Welcome Center | building cluster | `(430,300)` | `(28.0,26.0)` | `(672,417)` | Northwest of Dining Hall; adjacent to Parking Lot and entrance paths. |
| Chapel | building | `(585,215)` | `(38.1,18.7)` | `(914,299)` | North of Dining Hall, near oval/rally field. |
| Parking Lot | zone | `(405,385)` | `(26.4,33.4)` | `(633,535)` | Large white/red-outlined zone west of Dining Hall and south of Welcome Center. |
| Dining Hall | building | `(640,450)` | `(41.7,39.1)` | `(1000,625)` | Central anchor; connected to many paths. |
| Gym | building | `(900,175)` | `(58.6,15.2)` | `(1406,243)` | Northeast of Chapel and camp core, on main upper road. |
| Nurse Station | building | `(790,385)` | `(51.4,33.4)` | `(1234,535)` | East/northeast of Dining Hall, near main road loop. |
| Hawthorne | cabin/building | `(455,505)` | `(29.6,43.8)` | `(711,701)` | South/southwest of Parking Lot, west of Dining Hall. |
| Stoddard | cabin/building | `(225,590)` | `(14.6,51.2)` | `(352,819)` | Far southwest of Dining Hall, near wooded paths. |
| Philippians | building | `(455,615)` | `(29.6,53.4)` | `(711,854)` | Southwest of Dining Hall, on cabin/path loop. |
| Beech | cabin/building | `(535,560)` | `(34.8,48.6)` | `(836,778)` | South/southwest of Dining Hall, central cabin loop. |
| Mildon | cabin/building | `(705,600)` | `(45.9,52.1)` | `(1102,833)` | South/southeast of Dining Hall, near bathhouse path. |
| Bathhouse | building | `(805,605)` | `(52.4,52.5)` | `(1258,840)` | East/southeast of Dining Hall; west of Cherry; service/bathroom candidate. |
| Cherry | cabin/building | `(945,635)` | `(61.5,55.1)` | `(1477,882)` | Southeast of Dining Hall; near path toward lake. |
| Willow | cabin/building | `(1125,550)` | `(73.2,47.7)` | `(1758,764)` | East of Bathhouse/Cherry near road toward Waterfront. |
| Waterfront | activity/dock | `(1348,630)` | `(87.8,54.7)` | `(2106,875)` | At lake edge, east side of map. |
| Lake | terrain/water | `(1340,745)` | `(87.2,64.7)` | `(2094,1035)` | Large water area on east side. |
| Bridge | bridge/crossing | `(1045,785)` | `(68.0,68.1)` | `(1633,1090)` | South/east crossing near lake; gateway toward Back 40. |
| Maple | cabin/building | `(835,805)` | `(54.4,69.9)` | `(1305,1118)` | South of Bathhouse/Cherry, near river/bridge approach. |
| Patrick | cabin/building | `(660,890)` | `(43.0,77.3)` | `(1031,1236)` | South of central camp core, north of lower river line. |
| Juniper | cabin/building | `(425,780)` | `(27.7,67.7)` | `(664,1083)` | Southwest of Philippians, near lower path loop. |
| Hickory | cabin/building | `(320,700)` | `(20.8,60.8)` | `(500,972)` | West/southwest of Philippians on path branch. |
| Gun Range | activity area | `(380,950)` | `(24.7,82.5)` | `(594,1319)` | Lower-left activity area, peripheral. |
| Pine | cabin/building | `(705,1050)` | `(45.9,91.1)` | `(1102,1458)` | Across river / Back 40 side; not Day 1 main access. |
| A-Frame | cabin/building | `(965,1045)` | `(62.8,90.7)` | `(1508,1451)` | Across river / Back 40 side. |
| Pavilion | building | `(1265,985)` | `(82.4,85.5)` | `(1977,1368)` | Across bridge / near Don's Place, Back 40 side. |
| Don's Place | building | `(1360,920)` | `(88.5,79.9)` | `(2125,1278)` | Across bridge / east-southeast Back 40 area. |

## Relative Placement Rules for Codex

- Keep buildings axis-aligned; do not add rotated building collision or rotated rendering for gameplay.
- Dining Hall is the central anchor of Main Camp.
- Welcome Center is northwest of Dining Hall and adjacent to the Parking Lot.
- Chapel is north of Dining Hall near a central field/oval area.
- Gym is northeast of Chapel / northeast of the camp core.
- Nurse Station is east/northeast of Dining Hall.
- Bathhouse/Shower House is east/southeast of Dining Hall.
- Philippians is southwest of Dining Hall.
- Beech and Mildon sit south/southeast of Dining Hall along the path loop.
- Cabins form a loose southern/southwestern loop; avoid clustering them tightly.
- Lake and Waterfront are on the far east/right side.
- Bridge sits near the southeast/east edge of lake and should gate the Back 40 route.
- Pine, A-Frame, pavilion, and Don’s Place are across the bridge / Back 40 side and should stay inaccessible on Day 1 unless intentionally teased.
- Use curved paths/roads and wooded buffers to evoke the real layout more than exact building angles.

## Road / Path Network Notes

- **Entrance Road:** Road enters from west edge and curves into the Parking Lot; connects to central paths near Dining Hall.
- **Main North Road:** Central junction east of Dining Hall curves northeast toward Nurse Station, Gym, and the long road to the right.
- **Dining Hall Path Loop:** Dense path loop around Dining Hall connecting Parking Lot, Chapel/field, cabins, and Bathhouse.
- **Cabin Loop:** Curving southwest/south paths connecting Hawthorne, Philippians, Beech, Juniper, Hickory, Patrick, Mildon.
- **Lake/Bridge Road:** Path from central/east camp goes toward Willow/Waterfront and down toward the bridge.
- **Back 40 Road:** Path crosses bridge then heads southeast toward pavilion/Don's Place and southwest toward A-Frame/Pine.

## Suggested Game-Map Use

- Use the projected coordinates as rough anchors only; adjust to keep travel time fun, paths readable, and interactions reachable.
- The game map currently uses a wider aspect ratio than the reference image, so horizontal spacing may need extra room.
- If using a 2400×1600 map, preserve the relative ordering but widen paths and fields beyond strict projection.
- Keep terrain skill gates aligned with features: lake/stream require Swimming, gorge/cliff areas require Climbing.
- Keep Back 40 blocked on Day 1 at the bridge.

## Possible Content Mapping for Current Game Names

| Reference item | Game use |
|---|---|
| Bathhouse | Current Shower House / Bathroom building |
| Dining Hall | Dining Hall delivery and Ethan/program area |
| Welcome Center | Player start / Coop area |
| Chapel + central field | Rally Field / Gweggowy area |
| Bridge | Blocked Back 40 gateway |
| Lake | Swimming-gated terrain |
| Gorge/stream black lines | Climbing/swimming-gated terrain and Cliff foreshadowing |