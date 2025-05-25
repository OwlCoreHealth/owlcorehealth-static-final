// notion.mjs - Versão corrigida com fluxo de idioma e sintoma consistente
import { Client } from "@notionhq/client";

// ✅ Prompt Owl Savage - Personalidade e Funil
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

// Função para detectar o idioma da mensagem - MELHORADA
function detectLanguage(message) {
  // Palavras e frases específicas para detecção de idioma
  const portugueseWords = ["é", "você", "tem", "dores", "sintoma", "cabeça", "estômago", "costas", "fadiga", "cansaço", "como", "para", "não", "sim", "obrigado", "ajuda", "problema", "dor"];
  const englishWords = ["is", "you", "have", "pain", "symptom", "head", "stomach", "back", "fatigue", "tired", "how", "for", "no", "yes", "thanks", "help", "problem", "hurt"];
  
  const messageLower = message.toLowerCase();
  let portugueseCount = 0;
  let englishCount = 0;
  
  portugueseWords.forEach(word => {
    if (messageLower.includes(word)) portugueseCount++;
  });
  
  englishWords.forEach(word => {
    if (messageLower.includes(word)) englishCount++;
  });

  // Verificação adicional para perguntas em inglês
  if (messageLower.includes("do you") || messageLower.includes("can you") || messageLower.includes("what is") || messageLower.includes("how are")) {
    englishCount += 2;
  }
  
  // Verificação adicional para perguntas em português
  if (messageLower.includes("você pode") || messageLower.includes("como está") || messageLower.includes("o que é") || messageLower.includes("me ajuda")) {
    portugueseCount += 2;
  }

  console.log(`Detecção de idioma: PT=${portugueseCount}, EN=${englishCount}`);
  return portugueseCount >= englishCount ? "pt" : "en";
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
    if (age > 40) percentage += 10;
    else if (age > 30) percentage += 5;
  }
  
  if (weight) {
    if (weight > 90) percentage += 15;
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

// Perguntas de follow-up para cada fase do funil e sintoma
const followupQuestionsByPhase = {
  // Fase 1: Explicação científica com linguagem simples + soluções rápidas
  1: {
    headache: {
      pt: [
        "Sente mais stress ou ansiedade ultimamente?",
        "Pode descrever melhor essa sensação? Onde a sente?",
        "Há quanto tempo se sente assim?",
        "Quer explorar o que pode acontecer se estes sintomas persistirem?",
        "Como tem sido a qualidade do seu sono?",
        "Podemos falar sobre a importância de ouvir os sinais do corpo?"
      ],
      en: [
        "Have you been feeling more stressed or anxious lately?",
        "Can you describe this sensation better? Where do you feel it?",
        "How long have you been feeling this way?",
        "Want to explore what might happen if these symptoms persist?",
        "How has your sleep quality been?",
        "Can we talk about the importance of listening to your body's signals?"
      ]
    },
    stomach_pain: {
      pt: [
        "Notou alguma relação entre sua alimentação e os sintomas?",
        "Há quanto tempo sente esse desconforto?",
        "Quer saber como isso pode afetar sua saúde a longo prazo?",
        "Já tentou alguma solução natural para esse problema?",
        "O desconforto piora em algum momento específico do dia?",
        "Podemos falar sobre como o estresse afeta seu sistema digestivo?"
      ],
      en: [
        "Have you noticed any relationship between your diet and symptoms?",
        "How long have you been feeling this discomfort?",
        "Want to know how this might affect your long-term health?",
        "Have you tried any natural solutions for this problem?",
        "Does the discomfort worsen at any specific time of day?",
        "Can we talk about how stress affects your digestive system?"
      ]
    },
    fatigue: {
      pt: [
        "Como está sua alimentação ultimamente?",
        "Há quanto tempo se sente sem energia?",
        "Quer saber o que pode estar drenando sua energia?",
        "Já verificou seus níveis de vitaminas e minerais?",
        "Como é sua rotina de exercícios?",
        "Podemos falar sobre como melhorar sua energia naturalmente?"
      ],
      en: [
        "How has your diet been lately?",
        "How long have you been feeling low on energy?",
        "Want to know what might be draining your energy?",
        "Have you checked your vitamin and mineral levels?",
        "What's your exercise routine like?",
        "Can we talk about how to naturally improve your energy?"
      ]
    },
    back_pain: {
      pt: [
        "Como é sua postura durante o dia?",
        "Há quanto tempo sente essas dores?",
        "Quer saber como prevenir danos permanentes na coluna?",
        "Já tentou exercícios específicos para fortalecer as costas?",
        "A dor irradia para outras partes do corpo?",
        "Podemos falar sobre soluções naturais para dores nas costas?"
      ],
      en: [
        "How's your posture during the day?",
        "How long have you been feeling this pain?",
        "Want to know how to prevent permanent damage to your spine?",
        "Have you tried specific exercises to strengthen your back?",
        "Does the pain radiate to other parts of your body?",
        "Can we talk about natural solutions for back pain?"
      ]
    },
    unknown: {
      pt: [
        "Pode descrever melhor o que está sentindo?",
        "Há quanto tempo nota esses sintomas?",
        "Quer explorar possíveis causas para o que está sentindo?",
        "Já consultou um profissional sobre isso?",
        "Os sintomas variam durante o dia ou são constantes?",
        "Podemos falar sobre como seu estilo de vida pode estar afetando sua saúde?"
      ],
      en: [
        "Can you describe better what you're feeling?",
        "How long have you noticed these symptoms?",
        "Want to explore possible causes for what you're feeling?",
        "Have you consulted a professional about this?",
        "Do the symptoms vary during the day or are they constant?",
        "Can we talk about how your lifestyle might be affecting your health?"
      ]
    }
  },
  // Fase 2: Consequências se não tomar cuidados
  2: {
    headache: {
      pt: [
        "Sabia que dores de cabeça ignoradas podem levar a problemas crônicos?",
        "Quer conhecer nutrientes que podem ajudar a prevenir dores de cabeça?",
        "Já pensou em como o estresse afeta suas dores de cabeça?",
        "Quer saber como seu estilo de vida pode estar piorando as dores?",
        "Podemos falar sobre os riscos de automedicação frequente?",
        "Quer conhecer técnicas naturais para aliviar a tensão?"
      ],
      en: [
        "Did you know that ignored headaches can lead to chronic problems?",
        "Want to know about nutrients that can help prevent headaches?",
        "Have you thought about how stress affects your headaches?",
        "Want to know how your lifestyle might be worsening the pain?",
        "Can we talk about the risks of frequent self-medication?",
        "Want to learn natural techniques to relieve tension?"
      ]
    },
    // Adicione perguntas para outros sintomas na fase 2...
    unknown: {
      pt: [
        "Quer saber como sintomas ignorados podem evoluir?",
        "Podemos falar sobre como fortalecer seu sistema imunológico?",
        "Já considerou como sua alimentação afeta seus sintomas?",
        "Quer conhecer suplementos que podem ajudar com esses sintomas?",
        "Podemos falar sobre a conexão mente-corpo na saúde?",
        "Quer saber mais sobre prevenção de problemas de saúde?"
      ],
      en: [
        "Want to know how ignored symptoms can evolve?",
        "Can we talk about how to strengthen your immune system?",
        "Have you considered how your diet affects your symptoms?",
        "Want to know about supplements that can help with these symptoms?",
        "Can we talk about the mind-body connection in health?",
        "Want to learn more about preventing health problems?"
      ]
    }
  },
  // Fase 3: O que está realmente arriscando (agravamento)
  3: {
    // Perguntas para fase 3...
    unknown: {
      pt: [
        "Quer conhecer casos reais de pessoas que ignoraram sintomas semelhantes?",
        "Podemos falar sobre como reverter danos já causados?",
        "Quer saber quais nutrientes seu corpo está implorando agora?",
        "Já pensou em como isso afeta sua qualidade de vida a longo prazo?",
        "Quer conhecer a solução que 87% das pessoas com seu perfil adotaram?",
        "Podemos falar sobre como prevenir o agravamento desses sintomas?"
      ],
      en: [
        "Want to know about real cases of people who ignored similar symptoms?",
        "Can we talk about how to reverse damage already caused?",
        "Want to know which nutrients your body is begging for right now?",
        "Have you thought about how this affects your long-term quality of life?",
        "Want to know the solution that 87% of people with your profile adopted?",
        "Can we talk about how to prevent these symptoms from worsening?"
      ]
    }
  },
  // Fase 4: Nutrientes e plantas naturais
  4: {
    // Perguntas para fase 4...
    unknown: {
      pt: [
        "Quer saber quais plantas medicinais são mais eficazes para seu caso?",
        "Podemos falar sobre como combinar nutrientes para máxima eficácia?",
        "Já considerou suplementos específicos para seus sintomas?",
        "Quer conhecer a fórmula que combina ciência moderna e sabedoria ancestral?",
        "Podemos falar sobre como potencializar a absorção desses nutrientes?",
        "Quer saber por que muitas pessoas não melhoram mesmo usando plantas medicinais?"
      ],
      en: [
        "Want to know which medicinal plants are most effective for your case?",
        "Can we talk about how to combine nutrients for maximum effectiveness?",
        "Have you considered specific supplements for your symptoms?",
        "Want to know the formula that combines modern science and ancestral wisdom?",
        "Can we talk about how to enhance the absorption of these nutrients?",
        "Want to know why many people don't improve even when using medicinal plants?"
      ]
    }
  },
  // Fase 5: Suplemento como solução completa
  5: {
    // Perguntas para fase 5...
    unknown: {
      pt: [
        "Quer saber como esse suplemento age no seu organismo?",
        "Podemos falar sobre os resultados clínicos desse suplemento?",
        "Quer conhecer histórias reais de pessoas que resolveram problemas como o seu?",
        "Já pensou quanto custa viver com esses sintomas versus investir na solução?",
        "Podemos falar sobre como maximizar os resultados do suplemento?",
        "Quer saber por que esse suplemento é diferente dos outros que você já tentou?"
      ],
      en: [
        "Want to know how this supplement works in your body?",
        "Can we talk about the clinical results of this supplement?",
        "Want to hear real stories of people who solved problems like yours?",
        "Have you thought about the cost of living with these symptoms versus investing in the solution?",
        "Can we talk about how to maximize the results of the supplement?",
        "Want to know why this supplement is different from others you've tried?"
      ]
    }
  },
  // Fase 6: Plano B
  6: {
    // Perguntas para fase 6...
    unknown: {
      pt: [
        "Quer explorar outro tópico?",
        "Posso ajudar com mais alguma coisa?",
        "Tem mais alguma pergunta?",
        "Quer saber mais sobre como cuidar da sua saúde?",
        "Podemos falar sobre prevenção de outros problemas de saúde?",
        "Quer conhecer outras soluções naturais para melhorar seu bem-estar?"
      ],
      en: [
        "Want to explore another topic?",
        "Can I help with anything else?",
        "Do you have any other questions?",
        "Want to know more about taking care of your health?",
        "Can we talk about preventing other health problems?",
        "Want to learn about other natural solutions to improve your well-being?"
      ]
    }
  }
};

// Função para obter perguntas de follow-up não utilizadas
function getFollowupQuestions(symptom, language, funnelPhase = 1, usedQuestions = []) {
  // Garantir que a fase do funil seja válida (1-6)
  const phase = Math.min(Math.max(funnelPhase, 1), 6);
  
  // Obter perguntas para o sintoma e fase específicos, ou usar unknown como fallback
  const phaseQuestions = followupQuestionsByPhase[phase] || followupQuestionsByPhase[1];
  const symptomQuestions = phaseQuestions[symptom] || phaseQuestions.unknown;
  const availableQuestions = symptomQuestions[language] || symptomQuestions.en;
  
  // Filtrar perguntas já utilizadas
  const unusedQuestions = availableQuestions.filter(q => !usedQuestions.includes(q));
  
  // Se não houver perguntas não utilizadas suficientes, usar perguntas genéricas
  if (unusedQuestions.length < 3) {
    const genericQuestions = followupQuestionsByPhase[phase].unknown[language] || followupQuestionsByPhase[phase].unknown.en;
    const unusedGenericQuestions = genericQuestions.filter(q => !usedQuestions.includes(q));
    
    // Combinar perguntas não utilizadas específicas e genéricas
    const combinedQuestions = [...unusedQuestions, ...unusedGenericQuestions];
    
    // Se ainda não houver perguntas suficientes, usar perguntas da fase 6 (genéricas)
    if (combinedQuestions.length < 3) {
      const fallbackQuestions = followupQuestionsByPhase[6].unknown[language] || followupQuestionsByPhase[6].unknown.en;
      return fallbackQuestions.slice(0, 3);
    }
    
    return combinedQuestions.slice(0, 3);
  }
  
  // Selecionar 3 perguntas aleatórias não utilizadas
  const selectedQuestions = [];
  const shuffledQuestions = [...unusedQuestions].sort(() => 0.5 - Math.random());
  
  for (let i = 0; i < Math.min(3, shuffledQuestions.length); i++) {
    selectedQuestions.push(shuffledQuestions[i]);
  }
  
  return selectedQuestions;
}

// Função para obter explicações científicas com base no sintoma e idioma
function getScientificExplanation(symptom, language, userName, userAge, userWeight) {
  // Estatística personalizada baseada nos dados do usuário
  const personalizedStat = getPersonalizedStatistic(symptom, userAge, userWeight, language);
  
  const explanations = {
    stomach_pain: {
      pt: `As dores de estômago podem ter diversas causas, desde simples até mais complexas. E não, não é "só uma dorzinha" como você provavelmente está pensando.

A dor abdominal é processada através de nociceptores (receptores de dor) que enviam sinais ao cérebro via nervos aferentes. Estes sinais são interpretados pelo córtex somatossensorial, resultando na sensação de dor que você experimenta.

${personalizedStat}

Seu sistema digestivo é uma máquina complexa com mais de 100 milhões de neurônios (seu "segundo cérebro") e quando algo está errado, ele grita por atenção. Ignorar esses sinais é como desligar o alarme de incêndio enquanto sua casa queima.`,
      en: `Stomach pains can have various causes, from simple to more complex. And no, it's not "just a little pain" as you're probably thinking.

Abdominal pain is processed through nociceptors (pain receptors) that send signals to the brain via afferent nerves. These signals are interpreted by the somatosensory cortex, resulting in the pain sensation you experience.

${personalizedStat}

Your digestive system is a complex machine with over 100 million neurons (your "second brain") and when something is wrong, it screams for attention. Ignoring these signals is like turning off the fire alarm while your house burns down.`
    },
    headache: {
      pt: `Dores de cabeça não são apenas um "incômodo" - são um sistema de alerta sofisticado do seu cérebro. E pelo visto, o seu está em modo de emergência total.

A dor é processada através do Sistema Trigeminovascular e do Eixo Psiconeuroendocrinoimunológico, onde inflamação, tensão muscular e vasodilatação se combinam para criar aquela sensação que está martelando na sua cabeça agora.

${personalizedStat}

Seu cérebro está literalmente em chamas com inflamação neurológica, e você está tratando como se fosse apenas uma "fase". Fascinante como ignoramos o órgão mais importante do corpo até que ele comece a falhar completamente.`,
      en: `Headaches aren't just an "annoyance" - they're a sophisticated alert system from your brain. And apparently, yours is in full emergency mode.

The pain is processed through the Trigeminovascular System and the Psychoneuroendocrinoimmunological Axis, where inflammation, muscle tension, and vasodilation combine to create that sensation hammering in your head right now.

${personalizedStat}

Your brain is literally on fire with neurological inflammation, and you're treating it like it's just a "phase". Fascinating how we ignore the most important organ in the body until it starts failing completely.`
    },
    fatigue: {
      pt: `Fadiga crônica não é "só cansaço" - é seu corpo literalmente implorando por recursos que estão em falta. E pelo visto, o seu está em modo de economia de energia severa.

A exaustão que você sente é resultado de disfunção mitocondrial, onde suas células não conseguem produzir ATP (adenosina trifosfato) suficiente para manter suas funções básicas. É como tentar dirigir um carro com o tanque na reserva.

${personalizedStat}

Seu corpo está em um estado de estresse oxidativo e inflamação sistêmica, afetando desde seu metabolismo até seu sistema imunológico. E você provavelmente está tentando resolver isso com mais café, o que é como apagar um incêndio com gasolina.`,
      en: `Chronic fatigue isn't "just tiredness" - it's your body literally begging for resources that are lacking. And apparently, yours is in severe energy-saving mode.

The exhaustion you feel is the result of mitochondrial dysfunction, where your cells can't produce enough ATP (adenosine triphosphate) to maintain basic functions. It's like trying to drive a car with the tank on reserve.

${personalizedStat}

Your body is in a state of oxidative stress and systemic inflammation, affecting everything from your metabolism to your immune system. And you're probably trying to solve this with more coffee, which is like putting out a fire with gasoline.`
    },
    back_pain: {
      pt: `Dor nas costas não é apenas um "incômodo" - é um grito de socorro da sua estrutura de suporte. E pelo visto, a sua está em colapso iminente.

A dor que você sente é resultado de compressão nervosa, inflamação facetária, e tensão miofascial que afeta toda a cadeia cinética do seu corpo. Sua coluna vertebral está literalmente implorando por atenção.

${personalizedStat}

Cada movimento que você faz com dor está criando compensações musculares que distorcem ainda mais sua biomecânica, criando um ciclo vicioso de dano progressivo. É como dirigir um carro desalinhado e ignorar o barulho estranho até que a roda caia.`,
      en: `Back pain isn't just an "annoyance" - it's a cry for help from your support structure. And apparently, yours is in imminent collapse.

The pain you feel is the result of nerve compression, facet inflammation, and myofascial tension affecting your body's entire kinetic chain. Your spine is literally begging for attention.

${personalizedStat}

Every movement you make with pain is creating muscular compensations that further distort your biomechanics, creating a vicious cycle of progressive damage. It's like driving a misaligned car and ignoring the strange noise until the wheel falls off.`
    },
    unknown: {
      pt: `Sintomas vagos são frequentemente os primeiros sinais de que algo está desequilibrado no seu corpo. E ignorá-los é uma estratégia fascinante que muitas pessoas adotam... até que o problema se torne grave demais para ignorar.

Seu corpo tem sistemas sofisticados de comunicação interna, e quando algo está errado, ele tenta te alertar de várias formas. O problema é que muitas pessoas só prestam atenção quando o sussurro se torna um grito.

${personalizedStat}

A maioria dos problemas de saúde começa com sinais sutis que, se tratados precocemente, podem ser resolvidos com intervenções simples. Esperar até que se tornem crônicos é como ignorar um pequeno vazamento até que todo o teto desabe.`,
      en: `Vague symptoms are often the first signs that something is out of balance in your body. And ignoring them is a fascinating strategy that many people adopt... until the problem becomes too serious to ignore.

Your body has sophisticated internal communication systems, and when something is wrong, it tries to alert you in various ways. The problem is that many people only pay attention when the whisper becomes a scream.

${personalizedStat}

Most health problems start with subtle signs that, if treated early, can be resolved with simple interventions. Waiting until they become chronic is like ignoring a small leak until the entire ceiling collapses.`
    }
  };
  
  return explanations[symptom]?.[language] || explanations.unknown[language];
}

// Função para criar dados de prompt para o GPT-4o mini
function createGPTPromptData(symptom, language, userName, funnelPhase) {
  // Prompt base para o GPT-4o mini
  const basePrompt = OWL_SAVAGE_PROMPT;
  
  // Contexto específico para o GPT
  const context = {
    userName: userName || "",
    symptom: symptom,
    language: language,
    funnelPhase: funnelPhase
  };
  
  return {
    prompt: basePrompt,
    context: context
  };
}

// Função principal para consulta ao Notion - MELHORADA
export async function getSymptomContext(userMessage, userName, userAge, userWeight, funnelPhase = 1, currentSymptom = null, usedQuestions = []) {
  try {
    // Detectar idioma da mensagem
    const language = detectLanguage(userMessage);
    console.log(`Idioma detectado: ${language}`);
    
    // Verificando se o formulário foi preenchido
    const hasForm = userName && userName.trim() !== ""; // Verifica se o nome foi fornecido
    
    // Escolher introdução com base no preenchimento do formulário
    let intro;
    
    // Detectando o sintoma com base nas palavras-chave
    let sintomaKey = currentSymptom || "unknown";
    
    if (userMessage.toLowerCase().includes("stomach") || 
        userMessage.toLowerCase().includes("estômago") || 
        userMessage.toLowerCase().includes("estomago") || 
        userMessage.toLowerCase().includes("barriga")) {
      sintomaKey = "stomach_pain";
    } else if (userMessage.toLowerCase().includes("headache") || 
              userMessage.toLowerCase().includes("dor de cabeça") || 
              userMessage.toLowerCase().includes("cabeça") ||
              userMessage.toLowerCase().includes("cabeca")) {
      sintomaKey = "headache";
    } else if (userMessage.toLowerCase().includes("fatigue") || 
              userMessage.toLowerCase().includes("cansaço") || 
              userMessage.toLowerCase().includes("fadiga") || 
              userMessage.toLowerCase().includes("energia") ||
              userMessage.toLowerCase().includes("cansaco")) {
      sintomaKey = "fatigue";
    } else if (userMessage.toLowerCase().includes("back pain") || 
              userMessage.toLowerCase().includes("dor nas costas") || 
              userMessage.toLowerCase().includes("lombar") ||
              userMessage.toLowerCase().includes("coluna")) {
      sintomaKey = "back_pain";
    }
    
    console.log(`Sintoma detectado: ${sintomaKey}`);
    
    if (hasForm) {
      // Obter introdução sarcástica personalizada
      intro = getSarcasticIntro(sintomaKey, language, userName);
    } else {
      // Escolher uma frase sarcástica aleatória para formulário não preenchido
      intro = frasesSarcasticas[language][Math.floor(Math.random() * frasesSarcasticas[language].length)];
    }

    const keywords = extractKeywords(userMessage);
    console.log("🧠 Palavras-chave extraídas:", keywords);

    try {
      // Tentar consultar o Notion
      const response = await notion.databases.query({
        database_id: databaseId
      });
      console.log("📨 Resposta do Notion recebida com sucesso");
    } catch (notionError) {
      console.error("❌ Erro ao consultar o Notion:", notionError);
      // Continuar com o processamento mesmo sem dados do Notion
    }

    // Obter perguntas de follow-up não utilizadas
    const followupQuestions = getFollowupQuestions(sintomaKey, language, funnelPhase, usedQuestions);
    
    // Criar dados de prompt para o GPT-4o mini
    const gptPromptData = createGPTPromptData(sintomaKey, language, userName, funnelPhase);

    // Retornando um objeto estruturado com todas as informações necessárias
    return {
      sintoma: sintomaKey,
      intro: intro,
      scientificExplanation: getScientificExplanation(sintomaKey, language, userName, userAge, userWeight),
      followupQuestions: followupQuestions,
      language: language, // Explicitamente incluir o idioma detectado
      funnelPhase: funnelPhase, // Incluir a fase do funil
      gptPromptData: gptPromptData // Dados para o prompt do GPT
    };

  } catch (error) {
    console.error("❌ Erro geral na função getSymptomContext:", error);
    const language = detectLanguage(userMessage);
    
    // Mesmo em caso de erro, retornar um objeto completo com valores padrão
    return {
      sintoma: "unknown",
      intro: language === "pt" ? "Oi! Sintomas gerais? Acontece. Vamos explorar juntos." : "Hi! General symptoms? It happens. Let's explore together.",
      scientificExplanation: getScientificExplanation("unknown", language, userName, userAge, userWeight),
      followupQuestions: getFollowupQuestions("unknown", language, funnelPhase, usedQuestions),
      language: language, // Explicitamente incluir o idioma detectado
      funnelPhase: funnelPhase, // Incluir a fase do funil
      gptPromptData: createGPTPromptData("unknown", language, userName, funnelPhase) // Dados para o prompt do GPT
    };
  }
}
