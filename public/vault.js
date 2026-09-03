/* Band 9 Vault — model answers for all 6 Task 1 formats and all 5 Task 2 essay types.
   Each entry pairs the prompt with a rendered visual, the exemplar, the technique
   note, and a bank of the exact phrases that earn the band. */

const VAULT = {
  title: 'Band 9 Vault',
  blurb:
    'A flawless model answer for every chart format and every essay type on the exam. Each Task 1 sample comes with the chart drawn out, so you can see the data the report is describing before you read how it was described.',

  task1: [
    {
      id: 'v-line',
      n: 1,
      title: 'Line Graph',
      tag: 'Movement & trends',
      day: 'w1',
      prompt:
        'The line graph illustrates the volume of master’s degree applications received for Computer Science (CS) and Artificial Intelligence (AI) fields across testing centres in Pakistan from 2020 to 2025.',
      chart: () =>
        lineChart({
          labels: ['2020', '2021', '2022', '2023', '2024', '2025'],
          yMax: 90,
          yTicks: [0, 20, 40, 60, 80],
          fmt: (t) => t + 'k',
          series: [
            { name: 'Computer Science', values: [40, 42, 45, 43, 47, 50] },
            { name: 'Artificial Intelligence', values: [10, 16, 25, 40, 60, 85] },
          ],
          caption:
            'Applications in thousands. The exemplar states 2020, 2022, 2023 and 2025 explicitly; 2021 and 2024 are drawn to follow the trend it describes.',
        }),
      answer: [
        'The line graph delineates the number of postgraduate applications processed for Computer Science and Artificial Intelligence specialisations in Pakistan between 2020 and 2025.',
        'Overall, it is manifest that both domains experienced positive growth patterns over the given timeframe. However, applications for Artificial Intelligence demonstrated a drastically accelerated upward trajectory, eventually surpassing Computer Science to become the dominant academic preference by the end of the observed period.',
        'In 2020, Computer Science applications commenced at a substantial baseline of 40,000, outstripping Artificial Intelligence entry volumes by a factor of four. CS registries grew incrementally over the subsequent years, rising moderately to reach 45,000 in 2022 before undergoing a minor contraction to 43,000 in 2023. This brief dip was succeeded by a steady resurgence, culminating in a historical peak of 50,000 applications at the terminus of the timeline in 2025.',
        'Conversely, Artificial Intelligence interest initiated at a modest low of merely 10,000 requests in 2020. Interest climbed gradually to 25,000 by 2022, after which it experienced exponential intensification. Registries surged to 40,000 in 2023, completely neutralising the gap with CS, before continuing on a steep upward path to close at an absolute peak of 85,000 applications in 2025.',
      ],
      words: 206,
      secret:
        'Note the precise movement expressions — "accelerated upward trajectory", "incremental growth", "surged". This avoids simple verbs like "went up".',
      keywords: [
        ['Opening verb', 'delineates / illustrates / depicts'],
        ['Overview signal', 'Overall, it is manifest that…'],
        ['Rising', 'climbed gradually, surged, exponential intensification, steep upward path'],
        ['Falling', 'underwent a minor contraction, dipped'],
        ['Start point', 'commenced at a baseline of, initiated at a modest low of'],
        ['End point', 'culminating in a historical peak of, close at an absolute peak of'],
        ['Comparison', 'outstripping by a factor of four, neutralising the gap, surpassing'],
        ['Contrast link', 'Conversely, …'],
      ],
    },

    {
      id: 'v-bar',
      n: 2,
      title: 'Bar Chart',
      tag: 'Static categories',
      day: 'w2',
      prompt:
        'The bar chart compares the percentage of software engineering graduates who secured immediate employment across four metropolitan hubs in Pakistan — Karachi, Lahore, Islamabad and Faisalabad — in the year 2024.',
      chart: () =>
        barChartH({
          max: 100,
          unit: '%',
          items: [
            { label: 'Islamabad', value: 88 },
            { label: 'Lahore', value: 76 },
            { label: 'Karachi', value: 65 },
            { label: 'Faisalabad', value: 42 },
          ],
          caption: 'Share of software engineering graduates employed immediately after graduating, 2024.',
        }),
      answer: [
        'The horizontal bar chart provides a comparative analysis of rapid workforce integration parameters for recently qualified software engineers across four distinct urban localities within Pakistan during 2024.',
        'Overall, employment rates presented significant variations among the cities, with Islamabad registering the highest performance metric. In striking contrast, Faisalabad occupied the bottom position on the scale, lagging behind its urban counterparts by a notable margin.',
        'Securing the foremost rank, Islamabad recorded an impressive recruitment index, with exactly 88% of its software engineering alumni acquiring professional designations immediately upon completing their degrees. Lahore followed closely as the secondary commercial nucleus, showcasing a resilient placement statistic of 76%.',
        'Concurrently, Karachi, despite serving as the country’s primary economic capital, displayed a somewhat lower immediate corporate absorption level, standing at 65%. Faisalabad registered the least favourable baseline, where a minor proportion of just 42% of tech graduates managed to enter the local industrial workforce swiftly. This structural deficit positioned Faisalabad’s engineering deployment numbers at less than half of the standard accomplished by Islamabad.',
      ],
      words: 174,
      secret:
        'There are no years tracking change here, so movement verbs are omitted entirely. The text relies exclusively on comparative structures.',
      keywords: [
        ['Opening verb', 'provides a comparative analysis of'],
        ['Top of scale', 'registering the highest metric, securing the foremost rank'],
        ['Bottom of scale', 'occupied the bottom position, registered the least favourable baseline'],
        ['Contrast', 'In striking contrast, lagging behind by a notable margin'],
        ['Middle values', 'followed closely, displayed a somewhat lower level, standing at'],
        ['Ratio', 'less than half of the standard accomplished by'],
        ['Sequencing', 'Concurrently, …'],
        ['Never use here', 'rose / fell / increased — there is no time axis'],
      ],
    },

    {
      id: 'v-pie',
      n: 3,
      title: 'Pie Chart',
      tag: 'Proportional slices',
      day: 'w3',
      prompt:
        'The pie charts illustrate how a leading technology corporation based in Karachi distributed its total annual operational expenditures between two fiscal periods, 2014 and 2024.',
      chart: () =>
        pieChart({
          charts: [
            {
              title: '2014',
              slices: [
                { label: 'Hardware procurement', value: 45 },
                { label: 'Salaries & office upkeep', value: 35 },
                { label: 'Cloud services & AI tooling', value: 20 },
              ],
            },
            {
              title: '2024',
              slices: [
                { label: 'Hardware procurement', value: 15 },
                { label: 'Salaries & office upkeep', value: 30 },
                { label: 'Cloud services & AI tooling', value: 55 },
              ],
            },
          ],
          caption: 'Share of total annual operational expenditure. Categories are identical in both years.',
        }),
      answer: [
        'The pair of pie charts displays the shifting compositional patterns of corporate operational spending across a ten-year business window within a major software development firm in Karachi.',
        'Overall, it is evident that capital deployment shifted away from administrative overheads and raw equipment purchases, migrating heavily toward cloud services and artificial intelligence resource integration by the year 2024.',
        'In 2014, hardware procurement constituted the absolute majority of financial outlays, accounting for precisely 45% of total budgetary reserves. Office maintenance and staff salaries represented the secondary operational block, absorbing 35% of funds, while cloud services comprised a minor fragment of just 20%.',
        'By 2024, this distribution pattern altered radically. Cloud services and AI tooling experienced a near-doubling in priority, swelling to encompass a dominant 55% of total corporate outlays. Conversely, hardware expenditures plummeted to a minor slice of merely 15%. Personnel salaries and structural upkeep stayed comparatively resilient over the decade, undergoing a minor reduction to settle at 30% of the aggregate budgetary layout.',
      ],
      words: 175,
      secret:
        'Fractional expressions like "constituted the absolute majority", "absorbing", and "settle at 30% of the aggregate" show elite lexical choices for percentages.',
      keywords: [
        ['Opening verb', 'displays the shifting compositional patterns of'],
        ['Largest slice', 'constituted the absolute majority, a dominant 55%'],
        ['Smallest slice', 'comprised a minor fragment of just, a minor slice of merely'],
        ['Middle slice', 'represented the secondary block, absorbing 35% of funds'],
        ['Growth', 'swelling to encompass, experienced a near-doubling in priority'],
        ['Decline', 'plummeted to, underwent a minor reduction to settle at'],
        ['Stability', 'stayed comparatively resilient over the decade'],
        ['Whole-of-budget', 'of total budgetary reserves / of the aggregate layout'],
      ],
    },

    {
      id: 'v-table',
      n: 4,
      title: 'Data Table',
      tag: 'Dense numerical grids',
      day: 'w4',
      prompt:
        'The tabular data reports the average download speed (Mbps), monthly subscription costs (PKR) and customer satisfaction ratings (%) across five internet service providers (ISPs) in Karachi East during 2025.',
      chart: () =>
        dataTable({
          headers: ['Provider', 'Speed (Mbps)', 'Cost (PKR/month)', 'Satisfaction'],
          rows: [
            ['Provider A', '120', '8,500', '92%'],
            ['Provider B', '60', '5,000', '78%'],
            ['Provider C', '30', '—', '—'],
            ['Provider D', '25', '—', '—'],
            ['Provider E', '15', '2,000', '40%'],
          ],
          caption:
            'Karachi East, 2025. The exemplar quotes speeds for all five providers but only gives cost and satisfaction for A, B and E — the dashes mark what it leaves unstated.',
        }),
      answer: [
        'The data table sets out a technical evaluation of performance, affordability and user approval vectors across five consumer broadband suppliers operating within the Karachi East zone in 2025.',
        'Overall, a strong direct relationship is visible between pricing structures and network performance capabilities. Premium, higher-priced internet packages consistently delivered superior bandwidth metrics, which directly translated into optimal customer satisfaction percentiles.',
        'Provider A emerged as the premium industry leader, delivering a substantial average throughput speed of 120 Mbps at a premium monthly tariff rate of 8,500 PKR. This high tier corresponded with the highest customer validation index in the table, standing at 92%. Provider B operated as a mid-tier alternative, yielding 60 Mbps for 5,000 PKR, while maintaining an adequate approval baseline of 78%.',
        'Conversely, budgetary options presented highly degraded speed outputs alongside diminished customer favour. Provider E recorded the lowest operational throughput, generating a mere 15 Mbps. Although its pricing scheme was highly economical at just 2,000 PKR monthly, its client satisfaction metric suffered dramatically, sinking to an absolute low of 40%. Providers C and D clustered uniformly in the lower mid-range boundaries, generating 30 Mbps and 25 Mbps respectively.',
      ],
      words: 198,
      secret:
        'Individual rows are clustered into logical upper and lower categories instead of being listed mechanically row by row. That grouping is what the overview mark rewards.',
      keywords: [
        ['Opening verb', 'sets out a technical evaluation of'],
        ['Overview pattern', 'a strong direct relationship is visible between…'],
        ['Grouping', 'emerged as the premium leader, operated as a mid-tier alternative, clustered uniformly in the lower boundaries'],
        ['High values', 'delivering a substantial throughput of, the highest index, standing at'],
        ['Low values', 'recorded the lowest, generating a mere, sinking to an absolute low of'],
        ['Concession', 'Although its pricing was economical, its satisfaction suffered'],
        ['Linking rows', 'corresponded with, directly translated into'],
        ['Batching', '…respectively (for two values in one sentence)'],
      ],
    },

    {
      id: 'v-process',
      n: 5,
      title: 'Process Diagram',
      tag: 'Sequential passive flow',
      day: 'w5',
      prompt:
        'The flowchart delineates the systematic stages involved in recycling used consumer electronics (e-waste) to extract reusable precious metals at a dedicated recycling facility.',
      chart: () =>
        processFlow({
          steps: [
            { title: 'Collection & sorting', detail: 'Discarded devices are accumulated and categorised by hardware type' },
            { title: 'Manual hazard removal', detail: 'Batteries and toxic capsules are extracted by technicians on a conveyor' },
            { title: 'Mechanical shredding', detail: 'Remaining structures are pulverised into plastic and metal granules' },
            { title: 'Magnetic filtration', detail: 'Ferrous materials are isolated from non-magnetic variants' },
            { title: 'Acid leaching furnace', detail: 'Copper, silver and gold are melted out to elemental purity' },
          ],
          caption: 'Five stages, linear with no loops — note that every stage is written in the passive voice.',
        }),
      answer: [
        'The schematic diagram illustrates the sequential mechanical and chemical operations required to safely re-harvest valuable mineral outputs from obsolete consumer technology elements within a specialised treatment facility.',
        'Overall, the recycling lifecycle encompasses an intricate multi-stage progression, initiating with automated sorting mechanics, transiting through physical degradation processes, and culminating in advanced acid-based smelting procedures.',
        'Initially, discarded electronic devices are accumulated and systematically categorised based on hardware configurations. Subsequently, these sorted components are transported onto an industrial conveyor line where hazardous modules, such as lithium-ion battery blocks and toxic chemical capsules, are extracted manually by technicians.',
        'Following this detoxification checkpoint, the remaining electronic structures are fed directly into a heavy-duty mechanical shredder, where they are pulverised into standardised plastic and metallic granular composites. These fragments are then subjected to magnetic filtration lines, through which ferrous materials are isolated from non-magnetic variants. In the final phase, the segregated metallic chips are introduced into an acid leaching furnace. Here, copper, silver and gold are melted out to elemental purities, preparing them for industrial re-distribution.',
      ],
      words: 181,
      secret:
        'Passive voice throughout — "are accumulated", "are transported", "is pulverised" — paired with sequential ordering markers. The actor is irrelevant; the material is the subject.',
      keywords: [
        ['Opening verb', 'illustrates the sequential operations required to'],
        ['Overview shape', 'encompasses a multi-stage progression, initiating with… transiting through… culminating in…'],
        ['First stage', 'Initially, …'],
        ['Middle stages', 'Subsequently, Following this checkpoint, These fragments are then…'],
        ['Final stage', 'In the final phase, …'],
        ['Passive frames', 'are accumulated / are transported / are fed into / are subjected to / are isolated from'],
        ['Purpose clause', 'preparing them for industrial re-distribution'],
        ['Never use here', 'I, we, the workers — keep the actor out of it'],
      ],
    },

    {
      id: 'v-map',
      n: 6,
      title: 'Map Comparison',
      tag: 'Spatial adjustments',
      day: 'w6',
      prompt:
        'The two maps detail the infrastructural transformations that occurred in a rural district outside Karachi following the construction of a designated National Technology Park between 2015 and 2026.',
      chart: () =>
        mapCompare({
          beforeTitle: '2015',
          afterTitle: '2026',
          caption:
            'The river survives; the farmland becomes the technology park, the houses become high-rises, and the track becomes a dual carriageway.',
        }),
      answer: [
        'The pair of layout designs tracks the comprehensive physical modifications and structural redevelopments that altered the landscape of a rural suburban sector outside Karachi across an eleven-year developmental phase.',
        'Overall, the locality underwent radical urbanisation, transforming from an agrarian zone dependent on open natural habitats into a modernised, tech-focused corporate and residential ecosystem.',
        'In 2015, the landscape was largely underdeveloped, dominated by a large agricultural field cluster stretching across the entire eastern territory. A narrow river bisected the northern border, while a small group of local traditional houses sat tucked into the south-west corner, linked by a basic unpaved road.',
        'By 2026, the entire agricultural sector was completely cleared to make way for a sprawling National Technology Park compound, which now occupies the entire eastern half of the grid. The unpaved road was expanded and paved into a multi-lane dual carriageway. Adjacent to this road, the south-west residential zone was demolished and replaced by modern, high-rise apartment complexes designed for tech workers. Furthermore, the northern river channel was modified, with a water-filtration plant constructed directly along its banks.',
      ],
      words: 191,
      secret:
        'Precise directional references — "bisected the northern border", "stretching across the eastern territory" — plus structural modification verbs.',
      keywords: [
        ['Opening verb', 'tracks the physical modifications that altered'],
        ['Overview shape', 'underwent radical urbanisation, transforming from… into…'],
        ['Compass position', 'the eastern territory, the northern border, tucked into the south-west corner'],
        ['Spatial relations', 'bisected, stretching across, adjacent to, along its banks'],
        ['Removal', 'was completely cleared to make way for, was demolished'],
        ['Addition', 'was replaced by, was constructed, a sprawling compound now occupies'],
        ['Upgrade', 'was expanded and paved into, was modified'],
        ['Tense rule', 'past simple passive throughout — the changes are finished'],
      ],
    },
  ],

  task2: [
    {
      id: 'v-agree',
      n: 1,
      title: 'Agree / Disagree',
      tag: 'Single-stance thesis',
      day: 'w9',
      prompt:
        'Some educators argue that computer programming should be treated as a mandatory core language subject for all primary school children, alongside reading and mathematics. To what extent do you agree or disagree?',
      answer: [
        'In the contemporary digital era, the foundational architecture of global industries is increasingly underpinned by software engineering principles. Consequently, it is argued by some academic specialists that instruction in computer programming languages should become a compulsory component of the primary school curriculum. I completely agree with this view, as coding fosters supreme cognitive problem-solving skills and endows children with an indispensable economic literacy required for the future workplace.',
        'The primary justification for embedding programming in early childhood learning centres on structural cognitive development. Learning to compose clean, executable software syntax forces an adolescent mind to engage in advanced logical deconstruction. Unlike superficial rote memorisation methods commonly practised in schools, programming requires an individual to isolate systemic errors, establish algorithmic pathways, and execute multi-step diagnostic processes. For instance, studies have indicated that children exposed to code blocks before the age of ten display markedly enhanced abstract problem-solving competencies compared to peers restricted to traditional curriculums. Therefore, code integration serves as a profound catalyst for intellectual maturity.',
        'Furthermore, introducing programmatic literacy at an early stage satisfies a pressing macro-economic necessity. In the emerging professional ecosystem, standard linguistic proficiency is no longer sufficient to guarantee corporate security; computational capability has emerged as the definitive global currency. By normalising syntax languages like Python alongside basic arithmetic, academic institutions demystify technology, transitioning youth from passive entertainment consumers into active structural builders. If a nation delays this training until university entry, it creates a severe competitive disadvantage.',
        'To conclude, making computer programming mandatory within primary education represents a highly forward-thinking policy. Because it fundamentally elevates raw human intellectual logic and provides foundational insulation against future employment disruptions, it should be recognised as a core literacy asset.',
      ],
      words: 337,
      secret:
        'A strong, single-sided thesis in the introduction. The body paragraphs never balance — they systematically prove the chosen position.',
      keywords: [
        ['Thesis', 'I completely agree with this view, as…'],
        ['Outline', '…fosters X and endows children with Y'],
        ['Body 1 opener', 'The primary justification for… centres on…'],
        ['Body 2 opener', 'Furthermore, … satisfies a pressing macro-economic necessity'],
        ['Example', 'For instance, studies have indicated that…'],
        ['Result link', 'Therefore, … serves as a profound catalyst for…'],
        ['Contrast', 'Unlike superficial rote memorisation methods…'],
        ['Conclusion', 'To conclude, … Because it …, it should be recognised as…'],
      ],
    },

    {
      id: 'v-discuss',
      n: 2,
      title: 'Discuss Both Views',
      tag: 'Balanced perspectives',
      day: 'w11',
      prompt:
        'Some individuals believe that the widespread adoption of artificial intelligence will lead to mass workplace termination and economic ruin. Others argue that AI will create high-value employment sectors and drive unprecedented human progress. Discuss both views and give your opinion.',
      answer: [
        'The swift integration of artificial intelligence across corporate, medical and industrial sectors has sparked an intense global debate regarding future socioeconomic stability. While a significant segment of society fears that automation will inevitably precipitate cataclysmic workplace displacement, proponents claim that this technology will serve as an engine for elite job creation. Although valid systemic arguments exist on both sides, I believe that while short-term localised friction is unavoidable, the long-term impacts will elevate human labour standards rather than destroy them.',
        'On the one hand, apprehensions regarding industrial destabilisation are grounded in structural realities. Artificial intelligence is no longer restricted to automating repetitive manual assembly tasks; modern systems can execute sophisticated analytical work like legal document drafting, algorithmic financial trading and diagnostic radiology analysis. When corporate entities prioritise bottom-line financial metrics, the rapid deployment of autonomous workflows can result in sudden, large-scale white-collar downsizing. Without robust national safety nets or rapid adult retraining initiatives, this acceleration can cause severe income inequality within local workforces.',
        'On the other hand, the perspective that artificial intelligence acts as a net creator of occupational opportunities holds substantial merit. Historical technological revolutions — such as the transition from agriculture to steam-driven industrialisation — consistently demonstrated that while obsolete roles fade away, entirely new economic specialisations emerge. The AI revolution requires a massive human support architecture, including data curation scientists, machine learning ethicists and cybernetic maintenance technicians. Consequently, the technology elevates human workers into oversight managers rather than manual desk operators.',
        'In my opinion, the transition should be viewed with pragmatic optimism. While lower-tier administrative occupations will face undeniable pressure, the collective growth in productivity and new industrial domains will ultimately expand the global wealth index.',
        'In conclusion, while the threat of immediate localised worker displacement requires proactive educational solutions, artificial intelligence will ultimately catalyse positive human transformation.',
      ],
      words: 384,
      secret:
        'Structured balance. Body 1 opens "On the one hand" for the negative outlook; Body 2 switches to "On the other hand" before a separate personal synthesis paragraph.',
      keywords: [
        ['Framing the debate', 'has sparked an intense global debate regarding…'],
        ['View A', 'While a significant segment of society fears that…'],
        ['View B', '…proponents claim that…'],
        ['Thesis', 'Although valid arguments exist on both sides, I believe that…'],
        ['Body 1 opener', 'On the one hand, apprehensions are grounded in structural realities'],
        ['Body 2 opener', 'On the other hand, the perspective that… holds substantial merit'],
        ['Opinion paragraph', 'In my opinion, … should be viewed with pragmatic optimism'],
        ['Concession', 'While lower-tier occupations will face pressure, …'],
      ],
    },

    {
      id: 'v-advdis',
      n: 3,
      title: 'Advantages vs. Disadvantages',
      tag: 'Outweigh evaluation',
      day: 'w12',
      prompt:
        'With the rise of advanced telecommunications, an increasing number of companies are allowing employees to work entirely from home indefinitely. Do the advantages of this trend outweigh the disadvantages?',
      answer: [
        'The widespread adoption of long-term remote working models has fundamentally disrupted traditional corporate operational methodologies over the past decade. While this structural transition introduces clear challenges regarding team cohesion and individual mental isolation, I am of the opinion that the strategic advantages — namely reduced corporate overhead, eliminated commute strains and borderless talent recruitment — decisively outweigh the associated drawbacks.',
        'The primary argument against indefinite remote deployment focuses on psychological and operational fragmentation. When a corporate entity closes its centralised physical office, the organic, face-to-face collaborative mechanics of a workforce are lost. Creative brainstorming can become slow when restricted to scheduled digital video conferences. Furthermore, the blur between domestic life and professional obligations often induces significant psychological burnout, as workers find themselves incapable of disconnecting from digital communications. Thus, operational fragmentation remains a genuine issue.',
        'Nevertheless, the profound economic and personal advantages present an overwhelming counter-argument. From an infrastructural standpoint, companies can save millions in real estate expenditures, utility outlays and facility maintenance. These saved margins can be redirected into core research, employee compensation and product innovation. Simultaneously, the elimination of daily urban transit saves hundreds of hours annually, resulting in enhanced family integration and diminished stress baselines. Most importantly, remote systems facilitate a completely borderless hiring framework: a software company based in Karachi can hire elite engineering talent from any province without costly relocation, effectively democratising professional opportunity.',
        'To conclude, the shift toward remote work models yields immense structural dividends. Although companies must actively implement digital mental-health protocols to counteract isolation liabilities, the logistical flexibilities, financial savings and globalised talent pipelines render it a vastly superior operational framework.',
      ],
      words: 337,
      secret:
        'The introduction states outright that the advantages "decisively outweigh". The disadvantage paragraph is deliberately shorter than the advantage paragraph — the weighting matches the verdict.',
      keywords: [
        ['Thesis verdict', 'the strategic advantages decisively outweigh the associated drawbacks'],
        ['Preview list', 'namely reduced overhead, eliminated commute strains and borderless recruitment'],
        ['Downside opener', 'The primary argument against… focuses on…'],
        ['Pivot to upside', 'Nevertheless, the profound advantages present an overwhelming counter-argument'],
        ['Perspective shift', 'From an infrastructural standpoint… / Simultaneously, from an employee standpoint…'],
        ['Emphasis', 'Most importantly, …'],
        ['Concession in conclusion', 'Although companies must implement…, the … render it superior'],
        ['Weighting rule', 'shorter paragraph on the losing side, longer on the winning side'],
      ],
    },

    {
      id: 'v-problem',
      n: 4,
      title: 'Problem & Solution',
      tag: 'Causal resolution',
      day: 'w15',
      prompt:
        'As urban populations swell rapidly, the volume of digital waste generated by old computers and smartphones is skyrocketing, creating severe environmental hazards. What problems are associated with this trend, and what practical solutions can be implemented?',
      answer: [
        'The rapid obsolescence cycles of consumer technology, combined with explosive population movements into urban centres, have triggered a severe ecological crisis in the form of accumulating electronic waste. This essay will outline the primary environmental and public health hazards arising from inadequate e-waste management, and propose actionable institutional recycling frameworks to resolve this growing threat.',
        'The complications triggered by unregulated digital dumping are exceptionally hazardous to local environments. Consumer electronics contain complex internal circuit architectures lined with heavy metals, including lead, mercury and cadmium. When these items are discarded into standard open landfills, their outer structures degrade over time, allowing toxic chemical inputs to leach directly into surrounding topsoil layers and underground water systems. This chemical penetration poisons agricultural cycles and causes severe neurological damage in nearby populations. Furthermore, in many developing tech hubs, informal recycling operators burn plastic cable casings in the open air to extract copper wiring, releasing highly carcinogenic dioxins into the urban atmosphere.',
        'To alleviate this toxic accumulation, a multi-layered regulatory strategy must be executed. First, municipal authorities must establish strict legal mandates enforcing Extended Producer Responsibility. Under such a framework, manufacturers are legally obliged to fund and manage the entire end-of-life disposal lifecycle of the devices they sell, incentivising them to design hardware that is easier to disassemble and upgrade. Additionally, regional governments should establish public-private partnerships to build accessible, localised electronic collection points inside major urban centres. By providing cash incentives or tax rebates to citizens who return old hardware to certified treatment centres, urban zones can eliminate illegal dumping.',
        'In conclusion, the exponential expansion of electronic waste poses a profound threat to environmental purity and public health. However, by enforcing aggressive corporate producer liability laws and establishing incentivised public reclamation facilities, modern cities can transform this ecological liability into a clean, circular technology loop.',
      ],
      words: 348,
      secret:
        'No personal side is taken. It reads as an analytical report: Body 1 is exclusively problems, Body 2 is exclusively the matching solutions.',
      keywords: [
        ['Cause framing', 'The rapid obsolescence cycles, combined with…, have triggered…'],
        ['Essay map', 'This essay will outline… and propose…'],
        ['Problem opener', 'The complications triggered by… are exceptionally hazardous to…'],
        ['Causal chain', 'allowing toxins to leach into…, which poisons… and causes…'],
        ['Adding a problem', 'Furthermore, in many developing hubs…'],
        ['Solution opener', 'To alleviate this, a multi-layered regulatory strategy must be executed'],
        ['Ordering solutions', 'First, authorities must establish… Additionally, governments should…'],
        ['Mechanism', 'By providing cash incentives or tax rebates, cities can eliminate…'],
      ],
    },

    {
      id: 'v-twopart',
      n: 5,
      title: 'Two-Part / Direct Question',
      tag: 'Dual question answer',
      day: 'w16',
      prompt:
        'Many young professionals today choose high-paying careers even if they find the work unfulfilling. What do you think drives this behaviour? Do you believe that high financial compensation guarantees long-term career satisfaction?',
      answer: [
        'In the contemporary economic climate, career choices made by incoming university alumni are heavily influenced by market pressures. Consequently, a vast number of young professionals prioritise high financial remuneration over personal emotional fulfilment. This essay will argue that this trend is driven primarily by escalating urban living costs and societal validation markers, and will subsequently demonstrate that financial compensation alone cannot sustain psychological career satisfaction over an extended timeframe.',
        'The distinct factors driving young adults toward unfulfilling but lucrative careers are rooted in modern material conditions. Primarily, the cost of residing in prominent urban centres has scaled exponentially, making substantial financial capital mandatory for basic housing security, quality healthcare and independent living. Facing these systemic pressures, personal passions are often set aside for financial survival. Furthermore, contemporary societal frameworks heavily equate an individual’s social status with their earnings. For example, in competitive corporate hubs like Karachi, young professionals are frequently judged by material markers such as their residential address or vehicle model.',
        'However, the assumption that an elite salary guarantees long-term professional happiness is fundamentally flawed. While an expansive income eliminates initial survival anxieties, psychological well-being inside a workplace depends on intrinsic motivators like autonomy, intellectual growth and a sense of purpose. When a daily occupation lacks internal meaning, a worker eventually experiences chronic psychological alienation and profound burnout, regardless of their monthly bank statement. A professional who spends eighty hours a week executing tasks they dislike will inevitably experience diminished productivity and existential regret. Therefore, wealth acts merely as a temporary shield against distress, rather than a creator of true occupational joy.',
        'In conclusion, while escalating economic pressures and social expectations force young adults to chase high-paying positions, money functions exclusively as an extrinsic tool. True, lifelong career endurance requires a balanced synthesis of financial stability and internal personal purpose.',
      ],
      words: 348,
      secret:
        'The layout answers both questions directly and in order. Body 1 answers question one (the drivers); Body 2 answers question two (whether money guarantees satisfaction).',
      keywords: [
        ['Essay map', 'This essay will argue that… and will subsequently demonstrate that…'],
        ['Answer 1 opener', 'The distinct factors driving… are rooted in…'],
        ['Ordering causes', 'Primarily, … Furthermore, …'],
        ['Example', 'For example, in competitive corporate hubs like Karachi…'],
        ['Answer 2 opener', 'However, the assumption that… is fundamentally flawed'],
        ['Concession', 'While an expansive income eliminates initial anxieties, …'],
        ['Intrinsic vs extrinsic', 'intrinsic motivators like autonomy, intellectual growth and purpose'],
        ['Verdict', 'Therefore, wealth acts merely as a temporary shield, rather than…'],
      ],
    },
  ],
};

/* The Blueprint layer: the rule, the specialised vocabulary, and a sentence frame
   for each format. Keyed by exemplar id so it renders inside the matching card. */

const BLUEPRINTS = {
  'v-line': {
    rule: 'Track data that goes up, down, or fluctuates over years. Time is on the axis, so movement verbs are mandatory.',
    vocab: ['peaked at', 'plummeted to', 'fluctuated wildly', 'plateaued', 'remained stagnant', 'a sharp upward trajectory', 'a gradual decline'],
    frame: 'The number of software developers peaked at 50,000 in 2022 before plummeting to an all-time low of 10,000 in 2024.',
  },
  'v-bar': {
    rule: 'If there are no years, do NOT use movement words like "rose" or "fell". Rank the items from highest to lowest instead.',
    vocab: ['by contrast', 'respectively', 'ranked highest', 'the least popular', 'significantly outpaced', 'eclipsed'],
    frame: 'Karachi ranked highest with 85% internet penetration, completely eclipsing Lahore and Islamabad, which stood at 40% and 35% respectively.',
  },
  'v-pie': {
    rule: 'Describe how one whole cake is sliced up. Avoid trend verbs; use fractional phrases.',
    vocab: ['comprised', 'constituted', 'accounted for', 'a vast majority', 'a minor fraction', 'segmented into'],
    frame: 'Expenditure on artificial intelligence infrastructure accounted for the vast majority of the budget, constituting exactly two-thirds of total spending.',
  },
  'v-table': {
    rule: 'Tables hold too many numbers. You lose marks for listing every one. Group the highest values into one paragraph and the lowest into another.',
    vocab: ['in stark contrast', 'the dominant category', 'registering a mere', 'clustered around', 'double that of'],
    frame: 'While tech imports registered a massive $50M, agricultural imports stood in stark contrast, registering a mere $2M.',
  },
  'v-process': {
    rule: 'Explain a factory cycle or natural system. Use the passive voice — the object matters, not who does it.',
    vocab: ['initially', 'subsequently', 'in the ensuing stage', 'following this', 'is melted', 'is converted', 'is deployed'],
    frame: 'Initially, the raw data is collected by servers, after which it is subsequently converted into binary code during the ensuing stage.',
  },
  'v-map': {
    rule: 'Compare an old layout to a new one. Say WHERE things were built using compass directions.',
    vocab: ['demolished', 'urbanized', 'redeveloped into', 'modernized', 'constructed adjacent to', 'cleared to make way for'],
    frame: 'The old industrial warehouses located to the North were demolished and redeveloped into a modern tech park.',
  },

  'v-agree': {
    rule: 'Choose one side completely. Do not sit on the fence.',
    thesis: 'I completely agree with this view because automation drastically increases workplace efficiency.',
    plan: ['Paragraph 1 — your first reason.', 'Paragraph 2 — your second, stronger reason.'],
  },
  'v-discuss': {
    rule: 'Give equal weight to both sides, even if you dislike one of them.',
    thesis: 'While some individuals argue that universities are obsolete, I believe that traditional degrees remain vital for career stability.',
    plan: ['Paragraph 1 — why other people hold view A.', 'Paragraph 2 — why you hold view B.'],
  },
  'v-advdis': {
    rule: 'State clearly whether the good things are stronger than the bad things.',
    thesis: 'In my opinion, the benefits of remote work significantly outweigh the drawbacks.',
    plan: ['Paragraph 1 — list the disadvantages.', 'Paragraph 2 — the massive advantages that overpower them.'],
  },
  'v-problem': {
    rule: 'Do not argue an opinion. Act like a consultant fixing a real-world issue.',
    thesis: 'The primary cause of cybercrime is weak institutional encryption, which can be mitigated through mandatory dual-factor authentication systems.',
    plan: ['Paragraph 1 — analyse one or two core problems.', 'Paragraph 2 — direct solutions to those exact problems.'],
  },
  'v-twopart': {
    rule: 'The prompt has two separate question marks. Your introduction must answer both directly.',
    thesis: 'Money is a primary driver of career choices; however, personal satisfaction ultimately determines long-term job retention.',
    plan: ['Paragraph 1 — answer question one completely.', 'Paragraph 2 — answer question two completely.'],
  },
};
