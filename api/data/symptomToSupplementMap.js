const symptomToSupplementMap = {
  // === MITOLYN ===
  "belly fat": { supplement: "mitolyn", plants: ["Maqui Berry", "Rhodiola Rosea", "Schisandra Chinensis", "Astaxanthin", "Amla", "Theobroma Cacao"] },
  "stubborn belly fat": { supplement: "mitolyn", plants: ["Maqui Berry", "Rhodiola Rosea", "Schisandra Chinensis", "Astaxanthin", "Amla", "Theobroma Cacao"] },
  "weight gain around stomach": { supplement: "mitolyn", plants: ["Maqui Berry", "Rhodiola Rosea", "Schisandra Chinensis", "Astaxanthin", "Amla", "Theobroma Cacao"] },
  "difficulty losing weight": { supplement: "mitolyn", plants: ["Maqui Berry", "Rhodiola Rosea", "Schisandra Chinensis", "Astaxanthin", "Amla", "Theobroma Cacao"] },
  "slow metabolism": { supplement: "mitolyn", plants: ["Maqui Berry", "Rhodiola Rosea", "Schisandra Chinensis", "Astaxanthin", "Amla", "Theobroma Cacao"] },
  "fatigue and low energy": { supplement: "mitolyn", plants: ["Rhodiola Rosea", "Amla", "Theobroma Cacao", "Maqui Berry"] },
  "weight loss plateau": { supplement: "mitolyn", plants: ["Maqui Berry", "Rhodiola Rosea", "Astaxanthin"] },
  "hormonal weight gain": { supplement: "mitolyn", plants: ["Schisandra Chinensis", "Amla", "Rhodiola Rosea"] },
  "abdominal bloating": { supplement: "mitolyn", plants: ["Schisandra Chinensis", "Rhodiola Rosea"] },
  "excess belly fat": { supplement: "mitolyn", plants: ["Maqui Berry", "Rhodiola Rosea", "Astaxanthin"] },
  "trouble losing belly fat": { supplement: "mitolyn", plants: ["Maqui Berry", "Schisandra Chinensis"] },
  "fatigue despite rest": { supplement: "mitolyn", plants: ["Rhodiola Rosea", "Theobroma Cacao"] },
  "metabolic slowdown": { supplement: "mitolyn", plants: ["Maqui Berry", "Schisandra Chinensis"] },
  "increased belly fat after 40": { supplement: "mitolyn", plants: ["Rhodiola Rosea", "Astaxanthin"] },
  "belly fat after pregnancy": { supplement: "mitolyn", plants: ["Amla", "Rhodiola Rosea"] },
  "feeling tired all the time": { supplement: "mitolyn", plants: ["Rhodiola Rosea", "Amla"] },
  "weight gain despite dieting": { supplement: "mitolyn", plants: ["Schisandra Chinensis", "Theobroma Cacao"] },
  "belly fat and stress": { supplement: "mitolyn", plants: ["Rhodiola Rosea", "Maqui Berry"] },
  "difficulty burning fat": { supplement: "mitolyn", plants: ["Astaxanthin", "Maqui Berry"] },
  "low energy and weight gain": { supplement: "mitolyn", plants: ["Rhodiola Rosea", "Theobroma Cacao"] },

  // === PRIME BIOME ===
  "abdominal bloating and gas": { supplement: "prime biome", plants: ["Ginger", "Black Garlic", "Inulin", "L-glutamine"] },
  "constipation or irregular bowel movements": { supplement: "prime biome", plants: ["Inulin", "Ginger", "L-glutamine"] },
  "frequent diarrhea or irritable bowel syndrome": { supplement: "prime biome", plants: ["L-glutamine", "Ginger", "Black Garlic"] },
  "adult or recurrent acne": { supplement: "prime biome", plants: ["Black Garlic", "Ginger", "Inulin"] },
  "frequent skin redness and irritation": { supplement: "prime biome", plants: ["Inulin", "Ginger"] },
  "persistent dry and flaky skin": { supplement: "prime biome", plants: ["Black Garlic", "L-glutamine"] },
  "melasma (dark facial spots)": { supplement: "prime biome", plants: ["Ginger", "L-glutamine"] },
  "premature skin aging (wrinkles and loss of elasticity)": { supplement: "prime biome", plants: ["Black Garlic", "Ginger"] },
  "eczema (atopic dermatitis)": { supplement: "prime biome", plants: ["Inulin", "L-glutamine"] },
  "psoriasis": { supplement: "prime biome", plants: ["Inulin", "Ginger"] },
  "rosacea": { supplement: "prime biome", plants: ["Black Garlic", "L-glutamine"] },
  "weakened immune system (frequent infections)": { supplement: "prime biome", plants: ["Inulin", "Ginger", "Black Garlic"] },
  "abdominal inflammation and constant discomfort": { supplement: "prime biome", plants: ["L-glutamine", "Inulin"] },
  "dull skin": { supplement: "prime biome", plants: ["Black Garlic", "Inulin"] },
  "acne or skin irritations": { supplement: "prime biome", plants: ["Black Garlic", "Inulin", "Ginger"] },

  // === PRODENTIM ===
  "dental caries": { supplement: "prodentim", plants: ["Peppermint", "Malic Acid", "Inulin"] },
  "gingivitis": { supplement: "prodentim", plants: ["Peppermint", "Inulin"] },
  "tartar": { supplement: "prodentim", plants: ["Malic Acid", "Inulin"] },
  "bad breath": { supplement: "prodentim", plants: ["Peppermint", "Malic Acid", "Inulin"] },
  "bacterial plaque": { supplement: "prodentim", plants: ["Peppermint", "Inulin"] },
  "dry mouth (xerostomia)": { supplement: "prodentim", plants: ["Inulin", "Peppermint"] },
  "tooth sensitivity": { supplement: "prodentim", plants: ["Peppermint"] },
  "canker sores": { supplement: "prodentim", plants: ["Inulin"] },
  "tongue coating": { supplement: "prodentim", plants: ["Peppermint"] },
  "periodontal disease (periodontitis)": { supplement: "prodentim", plants: ["Malic Acid", "Inulin"] },

  // === MORINGA MAGIC ===
  "chronic fatigue": { supplement: "moringa magic", plants: ["Moringa Oleifera", "Spirulina", "Ginger", "Chlorophyll"] },
  "low immunity": { supplement: "moringa magic", plants: ["Moringa Oleifera", "Chlorophyll", "Turmeric + Piperine"] },
  "digestive problems (such as constipation and bloating)": { supplement: "moringa magic", plants: ["Spirulina", "Moringa Oleifera"] },
  "chronic inflammation": { supplement: "moringa magic", plants: ["Turmeric + Piperine", "Moringa Oleifera"] },
  "dry and dull skin": { supplement: "moringa magic", plants: ["Chlorophyll", "Moringa Oleifera"] },
  "hair loss and weak nails": { supplement: "moringa magic", plants: ["Moringa Oleifera", "Spirulina"] },
  "difficulty concentrating and memory issues": { supplement: "moringa magic", plants: ["Moringa Oleifera", "Chlorophyll"] },
  "hormonal imbalances": { supplement: "moringa magic", plants: ["Turmeric + Piperine", "Moringa Oleifera"] },
  "slow metabolism and difficulty losing weight": { supplement: "moringa magic", plants: ["Moringa Oleifera", "Spirulina"] },
  "blood sugar imbalance": { supplement: "moringa magic", plants: ["Moringa Oleifera", "Turmeric + Piperine"] },

  // === PINEAL GUARDIAN ===
  "mental and physical fatigue": { supplement: "pineal guardian", plants: ["Bacopa Monnieri", "Ginkgo Biloba", "Lion's Mane Mushroom"] },
  "high stress and anxiety": { supplement: "pineal guardian", plants: ["Bacopa Monnieri", "Ginkgo Biloba"] },
  "difficulty concentrating and focusing": { supplement: "pineal guardian", plants: ["Lion's Mane Mushroom", "Bacopa Monnieri"] },
  "short and long-term memory problems": { supplement: "pineal guardian", plants: ["Lion's Mane Mushroom", "Ginkgo Biloba"] },
  "insomnia or poor sleep quality": { supplement: "pineal guardian", plants: ["Bacopa Monnieri", "Ginkgo Biloba"] },
  "brain fog": { supplement: "pineal guardian", plants: ["Lion's Mane Mushroom", "Bacopa Monnieri"] },
  "low motivation and apathy": { supplement: "pineal guardian", plants: ["Ginkgo Biloba"] },
  "sleep-related hormonal imbalances": { supplement: "pineal guardian", plants: ["Bacopa Monnieri"] },
  "early cognitive aging": { supplement: "pineal guardian", plants: ["Lion's Mane Mushroom", "Ginkgo Biloba"] },
  "spiritual or emotional disconnection": { supplement: "pineal guardian", plants: ["Bacopa Monnieri"] }
};

export default symptomToSupplementMap;

