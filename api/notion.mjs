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
function getSimplifiedExplanation(symptom, language, userName, userAge, userWeight) {
  // Estatística personalizada baseada nos dados do usuário
  const personalizedStat = getPersonalizedStatistic(symptom, userAge, userWeight, language);
  
  const explanations = {
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
  
  return explanations[symptom][language] || explanations.unknown[language];
}

// ✅ Função para obter perguntas de follow-up por fase do funil
function getFollowupQuestions(symptom, language, funnelPhase) {
  // Fase 1: Diagnóstico provocador
  const phase1Questions = {
    stomach_pain: {
      pt: [
        "Você tem comido como se seu estômago fosse indestrutível? Vamos falar sobre seus hábitos alimentares.",
        "Quanto tempo você vai continuar ignorando que seu estômago está em guerra? Vamos avaliar a gravidade.",
        "Você já tentou alguma solução ou prefere continuar sofrendo? Conte-me suas tentativas."
      ],
      en: [
        "Have you been eating like your stomach is indestructible? Let's talk about your eating habits.",
        "How long will you continue ignoring that your stomach is at war? Let's assess the severity.",
        "Have you tried any solutions or do you prefer to keep suffering? Tell me about your attempts."
      ]
    },
    headache: {
      pt: [
        "Quanto tempo você vai fingir que essa dor de cabeça é 'normal'? Vamos avaliar a frequência e intensidade.",
        "Você já identificou os gatilhos ou prefere continuar sendo pego de surpresa? Vamos analisar padrões.",
        "Quais 'soluções milagrosas' você já tentou que obviamente não funcionaram? Conte-me suas tentativas."
      ],
      en: [
        "How long will you pretend this headache is 'normal'? Let's assess frequency and intensity.",
        "Have you identified triggers or do you prefer to keep being caught by surprise? Let's analyze patterns.",
        "What 'miracle solutions' have you already tried that obviously didn't work? Tell me about your attempts."
      ]
    },
    fatigue: {
      pt: [
        "Quantos cafés você precisa para funcionar? Vamos falar sobre seus níveis reais de energia.",
        "Você acha normal acordar cansado depois de dormir? Vamos avaliar a qualidade do seu sono.",
        "Quanto tempo você vai ignorar que seu corpo está implorando por ajuda? Vamos analisar seus sintomas."
      ],
      en: [
        "How many coffees do you need to function? Let's talk about your real energy levels.",
        "Do you think it's normal to wake up tired after sleeping? Let's assess your sleep quality.",
        "How long will you ignore that your body is begging for help? Let's analyze your symptoms."
      ]
    },
    back_pain: {
      pt: [
        "Quanto tempo você passa sentado destruindo sua coluna diariamente? Vamos falar sobre sua postura.",
        "Você já fez algum exercício para fortalecer o core ou prefere que sua coluna continue sofrendo? Vamos avaliar.",
        "A dor irradia para outras partes do corpo ou você só está esperando isso acontecer? Vamos analisar os sintomas."
      ],
      en: [
        "How much time do you spend sitting destroying your spine daily? Let's talk about your posture.",
        "Have you done any exercises to strengthen your core or do you prefer your spine to keep suffering? Let's assess.",
        "Does the pain radiate to other parts of your body or are you just waiting for that to happen? Let's analyze the symptoms."
      ]
    },
    unknown: {
      pt: [
        "Você poderia descrever seus sintomas de forma mais clara ou prefere que eu adivinhe? Vamos ser específicos.",
        "Há quanto tempo você vem ignorando esses sinais do seu corpo? Vamos avaliar a duração.",
        "Você notou algum padrão ou está esperando que o problema se resolva sozinho? Vamos analisar."
      ],
      en: [
        "Could you describe your symptoms more clearly or do you prefer I guess? Let's be specific.",
        "How long have you been ignoring these signals from your body? Let's assess the duration.",
        "Have you noticed any pattern or are you waiting for the problem to resolve itself? Let's analyze."
      ]
    }
  };
  
  // Fase 2: Agravamento (consequências de não agir)
  const phase2Questions = {
    stomach_pain: {
      pt: [
        "Você sabia que 67% dos problemas digestivos ignorados evoluem para condições crônicas? Vamos falar sobre riscos.",
        "Está ciente que problemas estomacais persistentes podem indicar úlceras ou até câncer? Vamos avaliar sua situação.",
        "Quanto tempo mais você pretende ignorar esses sintomas antes de agir? Vamos discutir consequências."
      ],
      en: [
        "Did you know that 67% of ignored digestive problems evolve into chronic conditions? Let's talk about risks.",
        "Are you aware that persistent stomach problems can indicate ulcers or even cancer? Let's assess your situation.",
        "How much longer do you intend to ignore these symptoms before acting? Let's discuss consequences."
      ]
    },
    headache: {
      pt: [
        "Sabia que dores de cabeça recorrentes podem ser sinais precoces de problemas neurológicos graves? Vamos avaliar riscos.",
        "Está ciente que 58% das enxaquecas não tratadas pioram com o tempo? Vamos falar sobre progressão.",
        "Quanto tempo mais você vai automedicar em vez de tratar a causa real? Vamos discutir abordagens eficazes."
      ],
      en: [
        "Did you know that recurrent headaches can be early signs of serious neurological problems? Let's assess risks.",
        "Are you aware that 58% of untreated migraines get worse over time? Let's talk about progression.",
        "How much longer will you self-medicate instead of treating the real cause? Let's discuss effective approaches."
      ]
    },
    fatigue: {
      pt: [
        "Você sabia que fadiga crônica não tratada está associada a um risco 70% maior de doenças cardíacas? Vamos avaliar riscos.",
        "Está ciente que seu baixo nível de energia pode ser sintoma de deficiências nutricionais graves? Vamos analisar causas.",
        "Quanto tempo mais você vai normalizar esse cansaço antes de agir? Vamos discutir consequências reais."
      ],
      en: [
        "Did you know that untreated chronic fatigue is associated with a 70% higher risk of heart disease? Let's assess risks.",
        "Are you aware that your low energy level may be a symptom of serious nutritional deficiencies? Let's analyze causes.",
        "How much longer will you normalize this tiredness before acting? Let's discuss real consequences."
      ]
    },
    back_pain: {
      pt: [
        "Sabia que 62% das dores nas costas não tratadas levam a danos permanentes na coluna? Vamos avaliar seus riscos.",
        "Está ciente que problemas na coluna podem causar disfunções em órgãos internos? Vamos analisar possíveis complicações.",
        "Quanto tempo mais você vai ignorar sua coluna antes que seja tarde demais? Vamos discutir intervenções necessárias."
      ],
      en: [
        "Did you know that 62% of untreated back pain leads to permanent spine damage? Let's assess your risks.",
        "Are you aware that spine problems can cause dysfunction in internal organs? Let's analyze possible complications.",
        "How much longer will you ignore your spine before it's too late? Let's discuss necessary interventions."
      ]
    },
    unknown: {
      pt: [
        "Você sabia que sintomas persistentes ignorados são a principal causa de diagnósticos tardios? Vamos avaliar riscos.",
        "Está ciente que 73% dos problemas de saúde pioram significativamente quando ignorados? Vamos analisar sua situação.",
        "Quanto tempo mais você vai esperar antes de levar sua saúde a sério? Vamos discutir próximos passos."
      ],
      en: [
        "Did you know that ignored persistent symptoms are the main cause of late diagnoses? Let's assess risks.",
        "Are you aware that 73% of health problems worsen significantly when ignored? Let's analyze your situation.",
        "How much longer will you wait before taking your health seriously? Let's discuss next steps."
      ]
    }
  };
  
  // Fase 3: Solução natural (plantas e nutrientes)
  const phase3Questions = {
    stomach_pain: {
      pt: [
        "Você sabia que certos extratos de plantas podem reduzir inflamação gástrica em até 65%? Vamos falar sobre soluções naturais.",
        "Já considerou que sua alimentação pode estar faltando nutrientes essenciais para a saúde digestiva? Vamos analisar.",
        "Gostaria de conhecer um suplemento natural que combate problemas digestivos na raiz? Vamos discutir opções."
      ],
      en: [
        "Did you know that certain plant extracts can reduce gastric inflammation by up to 65%? Let's talk about natural solutions.",
        "Have you considered that your diet may be lacking essential nutrients for digestive health? Let's analyze.",
        "Would you like to know about a natural supplement that fights digestive problems at the root? Let's discuss options."
      ]
    },
    headache: {
      pt: [
        "Sabia que extratos específicos de plantas podem reduzir a frequência de enxaquecas em até 71%? Vamos falar sobre soluções naturais.",
        "Já considerou que deficiências de magnésio e outros minerais podem ser a causa das suas dores? Vamos analisar nutrientes.",
        "Gostaria de conhecer um suplemento que combina plantas medicinais para saúde neurológica? Vamos discutir opções."
      ],
      en: [
        "Did you know that specific plant extracts can reduce migraine frequency by up to 71%? Let's talk about natural solutions.",
        "Have you considered that magnesium and other mineral deficiencies may be causing your pain? Let's analyze nutrients.",
        "Would you like to know about a supplement that combines medicinal plants for neurological health? Let's discuss options."
      ]
    },
    fatigue: {
      pt: [
        "Você sabia que adaptógenos naturais podem aumentar seus níveis de energia em até 80%? Vamos falar sobre plantas energéticas.",
        "Já considerou que sua fadiga pode ser resultado de deficiências nutricionais específicas? Vamos analisar sua situação.",
        "Gostaria de conhecer um suplemento que combina plantas adaptógenas para combater a fadiga? Vamos discutir opções."
      ],
      en: [
        "Did you know that natural adaptogens can increase your energy levels by up to 80%? Let's talk about energetic plants.",
        "Have you considered that your fatigue may be the result of specific nutritional deficiencies? Let's analyze your situation.",
        "Would you like to know about a supplement that combines adaptogenic plants to combat fatigue? Let's discuss options."
      ]
    },
    back_pain: {
      pt: [
        "Sabia que certos extratos naturais têm potente ação anti-inflamatória para dores musculoesqueléticas? Vamos falar sobre soluções.",
        "Já considerou que deficiências de cálcio, magnésio e vitamina D podem estar afetando sua coluna? Vamos analisar nutrientes.",
        "Gostaria de conhecer um suplemento que combina plantas medicinais para saúde musculoesquelética? Vamos discutir opções."
      ],
      en: [
        "Did you know that certain natural extracts have potent anti-inflammatory action for musculoskeletal pain? Let's talk about solutions.",
        "Have you considered that calcium, magnesium, and vitamin D deficiencies may be affecting your spine? Let's analyze nutrients.",
        "Would you like to know about a supplement that combines medicinal plants for musculoskeletal health? Let's discuss options."
      ]
    },
    unknown: {
      pt: [
        "Você sabia que plantas medicinais específicas podem ajudar a restaurar o equilíbrio do seu corpo? Vamos falar sobre fitoterapia.",
        "Já considerou que seus sintomas podem estar relacionados a deficiências nutricionais modernas? Vamos analisar possibilidades.",
        "Gostaria de conhecer um suplemento natural que pode ajudar a resolver a causa raiz dos seus sintomas? Vamos discutir opções."
      ],
      en: [
        "Did you know that specific medicinal plants can help restore your body's balance? Let's talk about phytotherapy.",
        "Have you considered that your symptoms may be related to modern nutritional deficiencies? Let's analyze possibilities.",
        "Would you like to know about a natural supplement that can help solve the root cause of your symptoms? Let's discuss options."
      ]
    }
  };
  
  // Fase 4: Sugestão de suplemento
  const phase4Questions = {
    stomach_pain: {
      pt: [
        "Quer conhecer o suplemento que 87% dos nossos clientes usam para resolver problemas digestivos?",
        "Pronto para experimentar a solução natural que pode acabar com suas dores de estômago?",
        "Quer ver como este suplemento específico pode transformar sua saúde digestiva?"
      ],
      en: [
        "Want to know the supplement that 87% of our clients use to solve digestive problems?",
        "Ready to try the natural solution that can end your stomach pains?",
        "Want to see how this specific supplement can transform your digestive health?"
      ]
    },
    headache: {
      pt: [
        "Quer conhecer o suplemento que ajudou 91% dos nossos clientes a reduzir dores de cabeça?",
        "Pronto para experimentar a solução natural que pode acabar com suas enxaquecas?",
        "Quer ver como este suplemento específico pode melhorar sua saúde neurológica?"
      ],
      en: [
        "Want to know the supplement that helped 91% of our clients reduce headaches?",
        "Ready to try the natural solution that can end your migraines?",
        "Want to see how this specific supplement can improve your neurological health?"
      ]
    },
    fatigue: {
      pt: [
        "Quer conhecer o suplemento que 82% dos nossos clientes usam para ter mais energia?",
        "Pronto para experimentar a solução natural que pode acabar com sua fadiga crônica?",
        "Quer ver como este suplemento específico pode revitalizar seu corpo e mente?"
      ],
      en: [
        "Want to know the supplement that 82% of our clients use to have more energy?",
        "Ready to try the natural solution that can end your chronic fatigue?",
        "Want to see how this specific supplement can revitalize your body and mind?"
      ]
    },
    back_pain: {
      pt: [
        "Quer conhecer o suplemento que 79% dos nossos clientes usam para aliviar dores nas costas?",
        "Pronto para experimentar a solução natural que pode fortalecer sua coluna?",
        "Quer ver como este suplemento específico pode melhorar sua saúde musculoesquelética?"
      ],
      en: [
        "Want to know the supplement that 79% of our clients use to relieve back pain?",
        "Ready to try the natural solution that can strengthen your spine?",
        "Want to see how this specific supplement can improve your musculoskeletal health?"
      ]
    },
    unknown: {
      pt: [
        "Quer conhecer o suplemento que 88% dos nossos clientes usam para restaurar o equilíbrio geral?",
        "Pronto para experimentar a solução natural que pode resolver a causa raiz dos seus sintomas?",
        "Quer ver como este suplemento específico pode transformar sua saúde de forma abrangente?"
      ],
      en: [
        "Want to know the supplement that 88% of our clients use to restore overall balance?",
        "Ready to try the natural solution that can solve the root cause of your symptoms?",
        "Want to see how this specific supplement can comprehensively transform your health?"
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
  
  return questionsSet[symptom][language] || questionsSet.unknown[language];
}

// ✅ Função principal para obter contexto e resposta
export async function getSymptomContext(userMessage, userName, userAge, userWeight, funnelPhase = 1) {
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
    
    // Escolher introdução com base no preenchimento do formulário
    let intro;
    if (hasForm) {
      intro = getSarcasticIntro(sintomaKey, language, userName);
    } else {
      intro = frasesSarcasticas[language][Math.floor(Math.random() * frasesSarcasticas[language].length)];
    }

    // Obter explicação simplificada e perguntas de follow-up para a fase atual
    const explanation = getSimplifiedExplanation(sintomaKey, language, userName, userAge, userWeight);
    const questions = getFollowupQuestions(sintomaKey, language, funnelPhase);

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
      scientificExplanation: getSimplifiedExplanation("unknown", language, userName, userAge, userWeight),
      followupQuestions: getFollowupQuestions("unknown", language, 1)
    };
  }
}

// Nota: A consulta ao Notion foi removida temporariamente para focar na lógica do prompt e funil.
// A integração com o Notion pode ser adicionada posteriormente para buscar dados específicos de suplementos.

