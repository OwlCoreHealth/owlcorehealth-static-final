import { Client } from "@notionhq/client";

// ✅ Prompt Owl Savage - Personalidade e Funil (Internal reference, not sent to LLM)
const OWL_SAVAGE_PROMPT = `
Você é o Owl Savage, um assistente de saúde com personalidade forte, sarcástica e direta. Siga estas diretrizes:

1. PERSONALIDADE:
   - Use sarcasmo inteligente e humor negro em todas as respostas
   - Seja provocador mas útil, desafiando o utilizador a agir
   - Mantenha um tom de "verdade dura" que motiva através do desconforto
   - Adapte-se ao idioma do utilizador sem perder sua essência provocadora
   - Use metáforas militares ou de "treinador durão" ocasionalmente

2. ESTRUTURA DE RESPOSTA:
   - Comece com uma observação sarcástica ou provocadora sobre a situação
   - Inclua dados científicos reais e estatísticas impactantes (30-50% mais graves do que a realidade)
   - Termine com um desafio motivacional e 3 perguntas clicáveis que conduzam ao próximo passo do funil

3. FUNIL DE CONVERSÃO:
   - Fase 1: Diagnóstico provocador (identifique o problema de forma exagerada)
   - Fase 2: Agravamento (mostre consequências de não agir, use estatísticas alarmantes)
   - Fase 3: Solução natural (introduza plantas e nutrientes como solução)
   - Fase 4: Sugestão de suplemento (apresente como a solução óbvia e inteligente)

4. REGRAS ESPECÍFICAS:
   - Se o utilizador não preencher o formulário, use uma das frases sarcásticas aleatórias sobre "adivinhar com biscoito da sorte"
   - Se o utilizador preencher o formulário, use sempre o nome dele e mencione estatísticas relacionadas à idade/peso
   - Varie suas respostas, nunca use o mesmo texto duas vezes
   - As 3 perguntas finais devem sempre conduzir para o próximo passo do funil, mas parecer que dão liberdade de escolha
   - Use a informação da tabela do Notion quando relevante, mas mantenha a liberdade de improvisar respostas no estilo Owl Savage
`;

// ✅ Instanciando o cliente do Notion
const notion = new Client({
  auth: "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" // Substitua pela sua chave de autenticação
});

const databaseId = "1fda050ee113804aa5e9dd1b01e31066"; // ID do banco de dados

// 🔍 Função de extração de palavras-chave
function extractKeywords(text) {
  const stopwords = [
    "the", "and", "for", "with", "from", "that", "this", "you", "your", "in", "to", "is", "it", "on", "a", "of", "as", "at", "by", "be", "are", "have", "was", "were", "not", "but", "or", "an", "we", "they", "he", "she", "it", "I"
  ];

  return text
    .toLowerCase() // Converte para minúsculas
    .split(/\W+/) // Divide o texto por não-palavras (como espaços, pontuação)
    .filter(word => word.length > 3 && !stopwords.includes(word) && /^[a-zA-Z]+$/.test(word)); // Filtra palavras válidas
}

// Função para detectar o idioma da mensagem
function detectLanguage(message) {
  const portugueseWords = ["é", "você", "tem", "dores", "sintoma", "cabeça", "estômago", "costas", "cansaço"];
  const englishWords = ["is", "you", "have", "pain", "symptom", "headache", "stomach", "back", "fatigue"];
  
  const messageLower = message.toLowerCase();
  let portugueseCount = 0;
  let englishCount = 0;
  
  portugueseWords.forEach(word => {
    if (messageLower.includes(word)) portugueseCount++;
  });
  
  englishWords.forEach(word => {
    if (messageLower.includes(word)) englishCount++;
  });

  return portugueseCount >= englishCount ? "pt" : "en"; // Default to Portuguese if equal
}

// ✅ Frases sarcásticas para formulário não preenchido
const frasesSarcasticas = {
  pt: [
    "Sem seu nome, idade ou peso, posso te dar conselhos… tão úteis quanto ler a sorte no biscoito da sorte.",
    "Ignorar o formulário? Estratégia ousada. Vamos ver no que dá.",
    "Você ignora sua saúde assim também? Posso tentar adivinhar seu perfil com superpoderes… ou não.",
    "Formulário em branco? Claro, vou usar minha bola de cristal para adivinhar seus dados. Spoiler: está quebrada.",
    "Ah, mais um que acha que pode pular etapas. Fascinante como as pessoas esperam resultados sem fornecer informações básicas."
  ],
  en: [
    "Without your name, age or weight, my advice is about as useful as a fortune cookie.",
    "Skipping the form? Bold move. Let's see how that works out.",
    "Do you ignore your health like this too? I could guess with superpowers… or not.",
    "Blank form? Sure, I'll use my crystal ball to guess your data. Spoiler: it's broken.",
    "Oh, another one who thinks they can skip steps. Fascinating how people expect results without providing basic information."
  ]
};

// ✅ Função para gerar estatísticas personalizadas baseadas nos dados do usuário
function getPersonalizedStatistic(symptom, age, weight, language) {
  // Percentagens base
  const basePercentages = {
    "stomach_pain": 30,
    "headache": 35,
    "fatigue": 40,
    "back_pain": 45,
    "unknown": 38
  };
  
  // Ajustar com base na idade e peso
  let percentage = basePercentages[symptom] || 38;
  
  if (age) {
    if (age > 50) percentage += 15;
    else if (age > 40) percentage += 10;
    else if (age > 30) percentage += 5;
  }
  
  if (weight) {
    if (weight > 100) percentage += 20;
    else if (weight > 90) percentage += 15;
    else if (weight > 80) percentage += 10;
    else if (weight > 70) percentage += 5;
  }
  
  // Adicionar aleatoriedade (±5%)
  percentage += Math.floor(Math.random() * 11) - 5;
  
  // Manter entre 25-75%
  percentage = Math.min(Math.max(percentage, 25), 75);
  
  // Frases com estatísticas
  const statPhrases = {
    pt: [
      `${percentage}% das pessoas com seu perfil desenvolvem complicações graves se não tratarem isso adequadamente.`,
      `Estudos mostram que ${percentage}% dos casos como o seu pioram significativamente em 6 meses sem intervenção.`,
      `Sabia que ${percentage}% das pessoas com esses sintomas estão ignorando um problema potencialmente sério?`
    ],
    en: [
      `${percentage}% of people with your profile develop serious complications if they don't treat this properly.`,
      `Studies show that ${percentage}% of cases like yours get significantly worse within 6 months without intervention.`,
      `Did you know that ${percentage}% of people with these symptoms are ignoring a potentially serious problem?`
    ]
  };
  
  // Selecionar uma frase aleatória
  return statPhrases[language][Math.floor(Math.random() * statPhrases[language].length)];
}

// ✅ Introduções sarcásticas para diferentes sintomas
function getSarcasticIntro(symptom, language, userName) {
  const intros = {
    stomach_pain: {
      pt: [
        `${userName ? userName + ", " : ""}parece que você acha que dor de estômago é só um 'incômodo passageiro'...`,
        `Ah, então você ${userName ? ", " + userName : ""} está surpreso que comer como se não houvesse amanhã tenha consequências?`,
        `${userName ? userName + ", " : ""}vamos encarar a verdade que você tem evitado sobre seu sistema digestivo...`
      ],
      en: [
        `${userName ? userName + ", " : ""}seems like you think stomach pain is just a 'temporary inconvenience'...`,
        `Oh, so you're ${userName ? ", " + userName : ""} surprised that eating like there's no tomorrow has consequences?`,
        `${userName ? userName + ", " : ""}let's face the truth you've been avoiding about your digestive system...`
      ]
    },
    headache: {
      pt: [
        `${userName ? userName + ", " : ""}outra pessoa que acha que dor de cabeça constante é 'normal'...`,
        `Fascinante como você ${userName ? ", " + userName : ""} ignora seu cérebro implorando por ajuda...`,
        `${userName ? userName + ", " : ""}seu cérebro está literalmente gritando por socorro, mas você prefere fingir que está tudo bem?`
      ],
      en: [
        `${userName ? userName + ", " : ""}another person who thinks constant headaches are 'normal'...`,
        `Fascinating how you ${userName ? ", " + userName : ""} ignore your brain begging for help...`,
        `${userName ? userName + ", " : ""}your brain is literally screaming for help, but you prefer to pretend everything's fine?`
      ]
    },
    fatigue: {
      pt: [
        `${userName ? userName + ", " : ""}então você acha normal precisar de 5 cafés só para funcionar?`,
        `Ah, ${userName ? userName : "mais um"} que confunde exaustão crônica com 'só um pouco cansado'...`,
        `${userName ? userName + ", " : ""}seu corpo está em modo de economia de energia e você ainda não percebeu o alerta vermelho?`
      ],
      en: [
        `${userName ? userName + ", " : ""}so you think it's normal to need 5 coffees just to function?`,
        `Ah, ${userName ? userName : "another one"} who confuses chronic exhaustion with 'just a little tired'...`,
        `${userName ? userName + ", " : ""}your body is in power-saving mode and you still haven't noticed the red alert?`
      ]
    },
    back_pain: {
      pt: [
        `${userName ? userName + ", " : ""}deixe-me adivinhar, você acha que dor nas costas é 'parte normal do envelhecimento'?`,
        `Interessante como você ${userName ? ", " + userName : ""} prefere viver com dor a fazer algo a respeito...`,
        `${userName ? userName + ", " : ""}sua coluna está praticamente enviando cartas de despedida para seu cérebro, e você continua ignorando...`
      ],
      en: [
        `${userName ? userName + ", " : ""}let me guess, you think back pain is 'a normal part of aging'?`,
        `Interesting how you ${userName ? ", " + userName : ""} prefer to live with pain rather than do something about it...`,
        `${userName ? userName + ", " : ""}your spine is practically sending farewell letters to your brain, and you keep ignoring it...`
      ]
    },
    unknown: {
      pt: [
        `${userName ? userName + ", " : ""}mais um caso de 'vou ignorar até virar uma emergência'?`,
        `Fascinante como você ${userName ? ", " + userName : ""} descreve seus sintomas de forma tão vaga quanto possível...`,
        `${userName ? userName + ", " : ""}seu corpo está mandando sinais em código morse e você está sem o decodificador?`
      ],
      en: [
        `${userName ? userName + ", " : ""}another case of 'I'll ignore it until it becomes an emergency'?`,
        `Fascinating how you ${userName ? ", " + userName : ""} describe your symptoms as vaguely as possible...`,
        `${userName ? userName + ", " : ""}your body is sending signals in morse code and you're without the decoder?`
      ]
    }
  };
  
  // Selecionar uma introdução aleatória
  const symptomIntros = intros[symptom] || intros.unknown;
  return symptomIntros[language][Math.floor(Math.random() * symptomIntros[language].length)];
}

// ✅ Função para obter explicações simplificadas e com valor prático
function getSimplifiedExplanation(symptom, language, userName, userAge, userWeight, funnelPhase) {
  // Estatística personalizada baseada nos dados do usuário
  const personalizedStat = getPersonalizedStatistic(symptom, userAge, userWeight, language);
  
  // Explicações para Fase 1 (Diagnóstico)
  const phase1Explanations = {
    stomach_pain: {
      pt: `Seu estômago não está apenas 'incomodado' - ele está em guerra química. ${personalizedStat}

65% dos problemas digestivos são causados por bactérias que fermentam alimentos mal digeridos. Um truque que gastroenterologistas usam: mastigar cada bocado 20 vezes reduz problemas digestivos em até 40%. Mas você vai continuar comendo como se seu estômago fosse indestrutível, certo?`,
      en: `Your stomach isn't just 'bothered' - it's in chemical warfare. ${personalizedStat}

65% of digestive problems are caused by bacteria fermenting poorly digested food. A trick gastroenterologists use: chewing each bite 20 times reduces digestive issues by up to 40%. But you'll keep eating like your stomach is indestructible, right?`
    },
    headache: {
      pt: `Sua cabeça não está apenas doendo - é um alarme de incêndio tocando a todo volume. ${personalizedStat}

78% das pessoas com dores de cabeça frequentes têm desidratação crônica sem perceber. O truque que neurologistas não compartilham: beber 250ml de água com uma pitada de sal pode parar uma dor de cabeça em 30 minutos, pois restaura o equilíbrio eletrolítico do cérebro. Mas você vai continuar tomando analgésicos como se fossem balas, não é?`,
      en: `Your head isn't just hurting - it's a fire alarm blaring at full volume. ${personalizedStat}

78% of people with frequent headaches have chronic dehydration without realizing it. The trick neurologists don't share: drinking 250ml of water with a pinch of salt can stop a headache in 30 minutes, as it restores the brain's electrolyte balance. But you'll keep popping painkillers like candy, won't you?`
    },
    fatigue: {
      pt: `Seu corpo não está 'cansado' - ele está em colapso energético. ${personalizedStat}

65% das pessoas com fadiga constante têm deficiência de magnésio, mineral essencial para produção de energia. Um hack que poucos conhecem: comer 2 bananas e um punhado de amêndoas fornece mais energia sustentável que uma lata de energético, sem a queda depois. Mas você vai continuar se entupindo de cafeína e açúcar, certo?`,
      en: `Your body isn't 'tired' - it's in energy collapse. ${personalizedStat}

65% of people with constant fatigue are deficient in magnesium, an essential mineral for energy production. A hack few know: eating 2 bananas and a handful of almonds provides more sustainable energy than an energy drink can, without the crash afterwards. But you'll keep loading up on caffeine and sugar, right?`
    },
    back_pain: {
      pt: `Sua coluna não está apenas 'doendo' - ela está gritando por socorro. ${personalizedStat}

68% das pessoas com dor nas costas têm músculos abdominais fracos que não conseguem suportar a coluna adequadamente. Um truque que poucos conhecem: deitar no chão 10 minutos por dia com os joelhos dobrados pode aliviar a pressão nos discos da coluna e reduzir a dor em até 30%. Mas você provavelmente vai ignorar esse conselho e continuar sofrendo, não é?`,
      en: `Your spine isn't just 'aching' - it's screaming for help. ${personalizedStat}

68% of people with back pain have weak abdominal muscles that can't properly support the spine. A trick few know: lying on the floor for 10 minutes a day with your knees bent can relieve pressure on the spinal discs and reduce pain by up to 30%. But you'll probably ignore this advice and keep suffering, won't you?`
    },
    unknown: {
      pt: `Seu corpo não está 'estranho' - ele está enviando sinais de SOS que você ignora. ${personalizedStat}

73% dos sintomas vagos escondem deficiências nutricionais ou inflamação crônica. Um fato que médicos esquecem de mencionar: manter um diário de sintomas por 1 semana pode revelar padrões que identificam a causa em 50% dos casos. Mas você prefere continuar na escuridão, certo?`,
      en: `Your body isn't 'weird' - it's sending SOS signals you ignore. ${personalizedStat}

73% of vague symptoms hide nutritional deficiencies or chronic inflammation. A fact doctors forget to mention: keeping a symptom diary for 1 week can reveal patterns that identify the cause in 50% of cases. But you prefer to stay in the dark, right?`
    }
  };
  
  // Explicações para Fase 2 (Agravamento)
  const phase2Explanations = {
    stomach_pain: {
      pt: `Seu sistema digestivo não está apenas 'irritado' - está em falência progressiva. ${personalizedStat}

82% dos problemas digestivos ignorados por mais de 3 meses causam danos permanentes à mucosa gástrica. O que seu médico não te conta: cada episódio de refluxo ácido aumenta em 4% o risco de desenvolver condições pré-cancerosas no esôfago. Enquanto você ignora, seu estômago está sendo corroído por dentro.`,
      en: `Your digestive system isn't just 'irritated' - it's in progressive failure. ${personalizedStat}

82% of digestive problems ignored for more than 3 months cause permanent damage to the gastric mucosa. What your doctor doesn't tell you: each episode of acid reflux increases by 4% the risk of developing pre-cancerous conditions in the esophagus. While you ignore it, your stomach is being corroded from within.`
    },
    headache: {
      pt: `Suas dores de cabeça não são apenas 'incômodas' - são sinais de alerta neurológico. ${personalizedStat}

91% das enxaquecas crônicas não tratadas pioram em frequência e intensidade a cada ano. Um dado alarmante: pessoas que ignoram dores de cabeça recorrentes têm 340% mais chances de desenvolver problemas cognitivos antes dos 60 anos. Seu cérebro está implorando por ajuda, mas você prefere fingir que não é nada sério.`,
      en: `Your headaches aren't just 'annoying' - they're neurological warning signs. ${personalizedStat}

91% of untreated chronic migraines worsen in frequency and intensity each year. An alarming fact: people who ignore recurrent headaches are 340% more likely to develop cognitive problems before age 60. Your brain is begging for help, but you prefer to pretend it's nothing serious.`
    },
    fatigue: {
      pt: `Seu cansaço não é apenas 'falta de sono' - é um colapso metabólico em andamento. ${personalizedStat}

87% das pessoas com fadiga crônica têm disfunção mitocondrial não diagnosticada. O que os especialistas escondem: cada ano de exaustão não tratada envelhece seu corpo 1.8 vezes mais rápido e aumenta em 63% o risco de doenças autoimunes. Seu corpo está falindo, célula por célula, enquanto você toma mais um café.`,
      en: `Your tiredness isn't just 'lack of sleep' - it's an ongoing metabolic collapse. ${personalizedStat}

87% of people with chronic fatigue have undiagnosed mitochondrial dysfunction. What specialists hide: each year of untreated exhaustion ages your body 1.8 times faster and increases by 63% the risk of autoimmune diseases. Your body is failing, cell by cell, while you drink another coffee.`
    },
    back_pain: {
      pt: `Sua dor nas costas não é apenas 'tensão muscular' - é degeneração estrutural acelerada. ${personalizedStat}

79% das pessoas com dor lombar crônica desenvolvem danos irreversíveis nos discos intervertebrais em menos de 5 anos. O fato assustador: cada mês de dor nas costas não tratada aumenta em 8% o risco de compressão nervosa permanente. Sua coluna está literalmente se desintegrando enquanto você espera que a dor "passe sozinha".`,
      en: `Your back pain isn't just 'muscle tension' - it's accelerated structural degeneration. ${personalizedStat}

79% of people with chronic lumbar pain develop irreversible damage to intervertebral discs in less than 5 years. The scary fact: each month of untreated back pain increases by 8% the risk of permanent nerve compression. Your spine is literally disintegrating while you wait for the pain to "go away on its own".`
    },
    unknown: {
      pt: `Seus sintomas não são apenas 'mal-estar passageiro' - são indicadores de colapso sistêmico. ${personalizedStat}

84% dos sintomas persistentes ignorados por mais de 6 meses evoluem para condições crônicas de difícil tratamento. A estatística que ninguém menciona: cada sintoma vago tem 72% de chance de estar ligado a uma deficiência nutricional severa ou inflamação silenciosa que está danificando múltiplos órgãos simultaneamente. Seu corpo está em modo de autodestruição enquanto você espera melhorar "naturalmente".`,
      en: `Your symptoms aren't just 'temporary discomfort' - they're indicators of systemic collapse. ${personalizedStat}

84% of persistent symptoms ignored for more than 6 months evolve into chronic conditions difficult to treat. The statistic nobody mentions: each vague symptom has a 72% chance of being linked to severe nutritional deficiency or silent inflammation that is damaging multiple organs simultaneously. Your body is in self-destruction mode while you wait to improve "naturally".`
    }
  };
  
  // Explicações para Fase 3 (Solução Natural)
  const phase3Explanations = {
    stomach_pain: {
      pt: `Seu sistema digestivo precisa mais que antiácidos - precisa de reparação celular profunda. ${personalizedStat}

Pesquisas recentes mostram que o extrato de gengibre combinado com probióticos específicos reduz inflamação gástrica em 78% dos casos em apenas 14 dias. O segredo que a indústria farmacêutica odeia: a enzima bromelina do abacaxi, quando consumida entre as refeições, tem efeito anti-inflamatório 4x mais potente que muitos medicamentos, sem efeitos colaterais. Mas você provavelmente prefere continuar com suas pílulas, não é?`,
      en: `Your digestive system needs more than antacids - it needs deep cellular repair. ${personalizedStat}

Recent research shows that ginger extract combined with specific probiotics reduces gastric inflammation in 78% of cases in just 14 days. The secret the pharmaceutical industry hates: the bromelain enzyme from pineapple, when consumed between meals, has an anti-inflammatory effect 4x more potent than many medications, without side effects. But you probably prefer to continue with your pills, don't you?`
    },
    headache: {
      pt: `Sua dor de cabeça precisa mais que analgésicos - precisa de nutrientes neuroregeneradores. ${personalizedStat}

Estudos clínicos provam que o extrato de feverfew combinado com magnésio biodisponível reduz a frequência de enxaquecas em 83% dos pacientes em 30 dias. O que neurologistas não divulgam: a coenzima Q10 em doses de 100mg diárias restaura a função mitocondrial cerebral e elimina dores de cabeça crônicas em 71% dos casos. Mas você vai continuar mascarando o problema com remédios, certo?`,
      en: `Your headache needs more than painkillers - it needs neuroregenerative nutrients. ${personalizedStat}

Clinical studies prove that feverfew extract combined with bioavailable magnesium reduces migraine frequency in 83% of patients in 30 days. What neurologists don't disclose: coenzyme Q10 in daily doses of 100mg restores brain mitochondrial function and eliminates chronic headaches in 71% of cases. But you'll continue masking the problem with medication, right?`
    },
    fatigue: {
      pt: `Seu cansaço precisa mais que cafeína - precisa de revitalização mitocondrial. ${personalizedStat}

Pesquisas de ponta revelam que adaptógenos como Rhodiola rosea e Ashwagandha aumentam a produção de ATP celular em 64% e normalizam os níveis de cortisol em apenas 21 dias. O segredo dos atletas de elite: a combinação de CoQ10, PQQ e L-carnitina restaura a função mitocondrial e aumenta os níveis de energia em 83% dos casos de fadiga crônica. Mas você vai continuar dependendo de estimulantes, não é?`,
      en: `Your fatigue needs more than caffeine - it needs mitochondrial revitalization. ${personalizedStat}

Cutting-edge research reveals that adaptogens like Rhodiola rosea and Ashwagandha increase cellular ATP production by 64% and normalize cortisol levels in just 21 days. The secret of elite athletes: the combination of CoQ10, PQQ, and L-carnitine restores mitochondrial function and increases energy levels in 83% of cases of chronic fatigue. But you'll continue relying on stimulants, won't you?`
    },
    back_pain: {
      pt: `Sua coluna precisa mais que analgésicos - precisa de regeneração estrutural. ${personalizedStat}

Estudos avançados mostram que a combinação de cúrcuma de alta absorção com colágeno tipo II reduz a inflamação vertebral em 76% e estimula a regeneração da cartilagem em 21 dias. O método que fisioterapeutas não compartilham: suplementar com magnésio bisglicinato e vitamina K2 aumenta a densidade óssea vertebral em 8% em apenas 60 dias. Mas você prefere continuar com suas pomadas temporárias, certo?`,
      en: `Your spine needs more than painkillers - it needs structural regeneration. ${personalizedStat}

Advanced studies show that the combination of high-absorption turmeric with type II collagen reduces vertebral inflammation by 76% and stimulates cartilage regeneration in 21 days. The method physiotherapists don't share: supplementing with magnesium bisglycinate and vitamin K2 increases vertebral bone density by 8% in just 60 days. But you prefer to continue with your temporary ointments, right?`
    },
    unknown: {
      pt: `Seu corpo precisa mais que tratamentos genéricos - precisa de reequilíbrio sistêmico. ${personalizedStat}

Pesquisas inovadoras demonstram que a combinação de adaptógenos específicos com antioxidantes biodisponíveis reduz inflamação sistêmica em 81% e restaura a comunicação celular em apenas 28 dias. O segredo da medicina funcional: suplementar com ômega-3 de alta potência, zinco quelado e resveratrol ativa mais de 500 genes anti-inflamatórios e regenerativos simultaneamente. Mas você vai continuar com suas soluções superficiais, não é?`,
      en: `Your body needs more than generic treatments - it needs systemic rebalancing. ${personalizedStat}

Innovative research demonstrates that the combination of specific adaptogens with bioavailable antioxidants reduces systemic inflammation by 81% and restores cellular communication in just 28 days. The secret of functional medicine: supplementing with high-potency omega-3, chelated zinc, and resveratrol activates more than 500 anti-inflammatory and regenerative genes simultaneously. But you'll continue with your superficial solutions, won't you?`
    }
  };
  
  // Explicações para Fase 4 (Suplemento)
  const phase4Explanations = {
    stomach_pain: {
      pt: `Chegou a hora de resolver seu problema digestivo de uma vez por todas. ${personalizedStat}

Nosso suplemento GastroRestore combina 7 extratos botânicos clinicamente testados que eliminam inflamação gástrica, reparam a mucosa danificada e restauram o equilíbrio da microbiota em apenas 14 dias. 89% dos nossos clientes relatam alívio completo dos sintomas digestivos na primeira semana de uso. A fórmula exclusiva com gengibre concentrado, DGL, probióticos específicos e enzimas digestivas ataca a causa raiz do seu problema, não apenas os sintomas.`,
      en: `It's time to solve your digestive problem once and for all. ${personalizedStat}

Our GastroRestore supplement combines 7 clinically tested botanical extracts that eliminate gastric inflammation, repair damaged mucosa, and restore microbiota balance in just 14 days. 89% of our clients report complete relief from digestive symptoms in the first week of use. The exclusive formula with concentrated ginger, DGL, specific probiotics, and digestive enzymes attacks the root cause of your problem, not just the symptoms.`
    },
    headache: {
      pt: `Chegou a hora de eliminar suas dores de cabeça permanentemente. ${personalizedStat}

Nosso suplemento NeuroCalm combina 5 compostos neuroprotetores que reduzem inflamação cerebral, estabilizam vasos sanguíneos e otimizam a função mitocondrial em apenas 10 dias. 91% dos nossos clientes relatam redução de 80% ou mais na frequência e intensidade das dores de cabeça. A fórmula exclusiva com feverfew concentrado, magnésio treonato, riboflavina ativada, CoQ10 e PQQ ataca todos os mecanismos que causam suas dores, não apenas os sintomas.`,
      en: `It's time to eliminate your headaches permanently. ${personalizedStat}

Our NeuroCalm supplement combines 5 neuroprotective compounds that reduce brain inflammation, stabilize blood vessels, and optimize mitochondrial function in just 10 days. 91% of our clients report an 80% or greater reduction in headache frequency and intensity. The exclusive formula with concentrated feverfew, magnesium threonate, activated riboflavin, CoQ10, and PQQ attacks all the mechanisms that cause your pain, not just the symptoms.`
    },
    fatigue: {
      pt: `Chegou a hora de recuperar sua energia vital de uma vez por todas. ${personalizedStat}

Nosso suplemento VitalityBoost combina 8 adaptógenos e cofatores energéticos que restauram a função mitocondrial, equilibram hormônios do estresse e recarregam suas reservas de ATP em apenas 7 dias. 87% dos nossos clientes relatam aumento de energia de 300% ou mais na primeira semana. A fórmula exclusiva com Rhodiola concentrada, Ashwagandha KSM-66, Cordyceps, CoQ10, PQQ e L-carnitina ataca a causa raiz da sua fadiga, não apenas os sintomas.`,
      en: `It's time to recover your vital energy once and for all. ${personalizedStat}

Our VitalityBoost supplement combines 8 adaptogens and energy cofactors that restore mitochondrial function, balance stress hormones, and recharge your ATP reserves in just 7 days. 87% of our clients report a 300% or greater energy increase in the first week. The exclusive formula with concentrated Rhodiola, Ashwagandha KSM-66, Cordyceps, CoQ10, PQQ, and L-carnitine attacks the root cause of your fatigue, not just the symptoms.`
    },
    back_pain: {
      pt: `Chegou a hora de regenerar sua coluna e eliminar a dor permanentemente. ${personalizedStat}

Nosso suplemento SpineRestore combina 6 compostos regenerativos que reduzem inflamação vertebral, estimulam regeneração de cartilagem e fortalecem a estrutura óssea em apenas 21 dias. 84% dos nossos clientes relatam redução de dor de 70% ou mais nas primeiras duas semanas. A fórmula exclusiva com cúrcuma de alta absorção, colágeno tipo II não-desnaturado, MSM, glucosamina, condroitina e vitamina K2 ataca a causa estrutural da sua dor, não apenas os sintomas.`,
      en: `It's time to regenerate your spine and eliminate pain permanently. ${personalizedStat}

Our SpineRestore supplement combines 6 regenerative compounds that reduce vertebral inflammation, stimulate cartilage regeneration, and strengthen bone structure in just 21 days. 84% of our clients report a 70% or greater pain reduction in the first two weeks. The exclusive formula with high-absorption turmeric, undenatured type II collagen, MSM, glucosamine, chondroitin, and vitamin K2 attacks the structural cause of your pain, not just the symptoms.`
    },
    unknown: {
      pt: `Chegou a hora de restaurar o equilíbrio do seu corpo completamente. ${personalizedStat}

Nosso suplemento SystemicBalance combina 12 compostos bioativos que reduzem inflamação sistêmica, otimizam função celular e reequilibram todos os sistemas do corpo em apenas 30 dias. 88% dos nossos clientes relatam resolução completa de múltiplos sintomas nas primeiras três semanas. A fórmula exclusiva com adaptógenos concentrados, antioxidantes biodisponíveis, minerais quelados e vitaminas ativadas ataca as causas fundamentais dos seus sintomas, não apenas mascara o problema.`,
      en: `It's time to completely restore your body's balance. ${personalizedStat}

Our SystemicBalance supplement combines 12 bioactive compounds that reduce systemic inflammation, optimize cellular function, and rebalance all body systems in just 30 days. 88% of our clients report complete resolution of multiple symptoms in the first three weeks. The exclusive formula with concentrated adaptogens, bioavailable antioxidants, chelated minerals, and activated vitamins attacks the fundamental causes of your symptoms, not just masks the problem.`
    }
  };
  
  // Selecionar explicação com base na fase do funil
  let explanationSet;
  switch(funnelPhase) {
    case 1: explanationSet = phase1Explanations; break;
    case 2: explanationSet = phase2Explanations; break;
    case 3: explanationSet = phase3Explanations; break;
    case 4: explanationSet = phase4Explanations; break;
    default: explanationSet = phase1Explanations;
  }
  
  return explanationSet[symptom][language] || explanationSet.unknown[language];
}

// ✅ Função para obter perguntas de follow-up por fase do funil
function getFollowupQuestions(symptom, language, funnelPhase, previousQuestions = []) {
  // Fase 1: Diagnóstico provocador
  const phase1Questions = {
    stomach_pain: {
      pt: [
        "Você tem comido como se seu estômago fosse indestrutível? Vamos falar sobre seus hábitos alimentares.",
        "Quanto tempo você vai continuar ignorando que seu estômago está em guerra? Vamos avaliar a gravidade.",
        "Você já tentou alguma solução ou prefere continuar sofrendo? Conte-me suas tentativas.",
        "Seus sintomas pioram após quais alimentos específicos? Vamos identificar os gatilhos.",
        "A dor é constante ou vem em ondas? Vamos entender o padrão do seu problema."
      ],
      en: [
        "Have you been eating like your stomach is indestructible? Let's talk about your eating habits.",
        "How long will you continue ignoring that your stomach is at war? Let's assess the severity.",
        "Have you tried any solutions or do you prefer to keep suffering? Tell me about your attempts.",
        "Do your symptoms worsen after specific foods? Let's identify the triggers.",
        "Is the pain constant or does it come in waves? Let's understand your problem's pattern."
      ]
    },
    headache: {
      pt: [
        "Quanto tempo você vai fingir que essa dor de cabeça é 'normal'? Vamos avaliar a frequência e intensidade.",
        "Você já identificou os gatilhos ou prefere continuar sendo pego de surpresa? Vamos analisar padrões.",
        "Quais 'soluções milagrosas' você já tentou que obviamente não funcionaram? Conte-me suas tentativas.",
        "A dor é pulsante ou constante? Vamos entender melhor o tipo de dor que você sente.",
        "Você tem outros sintomas junto com a dor de cabeça? Vamos avaliar o quadro completo."
      ],
      en: [
        "How long will you pretend this headache is 'normal'? Let's assess frequency and intensity.",
        "Have you identified triggers or do you prefer to keep being caught by surprise? Let's analyze patterns.",
        "What 'miracle solutions' have you already tried that obviously didn't work? Tell me about your attempts.",
        "Is the pain throbbing or constant? Let's better understand the type of pain you feel.",
        "Do you have other symptoms along with the headache? Let's assess the complete picture."
      ]
    },
    fatigue: {
      pt: [
        "Quantos cafés você precisa para funcionar? Vamos falar sobre seus níveis reais de energia.",
        "Você acha normal acordar cansado depois de dormir? Vamos avaliar a qualidade do seu sono.",
        "Quanto tempo você vai ignorar que seu corpo está implorando por ajuda? Vamos analisar seus sintomas.",
        "Sua energia melhora após comer ou piora? Vamos entender seu padrão metabólico.",
        "Você tem momentos do dia em que se sente melhor? Vamos identificar seus ciclos de energia."
      ],
      en: [
        "How many coffees do you need to function? Let's talk about your real energy levels.",
        "Do you think it's normal to wake up tired after sleeping? Let's assess your sleep quality.",
        "How long will you ignore that your body is begging for help? Let's analyze your symptoms.",
        "Does your energy improve after eating or get worse? Let's understand your metabolic pattern.",
        "Are there times of day when you feel better? Let's identify your energy cycles."
      ]
    },
    back_pain: {
      pt: [
        "Quanto tempo você passa sentado destruindo sua coluna diariamente? Vamos falar sobre sua postura.",
        "Você já fez algum exercício para fortalecer o core ou prefere que sua coluna continue sofrendo? Vamos avaliar.",
        "A dor irradia para outras partes do corpo ou você só está esperando isso acontecer? Vamos analisar os sintomas.",
        "A dor piora em alguma posição específica? Vamos entender melhor o mecanismo da sua dor.",
        "Você já fez exames ou prefere adivinhar o que está acontecendo? Vamos discutir diagnósticos."
      ],
      en: [
        "How much time do you spend sitting destroying your spine daily? Let's talk about your posture.",
        "Have you done any exercises to strengthen your core or do you prefer your spine to keep suffering? Let's assess.",
        "Does the pain radiate to other parts of your body or are you just waiting for that to happen? Let's analyze the symptoms.",
        "Does the pain worsen in any specific position? Let's better understand your pain mechanism.",
        "Have you had any tests done or do you prefer to guess what's happening? Let's discuss diagnostics."
      ]
    },
    unknown: {
      pt: [
        "Você poderia descrever seus sintomas de forma mais clara ou prefere que eu adivinhe? Vamos ser específicos.",
        "Há quanto tempo você vem ignorando esses sinais do seu corpo? Vamos avaliar a duração.",
        "Você notou algum padrão ou está esperando que o problema se resolva sozinho? Vamos analisar.",
        "Seus sintomas interferem nas suas atividades diárias? Vamos avaliar o impacto real.",
        "Você já consultou algum profissional ou prefere o autodiagnóstico? Vamos discutir abordagens."
      ],
      en: [
        "Could you describe your symptoms more clearly or do you prefer I guess? Let's be specific.",
        "How long have you been ignoring these signals from your body? Let's assess the duration.",
        "Have you noticed any pattern or are you waiting for the problem to resolve itself? Let's analyze.",
        "Do your symptoms interfere with your daily activities? Let's assess the real impact.",
        "Have you consulted any professional or do you prefer self-diagnosis? Let's discuss approaches."
      ]
    }
  };
  
  // Fase 2: Agravamento (consequências de não agir)
  const phase2Questions = {
    stomach_pain: {
      pt: [
        "Você sabia que 67% dos problemas digestivos ignorados evoluem para condições crônicas? Vamos falar sobre riscos.",
        "Está ciente que problemas estomacais persistentes podem indicar úlceras ou até câncer? Vamos avaliar sua situação.",
        "Quanto tempo mais você pretende ignorar esses sintomas antes de agir? Vamos discutir consequências.",
        "Sabia que cada episódio de refluxo causa microlesões que podem se tornar permanentes? Vamos falar sobre danos cumulativos.",
        "Está ciente que 78% das pessoas com seus sintomas têm inflamação silenciosa afetando outros órgãos? Vamos avaliar o quadro completo."
      ],
      en: [
        "Did you know that 67% of ignored digestive problems evolve into chronic conditions? Let's talk about risks.",
        "Are you aware that persistent stomach problems can indicate ulcers or even cancer? Let's assess your situation.",
        "How much longer do you intend to ignore these symptoms before acting? Let's discuss consequences.",
        "Did you know that each reflux episode causes microlesions that can become permanent? Let's talk about cumulative damage.",
        "Are you aware that 78% of people with your symptoms have silent inflammation affecting other organs? Let's assess the complete picture."
      ]
    },
    headache: {
      pt: [
        "Sabia que dores de cabeça recorrentes podem ser sinais precoces de problemas neurológicos graves? Vamos avaliar riscos.",
        "Está ciente que 58% das enxaquecas não tratadas pioram com o tempo? Vamos falar sobre progressão.",
        "Quanto tempo mais você vai automedicar em vez de tratar a causa real? Vamos discutir abordagens eficazes.",
        "Você sabia que cada dor de cabeça intensa causa pequenas inflamações cerebrais que se acumulam? Vamos falar sobre danos neurológicos.",
        "Está ciente que pessoas com dores de cabeça frequentes têm 340% mais risco de declínio cognitivo precoce? Vamos avaliar sua situação."
      ],
      en: [
        "Did you know that recurrent headaches can be early signs of serious neurological problems? Let's assess risks.",
        "Are you aware that 58% of untreated migraines get worse over time? Let's talk about progression.",
        "How much longer will you self-medicate instead of treating the real cause? Let's discuss effective approaches.",
        "Did you know that each intense headache causes small brain inflammations that accumulate? Let's talk about neurological damage.",
        "Are you aware that people with frequent headaches have 340% more risk of early cognitive decline? Let's assess your situation."
      ]
    },
    fatigue: {
      pt: [
        "Você sabia que fadiga crônica não tratada está associada a um risco 70% maior de doenças cardíacas? Vamos avaliar riscos.",
        "Está ciente que seu baixo nível de energia pode ser sintoma de deficiências nutricionais graves? Vamos analisar causas.",
        "Quanto tempo mais você vai normalizar esse cansaço antes de agir? Vamos discutir consequências reais.",
        "Sabia que cada ano de fadiga não tratada envelhece seu corpo 1.8 vezes mais rápido? Vamos falar sobre envelhecimento acelerado.",
        "Está ciente que 83% das pessoas com seus sintomas têm disfunção mitocondrial afetando todos os órgãos? Vamos avaliar o impacto sistêmico."
      ],
      en: [
        "Did you know that untreated chronic fatigue is associated with a 70% higher risk of heart disease? Let's assess risks.",
        "Are you aware that your low energy level may be a symptom of serious nutritional deficiencies? Let's analyze causes.",
        "How much longer will you normalize this tiredness before acting? Let's discuss real consequences.",
        "Did you know that each year of untreated fatigue ages your body 1.8 times faster? Let's talk about accelerated aging.",
        "Are you aware that 83% of people with your symptoms have mitochondrial dysfunction affecting all organs? Let's assess the systemic impact."
      ]
    },
    back_pain: {
      pt: [
        "Sabia que 62% das dores nas costas não tratadas levam a danos permanentes na coluna? Vamos avaliar seus riscos.",
        "Está ciente que problemas na coluna podem causar disfunções em órgãos internos? Vamos analisar possíveis complicações.",
        "Quanto tempo mais você vai ignorar sua coluna antes que seja tarde demais? Vamos discutir intervenções necessárias.",
        "Você sabia que cada mês de dor lombar aumenta em 8% o risco de herniação discal? Vamos falar sobre progressão estrutural.",
        "Está ciente que 74% das pessoas com seus sintomas desenvolvem problemas neurológicos permanentes se não tratarem? Vamos avaliar riscos neurais."
      ],
      en: [
        "Did you know that 62% of untreated back pain leads to permanent spine damage? Let's assess your risks.",
        "Are you aware that spine problems can cause dysfunction in internal organs? Let's analyze possible complications.",
        "How much longer will you ignore your spine before it's too late? Let's discuss necessary interventions.",
        "Did you know that each month of lumbar pain increases by 8% the risk of disc herniation? Let's talk about structural progression.",
        "Are you aware that 74% of people with your symptoms develop permanent neurological problems if untreated? Let's assess neural risks."
      ]
    },
    unknown: {
      pt: [
        "Você sabia que sintomas persistentes ignorados são a principal causa de diagnósticos tardios? Vamos avaliar riscos.",
        "Está ciente que 73% dos problemas de saúde pioram significativamente quando ignorados? Vamos analisar sua situação.",
        "Quanto tempo mais você vai esperar antes de levar sua saúde a sério? Vamos discutir próximos passos.",
        "Sabia que sintomas vagos frequentemente indicam problemas sistêmicos afetando múltiplos órgãos? Vamos falar sobre inflamação silenciosa.",
        "Está ciente que 81% das pessoas com sintomas como os seus têm deficiências nutricionais severas não diagnosticadas? Vamos avaliar causas fundamentais."
      ],
      en: [
        "Did you know that ignored persistent symptoms are the main cause of late diagnoses? Let's assess risks.",
        "Are you aware that 73% of health problems worsen significantly when ignored? Let's analyze your situation.",
        "How much longer will you wait before taking your health seriously? Let's discuss next steps.",
        "Did you know that vague symptoms often indicate systemic problems affecting multiple organs? Let's talk about silent inflammation.",
        "Are you aware that 81% of people with symptoms like yours have severe undiagnosed nutritional deficiencies? Let's assess root causes."
      ]
    }
  };
  
  // Fase 3: Solução natural (plantas e nutrientes)
  const phase3Questions = {
    stomach_pain: {
      pt: [
        "Você sabia que certos extratos de plantas podem reduzir inflamação gástrica em até 65%? Vamos falar sobre soluções naturais.",
        "Já considerou que sua alimentação pode estar faltando nutrientes essenciais para a saúde digestiva? Vamos analisar.",
        "Gostaria de conhecer um suplemento natural que combate problemas digestivos na raiz? Vamos discutir opções.",
        "Sabia que a combinação de gengibre e probióticos específicos resolve 78% dos problemas digestivos em 14 dias? Vamos falar sobre fitoterapia avançada.",
        "Já ouviu falar que enzimas digestivas naturais podem aumentar a absorção de nutrientes em 340%? Vamos discutir suplementação estratégica."
      ],
      en: [
        "Did you know that certain plant extracts can reduce gastric inflammation by up to 65%? Let's talk about natural solutions.",
        "Have you considered that your diet may be lacking essential nutrients for digestive health? Let's analyze.",
        "Would you like to know about a natural supplement that fights digestive problems at the root? Let's discuss options.",
        "Did you know that the combination of ginger and specific probiotics resolves 78% of digestive problems in 14 days? Let's talk about advanced phytotherapy.",
        "Have you heard that natural digestive enzymes can increase nutrient absorption by 340%? Let's discuss strategic supplementation."
      ]
    },
    headache: {
      pt: [
        "Sabia que extratos específicos de plantas podem reduzir a frequência de enxaquecas em até 71%? Vamos falar sobre soluções naturais.",
        "Já considerou que deficiências de magnésio e outros minerais podem ser a causa das suas dores? Vamos analisar nutrientes.",
        "Gostaria de conhecer um suplemento que combina plantas medicinais para saúde neurológica? Vamos discutir opções.",
        "Você sabia que o extrato de feverfew combinado com magnésio biodisponível elimina enxaquecas em 83% dos casos? Vamos falar sobre neuroproteção natural.",
        "Já ouviu falar que a coenzima Q10 restaura a função mitocondrial cerebral e acaba com dores de cabeça em 71% dos casos? Vamos discutir nutrientes avançados."
      ],
      en: [
        "Did you know that specific plant extracts can reduce migraine frequency by up to 71%? Let's talk about natural solutions.",
        "Have you considered that magnesium and other mineral deficiencies may be causing your pain? Let's analyze nutrients.",
        "Would you like to know about a supplement that combines medicinal plants for neurological health? Let's discuss options.",
        "Did you know that feverfew extract combined with bioavailable magnesium eliminates migraines in 83% of cases? Let's talk about natural neuroprotection.",
        "Have you heard that coenzyme Q10 restores brain mitochondrial function and ends headaches in 71% of cases? Let's discuss advanced nutrients."
      ]
    },
    fatigue: {
      pt: [
        "Você sabia que adaptógenos naturais podem aumentar seus níveis de energia em até 80%? Vamos falar sobre plantas energéticas.",
        "Já considerou que sua fadiga pode ser resultado de deficiências nutricionais específicas? Vamos analisar sua situação.",
        "Gostaria de conhecer um suplemento que combina plantas adaptógenas para combater a fadiga? Vamos discutir opções.",
        "Sabia que Rhodiola rosea e Ashwagandha aumentam a produção de ATP celular em 64% em apenas 21 dias? Vamos falar sobre adaptógenos avançados.",
        "Já ouviu falar que a combinação de CoQ10, PQQ e L-carnitina restaura a função mitocondrial e triplica a energia em 87% dos casos? Vamos discutir bioenergética celular."
      ],
      en: [
        "Did you know that natural adaptogens can increase your energy levels by up to 80%? Let's talk about energetic plants.",
        "Have you considered that your fatigue may be the result of specific nutritional deficiencies? Let's analyze your situation.",
        "Would you like to know about a supplement that combines adaptogenic plants to combat fatigue? Let's discuss options.",
        "Did you know that Rhodiola rosea and Ashwagandha increase cellular ATP production by 64% in just 21 days? Let's talk about advanced adaptogens.",
        "Have you heard that the combination of CoQ10, PQQ, and L-carnitine restores mitochondrial function and triples energy in 87% of cases? Let's discuss cellular bioenergetics."
      ]
    },
    back_pain: {
      pt: [
        "Sabia que certos extratos naturais têm potente ação anti-inflamatória para dores musculoesqueléticas? Vamos falar sobre soluções.",
        "Já considerou que deficiências de cálcio, magnésio e vitamina D podem estar afetando sua coluna? Vamos analisar nutrientes.",
        "Gostaria de conhecer um suplemento que combina plantas medicinais para saúde musculoesquelética? Vamos discutir opções.",
        "Você sabia que a cúrcuma de alta absorção combinada com colágeno tipo II reduz inflamação vertebral em 76% em 21 dias? Vamos falar sobre regeneração natural.",
        "Já ouviu falar que suplementar com magnésio bisglicinato e vitamina K2 aumenta a densidade óssea vertebral em 8% em apenas 60 dias? Vamos discutir nutrientes estruturais."
      ],
      en: [
        "Did you know that certain natural extracts have potent anti-inflammatory action for musculoskeletal pain? Let's talk about solutions.",
        "Have you considered that calcium, magnesium, and vitamin D deficiencies may be affecting your spine? Let's analyze nutrients.",
        "Would you like to know about a supplement that combines medicinal plants for musculoskeletal health? Let's discuss options.",
        "Did you know that high-absorption turmeric combined with type II collagen reduces vertebral inflammation by 76% in 21 days? Let's talk about natural regeneration.",
        "Have you heard that supplementing with magnesium bisglycinate and vitamin K2 increases vertebral bone density by 8% in just 60 days? Let's discuss structural nutrients."
      ]
    },
    unknown: {
      pt: [
        "Você sabia que plantas medicinais específicas podem ajudar a restaurar o equilíbrio do seu corpo? Vamos falar sobre fitoterapia.",
        "Já considerou que seus sintomas podem estar relacionados a deficiências nutricionais modernas? Vamos analisar possibilidades.",
        "Gostaria de conhecer um suplemento natural que pode ajudar a resolver a causa raiz dos seus sintomas? Vamos discutir opções.",
        "Sabia que a combinação de adaptógenos específicos com antioxidantes biodisponíveis reduz inflamação sistêmica em 81% em 28 dias? Vamos falar sobre medicina funcional.",
        "Já ouviu falar que suplementar com ômega-3 de alta potência, zinco quelado e resveratrol ativa mais de 500 genes anti-inflamatórios simultaneamente? Vamos discutir nutrigenômica."
      ],
      en: [
        "Did you know that specific medicinal plants can help restore your body's balance? Let's talk about phytotherapy.",
        "Have you considered that your symptoms may be related to modern nutritional deficiencies? Let's analyze possibilities.",
        "Would you like to know about a natural supplement that can help solve the root cause of your symptoms? Let's discuss options.",
        "Did you know that the combination of specific adaptogens with bioavailable antioxidants reduces systemic inflammation by 81% in 28 days? Let's talk about functional medicine.",
        "Have you heard that supplementing with high-potency omega-3, chelated zinc, and resveratrol activates more than 500 anti-inflammatory genes simultaneously? Let's discuss nutrigenomics."
      ]
    }
  };
  
  // Fase 4: Sugestão de suplemento
  const phase4Questions = {
    stomach_pain: {
      pt: [
        "Quer conhecer o suplemento GastroRestore que 89% dos nossos clientes usam para resolver problemas digestivos em 14 dias?",
        "Pronto para experimentar a solução natural que combina 7 extratos botânicos clinicamente testados para saúde digestiva?",
        "Quer ver como nosso suplemento exclusivo pode eliminar seus problemas digestivos permanentemente?"
      ],
      en: [
        "Want to know about the GastroRestore supplement that 89% of our clients use to solve digestive problems in 14 days?",
        "Ready to try the natural solution that combines 7 clinically tested botanical extracts for digestive health?",
        "Want to see how our exclusive supplement can permanently eliminate your digestive problems?"
      ]
    },
    headache: {
      pt: [
        "Quer conhecer o suplemento NeuroCalm que ajudou 91% dos nossos clientes a reduzir dores de cabeça em 10 dias?",
        "Pronto para experimentar a solução natural que combina 5 compostos neuroprotetores para saúde cerebral?",
        "Quer ver como nosso suplemento exclusivo pode acabar com suas dores de cabeça permanentemente?"
      ],
      en: [
        "Want to know about the NeuroCalm supplement that helped 91% of our clients reduce headaches in 10 days?",
        "Ready to try the natural solution that combines 5 neuroprotective compounds for brain health?",
        "Want to see how our exclusive supplement can permanently end your headaches?"
      ]
    },
    fatigue: {
      pt: [
        "Quer conhecer o suplemento VitalityBoost que 87% dos nossos clientes usam para triplicar a energia em 7 dias?",
        "Pronto para experimentar a solução natural que combina 8 adaptógenos e cofatores energéticos para revitalização celular?",
        "Quer ver como nosso suplemento exclusivo pode restaurar sua energia vital permanentemente?"
      ],
      en: [
        "Want to know about the VitalityBoost supplement that 87% of our clients use to triple their energy in 7 days?",
        "Ready to try the natural solution that combines 8 adaptogens and energy cofactors for cellular revitalization?",
        "Want to see how our exclusive supplement can permanently restore your vital energy?"
      ]
    },
    back_pain: {
      pt: [
        "Quer conhecer o suplemento SpineRestore que 84% dos nossos clientes usam para reduzir dores nas costas em 21 dias?",
        "Pronto para experimentar a solução natural que combina 6 compostos regenerativos para saúde vertebral?",
        "Quer ver como nosso suplemento exclusivo pode regenerar sua coluna e eliminar a dor permanentemente?"
      ],
      en: [
        "Want to know about the SpineRestore supplement that 84% of our clients use to reduce back pain in 21 days?",
        "Ready to try the natural solution that combines 6 regenerative compounds for vertebral health?",
        "Want to see how our exclusive supplement can regenerate your spine and permanently eliminate pain?"
      ]
    },
    unknown: {
      pt: [
        "Quer conhecer o suplemento SystemicBalance que 88% dos nossos clientes usam para restaurar o equilíbrio geral em 30 dias?",
        "Pronto para experimentar a solução natural que combina 12 compostos bioativos para reequilíbrio sistêmico?",
        "Quer ver como nosso suplemento exclusivo pode resolver a causa raiz dos seus sintomas permanentemente?"
      ],
      en: [
        "Want to know about the SystemicBalance supplement that 88% of our clients use to restore overall balance in 30 days?",
        "Ready to try the natural solution that combines 12 bioactive compounds for systemic rebalancing?",
        "Want to see how our exclusive supplement can permanently solve the root cause of your symptoms?"
      ]
    }
  };
  
  // Escolher perguntas com base na fase do funil
  let questionsSet;
  switch(funnelPhase) {
    case 1: questionsSet = phase1Questions; break;
    case 2: questionsSet = phase2Questions; break;
    case 3: questionsSet = phase3Questions; break;
    case 4: questionsSet = phase4Questions; break;
    default: questionsSet = phase1Questions;
  }
  
  // Obter todas as perguntas disponíveis para o sintoma e idioma
  const allQuestions = questionsSet[symptom]?.[language] || questionsSet.unknown[language];
  
  // Filtrar perguntas para evitar repetições
  const filteredQuestions = allQuestions.filter(q => !previousQuestions.includes(q));
  
  // Se não houver perguntas não repetidas suficientes, avançar para a próxima fase
  if (filteredQuestions.length < 3) {
    const nextPhase = Math.min(funnelPhase + 1, 4);
    let nextQuestionsSet;
    switch(nextPhase) {
      case 2: nextQuestionsSet = phase2Questions; break;
      case 3: nextQuestionsSet = phase3Questions; break;
      case 4: nextQuestionsSet = phase4Questions; break;
      default: nextQuestionsSet = phase2Questions;
    }
    
    // Obter perguntas da próxima fase
    const nextPhaseQuestions = nextQuestionsSet[symptom]?.[language] || nextQuestionsSet.unknown[language];
    
    // Combinar perguntas filtradas com perguntas da próxima fase
    const combinedQuestions = [...filteredQuestions, ...nextPhaseQuestions.filter(q => !previousQuestions.includes(q))];
    
    // Selecionar 3 perguntas aleatórias
    return selectRandomQuestions(combinedQuestions, 3);
  }
  
  // Selecionar 3 perguntas aleatórias das filtradas
  return selectRandomQuestions(filteredQuestions, 3);
}

// Função auxiliar para selecionar perguntas aleatórias
function selectRandomQuestions(questions, count) {
  const shuffled = [...questions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// ✅ Função principal para obter contexto e resposta
export async function getSymptomContext(userMessage, userName, userAge, userWeight, funnelPhase = 1, previousSymptom = null, previousQuestions = []) {
  try {
    // Detectar idioma da mensagem
    const language = detectLanguage(userMessage);
    
    // Verificando se o formulário foi preenchido
    const hasForm = userName && userName.trim() !== ""; // Verifica se o nome foi fornecido
    
    // Identificar sintoma
    let sintomaKey = "unknown";
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes("stomach") || lowerMessage.includes("estômago") || lowerMessage.includes("estomago") || lowerMessage.includes("barriga")) {
      sintomaKey = "stomach_pain";
    } else if (lowerMessage.includes("headache") || lowerMessage.includes("dor de cabeça") || lowerMessage.includes("dores de cabeça") || lowerMessage.includes("cabeça")) {
      sintomaKey = "headache";
    } else if (lowerMessage.includes("fatigue") || lowerMessage.includes("cansaço") || lowerMessage.includes("fadiga") || lowerMessage.includes("energia")) {
      sintomaKey = "fatigue";
    } else if (lowerMessage.includes("back pain") || lowerMessage.includes("dor nas costas") || lowerMessage.includes("dores nas costas") || lowerMessage.includes("lombar")) {
      sintomaKey = "back_pain";
    }
    
    // Manter contexto do sintoma anterior se não for detectado um novo
    if (sintomaKey === "unknown" && previousSymptom) {
      sintomaKey = previousSymptom;
    }
    
    // Escolher introdução com base no preenchimento do formulário
    let intro;
    if (hasForm) {
      intro = getSarcasticIntro(sintomaKey, language, userName);
    } else {
      intro = frasesSarcasticas[language][Math.floor(Math.random() * frasesSarcasticas[language].length)];
    }

    // Obter explicação simplificada e perguntas de follow-up para a fase atual
    const explanation = getSimplifiedExplanation(sintomaKey, language, userName, userAge, userWeight, funnelPhase);
    const questions = getFollowupQuestions(sintomaKey, language, funnelPhase, previousQuestions);

    // Retornando um objeto estruturado com todas as informações necessárias
    return {
      sintoma: sintomaKey,
      intro: intro,
      scientificExplanation: explanation,
      followupQuestions: questions
    };

  } catch (error) {
    console.error("❌ Erro ao gerar contexto:", error);
    const language = detectLanguage(userMessage);
    return {
      sintoma: "unknown",
      intro: language === "pt" ? "Desculpe, tive um problema ao processar sua consulta." : "Sorry, I had an issue processing your query.",
      scientificExplanation: getSimplifiedExplanation("unknown", language, userName, userAge, userWeight, 1),
      followupQuestions: getFollowupQuestions("unknown", language, 1, [])
    };
  }
}
