---
title: "What Solar Developers Look for in Land Before They Make an Offer"
description: "Solar developers start with a GIS screen, not a site visit. Protected areas, wetlands, and substation proximity eliminate most parcels before anyone makes a call. Here's the full screening sequence."
date: "2026-05-06"
author: "Sunnyplans Team"
tags: "solar, land selection, site screening, developers, lease offer"
target_query: "what solar developers look for in land"
secondary_query: "how solar developers choose land"
cta_url: "/united-states"
---

Most landowners assume solar developers find land through brokers or word of mouth. The actual process starts with a map — protected area databases, wetland inventories, and substation distance calculations applied across every parcel in a county before anyone makes a call.

The parcels that get a call survived that screen. Understanding what it checks — and what comes after — is how you evaluate land the way a developer would.

## The First Pass Is a GIS Screen, Not a Site Visit

A developer evaluating land for a new project doesn't drive county roads. They open a GIS platform, pull publicly available datasets, and run exclusion layers across every parcel in the target geography at once. A search area covering 10 counties might start with 50,000 parcels. After an hour of automated screening, it's down to a few hundred worth looking at.

Three datasets do most of the work, and all of them are public:

- **PAD-US** (Protected Areas Database, USGS) — removes conservation land, national forest, wilderness areas, and active conservation easements
- **NWI** (National Wetlands Inventory, US Fish & Wildlife Service) — removes parcels with mapped wetland coverage
- **HIFLD electric substations** (CISA) — calculates distance to the nearest substation for every parcel that survives

Flood zone classification — whether a parcel falls in FEMA Zone AE or Zone X — gets checked in parallel. It's not in the same automated layer as PAD-US or NWI, but it's fast: the FEMA Flood Map Service Center runs it by address in seconds, and the result is usually decisive.

After these layers run, surviving parcels get scored by substation distance and contiguous usable acreage. The ones that make the cut go to a human for the next stage. Everything else gets dropped.

## Substation Distance: Where Economics Enter the Screen

Grid proximity isn't just one item on a checklist — it's the filter that determines what the project is worth. Every other constraint is roughly binary. [Substation proximity](/blog/substation-proximity-solar-farm) creates a sliding scale that runs directly into the lease offer.

A developer building a 50 MW project needs to connect to the transmission grid. A parcel within a mile of a high-capacity substation can likely tie in at modest cost using an existing interconnection path. A parcel five miles away requires a privately built generation tie line — a gen-tie — from the project boundary to the grid. Based on EIA benchmarks for 115 kV single-circuit infrastructure, that line costs roughly $1 million per mile to construct. Five miles means $5 million before construction begins.

That $5 million doesn't disappear. It compresses directly into the lease offer.

| Distance to nearest substation | Typical developer interpretation |
|---|---|
| Under 1 mile | High priority — minimal gen-tie cost |
| 1–3 miles | Workable — standard interconnection study, possible short extension |
| 3–5 miles | Marginal — gen-tie cost starts compressing project returns |
| Over 5 miles | Usually passed over |

The thresholds tighten for smaller projects. A 200 MW utility-scale installation spreads a 5-mile gen-tie cost across enough megawatts to stay viable. A 5 MW community solar project can't — the same mile of line represents a much larger share of total cost. 

Lawrence Berkeley National Laboratory's interconnection cost research puts the average across utility-scale solar at around $253/kW, roughly double the figure from a decade ago.

## Acreage: Total vs. Usable

After grid proximity, developers check how much of the parcel can actually hold panels. A 200-acre parcel with a creek through the middle, a NWI-mapped wetland in one corner, and a road setback along the south edge might yield 130 usable acres. That's the number that drives the project model, not the deed acreage.

NREL's land-use research puts utility-scale solar at 6 to 8 acres per megawatt of installed capacity. A 20 MW project needs 120 to 160 usable acres at minimum — enough to support the project economics once setbacks, access roads, and inverter pads come out of the total. Community solar projects can work on 5 to 30 acres in markets where distribution-level interconnection is available, but the economics are fundamentally different from utility-scale.

Parcel shape matters too, though it's not a disqualifier on its own. Irregular or fragmented parcels produce installation inefficiency — more fence per panel, harder construction logistics, fewer clean array rows. Developers prefer parcels that allow rectangular or trapezoidal layouts. A roughly square 100-acre parcel is worth more per acre to a developer than a long, narrow strip of equivalent total acreage.

## The Two Filters That End Deals Immediately

Two constraint layers function as near-automatic disqualifiers in standard GIS screening.

**FEMA Zone AE** — the 100-year floodplain — stops most projects at the map stage. Electrical infrastructure in a floodplain requires elevated foundations, specialized engineering certification, and additional federal review. The cost and permitting risk together make Zone AE parcels unworkable for most developers. Zone X, outside the 500-year floodplain, clears the filter. Zone AE doesn't. The FEMA Flood Map Service Center allows parcel-level flood zone lookup by address — checking it before evaluating any parcel takes five minutes.

**NWI-mapped wetlands** trigger a different problem. Any wetland presence on a parcel invokes Section 404 of the Clean Water Act, requiring Army Corps of Engineers review even when the wetland appears dry most of the year. Formal wetland delineation — the process of confirming where jurisdictional wetlands begin and end — adds months and cost to permitting. Parcels with meaningful wetland coverage either receive deeply discounted offers or get passed over entirely. Neither outcome involves much negotiation.

## Slope: The Terrain Threshold

The slope threshold used consistently across utility-scale solar development is roughly 5 degrees, or about 9 percent grade. Above that, racking and earthwork costs rise steeply enough to compress project returns. Land that looks flat in person can have enough micro-variation to create problems at scale — developers run digital elevation models over candidate sites before trusting a field impression.

Some terrain-adaptive single-axis tracker systems can accommodate steeper ground than fixed-tilt installations, but they add cost. They only pencil out when the site is otherwise strong. Flat agricultural land in the Southeast, the Midwest, and across Texas passes this filter automatically. Much of the rural Mid-Atlantic and the Appalachian foothills does not.

## Zoning: The Last Automated Check

After constraint exclusion and physical screening, developers look at zoning. The relevant question isn't whether the land is farmable — it's whether solar is a permitted or conditional use under the current county zoning classification.

Agricultural-zoned land (A-1 or equivalent) is where most rural utility-scale development happens. Many states allow solar as a by-right or conditional use on agricultural land, meaning approval doesn't require a full legislative process. A by-right classification is the best case: standard building permits, no special public hearing. A conditional use requiring a Special Use Permit adds a county board process, potential imposed conditions, and months to the timeline — enough that developers factor permitting risk into how much they're willing to offer.

County-level variation in [agricultural zoning for solar](/blog/agricultural-zoning-solar-farm) is wide enough to matter at the parcel level. Davidson County in North Carolina passed a 24-month moratorium on new solar permits in December 2024 while it worked through new zoning overlay rules. Northampton County imposed restrictions. Halifax County enacted a 120-day temporary moratorium on solar Special Use Permits in October 2024. Developers don't wait out moratoriums — they move to the next county.

A variance, where the existing zoning doesn't permit solar at all and the developer would need to argue for an exception, carries permitting risk that most developers won't accept unless the site scores exceptionally well on every other dimension.

## Where the Queue Enters the Picture

A parcel can clear every GIS filter and still be commercially unviable if it sits in a heavily congested interconnection zone.

ISO interconnection queues — the line of projects waiting for technical studies before receiving a grid connection agreement — have grown substantially over the past several years. PJM, the grid operator covering the Mid-Atlantic and Midwest, has been clearing a backlog through its reformed queue process; under the post-FERC Order 2023 framework, new interconnection studies are expected to take one to two years. MISO, which covers much of the Midwest and South, has been moving 2020–2022 cycle applications toward Generator Interconnection Agreements through 2025. West Texas, historically one of the most active US solar corridors, has faced significant queue congestion as new generation requests have accumulated faster than the grid has been upgraded.

Queue congestion doesn't appear on a PAD-US map or a FEMA flood zone layer. A developer needs to check the relevant ISO's queue dashboard directly — and evaluate whether their capital can reach better returns in a less congested geography before committing to a site, even a site that otherwise looks ideal.

## Running the Screen Yourself

The developer's process maps onto a checklist that any land buyer or landowner can run before talking to anyone:

| Screening step | Data source | Clears the filter | Fails the filter |
|---|---|---|---|
| Protected areas | PAD-US (USGS) | No conservation designation | Conservation easement, PAD-US listed |
| Wetlands | NWI (US Fish & Wildlife) | No mapped wetlands | Any NWI-mapped coverage |
| Flood zone | FEMA Flood Map Service Center | Zone X | Zone AE |
| Substation distance | HIFLD (CISA) or utility maps | Under 3 miles | Over 5 miles |
| Usable acreage | County records + constraint map | 40+ contiguous usable acres | Under 40 acres, heavily fragmented |
| Slope | Topographic or DEM data | Under 5 degrees | Consistently over 5 degrees |
| Zoning | County planning department | By-right or conditional use | Moratorium, variance required |
| Queue congestion | ISO queue dashboard | Uncongested zone | Heavy backlog, multi-year wait |

Most parcels fail on two or three of these, not one. The ones that clear all of them are what developers compete for — and that competition is what drives lease offers up.

---

*Sunnyplans runs the same GIS filters developers use — PAD-US protected areas, National Wetlands Inventory, substation proximity — on every indexed parcel, so you see which ones survive the screen before anyone makes a call.*

---

**Sources**
- NREL, *Land-Use Requirements for Solar Power Plants in the United States* — 6–8 acres per MW analysis — [emp.lbl.gov/utility-scale-solar](https://emp.lbl.gov/utility-scale-solar)
- EIA, *Capital Cost and Performance Characteristics for Utility-Scale Power Plants* — gen-tie line construction cost estimates — [eia.gov/analysis/studies/powerplants/capitalcost](https://www.eia.gov/analysis/studies/powerplants/capitalcost/)
- Lawrence Berkeley National Laboratory, *Generator Interconnection Costs to the Transmission System* — average solar interconnection cost $253/kW — [emp.lbl.gov/interconnection_costs](https://emp.lbl.gov/interconnection_costs)
- USGS, *Protected Areas Database of the United States (PAD-US)* — [usgs.gov/programs/gap-analysis-project/science/protected-areas](https://www.usgs.gov/programs/gap-analysis-project/science/protected-areas)
- US Fish & Wildlife Service, *National Wetlands Inventory* — [fws.gov/program/national-wetlands-inventory](https://www.fws.gov/program/national-wetlands-inventory)
- FEMA, *Flood Map Service Center* — parcel-level flood zone lookup — [msc.fema.gov](https://msc.fema.gov)
- PJM, *Interconnection Reform Progress Fact Sheet* — 1–2 year study timeline under post-FERC Order 2023 process — [pjm.com](https://www.pjm.com/-/media/DotCom/about-pjm/newsroom/fact-sheets/interconnection-reform-progress-fact-sheet.pdf)
- FERC, *Order 2023* — interconnection queue reform effective 2024 — [ferc.gov/media/order-no-2023](https://www.ferc.gov/media/order-no-2023)
- Davidson County Board of Commissioners, *Special Meeting for Solar Moratorium* (December 2024) — 24-month moratorium record — [co.davidson.nc.us](https://www.co.davidson.nc.us/DocumentCenter/View/11425/Special-Meeting-for-Solar-Moratorium-12-4-24)
