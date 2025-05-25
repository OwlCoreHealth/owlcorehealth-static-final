// Convertendo para CommonJS para compatibilidade
const { Client } = require("@notionhq/client");

// ✅ Prompt Owl Savage - Personalidade e Funil (Internal reference, not sent to LLM)
const OWL_SAVAGE_PROMPT = `
Você é o Owl Savage, um assistente de saúde com personalidade forte, sarcástica e direta. Siga estas diretrizes:

1. PERSONALIDADE:
   - Use sarcasmo inteligente e humor negro em todas as respostas
   - Seja provocador mas útil, desafiando o utilizador a agir
   - Mantenha um tom de "verdade dura" que motiva através do desconforto
   - Adapte-se ao idioma do utilizador sem perder sua essência provocadora
   - Use metáforas militares ou de "treinador durão" ocasionalmente

2. ESTRUTURA DE RESPOSTA (NOVO FUNIL):
   - Fase 1: Explicação científica simples + 2-3 soluções rápidas
   - Fase 2: Consequências iniciais (alertas moderados)
   - Fase 3: Agravamento (riscos sérios, "O que você está realmente arriscando")
   - Fase 4: Nutrientes e plantas naturais (alimentos não bastam)
   - Fase 5: Suplemento como solução completa (CTA direto)
   - Fase 6 (Plano B): Reforço com nova abordagem (se não houver interesse na Fase 5)
   - Cada resposta deve incluir dados científicos reais e estatísticas impactantes (30-50% mais graves que a realidade)
   - Termine com um desafio motivacional e 3 perguntas clicáveis que conduzam ao próximo passo do funil

3. REGRAS ESPECÍFICAS:
   - Se o utilizador não preencher o formulário, use uma das frases sarcásticas aleatórias sobre "adivinhar com biscoito da sorte"
   - Se o utilizador preencher o formulário, use sempre o nome dele e mencione estatísticas relacionadas à idade/peso
   - Varie suas respostas, nunca use o mesmo texto duas vezes (introduções, explicações, perguntas)
   - As 3 perguntas finais devem sempre conduzir para o próximo passo do funil, mas parecer que dão liberdade de escolha
   - Use a informação da tabela do Notion quando relevante, mas mantenha a liberdade de improvisar respostas no estilo Owl Savage
`;

// ✅ Instanciando o cliente do Notion
const notion = new Client({
  auth: "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" // Substitua pela sua chave de autenticação
});

const databaseId = "1fda050ee113804aa5e9dd1b01e31066"; // ID do banco de dados

// 🔍 Função de extração de palavras-chave (mantida)
function extractKeywords(text) {
  const stopwords = [
    "the", "and", "for", "with", "from", "that", "this", "you", "your", "in", "to", "is", "it", "on", "a", "of", "as", "at", "by", "be", "are", "have", "was", "were", "not", "but", "or", "an", "we", "they", "he", "she", "it", "I"
  ];

  return text
    .toLowerCase() // Converte para minúsculas
    .split(/\W+/) // Divide o texto por não-palavras (como espaços, pontuação)
    .filter(word => word.length > 3 && !stopwords.includes(word) && /^[a-zA-Z]+$/.test(word)); // Filtra palavras válidas
}

// Função para detectar o idioma da mensagem (mantida)
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

// ✅ Frases sarcásticas para formulário não preenchido (mantida)
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

// ✅ Função para gerar estatísticas personalizadas (mantida)
function getPersonalizedStatistic(symptom, age, weight, language, funnelPhase) {
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
  
  // Aumentar gravidade com a fase do funil
  percentage += (funnelPhase - 1) * 5; // +0% na fase 1, +5% na fase 2, +10% na fase 3, etc.
  
  // Adicionar aleatoriedade (±5%)
  percentage += Math.floor(Math.random() * 11) - 5;
  
  // Manter entre 25-85%
  percentage = Math.min(Math.max(percentage, 25), 85);
  
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

// ✅ Introduções sarcásticas (com memória para evitar repetição)
let usedIntros = [];
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
  
  const symptomIntros = intros[symptom] || intros.unknown;
  const availableIntros = symptomIntros[language].filter(intro => !usedIntros.includes(intro));
  
  if (availableIntros.length === 0) {
    usedIntros = []; // Reset if all used
    const selectedIntro = symptomIntros[language][Math.floor(Math.random() * symptomIntros[language].length)];
    usedIntros.push(selectedIntro);
    return selectedIntro;
  }
  
  const selectedIntro = availableIntros[Math.floor(Math.random() * availableIntros.length)];
  usedIntros.push(selectedIntro);
  
  // Limit memory size
  if (usedIntros.length > 5) {
    usedIntros.shift();
  }
  
  return selectedIntro;
}

// ✅ Função para obter explicações simplificadas e com valor prático (REORGANIZADA POR FASE)
function getExplanationForPhase(symptom, language, userName, userAge, userWeight, funnelPhase) {
  // Estatística personalizada baseada nos dados do usuário e fase
  const personalizedStat = getPersonalizedStatistic(symptom, userAge, userWeight, language, funnelPhase);
  
  // Explicações para Fase 1 (Explicação científica simples + soluções rápidas)
  const phase1Explanations = {
    stomach_pain: {
      pt: `Seu estômago não está apenas 'incomodado' - ele está em guerra química. ${personalizedStat}

65% dos problemas digestivos são causados por bactérias que fermentam alimentos mal digeridos. **Dica Rápida 1:** Mastigar cada bocado 20 vezes reduz problemas digestivos em até 40%. **Dica Rápida 2:** Evite beber líquidos durante as refeições para não diluir os sucos gástricos. Mas você vai continuar comendo como se seu estômago fosse indestrutível, certo?`,
      en: `Your stomach isn't just 'bothered' - it's in chemical warfare. ${personalizedStat}

65% of digestive problems are caused by bacteria fermenting poorly digested food. **Quick Tip 1:** Chewing each bite 20 times reduces digestive issues by up to 40%. **Quick Tip 2:** Avoid drinking liquids during meals so you don't dilute gastric juices. But you'll keep eating like your stomach is indestructible, right?`
    },
    headache: {
      pt: `Sua cabeça não está apenas doendo - é um alarme de incêndio tocando a todo volume. ${personalizedStat}

78% das pessoas com dores de cabeça frequentes têm desidratação crônica sem perceber. **Dica Rápida 1:** Beber 250ml de água com uma pitada de sal pode parar uma dor de cabeça em 30 minutos. **Dica Rápida 2:** Massagear as têmporas com óleo essencial de hortelã-pimenta pode aliviar a tensão. Mas você vai continuar tomando analgésicos como se fossem balas, não é?`,
      en: `Your head isn't just hurting - it's a fire alarm blaring at full volume. ${personalizedStat}

78% of people with frequent headaches have chronic dehydration without realizing it. **Quick Tip 1:** Drinking 250ml of water with a pinch of salt can stop a headache in 30 minutes. **Quick Tip 2:** Massaging your temples with peppermint essential oil can relieve tension. But you'll keep popping painkillers like candy, won't you?`
    },
    fatigue: {
      pt: `Seu corpo não está 'cansado' - ele está em colapso energético. ${personalizedStat}

65% das pessoas com fadiga constante têm deficiência de magnésio. **Dica Rápida 1:** Comer 2 bananas e um punhado de amêndoas fornece mais energia sustentável que um energético. **Dica Rápida 2:** Expor-se à luz solar por 15 minutos pela manhã ajuda a regular seu relógio biológico e aumentar a energia. Mas você vai continuar se entupindo de cafeína e açúcar, certo?`,
      en: `Your body isn't 'tired' - it's in energy collapse. ${personalizedStat}

65% of people with constant fatigue are deficient in magnesium. **Quick Tip 1:** Eating 2 bananas and a handful of almonds provides more sustainable energy than an energy drink. **Quick Tip 2:** Getting 15 minutes of morning sunlight helps regulate your biological clock and boost energy. But you'll keep loading up on caffeine and sugar, right?`
    },
    back_pain: {
      pt: `Sua coluna não está apenas 'doendo' - ela está gritando por socorro. ${personalizedStat}

68% das pessoas com dor nas costas têm músculos abdominais fracos. **Dica Rápida 1:** Deitar no chão 10 minutos por dia com os joelhos dobrados pode aliviar a pressão nos discos. **Dica Rápida 2:** Alongar os músculos isquiotibiais (parte de trás das coxas) diariamente reduz a tensão na lombar. Mas você provavelmente vai ignorar esses conselhos e continuar sofrendo, não é?`,
      en: `Your spine isn't just 'aching' - it's screaming for help. ${personalizedStat}

68% of people with back pain have weak abdominal muscles. **Quick Tip 1:** Lying on the floor for 10 minutes a day with your knees bent can relieve pressure on the discs. **Quick Tip 2:** Stretching your hamstrings daily reduces lower back tension. But you'll probably ignore this advice and keep suffering, won't you?`
    },
    unknown: {
      pt: `Seu corpo não está 'estranho' - ele está enviando sinais de SOS que você ignora. ${personalizedStat}

73% dos sintomas vagos escondem deficiências nutricionais ou inflamação crônica. **Dica Rápida 1:** Manter um diário de sintomas por 1 semana pode revelar padrões que identificam a causa em 50% dos casos. **Dica Rápida 2:** Eliminar alimentos processados por 3 dias pode reduzir significativamente sintomas inflamatórios. Mas você prefere continuar na escuridão, certo?`,
      en: `Your body isn't 'weird' - it's sending SOS signals you ignore. ${personalizedStat}

73% of vague symptoms hide nutritional deficiencies or chronic inflammation. **Quick Tip 1:** Keeping a symptom diary for 1 week can reveal patterns that identify the cause in 50% of cases. **Quick Tip 2:** Eliminating processed foods for 3 days can significantly reduce inflammatory symptoms. But you prefer to stay in the dark, right?`
    }
  };
  
  // Explicações para Fase 2 (Consequências iniciais)
  const phase2Explanations = {
    stomach_pain: {
      pt: `Ignorar essa dor de estômago não é só desconfortável, é perigoso. ${personalizedStat}

Problemas digestivos persistentes podem levar à má absorção de nutrientes essenciais, afetando sua energia e imunidade. Além disso, 67% dos casos não tratados evoluem para condições crônicas como gastrite ou síndrome do intestino irritável. Você está realmente disposto a arriscar isso por não mudar seus hábitos?`,
      en: `Ignoring this stomach pain isn't just uncomfortable, it's dangerous. ${personalizedStat}

Persistent digestive problems can lead to poor absorption of essential nutrients, affecting your energy and immunity. Furthermore, 67% of untreated cases evolve into chronic conditions like gastritis or irritable bowel syndrome. Are you really willing to risk that by not changing your habits?`
    },
    headache: {
      pt: `Achar que essa dor de cabeça vai passar sozinha é uma aposta arriscada. ${personalizedStat}

Dores de cabeça frequentes podem ser um sinal de alerta para problemas mais sérios como pressão alta ou até problemas neurológicos. Ignorá-las aumenta em 58% a chance de a condição piorar e se tornar crônica. Você vai esperar até que seja tarde demais para investigar a causa?`,
      en: `Thinking this headache will just go away on its own is a risky bet. ${personalizedStat}

Frequent headaches can be a warning sign for more serious problems like high blood pressure or even neurological issues. Ignoring them increases by 58% the chance of the condition worsening and becoming chronic. Are you going to wait until it's too late to investigate the cause?`
    },
    fatigue: {
      pt: `Normalizar esse cansaço é o caminho mais rápido para problemas maiores. ${personalizedStat}

A fadiga constante pode indicar desequilíbrios hormonais ou deficiências que, se não corrigidas, aumentam em 70% o risco de doenças cardíacas e diabetes. Seu corpo está pedindo ajuda, não mais cafeína. Você vai continuar ignorando os sinais até seu sistema entrar em colapso?`,
      en: `Normalizing this fatigue is the fastest way to bigger problems. ${personalizedStat}

Constant fatigue can indicate hormonal imbalances or deficiencies that, if uncorrected, increase by 70% the risk of heart disease and diabetes. Your body is asking for help, not more caffeine. Are you going to keep ignoring the signs until your system collapses?`
    },
    back_pain: {
      pt: `Essa dor nas costas não é só um incômodo, é um aviso estrutural. ${personalizedStat}

Ignorar a dor lombar aumenta em 62% o risco de desenvolver danos permanentes nos discos ou nervos da coluna. Problemas na coluna podem afetar a mobilidade e até a função de órgãos internos. Você vai esperar até não conseguir mais se levantar da cadeira para levar isso a sério?`,
      en: `This back pain isn't just an annoyance, it's a structural warning. ${personalizedStat}

Ignoring lower back pain increases by 62% the risk of developing permanent damage to the discs or nerves of the spine. Spine problems can affect mobility and even the function of internal organs. Are you going to wait until you can no longer get out of your chair to take this seriously?`
    },
    unknown: {
      pt: `Esses sintomas vagos não são 'normais', são sinais de alerta do seu corpo. ${personalizedStat}

Ignorar sintomas persistentes é a principal causa de diagnósticos tardios de condições sérias. 73% dos problemas de saúde pioram significativamente quando não são investigados a tempo. Você vai continuar esperando que isso 'passe sozinho' enquanto algo mais grave pode estar se desenvolvendo?`,
      en: `These vague symptoms aren't 'normal', they're warning signs from your body. ${personalizedStat}

Ignoring persistent symptoms is the main cause of late diagnoses of serious conditions. 73% of health problems worsen significantly when not investigated in time. Are you going to keep waiting for this to 'pass on its own' while something more serious might be developing?`
    }
  };
  
  // Explicações para Fase 3 (Agravamento - Riscos Sérios)
  const phase3Explanations = {
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

79% das pessoas com dor lombar crônica desenvolvem danos irreversíveis nos discos intervertebrais em menos de 5 anos. O fato assustador: cada mês de dor nas costas não tratada aumenta em 8% o risco de compressão nervosa permanente. Sua coluna está literalmente se desintegrando enquanto você espera que a dor 'passe sozinha'.`,
      en: `Your back pain isn't just 'muscle tension' - it's accelerated structural degeneration. ${personalizedStat}

79% of people with chronic lumbar pain develop irreversible damage to intervertebral discs in less than 5 years. The scary fact: each month of untreated back pain increases by 8% the risk of permanent nerve compression. Your spine is literally disintegrating while you wait for the pain to 'go away on its own'.`
    },
    unknown: {
      pt: `Seus sintomas não são apenas 'mal-estar passageiro' - são indicadores de colapso sistêmico. ${personalizedStat}

84% dos sintomas persistentes ignorados por mais de 6 meses evoluem para condições crônicas de difícil tratamento. A estatística que ninguém menciona: cada sintoma vago tem 72% de chance de estar ligado a uma deficiência nutricional severa ou inflamação silenciosa que está danificando múltiplos órgãos simultaneamente. Seu corpo está em modo de autodestruição enquanto você espera melhorar 'naturalmente'.`,
      en: `Your symptoms aren't just 'temporary discomfort' - they're indicators of systemic collapse. ${personalizedStat}

84% of persistent symptoms ignored for more than 6 months evolve into chronic conditions difficult to treat. The statistic nobody mentions: each vague symptom has a 72% chance of being linked to severe nutritional deficiency or silent inflammation that is damaging multiple organs simultaneously. Your body is in self-destruction mode while you wait to improve 'naturally'.`
    }
  };
  
  // Explicações para Fase 4 (Nutrientes e Plantas Naturais)
  const phase4Explanations = {
    stomach_pain: {
      pt: `Seu sistema digestivo precisa mais que antiácidos - precisa de reparação celular profunda. ${personalizedStat}

Embora alimentos como gengibre e abacaxi ajudem, a concentração necessária para reparar danos sérios é difícil de obter só com a dieta. Pesquisas recentes mostram que o extrato de gengibre combinado com probióticos específicos reduz inflamação gástrica em 78% dos casos em apenas 14 dias. A enzima bromelina do abacaxi, em forma concentrada, tem efeito anti-inflamatório 4x mais potente que muitos medicamentos. Mas você provavelmente prefere continuar com suas pílulas, não é?`,
      en: `Your digestive system needs more than antacids - it needs deep cellular repair. ${personalizedStat}

While foods like ginger and pineapple help, the concentration needed to repair serious damage is hard to get from diet alone. Recent research shows that ginger extract combined with specific probiotics reduces gastric inflammation in 78% of cases in just 14 days. Concentrated bromelain enzyme from pineapple has an anti-inflammatory effect 4x more potent than many medications. But you probably prefer to continue with your pills, don't you?`
    },
    headache: {
      pt: `Sua dor de cabeça precisa mais que analgésicos - precisa de nutrientes neuroregeneradores. ${personalizedStat}

Alimentos ricos em magnésio ajudam, mas para reverter deficiências crônicas, a suplementação é chave. Estudos clínicos provam que o extrato de feverfew combinado com magnésio biodisponível reduz a frequência de enxaquecas em 83% dos pacientes em 30 dias. A coenzima Q10 em doses terapêuticas restaura a função mitocondrial cerebral e elimina dores de cabeça crônicas em 71% dos casos. Mas você vai continuar mascarando o problema com remédios, certo?`,
      en: `Your headache needs more than painkillers - it needs neuroregenerative nutrients. ${personalizedStat}

Magnesium-rich foods help, but to reverse chronic deficiencies, supplementation is key. Clinical studies prove that feverfew extract combined with bioavailable magnesium reduces migraine frequency in 83% of patients in 30 days. Coenzyme Q10 in therapeutic doses restores brain mitochondrial function and eliminates chronic headaches in 71% of cases. But you'll continue masking the problem with medication, right?`
    },
    fatigue: {
      pt: `Seu cansaço precisa mais que cafeína - precisa de revitalização mitocondrial. ${personalizedStat}

Comer bem é essencial, mas para recarregar mitocôndrias esgotadas, nutrientes específicos são necessários. Pesquisas de ponta revelam que adaptógenos como Rhodiola rosea e Ashwagandha aumentam a produção de ATP celular em 64% e normalizam os níveis de cortisol em apenas 21 dias. A combinação de CoQ10, PQQ e L-carnitina restaura a função mitocondrial e aumenta os níveis de energia em 83% dos casos de fadiga crônica. Mas você vai continuar dependendo de estimulantes, não é?`,
      en: `Your fatigue needs more than caffeine - it needs mitochondrial revitalization. ${personalizedStat}

Eating well is essential, but to recharge depleted mitochondria, specific nutrients are needed. Cutting-edge research reveals that adaptogens like Rhodiola rosea and Ashwagandha increase cellular ATP production by 64% and normalize cortisol levels in just 21 days. The combination of CoQ10, PQQ, and L-carnitine restores mitochondrial function and increases energy levels in 83% of chronic fatigue cases. But you'll continue relying on stimulants, won't you?`
    },
    back_pain: {
      pt: `Sua coluna precisa mais que analgésicos - precisa de regeneração estrutural. ${personalizedStat}

Exercícios ajudam, mas para reconstruir cartilagem e fortalecer ossos, nutrientes específicos são cruciais. Estudos avançados mostram que a combinação de cúrcuma de alta absorção com colágeno tipo II reduz a inflamação vertebral em 76% e estimula a regeneração da cartilagem em 21 dias. Suplementar com magnésio bisglicinato e vitamina K2 aumenta a densidade óssea vertebral em 8% em apenas 60 dias. Mas você prefere continuar com suas pomadas temporárias, certo?`,
      en: `Your spine needs more than painkillers - it needs structural regeneration. ${personalizedStat}

Exercises help, but to rebuild cartilage and strengthen bones, specific nutrients are crucial. Advanced studies show that the combination of high-absorption turmeric with type II collagen reduces vertebral inflammation by 76% and stimulates cartilage regeneration in 21 days. Supplementing with magnesium bisglycinate and vitamin K2 increases vertebral bone density by 8% in just 60 days. But you prefer to continue with your temporary ointments, right?`
    },
    unknown: {
      pt: `Seu corpo precisa mais que tratamentos genéricos - precisa de reequilíbrio sistêmico. ${personalizedStat}

Uma dieta saudável é a base, mas para corrigir desequilíbrios profundos, compostos bioativos são necessários. Pesquisas inovadoras demonstram que a combinação de adaptógenos específicos com antioxidantes biodisponíveis reduz inflamação sistêmica em 81% e restaura a comunicação celular em apenas 28 dias. Suplementar com ômega-3 de alta potência, zinco quelado e resveratrol ativa mais de 500 genes anti-inflamatórios e regenerativos simultaneamente. Mas você vai continuar com suas soluções superficiais, não é?`,
      en: `Your body needs more than generic treatments - it needs systemic rebalancing. ${personalizedStat}

A healthy diet is the foundation, but to correct deep imbalances, bioactive compounds are needed. Innovative research demonstrates that the combination of specific adaptogens with bioavailable antioxidants reduces systemic inflammation by 81% and restores cellular communication in just 28 days. Supplementing with high-potency omega-3, chelated zinc, and resveratrol activates more than 500 anti-inflammatory and regenerative genes simultaneously. But you'll continue with your superficial solutions, won't you?`
    }
  };
  
  // Explicações para Fase 5 (Suplemento)
  const phase5Explanations = {
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
  
  // Explicações para Fase 6 (Plano B - Reforço)
  const phase6Explanations = {
    stomach_pain: {
      pt: `Entendo que ainda não esteja convencido. Mas pense: quanto vale sua qualidade de vida? ${personalizedStat}

Continuar com soluções paliativas significa aceitar dor, inchaço e limitações para sempre. Nosso suplemento GastroRestore não é uma cura milagrosa, é ciência aplicada. A combinação sinérgica dos 7 extratos botânicos foi desenhada para quebrar o ciclo vicioso da inflamação digestiva que nem dietas rigorosas conseguem resolver sozinhas. É a diferença entre gerenciar o problema e resolvê-lo.`,
      en: `I understand you're still not convinced. But think: how much is your quality of life worth? ${personalizedStat}

Palliative solutions mean accepting pain, bloating, and limitations forever. Our GastroRestore supplement isn't a miracle cure, it's applied science. The synergistic combination of the 7 botanical extracts was designed to break the vicious cycle of digestive inflammation that even strict diets can't solve alone. It's the difference between managing the problem and solving it.`
    },
    headache: {
      pt: `Percebo sua hesitação. Mas considere o custo de viver com dores de cabeça constantes. ${personalizedStat}

Analgésicos apenas silenciam o alarme, não apagam o incêndio no seu cérebro. Nosso suplemento NeuroCalm atua na causa: inflamação, instabilidade vascular e disfunção mitocondrial. Os 5 compostos neuroprotetores trabalham juntos para restaurar o equilíbrio neurológico que medicamentos convencionais não conseguem alcançar. É investir na sua saúde cerebral a longo prazo.`,
      en: `I understand your hesitation. But consider the cost of living with constant headaches. ${personalizedStat}

Painkillers just silence the alarm, they don't put out the fire in your brain. Our NeuroCalm supplement acts on the cause: inflammation, vascular instability, and mitochondrial dysfunction. The 5 neuroprotective compounds work together to restore the neurological balance that conventional medications cannot achieve. It's investing in your long-term brain health.`
    },
    fatigue: {
      pt: `Compreendo que pareça bom demais para ser verdade. Mas reflita sobre o impacto da fadiga na sua vida. ${personalizedStat}

Estimulantes são como usar o cartão de crédito da sua energia futura - a conta sempre chega. Nosso suplemento VitalityBoost recarrega suas 'baterias' celulares (mitocôndrias) com 8 adaptógenos e cofatores energéticos. Não é um impulso artificial, é a restauração da sua capacidade natural de produzir energia. É a diferença entre sobreviver e prosperar.`,
      en: `I understand it sounds too good to be true. But reflect on the impact of fatigue on your life. ${personalizedStat}

Stimulants are like using your future energy's credit card - the bill always comes due. Our VitalityBoost supplement recharges your cellular 'batteries' (mitochondria) with 8 adaptogens and energy cofactors. It's not an artificial boost, it's the restoration of your natural ability to produce energy. It's the difference between surviving and thriving.`
    },
    back_pain: {
      pt: `Entendo sua cautela. Mas pense no futuro da sua coluna se nada mudar. ${personalizedStat}

Analgésicos e fisioterapia ajudam, mas não regeneram o tecido danificado. Nosso suplemento SpineRestore fornece os blocos de construção (colágeno, MSM, etc.) e os sinalizadores anti-inflamatórios (cúrcuma) que seu corpo precisa para reparar a estrutura vertebral. É a abordagem mais completa para quebrar o ciclo de dor e degeneração.`,
      en: `I understand your caution. But think about the future of your spine if nothing changes. ${personalizedStat}

Painkillers and physiotherapy help, but they don't regenerate damaged tissue. Our SpineRestore supplement provides the building blocks (collagen, MSM, etc.) and anti-inflammatory signals (turmeric) your body needs to repair the vertebral structure. It's the most complete approach to break the cycle of pain and degeneration.`
    },
    unknown: {
      pt: `Percebo que ainda tem dúvidas. Mas considere o risco de continuar tratando apenas sintomas isolados. ${personalizedStat}

Seu corpo funciona como um sistema interconectado. Nosso suplemento SystemicBalance foi formulado com 12 compostos bioativos para restaurar o equilíbrio geral, combatendo inflamação silenciosa e deficiências nutricionais que são a causa raiz de múltiplos sintomas. É a abordagem holística que a medicina convencional muitas vezes ignora.`,
      en: `I understand you still have doubts. But consider the risk of continuing to treat only isolated symptoms. ${personalizedStat}

Your body works as an interconnected system. Our SystemicBalance supplement was formulated with 12 bioactive compounds to restore overall balance, fighting silent inflammation and nutritional deficiencies that are the root cause of multiple symptoms. It's the holistic approach that conventional medicine often ignores.`
    }
  };
  
  // Selecionar explicação com base na fase do funil
  let explanationSet;
  switch(funnelPhase) {
    case 1: explanationSet = phase1Explanations; break;
    case 2: explanationSet = phase2Explanations; break;
    case 3: explanationSet = phase3Explanations; break;
    case 4: explanationSet = phase4Explanations; break;
    case 5: explanationSet = phase5Explanations; break;
    case 6: explanationSet = phase6Explanations; break; // Plano B
    default: explanationSet = phase1Explanations;
  }
  
  return explanationSet[symptom]?.[language] || explanationSet.unknown[language];
}

// ✅ Função para obter perguntas de follow-up (REORGANIZADA POR FASE)
function getFollowupQuestions(symptom, language, funnelPhase, previousQuestions = []) {
  // Fase 1: Diagnóstico + Soluções Rápidas
  const phase1Questions = {
    stomach_pain: {
      pt: [
        "Você já tentou a dica de mastigar 20x ou evitar líquidos nas refeições?",
        "Quais alimentos específicos parecem piorar sua digestão?",
        "A dor é mais forte após comer ou quando está de estômago vazio?",
        "Você costuma sentir inchaço ou gases junto com a dor?",
        "Como está seu nível de estresse ultimamente?"
      ],
      en: [
        "Have you tried the tip of chewing 20x or avoiding liquids during meals?",
        "Which specific foods seem to worsen your digestion?",
        "Is the pain stronger after eating or on an empty stomach?",
        "Do you usually feel bloated or gassy along with the pain?",
        "How has your stress level been lately?"
      ]
    },
    headache: {
      pt: [
        "Você já experimentou a dica da água com sal ou massagem com hortelã?",
        "Sua dor de cabeça piora com luz, som ou cheiros?",
        "Você dorme bem ou acorda com dor de cabeça?",
        "A dor é localizada (têmporas, nuca) ou geral?",
        "Você consome muita cafeína ou álcool?"
      ],
      en: [
        "Have you tried the water with salt or peppermint massage tip?",
        "Does your headache worsen with light, sound, or smells?",
        "Do you sleep well or wake up with a headache?",
        "Is the pain localized (temples, neck) or general?",
        "Do you consume a lot of caffeine or alcohol?"
      ]
    },
    fatigue: {
      pt: [
        "Você já tentou a dica das bananas/amêndoas ou da luz solar matinal?",
        "Seu cansaço é mais físico ou mental?",
        "Você se sente revigorado após dormir ou continua cansado?",
        "Sua dieta é rica em alimentos processados ou naturais?",
        "Você pratica alguma atividade física regularmente?"
      ],
      en: [
        "Have you tried the banana/almonds or morning sunlight tip?",
        "Is your fatigue more physical or mental?",
        "Do you feel refreshed after sleeping or still tired?",
        "Is your diet rich in processed or natural foods?",
        "Do you practice any physical activity regularly?"
      ]
    },
    back_pain: {
      pt: [
        "Você já experimentou a dica de deitar com joelhos dobrados ou alongar isquiotibiais?",
        "Sua dor piora ao ficar muito tempo sentado ou em pé?",
        "Você carrega peso de forma inadequada no dia a dia?",
        "A dor é aguda (pontada) ou crônica (constante)?",
        "Você já fez fisioterapia ou quiropraxia antes?"
      ],
      en: [
        "Have you tried the tip of lying with bent knees or stretching hamstrings?",
        "Does your pain worsen when sitting or standing for long periods?",
        "Do you carry weight improperly in your daily life?",
        "Is the pain sharp (stabbing) or chronic (constant)?",
        "Have you done physical therapy or chiropractic before?"
      ]
    },
    unknown: {
      pt: [
        "Você já tentou a dica do diário de sintomas ou eliminar processados?",
        "Pode descrever melhor o que sente? Onde? Quando?",
        "Há quanto tempo exatamente esses sintomas começaram?",
        "Alguma coisa parece melhorar ou piorar os sintomas?",
        "Você tem outros problemas de saúde diagnosticados?"
      ],
      en: [
        "Have you tried the symptom diary or eliminating processed foods tip?",
        "Can you better describe what you feel? Where? When?",
        "Exactly how long ago did these symptoms start?",
        "Does anything seem to improve or worsen the symptoms?",
        "Do you have other diagnosed health problems?"
      ]
    }
  };
  
  // Fase 2: Consequências Iniciais
  const phase2Questions = {
    stomach_pain: {
      pt: [
        "Você está ciente que ignorar isso pode levar a problemas de absorção de nutrientes?",
        "Já pensou que essa dor pode evoluir para gastrite crônica?",
        "Quanto tempo mais você vai esperar antes de investigar a causa dessa dor?",
        "Você sabia que o estresse piora significativamente problemas digestivos?",
        "Está ciente que certos medicamentos podem estar agravando seu problema?"
      ],
      en: [
        "Are you aware that ignoring this can lead to nutrient absorption problems?",
        "Have you considered that this pain could evolve into chronic gastritis?",
        "How much longer will you wait before investigating the cause of this pain?",
        "Did you know that stress significantly worsens digestive problems?",
        "Are you aware that certain medications might be aggravating your problem?"
      ]
    },
    headache: {
      pt: [
        "Você sabia que dores de cabeça frequentes podem indicar pressão alta?",
        "Está ciente que enxaquecas não tratadas tendem a piorar com o tempo?",
        "Quanto tempo mais você vai mascarar a dor em vez de tratar a causa?",
        "Você já considerou que sua postura ou problemas de visão podem estar contribuindo?",
        "Está ciente dos riscos de abuso de analgésicos para o fígado e rins?"
      ],
      en: [
        "Did you know that frequent headaches can indicate high blood pressure?",
        "Are you aware that untreated migraines tend to worsen over time?",
        "How much longer will you mask the pain instead of treating the cause?",
        "Have you considered that your posture or vision problems might be contributing?",
        "Are you aware of the risks of painkiller abuse for the liver and kidneys?"
      ]
    },
    fatigue: {
      pt: [
        "Você sabia que fadiga crônica aumenta o risco de doenças cardíacas?",
        "Está ciente que seu cansaço pode ser sinal de problemas na tireoide ou anemia?",
        "Quanto tempo mais você vai viver com 'meia energia' antes de buscar uma solução?",
        "Você já pensou que a qualidade do seu sono pode ser a causa raiz?",
        "Está ciente que a fadiga constante afeta sua concentração e produtividade?"
      ],
      en: [
        "Did you know that chronic fatigue increases the risk of heart disease?",
        "Are you aware that your tiredness could be a sign of thyroid problems or anemia?",
        "How much longer will you live with 'half energy' before seeking a solution?",
        "Have you considered that the quality of your sleep might be the root cause?",
        "Are you aware that constant fatigue affects your concentration and productivity?"
      ]
    },
    back_pain: {
      pt: [
        "Você sabia que ignorar dor nas costas pode levar a danos permanentes nos nervos?",
        "Está ciente que problemas na coluna podem afetar sua mobilidade a longo prazo?",
        "Quanto tempo mais você vai limitar suas atividades por causa da dor?",
        "Você já considerou que seu colchão ou cadeira podem estar piorando o problema?",
        "Está ciente que o excesso de peso sobrecarrega significativamente a coluna?"
      ],
      en: [
        "Did you know that ignoring back pain can lead to permanent nerve damage?",
        "Are you aware that spine problems can affect your long-term mobility?",
        "How much longer will you limit your activities because of the pain?",
        "Have you considered that your mattress or chair might be worsening the problem?",
        "Are you aware that excess weight significantly overloads the spine?"
      ]
    },
    unknown: {
      pt: [
        "Você sabia que sintomas vagos podem ser os primeiros sinais de condições autoimunes?",
        "Está ciente que ignorar esses sinais pode levar a diagnósticos tardios?",
        "Quanto tempo mais você vai viver com esse 'mal-estar' sem investigar?",
        "Você já pensou que pode ser uma reação a algo no seu ambiente (alergia, toxina)?",
        "Está ciente que a saúde intestinal está ligada a múltiplos sintomas no corpo?"
      ],
      en: [
        "Did you know that vague symptoms can be the first signs of autoimmune conditions?",
        "Are you aware that ignoring these signs can lead to late diagnoses?",
        "How much longer will you live with this 'discomfort' without investigating?",
        "Have you considered it might be a reaction to something in your environment (allergy, toxin)?",
        "Are you aware that gut health is linked to multiple symptoms in the body?"
      ]
    }
  };
  
  // Fase 3: Agravamento (Riscos Sérios)
  const phase3Questions = {
    stomach_pain: {
      pt: [
        "Você sabia que 82% dos problemas digestivos ignorados causam danos permanentes?",
        "Está ciente do risco aumentado de condições pré-cancerosas com refluxo crônico?",
        "Quanto tempo mais você vai arriscar sua saúde digestiva futura?",
        "Já pensou que a inflamação no estômago pode afetar outros órgãos?",
        "Está ciente que a má absorção crônica pode levar a osteoporose e anemia severa?"
      ],
      en: [
        "Did you know that 82% of ignored digestive problems cause permanent damage?",
        "Are you aware of the increased risk of pre-cancerous conditions with chronic reflux?",
        "How much longer will you risk your future digestive health?",
        "Have you considered that stomach inflammation can affect other organs?",
        "Are you aware that chronic malabsorption can lead to osteoporosis and severe anemia?"
      ]
    },
    headache: {
      pt: [
        "Você sabia que 91% das enxaquecas crônicas pioram a cada ano sem tratamento?",
        "Está ciente do risco 340% maior de problemas cognitivos precoces?",
        "Quanto tempo mais você vai viver com medo da próxima crise de dor?",
        "Já pensou no impacto que isso tem na sua vida profissional e pessoal?",
        "Está ciente que dores de cabeça podem ser sintoma de aneurisma ou tumor cerebral (raro, mas possível)?"
      ],
      en: [
        "Did you know that 91% of untreated chronic migraines worsen each year?",
        "Are you aware of the 340% higher risk of early cognitive problems?",
        "How much longer will you live in fear of the next pain crisis?",
        "Have you considered the impact this has on your professional and personal life?",
        "Are you aware that headaches can be a symptom of an aneurysm or brain tumor (rare, but possible)?"
      ]
    },
    fatigue: {
      pt: [
        "Você sabia que 87% das pessoas com fadiga crônica têm disfunção mitocondrial?",
        "Está ciente que cada ano de exaustão envelhece seu corpo 1.8x mais rápido?",
        "Quanto tempo mais você vai aceitar viver com energia limitada?",
        "Já pensou que essa fadiga pode ser o primeiro sinal de uma doença autoimune?",
        "Está ciente do risco 63% maior de desenvolver doenças autoimunes?"
      ],
      en: [
        "Did you know that 87% of people with chronic fatigue have mitochondrial dysfunction?",
        "Are you aware that each year of exhaustion ages your body 1.8x faster?",
        "How much longer will you accept living with limited energy?",
        "Have you considered that this fatigue could be the first sign of an autoimmune disease?",
        "Are you aware of the 63% higher risk of developing autoimmune diseases?"
      ]
    },
    back_pain: {
      pt: [
        "Você sabia que 79% das pessoas com dor crônica desenvolvem danos irreversíveis nos discos?",
        "Está ciente do risco de 8% de compressão nervosa permanente a cada mês sem tratamento?",
        "Quanto tempo mais você vai arriscar sua mobilidade futura?",
        "Já pensou que essa dor pode levar à necessidade de cirurgia invasiva?",
        "Está ciente que problemas na coluna podem causar incontinência ou disfunção sexual?"
      ],
      en: [
        "Did you know that 79% of people with chronic pain develop irreversible disc damage?",
        "Are you aware of the 8% risk of permanent nerve compression each month without treatment?",
        "How much longer will you risk your future mobility?",
        "Have you considered that this pain could lead to the need for invasive surgery?",
        "Are you aware that spine problems can cause incontinence or sexual dysfunction?"
      ]
    },
    unknown: {
      pt: [
        "Você sabia que 84% dos sintomas ignorados evoluem para condições crônicas?",
        "Está ciente da chance de 72% de ligação com deficiência nutricional severa ou inflamação silenciosa?",
        "Quanto tempo mais você vai brincar de roleta russa com sua saúde?",
        "Já pensou que esses sintomas podem ser a ponta do iceberg de um problema maior?",
        "Está ciente que inflamação crônica silenciosa é a causa raiz da maioria das doenças modernas?"
      ],
      en: [
        "Did you know that 84% of ignored symptoms evolve into chronic conditions?",
        "Are you aware of the 72% chance of linkage to severe nutritional deficiency or silent inflammation?",
        "How much longer will you play Russian roulette with your health?",
        "Have you considered that these symptoms might be the tip of the iceberg of a larger problem?",
        "Are you aware that chronic silent inflammation is the root cause of most modern diseases?"
      ]
    }
  };
  
  // Fase 4: Nutrientes e Plantas Naturais
  const phase4Questions = {
    stomach_pain: {
      pt: [
        "Gostaria de saber como extratos concentrados de plantas podem ser mais eficazes que alimentos?",
        "Quer entender por que a suplementação com probióticos específicos é crucial para a saúde digestiva?",
        "Interessado em aprender como a bromelina concentrada combate a inflamação digestiva?"
      ],
      en: [
        "Would you like to know how concentrated plant extracts can be more effective than food?",
        "Want to understand why supplementation with specific probiotics is crucial for digestive health?",
        "Interested in learning how concentrated bromelain fights digestive inflammation?"
      ]
    },
    headache: {
      pt: [
        "Gostaria de saber como o feverfew e o magnésio biodisponível atuam juntos contra enxaquecas?",
        "Quer entender por que a Coenzima Q10 é essencial para a energia cerebral e alívio da dor?",
        "Interessado em aprender sobre nutrientes específicos que protegem seus neurônios?"
      ],
      en: [
        "Would you like to know how feverfew and bioavailable magnesium work together against migraines?",
        "Want to understand why Coenzyme Q10 is essential for brain energy and pain relief?",
        "Interested in learning about specific nutrients that protect your neurons?"
      ]
    },
    fatigue: {
      pt: [
        "Gostaria de saber como adaptógenos como Rhodiola e Ashwagandha recarregam suas 'baterias' celulares?",
        "Quer entender o papel da CoQ10, PQQ e L-carnitina na produção de energia mitocondrial?",
        "Interessado em aprender como equilibrar seus hormônios do estresse naturalmente?"
      ],
      en: [
        "Would you like to know how adaptogens like Rhodiola and Ashwagandha recharge your cellular 'batteries'?",
        "Want to understand the role of CoQ10, PQQ, and L-carnitine in mitochondrial energy production?",
        "Interested in learning how to balance your stress hormones naturally?"
      ]
    },
    back_pain: {
      pt: [
        "Gostaria de saber como a cúrcuma de alta absorção e o colágeno tipo II regeneram a cartilagem?",
        "Quer entender por que o magnésio bisglicinato e a vitamina K2 são cruciais para a saúde óssea?",
        "Interessado em aprender sobre nutrientes que combatem a inflamação vertebral na raiz?"
      ],
      en: [
        "Would you like to know how high-absorption turmeric and type II collagen regenerate cartilage?",
        "Want to understand why magnesium bisglycinate and vitamin K2 are crucial for bone health?",
        "Interested in learning about nutrients that fight vertebral inflammation at the root?"
      ]
    },
    unknown: {
      pt: [
        "Gostaria de saber como adaptógenos e antioxidantes específicos combatem a inflamação sistêmica?",
        "Quer entender o papel do ômega-3, zinco e resveratrol na ativação de genes anti-inflamatórios?",
        "Interessado em aprender como a medicina funcional aborda a causa raiz de múltiplos sintomas?"
      ],
      en: [
        "Would you like to know how specific adaptogens and antioxidants fight systemic inflammation?",
        "Want to understand the role of omega-3, zinc, and resveratrol in activating anti-inflammatory genes?",
        "Interested in learning how functional medicine addresses the root cause of multiple symptoms?"
      ]
    }
  };
  
  // Fase 5: Suplemento
  const phase5Questions = {
    stomach_pain: {
      pt: [
        "Quer conhecer em detalhes o suplemento GastroRestore e seus 7 extratos botânicos?",
        "Pronto para ver como o GastroRestore pode resolver seu problema digestivo em 14 dias?",
        "Gostaria de entender a ciência por trás da fórmula exclusiva do GastroRestore?"
      ],
      en: [
        "Want to know the details about the GastroRestore supplement and its 7 botanical extracts?",
        "Ready to see how GastroRestore can solve your digestive problem in 14 days?",
        "Would you like to understand the science behind GastroRestore's exclusive formula?"
      ]
    },
    headache: {
      pt: [
        "Quer conhecer em detalhes o suplemento NeuroCalm e seus 5 compostos neuroprotetores?",
        "Pronto para ver como o NeuroCalm pode reduzir suas dores de cabeça em 10 dias?",
        "Gostaria de entender a ciência por trás da fórmula exclusiva do NeuroCalm?"
      ],
      en: [
        "Want to know the details about the NeuroCalm supplement and its 5 neuroprotective compounds?",
        "Ready to see how NeuroCalm can reduce your headaches in 10 days?",
        "Would you like to understand the science behind NeuroCalm's exclusive formula?"
      ]
    },
    fatigue: {
      pt: [
        "Quer conhecer em detalhes o suplemento VitalityBoost e seus 8 adaptógenos e cofatores?",
        "Pronto para ver como o VitalityBoost pode triplicar sua energia em 7 dias?",
        "Gostaria de entender a ciência por trás da fórmula exclusiva do VitalityBoost?"
      ],
      en: [
        "Want to know the details about the VitalityBoost supplement and its 8 adaptogens and cofactors?",
        "Ready to see how VitalityBoost can triple your energy in 7 days?",
        "Would you like to understand the science behind VitalityBoost's exclusive formula?"
      ]
    },
    back_pain: {
      pt: [
        "Quer conhecer em detalhes o suplemento SpineRestore e seus 6 compostos regenerativos?",
        "Pronto para ver como o SpineRestore pode reduzir sua dor nas costas em 21 dias?",
        "Gostaria de entender a ciência por trás da fórmula exclusiva do SpineRestore?"
      ],
      en: [
        "Want to know the details about the SpineRestore supplement and its 6 regenerative compounds?",
        "Ready to see how SpineRestore can reduce your back pain in 21 days?",
        "Would you like to understand the science behind SpineRestore's exclusive formula?"
      ]
    },
    unknown: {
      pt: [
        "Quer conhecer em detalhes o suplemento SystemicBalance e seus 12 compostos bioativos?",
        "Pronto para ver como o SystemicBalance pode restaurar seu equilíbrio geral em 30 dias?",
        "Gostaria de entender a ciência por trás da fórmula exclusiva do SystemicBalance?"
      ],
      en: [
        "Want to know the details about the SystemicBalance supplement and its 12 bioactive compounds?",
        "Ready to see how SystemicBalance can restore your overall balance in 30 days?",
        "Would you like to understand the science behind SystemicBalance's exclusive formula?"
      ]
    }
  };
  
  // Fase 6: Plano B (Reforço)
  const phase6Questions = {
    stomach_pain: {
      pt: [
        "Quanto você já gastou em soluções temporárias que não resolveram o problema?",
        "Prefere continuar gerenciando a dor ou investir em uma solução definitiva?",
        "Que outras áreas da sua vida são afetadas por esses problemas digestivos?"
      ],
      en: [
        "How much have you already spent on temporary solutions that didn't solve the problem?",
        "Do you prefer to continue managing the pain or invest in a definitive solution?",
        "What other areas of your life are affected by these digestive problems?"
      ]
    },
    headache: {
      pt: [
        "Quantos dias de trabalho ou lazer você já perdeu por causa das dores de cabeça?",
        "Prefere continuar dependente de analgésicos ou tratar a causa raiz?",
        "Como seria sua vida sem o medo constante da próxima crise de dor?"
      ],
      en: [
        "How many work or leisure days have you already lost because of headaches?",
        "Do you prefer to remain dependent on painkillers or treat the root cause?",
        "What would your life be like without the constant fear of the next pain crisis?"
      ]
    },
    fatigue: {
      pt: [
        "Quanta produtividade você perde diariamente por causa da falta de energia?",
        "Prefere continuar sobrevivendo com estimulantes ou recuperar sua vitalidade natural?",
        "O que você faria se tivesse 3x mais energia todos os dias?"
      ],
      en: [
        "How much productivity do you lose daily due to lack of energy?",
        "Do you prefer to continue surviving on stimulants or recover your natural vitality?",
        "What would you do if you had 3x more energy every day?"
      ]
    },
    back_pain: {
      pt: [
        "Quais atividades você deixou de fazer por causa da dor nas costas?",
        "Prefere continuar com soluções paliativas ou investir na regeneração da sua coluna?",
        "Como seria sua vida sem a limitação constante imposta pela dor?"
      ],
      en: [
        "What activities have you stopped doing because of back pain?",
        "Do you prefer to continue with palliative solutions or invest in the regeneration of your spine?",
        "What would your life be like without the constant limitation imposed by pain?"
      ]
    },
    unknown: {
      pt: [
        "Quanto tempo e dinheiro você já gastou tentando resolver sintomas isolados sem sucesso?",
        "Prefere continuar tratando sintomas ou investir em restaurar o equilíbrio geral do seu corpo?",
        "Como seria sua vida se você se sentisse realmente bem e equilibrado todos os dias?"
      ],
      en: [
        "How much time and money have you already spent trying to solve isolated symptoms without success?",
        "Do you prefer to continue treating symptoms or invest in restoring your body's overall balance?",
        "What would your life be like if you felt truly well and balanced every day?"
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
    case 5: questionsSet = phase5Questions; break;
    case 6: questionsSet = phase6Questions; break; // Plano B
    default: questionsSet = phase1Questions;
  }
  
  // Obter todas as perguntas disponíveis para o sintoma e idioma
  const allQuestions = questionsSet[symptom]?.[language] || questionsSet.unknown[language];
  
  // Filtrar perguntas para evitar repetições
  const filteredQuestions = allQuestions.filter(q => !previousQuestions.includes(q));
  
  // Se não houver perguntas não repetidas suficientes, usar as disponíveis ou avançar
  if (filteredQuestions.length < 3) {
    // Se já estamos no plano B, apenas retornar as disponíveis
    if (funnelPhase === 6) {
       return selectRandomQuestions(allQuestions, Math.min(3, allQuestions.length));
    }
    
    // Tentar pegar da próxima fase
    const nextPhase = Math.min(funnelPhase + 1, 6);
    let nextQuestionsSet;
    switch(nextPhase) {
      case 2: nextQuestionsSet = phase2Questions; break;
      case 3: nextQuestionsSet = phase3Questions; break;
      case 4: nextQuestionsSet = phase4Questions; break;
      case 5: nextQuestionsSet = phase5Questions; break;
      case 6: nextQuestionsSet = phase6Questions; break;
      default: nextQuestionsSet = phase2Questions;
    }
    
    const nextPhaseQuestions = nextQuestionsSet[symptom]?.[language] || nextQuestionsSet.unknown[language];
    const combinedQuestions = [...filteredQuestions, ...nextPhaseQuestions.filter(q => !previousQuestions.includes(q))];
    
    // Selecionar 3 perguntas aleatórias, garantindo que não haja duplicatas
    return selectRandomQuestions(Array.from(new Set(combinedQuestions)), 3);
  }
  
  // Selecionar 3 perguntas aleatórias das filtradas
  return selectRandomQuestions(filteredQuestions, 3);
}

// Função auxiliar para selecionar perguntas aleatórias (mantida)
function selectRandomQuestions(questions, count) {
  if (!questions || questions.length === 0) return [];
  const shuffled = [...questions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

// ✅ Função principal para obter contexto e resposta (ATUALIZADA)
async function getSymptomContext(userMessage, userName, userAge, userWeight, funnelPhase = 1, previousSymptom = null, previousQuestions = []) {
  try {
    // Detectar idioma da mensagem
    const language = detectLanguage(userMessage);
    
    // Verificando se o formulário foi preenchido
    const hasForm = userName && userName.trim() !== ""; // Verifica se o nome foi fornecido
    
    // Identificar sintoma - MELHORADO PARA DETECTAR MAIS VARIAÇÕES
    let sintomaKey = "unknown";
    const lowerMessage = userMessage.toLowerCase();
    
    // Melhorada a detecção de dores de estômago
    if (lowerMessage.includes("stomach") || 
        lowerMessage.includes("estômago") || 
        lowerMessage.includes("estomago") || 
        lowerMessage.includes("barriga") ||
        lowerMessage.includes("digestiv") ||
        lowerMessage.includes("gastrite") ||
        lowerMessage.includes("gastritis") ||
        lowerMessage.includes("refluxo") ||
        lowerMessage.includes("reflux") ||
        lowerMessage.includes("azia") ||
        lowerMessage.includes("heartburn")) {
      sintomaKey = "stomach_pain";
    } 
    // Melhorada a detecção de dores de cabeça
    else if (lowerMessage.includes("headache") || 
             lowerMessage.includes("dor de cabeça") || 
             lowerMessage.includes("dores de cabeça") || 
             lowerMessage.includes("dor na cabeça") ||
             lowerMessage.includes("dor de cabeca") ||
             lowerMessage.includes("dores de cabeca") ||
             lowerMessage.includes("cabeça") ||
             lowerMessage.includes("cabeca") ||
             lowerMessage.includes("enxaqueca") ||
             lowerMessage.includes("migraine") ||
             lowerMessage.includes("cefaleia") ||
             lowerMessage.includes("cephalgia")) {
      sintomaKey = "headache";
    } 
    // Melhorada a detecção de fadiga
    else if (lowerMessage.includes("fatigue") || 
             lowerMessage.includes("cansaço") || 
             lowerMessage.includes("cansaco") ||
             lowerMessage.includes("fadiga") || 
             lowerMessage.includes("energia") ||
             lowerMessage.includes("energy") ||
             lowerMessage.includes("exaustão") ||
             lowerMessage.includes("exhaustion") ||
             lowerMessage.includes("sem força") ||
             lowerMessage.includes("fraqueza") ||
             lowerMessage.includes("weakness")) {
      sintomaKey = "fatigue";
    } 
    // Melhorada a detecção de dores nas costas
    else if (lowerMessage.includes("back pain") || 
             lowerMessage.includes("dor nas costas") || 
             lowerMessage.includes("dores nas costas") || 
             lowerMessage.includes("lombar") ||
             lowerMessage.includes("coluna") ||
             lowerMessage.includes("spine") ||
             lowerMessage.includes("vertebra") ||
             lowerMessage.includes("vértebra") ||
             lowerMessage.includes("costas doem") ||
             lowerMessage.includes("dor na coluna") ||
             lowerMessage.includes("dores na coluna")) {
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

    // Obter explicação e perguntas de follow-up para a fase atual
    const explanation = getExplanationForPhase(sintomaKey, language, userName, userAge, userWeight, funnelPhase);
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
      scientificExplanation: getExplanationForPhase("unknown", language, userName, userAge, userWeight, 1),
      followupQuestions: getFollowupQuestions("unknown", language, 1, [])
    };
  }
}

// Exportar usando CommonJS para compatibilidade
module.exports = {
  getSymptomContext
};
