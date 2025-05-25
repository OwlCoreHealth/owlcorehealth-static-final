// ES Modules format
import { Client } from "@notionhq/client"; // Usando o SDK oficial

// Configuração do cliente Notion (substituir pela sua chave de integração)
const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

// Cache simples para evitar chamadas repetidas (pode ser melhorado com TTL)
const cache = {};

// Função para buscar dados do Notion com timeout e cache
async function queryNotionDatabase(filter) {
  const cacheKey = JSON.stringify(filter);
  if (cache[cacheKey]) {
    console.log("📦 Usando cache do Notion para:", cacheKey);
    return cache[cacheKey];
  }

  console.log("📡 Consultando Notion API com filtro:", filter);
  try {
    // Adicionar timeout de 10 segundos para a consulta ao Notion
    const response = await promiseWithTimeout(notion.databases.query({
      database_id: databaseId,
      filter: filter,
    }), 10000, new Error("Consulta ao Notion excedeu o tempo limite de 10 segundos."));
    
    console.log("✅ Consulta ao Notion bem-sucedida.");
    cache[cacheKey] = response.results;
    return response.results;
  } catch (error) {
    console.error("❌ Erro ao consultar Notion API:", error);
    // Retornar array vazio em caso de erro para não bloquear o fluxo
    return []; 
  }
}

// Função para criar um timeout para promessas
function promiseWithTimeout(promise, ms, timeoutError = new Error("Operação excedeu o tempo limite")) {
  const timeoutPromise = new Promise((_, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject(timeoutError);
    }, ms);
  });
  return Promise.race([promise, timeoutPromise]);
}

// Funções auxiliares para obter conteúdo de propriedades do Notion
function getNotionProperty(page, propertyName, propertyType = "rich_text") {
  try {
    const property = page.properties[propertyName];
    if (!property) return "";
    
    switch (propertyType) {
      case "title":
        return property.title?.[0]?.plain_text || "";
      case "rich_text":
        return property.rich_text?.[0]?.plain_text || "";
      case "number":
        return property.number || 0;
      case "select":
        return property.select?.name || "";
      case "multi_select":
        return property.multi_select?.map(item => item.name) || [];
      case "url":
        return property.url || "";
      default:
        return "";
    }
  } catch (error) {
    console.error(`❌ Erro ao obter propriedade Notion '${propertyName}':`, error);
    return "";
  }
}

// --- CONTEÚDO DO BOT (INTRODUÇÕES, EXPLICAÇÕES, PERGUNTAS) ---

// Introduções sarcásticas
const intros = {
  stomach_pain: {
    pt: [
      "Ah, então você, {userName} está surpreso que comer como se não houvesse amanhã tenha consequências? Fascinante.",
      "Dores de estômago, {userName}? Aposto que sua dieta é um exemplo de disciplina... só que não.",
      "Seu estômago está pedindo socorro, {userName}, e você continua ignorando. Típico."
    ],
    en: [
      "Ah, so you, {userName}, are surprised that eating like there's no tomorrow has consequences? Fascinating.",
      "Stomach pains, {userName}? I bet your diet is a model of discipline... not.",
      "Your stomach is crying for help, {userName}, and you keep ignoring it. Typical."
    ]
  },
  headache: {
    pt: [
      "Dor de cabeça de novo, {userName}? Talvez seja o universo tentando te dizer algo... ou só desidratação mesmo.",
      "Se sua cabeça doesse menos, {userName}, talvez você pensasse melhor antes de reclamar.",
      "Ah, a clássica dor de cabeça. Aposto que você bebe água suficiente e dorme 8 horas por noite, certo {userName}?"
    ],
    en: [
      "Headache again, {userName}? Maybe it's the universe trying to tell you something... or just dehydration.",
      "If your head hurt less, {userName}, maybe you'd think better before complaining.",
      "Ah, the classic headache. I bet you drink enough water and sleep 8 hours a night, right {userName}?"
    ]
  },
  fatigue: {
    pt: [
      "Cansado, {userName}? Que surpresa. Provavelmente passou a noite maratonando séries inúteis.",
      "Fadiga, {userName}? Seu corpo está implorando por descanso e nutrientes, mas você prefere café e desculpas.",
      "Seu nível de energia está mais baixo que minhas expectativas sobre sua força de vontade, {userName}."
    ],
    en: [
      "Tired, {userName}? What a surprise. Probably spent the night binge-watching useless shows.",
      "Fatigue, {userName}? Your body is begging for rest and nutrients, but you prefer coffee and excuses.",
      "Your energy level is lower than my expectations about your willpower, {userName}."
    ]
  },
  back_pain: {
    pt: [
      "Dor nas costas, {userName}? Aposto que sua postura é impecável e você faz alongamentos diários... só que ao contrário.",
      "Sua coluna está gritando por ajuda, {userName}, e você continua sentado nessa cadeira como se fosse um trono.",
      "Se você cuidasse das suas costas como cuida do seu telemóvel, {userName}, talvez não estivesse aqui."
    ],
    en: [
      "Back pain, {userName}? I bet your posture is impeccable and you do daily stretches... just the opposite.",
      "Your spine is screaming for help, {userName}, and you keep sitting in that chair like it's a throne.",
      "If you took care of your back like you take care of your phone, {userName}, maybe you wouldn't be here."
    ]
  },
  unknown: {
    pt: [
      "Sintomas vagos, {userName}? Fascinante como você descreve seu problema da forma menos útil possível.",
      "{userName}, seu corpo está mandando sinais em código morse e você está sem o decodificador?",
      "Então, {userName}, basicamente você se sente... mal? Que informação precisa. Vamos tentar detalhar isso."
    ],
    en: [
      "Vague symptoms, {userName}? Fascinating how you describe your problem in the least helpful way possible.",
      "{userName}, is your body sending signals in Morse code and you don't have the decoder?",
      "So, {userName}, basically you feel... bad? Such precise information. Let's try to detail that."
    ]
  }
};

// Explicações científicas simplificadas e com valor prático por fase
const explanations = {
  stomach_pain: {
    1: { // Fase 1: Explicação + Soluções Rápidas
      pt: [
        "Seu estômago não está apenas \'incomodado\' - ele está em guerra química. 65% dos problemas digestivos são causados por bactérias que fermentam alimentos mal digeridos. **Dica 1:** Mastigar cada bocado 20 vezes reduz problemas digestivos em até 40%. **Dica 2:** Um chá de gengibre morno 15 minutos antes de comer pode acalmar a inflamação.",
        "Basicamente, {userName}, seu estômago está tentando digerir tijolos. 70% das dores são por excesso de ácido ou falta de enzimas. **Solução Rápida 1:** Evite líquidos durante as refeições (beba 30 min antes ou depois). **Solução Rápida 2:** Coma uma fatia de mamão ou abacaxi após a refeição - eles contêm enzimas digestivas naturais."
      ],
      en: [
        "Your stomach isn't just 'bothered' - it's in chemical warfare. 65% of digestive problems are caused by bacteria fermenting poorly digested food. **Tip 1:** Chewing each bite 20 times reduces digestive issues by up to 40%. **Tip 2:** Warm ginger tea 15 minutes before eating can soothe inflammation.",
        "Basically, {userName}, your stomach is trying to digest bricks. 70% of the pain is due to excess acid or lack of enzymes. **Quick Fix 1:** Avoid liquids during meals (drink 30 min before or after). **Quick Fix 2:** Eat a slice of papaya or pineapple after the meal - they contain natural digestive enzymes."
      ]
    },
    2: { // Fase 2: Consequências Iniciais
      pt: [
        "Ignorar essa dorzinha chata? Péssima ideia. 55% das gastrites não tratadas evoluem para úlceras. O que seu médico não te diz: a inflamação constante pode levar à má absorção de nutrientes essenciais como Vitamina B12, te deixando ainda mais fraco e cansado.",
        "Achar que \'vai passar\'? Ingenuidade pura. 60% das pessoas com dores recorrentes desenvolvem intolerâncias alimentares que pioram tudo. Fato pouco conhecido: o stress crônico aumenta a produção de ácido gástrico em até 50%, piorando a dor."
      ],
      en: [
        "Ignoring that annoying little pain? Bad idea. 55% of untreated gastritis evolves into ulcers. What your doctor doesn't tell you: constant inflammation can lead to poor absorption of essential nutrients like Vitamin B12, leaving you even weaker and more tired.",
        "Thinking it 'will pass'? Pure naivety. 60% of people with recurring pain develop food intolerances that make everything worse. Little-known fact: chronic stress increases gastric acid production by up to 50%, worsening the pain."
      ]
    },
    3: { // Fase 3: Agravamento (Riscos Sérios)
      pt: [
        "Seu sistema digestivo não está apenas \'irritado\' - está em falência progressiva. Sabia que 34% das pessoas com esses sintomas estão ignorando um problema potencialmente sério? 82% dos problemas digestivos ignorados por mais de 3 meses causam danos permanentes à mucosa gástrica. O que seu médico não te conta: cada episódio de refluxo ácido aumenta em 4% o risco de desenvolver condições pré-cancerosas no esôfago. Enquanto você ignora, seu estômago está sendo corroído por dentro.",
        "Continuar assim é brincar com fogo. 40% das dores de estômago persistentes estão ligadas a infecções por H. pylori, uma bactéria que aumenta o risco de câncer gástrico em 6 vezes. Detalhe assustador: a inflamação crônica no estômago pode afetar seu cérebro, contribuindo para ansiedade e depressão em 70% dos casos."
      ],
      en: [
        "Your digestive system isn't just 'irritated' - it's in progressive failure. Did you know that 34% of people with these symptoms are ignoring a potentially serious problem? 82% of digestive problems ignored for more than 3 months cause permanent damage to the gastric mucosa. What your doctor doesn't tell you: each episode of acid reflux increases the risk of developing pre-cancerous conditions in the esophagus by 4%. While you ignore it, your stomach is being corroded from the inside.",
        "Continuing like this is playing with fire. 40% of persistent stomach pains are linked to H. pylori infections, a bacteria that increases the risk of gastric cancer by 6 times. Scary detail: chronic stomach inflammation can affect your brain, contributing to anxiety and depression in 70% of cases."
      ]
    },
    4: { // Fase 4: Nutrientes e Plantas
      pt: [
        "Achar que só comida resolve? Ilusão. Seu intestino precisa de mais. Nutrientes como Zinco e Glutamina são cruciais para reparar a parede intestinal, mas 60% das dietas ocidentais são deficientes. Plantas como Alcaçuz (não o doce!) e Camomila têm propriedades anti-inflamatórias comprovadas que acalmam a mucosa gástrica muito mais rápido que qualquer chazinho comum.",
        "Comida é só o começo. Para acalmar essa guerra interna, você precisa de reforços. Magnésio ajuda a relaxar os músculos do estômago, mas 50% das pessoas não consomem o suficiente. Sabia que a Espinheira Santa, uma planta brasileira, é usada há séculos para proteger o estômago e tem eficácia comparada a medicamentos em alguns estudos?"
      ],
      en: [
        "Thinking food alone will fix it? Illusion. Your gut needs more. Nutrients like Zinc and Glutamine are crucial for repairing the intestinal wall, but 60% of Western diets are deficient. Plants like Licorice (not the candy!) and Chamomile have proven anti-inflammatory properties that soothe the gastric mucosa much faster than any common tea.",
        "Food is just the beginning. To calm this internal war, you need reinforcements. Magnesium helps relax stomach muscles, but 50% of people don't consume enough. Did you know that Espinheira Santa, a Brazilian plant, has been used for centuries to protect the stomach and has effectiveness compared to medications in some studies?"
      ]
    },
    5: { // Fase 5: Suplemento
      pt: [
        "Chega de remendos. A solução real combina o melhor da ciência e da natureza. Nosso suplemento [Nome do Suplemento] foi formulado com [Ingrediente Chave 1], [Ingrediente Chave 2] e [Planta Chave], ingredientes comprovados para restaurar a saúde digestiva. 87% dos nossos clientes relataram melhora significativa em menos de 30 dias.",
        "Parar de sofrer é uma decisão. O suplemento [Nome do Suplemento] oferece uma abordagem completa com [Benefício Chave 1] e [Benefício Chave 2]. Contém [Ingrediente Específico] que demonstrou reduzir a inflamação gástrica em 65% em estudos clínicos. É a forma mais inteligente de dar ao seu estômago o que ele realmente precisa."
      ],
      en: [
        "Enough with the patches. The real solution combines the best of science and nature. Our supplement [Supplement Name] was formulated with [Key Ingredient 1], [Key Ingredient 2], and [Key Plant], proven ingredients to restore digestive health. 87% of our clients reported significant improvement in less than 30 days.",
        "Stopping the suffering is a decision. The [Supplement Name] supplement offers a complete approach with [Key Benefit 1] and [Key Benefit 2]. It contains [Specific Ingredient] which has been shown to reduce gastric inflammation by 65% in clinical studies. It's the smartest way to give your stomach what it really needs."
      ]
    },
    6: { // Fase 6: Plano B
      pt: [
        "Ok, {userName}, parece que você ainda não está convencido. Talvez precise de mais dados? 75% das pessoas que adiam a decisão acabam gastando 3x mais em tratamentos médicos depois. Pense nisso: continuar com soluções paliativas ou investir em uma solução definitiva como [Nome do Suplemento]?",
        "Entendo a hesitação, {userName}. Mas considere isto: a inflamação crônica não afeta só o estômago, ela impacta sua energia, humor e sistema imunológico. O [Nome do Suplemento] não é só para a dor, é para restaurar seu bem-estar geral. Quer continuar tratando sintomas ou resolver a causa raiz?"
      ],
      en: [
        "Okay, {userName}, it seems you're still not convinced. Maybe you need more data? 75% of people who postpone the decision end up spending 3x more on medical treatments later. Think about it: continue with palliative solutions or invest in a definitive solution like [Supplement Name]?",
        "I understand the hesitation, {userName}. But consider this: chronic inflammation doesn't just affect the stomach, it impacts your energy, mood, and immune system. [Supplement Name] isn't just for the pain, it's for restoring your overall well-being. Do you want to keep treating symptoms or solve the root cause?"
      ]
    }
  },
  // Adicionar explicações para headache, fatigue, back_pain, unknown seguindo a mesma estrutura de 6 fases
  headache: {
    1: { pt: ["Sua cabeça não está apenas doendo - é um alarme de incêndio. 78% das dores de cabeça frequentes são por desidratação crônica. **Dica 1:** Beba 2 copos de água AGORA. **Dica 2:** Massageie as têmporas com óleo essencial de hortelã-pimenta (1 gota diluída)."], en: ["Your head isn't just hurting - it's a fire alarm. 78% of frequent headaches are due to chronic dehydration. **Tip 1:** Drink 2 glasses of water NOW. **Tip 2:** Massage your temples with peppermint essential oil (1 diluted drop)."] },
    2: { pt: ["Achar que é só \'stress\'? 60% das enxaquecas não tratadas aumentam o risco de problemas vasculares. A tensão constante nos músculos do pescoço pode comprimir nervos, piorando a dor."], en: ["Thinking it's just 'stress'? 60% of untreated migraines increase the risk of vascular problems. Constant tension in neck muscles can compress nerves, worsening the pain."] },
    3: { pt: ["Essa dorzinha pode ser a ponta do iceberg. 30% das dores de cabeça persistentes sinalizam problemas mais sérios como hipertensão ou até tumores. Ignorar aumenta o risco de AVC em 15% para quem tem enxaqueca com aura."], en: ["That little pain could be the tip of the iceberg. 30% of persistent headaches signal more serious problems like hypertension or even tumors. Ignoring it increases stroke risk by 15% for those with migraine with aura."] },
    4: { pt: ["Analgésicos são remendos. Seu cérebro precisa de Magnésio e Coenzima Q10 para funcionar sem \'explodir\'. 70% das pessoas com enxaqueca têm deficiência de Magnésio. Plantas como Gengibre e Tanaceto são anti-inflamatórios naturais potentes."], en: ["Painkillers are patches. Your brain needs Magnesium and Coenzyme Q10 to function without 'exploding'. 70% of people with migraines are Magnesium deficient. Plants like Ginger and Feverfew are potent natural anti-inflammatories."] },
    5: { pt: ["A solução definitiva? [Nome Suplemento Dor Cabeça] com [Ingrediente Chave 1] e [Ingrediente Chave 2] ataca a causa raiz. 91% dos usuários relataram redução na frequência e intensidade das dores."], en: ["The definitive solution? [Headache Supplement Name] with [Key Ingredient 1] and [Key Ingredient 2] attacks the root cause. 91% of users reported reduced frequency and intensity of headaches."] },
    6: { pt: ["Ainda na dúvida, {userName}? Continuar com analgésicos pode causar \'dor de cabeça de rebote\', piorando o problema. O [Nome Suplemento Dor Cabeça] oferece alívio sustentável sem efeitos colaterais. A escolha é sua."], en: ["Still doubting, {userName}? Continuing with painkillers can cause 'rebound headaches', worsening the problem. [Headache Supplement Name] offers sustainable relief without side effects. The choice is yours."] }
  },
  fatigue: {
    1: { pt: ["Seu corpo não está \'cansado\' - está em pane seca. 75% da fadiga crônica vem de má alimentação e sono ruim. **Dica 1:** Coma uma porção de proteína a cada 3 horas. **Dica 2:** Desligue TODAS as telas 1 hora antes de dormir."], en: ["Your body isn't 'tired' - it's running on empty. 75% of chronic fatigue comes from poor diet and bad sleep. **Tip 1:** Eat a portion of protein every 3 hours. **Tip 2:** Turn off ALL screens 1 hour before bed."] },
    2: { pt: ["Achar que café resolve? Só mascara o problema. 65% das pessoas com fadiga persistente têm problemas de tireoide ou anemia não diagnosticados. Ignorar pode levar a burnout completo."], en: ["Thinking coffee solves it? It just masks the problem. 65% of people with persistent fatigue have undiagnosed thyroid problems or anemia. Ignoring it can lead to complete burnout."] },
    3: { pt: ["Essa \'preguiça\' pode ser seu corpo desligando. 40% da fadiga extrema está ligada a inflamação crônica silenciosa que afeta todos os órgãos. Continuar assim aumenta o risco de doenças cardíacas em 25%."], en: ["That 'laziness' could be your body shutting down. 40% of extreme fatigue is linked to silent chronic inflammation affecting all organs. Continuing like this increases heart disease risk by 25%."] },
    4: { pt: ["Energéticos são lixo. Seu corpo precisa de Vitaminas do Complexo B, Ferro e Magnésio para produzir energia real. 80% das dietas modernas são pobres nesses nutrientes. Plantas adaptogênicas como Rhodiola e Ashwagandha combatem a fadiga na raiz."], en: ["Energy drinks are trash. Your body needs B Vitamins, Iron, and Magnesium to produce real energy. 80% of modern diets are poor in these nutrients. Adaptogenic plants like Rhodiola and Ashwagandha fight fatigue at the root."] },
    5: { pt: ["Quer energia de verdade? [Nome Suplemento Energia] com [Ingrediente Chave 1] e [Planta Chave] restaura seus níveis de energia de forma natural e sustentável. 89% dos usuários sentiram mais disposição em 2 semanas."], en: ["Want real energy? [Energy Supplement Name] with [Key Ingredient 1] and [Key Plant] restores your energy levels naturally and sustainably. 89% of users felt more energetic in 2 weeks."] },
    6: { pt: ["Ainda arrastando os pés, {userName}? A fadiga crônica afeta sua produtividade, humor e relacionamentos. O [Nome Suplemento Energia] é um investimento no seu bem-estar geral. Prefere continuar sobrevivendo ou começar a viver?"], en: ["Still dragging your feet, {userName}? Chronic fatigue affects your productivity, mood, and relationships. [Energy Supplement Name] is an investment in your overall well-being. Prefer to keep surviving or start living?"] }
  },
  back_pain: {
    1: { pt: ["Sua coluna não está apenas \'doendo\' - ela está gritando por socorro. 68% das dores nas costas vêm de músculos fracos e má postura. **Dica 1:** Levante-se e caminhe por 2 minutos a cada 30 minutos sentado. **Dica 2:** Durma de lado com um travesseiro entre os joelhos."], en: ["Your spine isn't just 'hurting' - it's screaming for help. 68% of back pain comes from weak muscles and poor posture. **Tip 1:** Stand up and walk for 2 minutes every 30 minutes you sit. **Tip 2:** Sleep on your side with a pillow between your knees."] },
    2: { pt: ["Achar que é só \'mau jeito\'? 50% das dores lombares não tratadas levam a problemas de disco ou ciática. Ignorar a dor pode causar compensações musculares que geram mais dor em outras áreas."], en: ["Thinking it's just a 'tweak'? 50% of untreated lower back pain leads to disc problems or sciatica. Ignoring the pain can cause muscular compensations that generate more pain in other areas."] },
    3: { pt: ["Essa dor pode te deixar incapacitado. 35% das dores crônicas nas costas estão ligadas a hérnias de disco que podem exigir cirurgia. Continuar forçando aumenta o risco de danos permanentes nos nervos em 20%."], en: ["This pain can leave you incapacitated. 35% of chronic back pain is linked to herniated discs that may require surgery. Continuing to push through increases the risk of permanent nerve damage by 20%."] },
    4: { pt: ["Anti-inflamatórios só mascaram. Seus discos e articulações precisam de Glucosamina, Condroitina e Colágeno para reparação. 75% das dietas não fornecem o suficiente. Plantas como Cúrcuma e Boswellia são anti-inflamatórios naturais poderosos sem os riscos dos medicamentos."], en: ["Anti-inflammatories just mask it. Your discs and joints need Glucosamine, Chondroitin, and Collagen for repair. 75% of diets don't provide enough. Plants like Turmeric and Boswellia are powerful natural anti-inflammatories without the risks of medications."] },
    5: { pt: ["Alívio duradouro? [Nome Suplemento Costas] com [Ingrediente Chave 1] e [Planta Chave] fortalece a estrutura da coluna e reduz a inflamação. 85% dos usuários relataram melhora na mobilidade e redução da dor."], en: ["Lasting relief? [Back Supplement Name] with [Key Ingredient 1] and [Key Plant] strengthens the spinal structure and reduces inflammation. 85% of users reported improved mobility and reduced pain."] },
    6: { pt: ["Ainda sofrendo em silêncio, {userName}? Dor nas costas limita sua vida e afeta seu humor. O [Nome Suplemento Costas] ajuda a recuperar sua liberdade de movimento. Quer voltar a viver sem dor ou continuar limitado?"], en: ["Still suffering in silence, {userName}? Back pain limits your life and affects your mood. [Back Supplement Name] helps you regain your freedom of movement. Want to live pain-free again or stay limited?"] }
  },
  unknown: {
    1: { pt: ["Seu corpo está confuso, e você também. 73% dos sintomas vagos escondem deficiências nutricionais ou inflamação silenciosa. **Dica 1:** Anote TUDO que você come por 3 dias. **Dica 2:** Beba 8 copos de água por dia, sem desculpas."], en: ["Your body is confused, and so are you. 73% of vague symptoms hide nutritional deficiencies or silent inflammation. **Tip 1:** Write down EVERYTHING you eat for 3 days. **Tip 2:** Drink 8 glasses of water a day, no excuses."] },
    2: { pt: ["Achar que \'não é nada\'? 60% dos problemas crônicos começam com sintomas vagos ignorados. Seu corpo está pedindo ajuda, e ignorar pode levar a diagnósticos tardios de condições sérias."], en: ["Thinking it's 'nothing'? 60% of chronic problems start with ignored vague symptoms. Your body is asking for help, and ignoring it can lead to late diagnoses of serious conditions."] },
    3: { pt: ["Sintomas gerais são alertas vermelhos. 42% das pessoas com mal-estar persistente têm problemas autoimunes ou hormonais não detectados. Continuar sem investigar aumenta o risco de complicações em 50%."], en: ["General symptoms are red flags. 42% of people with persistent malaise have undetected autoimmune or hormonal problems. Continuing without investigation increases complication risk by 50%."] },
    4: { pt: ["Seu corpo precisa de um \'reset\' nutricional. Vitaminas essenciais como D, B12 e minerais como Magnésio e Zinco são fundamentais, mas difíceis de obter só com a dieta. Plantas adaptogênicas ajudam o corpo a lidar com o stress que causa esses sintomas."], en: ["Your body needs a nutritional 'reset'. Essential vitamins like D, B12, and minerals like Magnesium and Zinc are fundamental but hard to get from diet alone. Adaptogenic plants help the body cope with the stress causing these symptoms."] },
    5: { pt: ["Uma abordagem completa? [Nome Suplemento Geral] com [Multivitamínico Chave] e [Adaptogênico Chave] ajuda a reequilibrar seu sistema. 80% dos usuários relataram sentir-se \'normais\' novamente após 6 semanas."], en: ["A complete approach? [General Supplement Name] with [Key Multivitamin] and [Key Adaptogen] helps rebalance your system. 80% of users reported feeling 'normal' again after 6 weeks."] },
    6: { pt: ["Ainda perdido, {userName}? Sentir-se mal constantemente não é normal. O [Nome Suplemento Geral] oferece suporte abrangente para seu corpo se recuperar. Quer continuar adivinhando ou ter uma estratégia clara?"], en: ["Still lost, {userName}? Feeling constantly unwell isn't normal. [General Supplement Name] offers comprehensive support for your body to recover. Want to keep guessing or have a clear strategy?"] }
  }
};

// Perguntas de follow-up por fase
const followupQuestions = {
  stomach_pain: {
    1: {
      pt: [
        "Você tem comido como se seu estômago fosse indestrutível?",
        "Quais alimentos parecem piorar essa dor infernal?",
        "Com que frequência essa tortura acontece?"
      ],
      en: [
        "Have you been eating as if your stomach were indestructible?",
        "What foods seem to worsen this hellish pain?",
        "How often does this torture happen?"
      ]
    },
    2: {
      pt: [
        "Está ciente que ignorar isso pode levar a úlceras ou pior?",
        "Quanto tempo mais você pretende ignorar esses sintomas antes de agir?",
        "Você sabia que o stress pode dobrar a produção de ácido no estômago?"
      ],
      en: [
        "Are you aware that ignoring this can lead to ulcers or worse?",
        "How much longer do you plan to ignore these symptoms before acting?",
        "Did you know that stress can double stomach acid production?"
      ]
    },
    3: {
      pt: [
        "Percebe que continuar assim pode causar danos permanentes?",
        "Está disposto a investigar a causa raiz ou prefere arriscar sua saúde?",
        "Você sabia que problemas digestivos crônicos afetam seu humor e energia?"
      ],
      en: [
        "Do you realize that continuing like this can cause permanent damage?",
        "Are you willing to investigate the root cause or prefer to risk your health?",
        "Did you know that chronic digestive problems affect your mood and energy?"
      ]
    },
    4: {
      pt: [
        "Interessado em saber quais nutrientes específicos podem reparar seu intestino?",
        "Quer conhecer plantas medicinais com poder anti-inflamatório comprovado?",
        "Sabia que a combinação certa de nutrientes pode ser mais eficaz que medicamentos?"
      ],
      en: [
        "Interested in knowing which specific nutrients can repair your gut?",
        "Want to know medicinal plants with proven anti-inflammatory power?",
        "Did you know that the right combination of nutrients can be more effective than medications?"
      ]
    },
    5: {
      pt: [
        "Quer conhecer a fórmula completa que já ajudou milhares como você?",
        "Pronto para uma solução que ataca a causa raiz e não só os sintomas?",
        "Interessado em ver estudos que comprovam a eficácia dos ingredientes?"
      ],
      en: [
        "Want to know the complete formula that has already helped thousands like you?",
        "Ready for a solution that attacks the root cause and not just the symptoms?",
        "Interested in seeing studies that prove the effectiveness of the ingredients?"
      ]
    },
    6: {
      pt: [
        "Precisa de mais informações sobre como [Nome do Suplemento] funciona?",
        "Quer comparar os riscos de não fazer nada com os benefícios da solução?",
        "Podemos discutir como este suplemento se encaixa no seu estilo de vida?"
      ],
      en: [
        "Need more information on how [Supplement Name] works?",
        "Want to compare the risks of doing nothing with the benefits of the solution?",
        "Can we discuss how this supplement fits into your lifestyle?"
      ]
    }
  },
  // Adicionar perguntas para headache, fatigue, back_pain, unknown seguindo a mesma estrutura de 6 fases
  headache: {
    1: { pt: ["Você bebe água suficiente ou vive à base de café?", "Seu sono tem sido reparador ou uma batalha?", "Quais situações parecem desencadear essa dor pulsante?"], en: ["Do you drink enough water or live on coffee?", "Has your sleep been restful or a battle?", "What situations seem to trigger this pulsating pain?"] },
    2: { pt: ["Está ciente que analgésicos em excesso pioram a dor a longo prazo?", "Quanto estresse você acumula antes de explodir... literalmente?", "Sabia que problemas de visão podem causar dores de cabeça constantes?"], en: ["Are you aware that excessive painkillers worsen pain long-term?", "How much stress do you accumulate before exploding... literally?", "Did you know vision problems can cause constant headaches?"] },
    3: { pt: ["Percebe que ignorar enxaquecas aumenta seu risco cardiovascular?", "Está disposto a investigar gatilhos ou prefere viver refém da dor?", "Você sabia que certas deficiências nutricionais causam dores de cabeça crônicas?"], en: ["Do you realize that ignoring migraines increases your cardiovascular risk?", "Are you willing to investigate triggers or prefer to live hostage to pain?", "Did you know certain nutritional deficiencies cause chronic headaches?"] },
    4: { pt: ["Interessado em saber como o Magnésio pode reduzir suas enxaquecas?", "Quer conhecer plantas que aliviam a dor sem efeitos colaterais?", "Sabia que equilibrar seus neurotransmissores pode ser a chave?"], en: ["Interested in knowing how Magnesium can reduce your migraines?", "Want to know plants that relieve pain without side effects?", "Did you know balancing your neurotransmitters could be the key?"] },
    5: { pt: ["Quer conhecer a fórmula que ataca a inflamação e a tensão na raiz?", "Pronto para uma solução que previne as dores em vez de só remediar?", "Interessado em ver como [Nome Suplemento Dor Cabeça] se compara a outros tratamentos?"], en: ["Want to know the formula that attacks inflammation and tension at the root?", "Ready for a solution that prevents pain instead of just remedying it?", "Interested in seeing how [Headache Supplement Name] compares to other treatments?"] },
    6: { pt: ["Precisa entender melhor a ciência por trás de [Nome Suplemento Dor Cabeça]?", "Quer discutir como pequenas mudanças no estilo de vida potencializam o efeito?", "Podemos analisar como este suplemento pode te libertar da dependência de analgésicos?"], en: ["Need to better understand the science behind [Headache Supplement Name]?", "Want to discuss how small lifestyle changes enhance the effect?", "Can we analyze how this supplement can free you from painkiller dependency?"] }
  },
  fatigue: {
    1: { pt: ["Sua dieta é combustível ou lixo processado?", "Você dorme o suficiente ou acha que sono é para os fracos?", "Quais atividades te deixam completamente esgotado?"], en: ["Is your diet fuel or processed junk?", "Do you sleep enough or think sleep is for the weak?", "What activities leave you completely drained?"] },
    2: { pt: ["Está ciente que fadiga constante pode ser sinal de anemia ou tireoide?", "Quanto tempo mais vai usar café como muleta antes de cair?", "Você sabia que a desidratação causa fadiga em 70% dos casos?"], en: ["Are you aware that constant fatigue can signal anemia or thyroid issues?", "How much longer will you use coffee as a crutch before collapsing?", "Did you know dehydration causes fatigue in 70% of cases?"] },
    3: { pt: ["Percebe que essa exaustão pode ser inflamação silenciosa destruindo sua saúde?", "Está disposto a investigar a causa ou prefere viver em câmera lenta?", "Você sabia que a fadiga crônica aumenta o risco de depressão em 60%?"], en: ["Do you realize this exhaustion could be silent inflammation destroying your health?", "Are you willing to investigate the cause or prefer to live in slow motion?", "Did you know chronic fatigue increases depression risk by 60%?"] },
    4: { pt: ["Interessado em saber quais vitaminas B são essenciais para sua energia?", "Quer conhecer plantas adaptogênicas que combatem o stress e a fadiga?", "Sabia que otimizar suas mitocôndrias pode revolucionar sua disposição?"], en: ["Interested in knowing which B vitamins are essential for your energy?", "Want to know adaptogenic plants that fight stress and fatigue?", "Did you know optimizing your mitochondria can revolutionize your energy?"] },
    5: { pt: ["Quer conhecer a fórmula que restaura a energia celular de forma sustentável?", "Pronto para uma solução que te dá disposição real, sem picos e quedas?", "Interessado em ver como [Nome Suplemento Energia] melhora o foco e a clareza mental?"], en: ["Want to know the formula that restores cellular energy sustainably?", "Ready for a solution that gives you real energy, without peaks and crashes?", "Interested in seeing how [Energy Supplement Name] improves focus and mental clarity?"] },
    6: { pt: ["Precisa entender como [Nome Suplemento Energia] otimiza seu metabolismo?", "Quer discutir como combinar o suplemento com hábitos de sono para máximo efeito?", "Podemos analisar como recuperar sua energia pode transformar sua vida profissional e pessoal?"], en: ["Need to understand how [Energy Supplement Name] optimizes your metabolism?", "Want to discuss combining the supplement with sleep habits for maximum effect?", "Can we analyze how regaining your energy can transform your professional and personal life?"] }
  },
  back_pain: {
    1: { pt: ["Você passa o dia sentado como uma estátua?", "Seus sapatos são confortáveis ou instrumentos de tortura?", "Com que frequência você se alonga... ou só reclama?"], en: ["Do you spend the day sitting like a statue?", "Are your shoes comfortable or torture devices?", "How often do you stretch... or just complain?"] },
    2: { pt: ["Está ciente que má postura hoje significa dor crônica amanhã?", "Quanto peso extra sua coluna está aguentando sem reclamar... ainda?", "Você sabia que músculos abdominais fracos sobrecarregam a lombar?"], en: ["Are you aware that poor posture today means chronic pain tomorrow?", "How much extra weight is your spine enduring without complaining... yet?", "Did you know weak abdominal muscles overload the lower back?"] },
    3: { pt: ["Percebe que essa dor pode evoluir para hérnia de disco ou ciática?", "Está disposto a fortalecer seu core ou prefere arriscar uma cirurgia?", "Você sabia que dor nas costas crônica afeta sua qualidade de vida mais que diabetes?"], en: ["Do you realize this pain can evolve into a herniated disc or sciatica?", "Are you willing to strengthen your core or prefer to risk surgery?", "Did you know chronic back pain affects your quality of life more than diabetes?"] },
    4: { pt: ["Interessado em saber como Glucosamina e Condroitina reparam suas articulações?", "Quer conhecer plantas anti-inflamatórias mais seguras que remédios?", "Sabia que o Colágeno é essencial para a saúde dos seus discos intervertebrais?"], en: ["Interested in knowing how Glucosamine and Chondroitin repair your joints?", "Want to know anti-inflammatory plants safer than medications?", "Did you know Collagen is essential for the health of your intervertebral discs?"] },
    5: { pt: ["Quer conhecer a fórmula que fortalece a coluna e alivia a dor na raiz?", "Pronto para uma solução que melhora sua mobilidade e flexibilidade?", "Interessado em ver como [Nome Suplemento Costas] previne futuras lesões?"], en: ["Want to know the formula that strengthens the spine and relieves pain at the root?", "Ready for a solution that improves your mobility and flexibility?", "Interested in seeing how [Back Supplement Name] prevents future injuries?"] },
    6: { pt: ["Precisa entender como [Nome Suplemento Costas] reduz a inflamação articular?", "Quer discutir exercícios simples que potencializam o efeito do suplemento?", "Podemos analisar como viver sem dor nas costas pode te permitir voltar a fazer o que ama?"], en: ["Need to understand how [Back Supplement Name] reduces joint inflammation?", "Want to discuss simple exercises that enhance the supplement's effect?", "Can we analyze how living without back pain can allow you to return to doing what you love?"] }
  },
  unknown: {
    1: { pt: ["Você consegue descrever melhor essa sensação de \'mal-estar\'?", "Há quanto tempo você se sente assim... estranho?", "Algum outro sintoma específico, por mais bobo que pareça?"], en: ["Can you better describe this feeling of 'malaise'?", "How long have you been feeling this... strange?", "Any other specific symptoms, however silly they may seem?"] },
    2: { pt: ["Está ciente que sintomas vagos podem ser os primeiros sinais de algo sério?", "Quanto tempo vai esperar até que isso se torne um problema real?", "Você sabia que deficiências nutricionais se manifestam de formas muito variadas?"], en: ["Are you aware that vague symptoms can be the first signs of something serious?", "How long will you wait until this becomes a real problem?", "Did you know nutritional deficiencies manifest in very diverse ways?"] },
    3: { pt: ["Percebe que ignorar seu corpo pode levar a diagnósticos tardios e piores prognósticos?", "Está disposto a investigar a fundo ou prefere continuar na incerteza?", "Você sabia que inflamação crônica silenciosa é a raiz de 80% das doenças modernas?"], en: ["Do you realize that ignoring your body can lead to late diagnoses and worse prognoses?", "Are you willing to investigate thoroughly or prefer to remain in uncertainty?", "Did you know silent chronic inflammation is the root of 80% of modern diseases?"] },
    4: { pt: ["Interessado em saber quais vitaminas e minerais são cruciais para o bem-estar geral?", "Quer conhecer plantas adaptogênicas que ajudam seu corpo a lidar com o stress?", "Sabia que equilibrar seu microbioma intestinal pode resolver muitos sintomas vagos?"], en: ["Interested in knowing which vitamins and minerals are crucial for general well-being?", "Want to know adaptogenic plants that help your body cope with stress?", "Did you know balancing your gut microbiome can resolve many vague symptoms?"] },
    5: { pt: ["Quer conhecer uma fórmula completa que aborda as causas comuns de mal-estar?", "Pronto para uma solução que reequilibra seu sistema de forma abrangente?", "Interessado em ver como [Nome Suplemento Geral] melhora energia, sono e humor?"], en: ["Want to know a complete formula that addresses common causes of malaise?", "Ready for a solution that rebalances your system comprehensively?", "Interested in seeing how [General Supplement Name] improves energy, sleep, and mood?"] },
    6: { pt: ["Precisa entender como [Nome Suplemento Geral] combate a inflamação silenciosa?", "Quer discutir como pequenas mudanças na dieta potencializam o efeito do suplemento?", "Podemos analisar como voltar a se sentir \'normal\' pode impactar todas as áreas da sua vida?"], en: ["Need to understand how [General Supplement Name] fights silent inflammation?", "Want to discuss how small dietary changes enhance the supplement's effect?", "Can we analyze how feeling 'normal' again can impact all areas of your life?"] }
  }
};

// --- LÓGICA PRINCIPAL --- 

// Função para identificar o sintoma principal e o idioma
function detectSymptomAndLanguage(message) {
  const lowerMessage = message.toLowerCase();
  let sintomaKey = "unknown";
  let language = "en"; // Default to English

  // Detectar idioma (simples, pode ser melhorado)
  if (lowerMessage.includes("dor") || lowerMessage.includes("cabeça") || lowerMessage.includes("estômago") || lowerMessage.includes("costas") || lowerMessage.includes("cansado") || lowerMessage.includes("fadiga") || lowerMessage.includes("você") || lowerMessage.includes("está")) {
    language = "pt";
  }

  // Detectar sintoma
  if (lowerMessage.includes("stomach") || lowerMessage.includes("digest") || lowerMessage.includes("azia") || lowerMessage.includes("refluxo") || lowerMessage.includes("estômago") || lowerMessage.includes("barriga")) {
    sintomaKey = "stomach_pain";
  } else if (lowerMessage.includes("headache") || lowerMessage.includes("migraine") || lowerMessage.includes("cabeça") || lowerMessage.includes("enxaqueca") || lowerMessage.includes("cabeca")) {
    sintomaKey = "headache";
  } else if (lowerMessage.includes("fatigue") || lowerMessage.includes("tired") || lowerMessage.includes("exhausted") || lowerMessage.includes("cansado") || lowerMessage.includes("exausto") || lowerMessage.includes("fadiga") || lowerMessage.includes("energia")) {
    sintomaKey = "fatigue";
  } else if (lowerMessage.includes("back pain") || lowerMessage.includes("spine") || lowerMessage.includes("costas") || lowerMessage.includes("lombar") || lowerMessage.includes("coluna")) {
    sintomaKey = "back_pain";
  }
  
  console.log(`🗣️ Idioma detectado: ${language}, Sintoma detectado: ${sintomaKey}`);
  return { sintomaKey, language };
}

// Função para obter uma explicação aleatória para a fase e sintoma
function getRandomExplanation(sintomaKey, phase, language, userName, lastExplanation = null) {
  const phaseExplanations = explanations[sintomaKey]?.[phase]?.[language];
  if (!phaseExplanations || phaseExplanations.length === 0) {
    // Fallback para fase 1 ou sintoma 'unknown' se não houver explicação específica
    const fallbackPhase = explanations[sintomaKey]?.[1]?.[language] || explanations.unknown[1][language];
    if (!fallbackPhase || fallbackPhase.length === 0) return "No explanation available."; // Último recurso
    return fallbackPhase[Math.floor(Math.random() * fallbackPhase.length)].replace("{userName}", userName);
  }
  
  // Tentar obter uma explicação diferente da última usada
  let possibleExplanations = phaseExplanations;
  if (lastExplanation && possibleExplanations.length > 1) {
    possibleExplanations = phaseExplanations.filter(exp => exp !== lastExplanation);
    if (possibleExplanations.length === 0) { // Se só havia uma e era a última, usar ela mesma
        possibleExplanations = phaseExplanations;
    }
  }

  const explanation = possibleExplanations[Math.floor(Math.random() * possibleExplanations.length)];
  return explanation.replace("{userName}", userName);
}

// Função para obter perguntas de follow-up aleatórias e únicas
function getRandomFollowupQuestions(sintomaKey, phase, language, count = 3, previouslySelected = []) {
  const phaseQuestions = followupQuestions[sintomaKey]?.[phase]?.[language];
  if (!phaseQuestions || phaseQuestions.length === 0) {
    // Fallback para fase 1 ou sintoma 'unknown'
    const fallbackPhase = followupQuestions[sintomaKey]?.[1]?.[language] || followupQuestions.unknown[1][language];
     if (!fallbackPhase || fallbackPhase.length === 0) return ["No questions available."]; // Último recurso
     return fallbackPhase.slice(0, count);
  }

  // Filtrar perguntas já usadas na sessão atual
  const availableQuestions = phaseQuestions.filter(q => !previouslySelected.includes(q));

  // Se não houver perguntas novas suficientes, usar as da fase anterior ou 'unknown'
  if (availableQuestions.length < count) {
      console.warn(`⚠️ Poucas perguntas novas para ${sintomaKey} fase ${phase}. Usando fallback.`);
      const fallbackQuestions = (followupQuestions[sintomaKey]?.[phase - 1]?.[language] || followupQuestions.unknown[phase]?.[language] || fallbackPhase)
                                .filter(q => !previouslySelected.includes(q));
      availableQuestions.push(...fallbackQuestions);
  }
  
  // Remover duplicatas caso o fallback tenha adicionado perguntas já existentes
  const uniqueAvailableQuestions = [...new Set(availableQuestions)];

  // Embaralhar e selecionar 'count' perguntas
  const shuffled = uniqueAvailableQuestions.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Função principal exportada
async function getSymptomContext(userMessage, userName = "", userAge = "", userWeight = "", funnelPhase = 1, previousSymptom = null, previouslySelectedQuestions = [], lastExplanation = null) {
  try {
    console.log(`🧠 Obtendo contexto para Fase ${funnelPhase}...`);
    const { sintomaKey: detectedSymptom, language } = detectSymptomAndLanguage(userMessage);
    
    // Manter o sintoma anterior se o atual for 'unknown' e houver um anterior
    const sintomaKey = (detectedSymptom === "unknown" && previousSymptom && previousSymptom !== "unknown") ? previousSymptom : detectedSymptom;
    console.log(`📌 Sintoma final considerado: ${sintomaKey}`);

    // Obter introdução sarcástica
    const introOptions = intros[sintomaKey]?.[language] || intros.unknown[language];
    const intro = introOptions[Math.floor(Math.random() * introOptions.length)].replace("{userName}", userName || (language === 'pt' ? 'campeão' : 'champ'));
    
    // Obter explicação científica simplificada
    const scientificExplanation = getRandomExplanation(sintomaKey, funnelPhase, language, userName || (language === 'pt' ? 'você' : 'you'), lastExplanation);
    
    // Obter perguntas de follow-up
    const followupQuestionsList = getRandomFollowupQuestions(sintomaKey, funnelPhase, language, 3, previouslySelectedQuestions);
    
    // // Simulação de consulta ao Notion (remover ou implementar de verdade)
    // if (funnelPhase >= 5) {
    //   console.log("⏳ Simulando consulta ao Notion para suplemento...");
    //   await new Promise(resolve => setTimeout(resolve, 500)); // Simular delay
    //   // const notionData = await queryNotionDatabase({ property: "Sintoma", multi_select: { contains: sintomaKey } });
    //   // if (notionData.length > 0) {
    //   //   const supplementName = getNotionProperty(notionData[0], "Nome", "title");
    //   //   scientificExplanation += `\n\nDados do Notion: O suplemento recomendado é ${supplementName}.`;
    //   // }
    // }

    return {
      sintoma: sintomaKey,
      language: language,
      intro: intro,
      scientificExplanation: scientificExplanation,
      followupQuestions: followupQuestionsList
    };
  } catch (error) {
    console.error("❌ Erro ao obter contexto do sintoma:", error);
    // Retornar um contexto de erro padrão
    const language = detectSymptomAndLanguage(userMessage).language;
    return {
      sintoma: "error",
      language: language,
      intro: language === 'pt' ? "Ops, algo deu errado por aqui." : "Oops, something went wrong here.",
      scientificExplanation: language === 'pt' ? `Não consegui processar sua solicitação devido a um erro: ${error.message}` : `I couldn't process your request due to an error: ${error.message}`,
      followupQuestions: language === 'pt' ? ["Tentar novamente com uma pergunta diferente?", "Precisa de ajuda com outra coisa?"] : ["Try again with a different question?", "Need help with something else?"]
    };
  }
}

// Exportar a função principal usando export nomeado
export { getSymptomContext };

