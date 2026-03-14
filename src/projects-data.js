/**
 * THEMELI — Projects Data
 * Edit via admin.html or directly in this file.
 */
const PROJECTS = [
  {
    id: 1,
    name: "Athens-Thessaloniki Railway",
    description: "Major railway line connecting Greece's two largest cities through Pieria and Karditsa.",
    year: 1993,
    typology: "Railways",
    location: "Pieria / Karditsa",
    image: "",
    mapX: 46.3,
    mapY: 49.3
  },
  {
    id: 2,
    name: "Athens Tramway Extension",
    description: "Extension of the Athens tramway network serving the southern coastal suburbs.",
    year: 2004,
    typology: "Railways",
    location: "Athens",
    image: "",
    mapX: 46.3,
    mapY: 49.3
  },
  {
    id: 3,
    name: "Tramway Extension to Piraeus",
    description: "Connecting the existing tramway line from Faliro to the port of Piraeus.",
    year: 2013,
    typology: "Railways",
    location: "Athens / Piraeus",
    image: "",
    mapX: 45.8,
    mapY: 49.5
  },
  {
    id: 4,
    name: "Elefsina-Corinth High Speed Rail",
    description: "High-speed railway section linking Elefsina to Corinth along the Saronic Gulf.",
    year: 1998,
    typology: "Railways",
    location: "Corinth",
    image: "",
    mapX: 42.0,
    mapY: 51.0
  },
  {
    id: 5,
    name: "Inoi-Tithorea Track Laying",
    description: "Track laying works on the Inoi-Tithorea section of the Athens-Thessaloniki line.",
    year: 2000,
    typology: "Railways",
    location: "Viotia",
    image: "",
    mapX: 43.5,
    mapY: 47.0
  },
  {
    id: 6,
    name: "Slab Track System — Tempi",
    description: "Installation of slab track system in the Tempi valley railway corridor.",
    year: 2000,
    typology: "Railways",
    location: "Thessaly",
    image: "",
    mapX: 45.3,
    mapY: 42.9
  },
  {
    id: 7,
    name: "Egnatia Odos Motorway",
    description: "Major sections of Greece's cross-country motorway connecting Igoumenitsa to the Turkish border.",
    year: 1986,
    typology: "Roadworks",
    location: "Thessaloniki",
    image: "",
    mapX: 44.0,
    mapY: 35.5
  },
  {
    id: 8,
    name: "Corinth-Argos-Tripoli Highway",
    description: "National highway traversing the eastern Peloponnese from Corinth to Tripoli.",
    year: 1950,
    typology: "Roadworks",
    location: "Peloponnese",
    image: "",
    mapX: 39.0,
    mapY: 53.0
  },
  {
    id: 9,
    name: "Argos-Nafplio Highway",
    description: "Road connecting the city of Argos with the coastal town of Nafplio.",
    year: 1950,
    typology: "Roadworks",
    location: "Peloponnese",
    image: "",
    mapX: 40.5,
    mapY: 53.5
  },
  {
    id: 10,
    name: "VOAK — Northern Axis of Crete",
    description: "Northern road axis of Crete, the island's primary east-west motorway.",
    year: 2013,
    typology: "Roadworks",
    location: "Crete",
    image: "",
    mapX: 27.0,
    mapY: 57.3
  },
  {
    id: 11,
    name: "Larissa Bypass — Gyrtoni",
    description: "Bypass road around the city of Larissa through the Gyrtoni area.",
    year: 1999,
    typology: "Roadworks",
    location: "Larissa",
    image: "",
    mapX: 34.7,
    mapY: 34.0
  },
  {
    id: 12,
    name: "Piraeus Ikonio Tunnel",
    description: "Road tunnel connecting Piraeus port area with the Ikonio district.",
    year: 2004,
    typology: "Tunnels",
    location: "Piraeus / Perama",
    image: "",
    mapX: 45.5,
    mapY: 49.8
  },
  {
    id: 13,
    name: "Aigio Double Railway Tunnel",
    description: "Twin-bore railway tunnel near the city of Aigio in Achaia.",
    year: 2009,
    typology: "Tunnels",
    location: "Achaia",
    image: "",
    mapX: 36.0,
    mapY: 50.0
  },
  {
    id: 14,
    name: "Army's Joined Found Building",
    description: "Historic military administrative building constructed in central Athens.",
    year: 1923,
    typology: "Buildings",
    location: "Athens",
    image: "",
    mapX: 46.3,
    mapY: 49.3
  },
  {
    id: 15,
    name: "Bank of Athens — Stadiou St",
    description: "Neoclassical bank building on Stadiou Street in the Athens city center.",
    year: 1928,
    typology: "Buildings",
    location: "Athens",
    image: "",
    mapX: 46.3,
    mapY: 49.3
  },
  {
    id: 16,
    name: "KAT Hospital Complex",
    description: "Major trauma hospital complex in Kifissia, northern Athens.",
    year: 1950,
    typology: "Buildings",
    location: "Kifissia, Athens",
    image: "",
    mapX: 46.5,
    mapY: 48.5
  },
  {
    id: 17,
    name: "Hellenic Aspropyrgos Refinery",
    description: "Industrial refinery complex in the Aspropyrgos area west of Athens.",
    year: 1986,
    typology: "Buildings",
    location: "Aspropyrgos",
    image: "",
    mapX: 45.0,
    mapY: 49.0
  },
  {
    id: 18,
    name: "Xirovouni Wind Farm — 17 MW",
    description: "17 MW wind energy park in the Xirovouni area of Nafpaktia, Western Greece.",
    year: 2012,
    typology: "Industrial & Energy",
    location: "Nafpaktia, W. Greece",
    image: "",
    mapX: 34.0,
    mapY: 47.5
  },
  {
    id: 19,
    name: "Perganti Wind Farm — 41.8 MW",
    description: "Large-scale 41.8 MW wind farm in the mountainous terrain of Achaia.",
    year: 2020,
    typology: "Industrial & Energy",
    location: "Achaia",
    image: "",
    mapX: 35.5,
    mapY: 49.0
  },
  {
    id: 20,
    name: "Nafplio Sewerage System",
    description: "Complete sewerage network for the historic city of Nafplio.",
    year: 1988,
    typology: "Utility Networks",
    location: "Nafplio",
    image: "",
    mapX: 41.0,
    mapY: 53.0
  },
  {
    id: 21,
    name: "Mitilini Sewerage Network",
    description: "Sewerage infrastructure for the capital of Lesvos island.",
    year: 1998,
    typology: "Utility Networks",
    location: "Lesvos",
    image: "",
    mapX: 58.0,
    mapY: 34.0
  },
  {
    id: 22,
    name: "Paravola Underground Watering",
    description: "Underground irrigation system in the Paravola area near Agrinio.",
    year: 2005,
    typology: "Utility Networks",
    location: "Agrinio",
    image: "",
    mapX: 32.0,
    mapY: 46.5
  },
  {
    id: 23,
    name: "Kalamoti Earth Dam",
    description: "Earth dam construction on Chios island for water management.",
    year: 2005,
    typology: "Dams",
    location: "Chios",
    image: "",
    mapX: 57.0,
    mapY: 39.0
  },
  {
    id: 24,
    name: "Agrinio Flood Protection Dams",
    description: "Flood protection dam system in the Fthiotida region.",
    year: 1999,
    typology: "Dams",
    location: "Fthiotida",
    image: "",
    mapX: 38.0,
    mapY: 44.0
  },
  {
    id: 25,
    name: "Mesta Port Modernisation",
    description: "Modernisation of the Mesta port facilities on Chios island.",
    year: 2006,
    typology: "Ports & Marine",
    location: "Chios",
    image: "",
    mapX: 56.5,
    mapY: 40.0
  },
  {
    id: 26,
    name: "Kifissos River Arrangement",
    description: "River bed arrangement and flood protection works along the Kifissos in Athens.",
    year: 1990,
    typology: "Urban Redevelopment",
    location: "Athens",
    image: "",
    mapX: 46.0,
    mapY: 49.0
  }
];
