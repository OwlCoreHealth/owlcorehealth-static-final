// notion.mjs - Estrutura de conteúdo por fases do funil (Tom mais informal)

// Função auxiliar para escolher um item aleatório de um array
const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Estrutura para as fases do funil com conteúdo variado e tom ajustado
const funnelPhases = {
  1: { // Fase 1: Explicação científica simples + soluções rápidas
    intros: {
      headache: {
        pt: [
          "Oi! Dor de cabeça de novo? Vamos ver o que pode estar a acontecer.",
          "Olá! Cabeça a latejar? Acontece... vamos investigar juntos.",
          "Epa! Dor de cabeça chata? Vamos tentar entender a causa."
        ],
        en: [
          "Hi! Headache again? Let's see what might be going on.",
          "Hello! Head pounding? It happens... let's investigate together.",
          "Oops! Annoying headache? Let's try to understand the cause."
        ]
      },
      stomach_pain: {
        pt: [
          "Olá! Desconforto no estômago? Vamos descobrir o que se passa.",
          "Oi! Barriga a reclamar? Acontece. Vamos ver como ajudar.",
          "Epa! Estômago a dar sinal? Vamos analisar isso."
        ],
        en: [
          "Hello! Stomach discomfort? Let's find out what's up.",
          "Hi! Tummy complaining? It happens. Let's see how to help.",
          "Oops! Stomach acting up? Let's look into that."
        ]
      },
      fatigue: {
        pt: [
          "Oi! A sentir-se sem energia? Vamos ver como podemos melhorar isso.",
          "Olá! Cansaço a pesar? Acontece. Vamos explorar as causas.",
          "Epa! Baterias em baixo? Vamos investigar juntos."
        ],
        en: [
          "Hi! Feeling low on energy? Let's see how we can improve that.",
          "Hello! Feeling tired? It happens. Let's explore the causes.",
          "Oops! Batteries low? Let's investigate together."
        ]
      },
      back_pain: {
        pt: [
          "Olá! Dores nas costas a incomodar? Vamos ver o que pode ser.",
          "Oi! Costas a reclamar? Acontece. Vamos analisar a situação.",
          "Epa! Dor chata nas costas? Vamos tentar entender a origem."
        ],
        en: [
          "Hello! Back pain bothering you? Let's see what it could be.",
          "Hi! Back complaining? It happens. Let's analyze the situation.",
          "Oops! Annoying back pain? Let's try to understand the source."
        ]
      },
      unknown: {
        pt: [
          "Olá! A sentir-se um pouco estranho? Vamos tentar perceber melhor.",
          "Oi! Sintomas gerais? Acontece. Vamos explorar juntos.",
          "Epa! Algo não está certo? Vamos investigar."
        ],
        en: [
          "Hello! Feeling a bit off? Let's try to understand better.",
          "Hi! General symptoms? It happens. Let's explore together.",
          "Oops! Something not right? Let's investigate."
        ]
      }
    },
    explanations: {
      headache: {
        pt: [
          "Muitas vezes, dores de cabeça podem ser sinal de desidratação ou tensão. Tente beber um bom copo de água e fazer uma pausa para alongar o pescoço. Coisas simples podem fazer diferença!",
          "Sabia que a falta de água ou passar muito tempo em frente a ecrãs pode causar dores de cabeça? Uma dica: experimente beber mais água hoje e fazer pausas regulares.",
          "Dores de cabeça podem ter várias causas, como tensão muscular ou até mesmo a alimentação. Uma sugestão: massaje suavemente as têmporas e respire fundo por um minuto."
        ],
        en: [
          "Often, headaches can be a sign of dehydration or tension. Try drinking a big glass of water and taking a break to stretch your neck. Simple things can make a difference!",
          "Did you know that lack of water or spending too much time in front of screens can cause headaches? A tip: try drinking more water today and taking regular breaks.",
          "Headaches can have various causes, like muscle tension or even diet. A suggestion: gently massage your temples and take deep breaths for a minute."
        ]
      },
      stomach_pain: {
        pt: [
          "Desconforto no estômago pode ser causado por algo que comeu ou até stress. Tente beber um chá de camomila ou hortelã, que ajudam a acalmar o sistema digestivo.",
          "Às vezes, a digestão fica um pouco lenta. Comer devagar e mastigar bem os alimentos pode ajudar muito. Que tal experimentar na próxima refeição?",
          "O stress do dia-a-dia pode afetar o estômago. Tente relaxar um pouco, talvez com uma caminhada curta ou ouvindo música calma."
        ],
        en: [
          "Stomach discomfort can be caused by something you ate or even stress. Try drinking chamomile or mint tea, which help soothe the digestive system.",
          "Sometimes, digestion gets a bit slow. Eating slowly and chewing food well can help a lot. How about trying it at your next meal?",
          "Daily stress can affect the stomach. Try to relax a bit, maybe with a short walk or listening to calm music."
        ]
      },
       fatigue: {
        pt: [
          "Sentir-se cansado pode ser sinal de que precisa de descansar melhor ou ajustar a alimentação. Uma boa noite de sono faz maravilhas! Tente dormir 7-8 horas.",
          "Às vezes, a falta de energia vem da desidratação ou falta de nutrientes. Certifique-se que está a beber água suficiente e a comer alimentos nutritivos.",
          "O corpo precisa de movimento para ter energia! Uma caminhada leve ou alguns alongamentos podem ajudar a despertar."
        ],
        en: [
          "Feeling tired can be a sign you need better rest or to adjust your diet. A good night's sleep works wonders! Try to get 7-8 hours.",
          "Sometimes, lack of energy comes from dehydration or lack of nutrients. Make sure you're drinking enough water and eating nutritious foods.",
          "The body needs movement to have energy! A light walk or some stretches can help wake you up."
        ]
      },
      back_pain: {
        pt: [
          "Dores nas costas muitas vezes vêm de má postura ou ficar muito tempo na mesma posição. Tente levantar-se e alongar a cada hora, se possível.",
          "Fortalecer os músculos das costas e abdómen ajuda a prevenir dores. Exercícios simples como a prancha podem fazer diferença.",
          "Sabia que o calçado inadequado ou dormir numa posição errada podem causar dores nas costas? Verifique se seu colchão e sapatos estão a dar bom suporte."
        ],
        en: [
          "Back pain often comes from poor posture or staying in the same position for too long. Try standing up and stretching every hour, if possible.",
          "Strengthening back and abdominal muscles helps prevent pain. Simple exercises like the plank can make a difference.",
          "Did you know that improper footwear or sleeping in the wrong position can cause back pain? Check if your mattress and shoes are providing good support."
        ]
      },
      unknown: {
        pt: [
          "Quando nos sentimos 'estranhos', pode ser o corpo a pedir mais atenção. Tente observar se há algum padrão: acontece depois de comer? Depois de stress?",
          "Às vezes, o corpo só precisa de um reequilíbrio básico. Certifique-se que está a dormir bem, a comer de forma variada e a gerir o stress.",
          "Sintomas gerais podem ser um sinal para abrandar um pouco. Que tal reservar um momento do dia para relaxar e respirar fundo?"
        ],
        en: [
          "When we feel 'off', it might be the body asking for more attention. Try to observe if there's any pattern: does it happen after eating? After stress?",
          "Sometimes, the body just needs a basic rebalancing. Make sure you're sleeping well, eating a varied diet, and managing stress.",
          "General symptoms can be a signal to slow down a bit. How about setting aside a moment in your day to relax and take deep breaths?"
        ]
      }
    },
    followupQuestions: {
      // Garantir pelo menos 6-9 perguntas únicas por sintoma/fase para permitir rotação
      headache: {
        pt: [
          "Com que frequência estas dores de cabeça acontecem?",
          "Nota se a dor piora com luz ou barulho?",
          "Você costuma beber café ou outras bebidas com cafeína?",
          "Como descreveria a intensidade da dor, de 1 a 10?",
          "Você já tentou alguma coisa para aliviar a dor?",
          "A dor parece estar ligada a algum alimento específico?",
          "Quer explorar o que pode acontecer se estas dores continuarem?",
          "Interessado em saber mais sobre possíveis causas?",
          "Podemos falar sobre como o stress pode influenciar isso?"
        ],
        en: [
          "How often do these headaches happen?",
          "Do you notice if the pain worsens with light or noise?",
          "Do you usually drink coffee or other caffeinated beverages?",
          "How would you describe the pain intensity, from 1 to 10?",
          "Have you tried anything to relieve the pain?",
          "Does the pain seem linked to any specific food?",
          "Want to explore what might happen if these headaches continue?",
          "Interested in learning more about possible causes?",
          "Can we talk about how stress might influence this?"
        ]
      },
      stomach_pain: {
        pt: [
          "Este desconforto acontece mais antes ou depois de comer?",
          "Você sente inchaço ou gases associados?",
          "Como está o seu nível de stress ultimamente?",
          "Houve alguma mudança recente na sua alimentação?",
          "Você costuma comer rápido ou enquanto faz outras coisas?",
          "A dor é mais como uma queimação ou uma cólica?",
          "Quer entender melhor as consequências de ignorar estes sinais?",
          "Interessado em saber como a alimentação afeta a digestão?",
          "Podemos discutir o impacto do stress no estômago?"
        ],
        en: [
          "Does this discomfort happen more before or after eating?",
          "Do you feel bloating or gas associated with it?",
          "How has your stress level been lately?",
          "Have there been any recent changes in your diet?",
          "Do you usually eat quickly or while doing other things?",
          "Is the pain more like a burning sensation or a cramp?",
          "Want to better understand the consequences of ignoring these signs?",
          "Interested in knowing how diet affects digestion?",
          "Can we discuss the impact of stress on the stomach?"
        ]
      },
      // ... (mais perguntas para outros sintomas)
      unknown: {
         pt: [
          "Pode descrever melhor essa sensação? Onde a sente?",
          "Há quanto tempo se sente assim?",
          "Acontece em algum momento específico do dia?",
          "Notou alguma outra mudança no seu corpo ou rotina?",
          "Como tem sido a qualidade do seu sono?",
          "Sente mais stress ou ansiedade ultimamente?",
          "Quer explorar o que pode acontecer se estes sintomas persistirem?",
          "Interessado em saber como o estilo de vida influencia o bem-estar?",
          "Podemos falar sobre a importância de ouvir os sinais do corpo?"
        ],
        en: [
          "Can you describe this feeling better? Where do you feel it?",
          "How long have you been feeling this way?",
          "Does it happen at any specific time of day?",
          "Have you noticed any other changes in your body or routine?",
          "How has the quality of your sleep been?",
          "Feeling more stress or anxiety lately?",
          "Want to explore what might happen if these symptoms persist?",
          "Interested in knowing how lifestyle influences well-being?",
          "Can we talk about the importance of listening to your body's signals?"
        ]
      }
    }
  },
  2: { // Fase 2: Consequências se não tomar cuidados
    intros: { /* ... (variações mais focadas na preocupação) ... */ },
    explanations: {
       headache: {
        pt: [
          "Ignorar dores de cabeça frequentes pode não ser boa ideia. Às vezes, elas podem tornar-se crónicas ou até mascarar algo que precisa de mais atenção. Cerca de 40% das pessoas que ignoram acabam por ter dores mais intensas no futuro.",
          "Não dar atenção a estas dores pode levar a um ciclo vicioso. O corpo habitua-se à dor e pode tornar-se mais difícil de tratar. Além disso, pode afetar a sua concentração e humor no dia-a-dia."
        ],
        en: [
          "Ignoring frequent headaches might not be a good idea. Sometimes, they can become chronic or even mask something that needs more attention. About 40% of people who ignore them end up having more intense pain in the future.",
          "Not paying attention to these pains can lead to a vicious cycle. The body gets used to the pain, and it can become harder to treat. Plus, it can affect your concentration and mood daily."
        ]
      },
      // ... (explicações para outros sintomas, focando em consequências moderadas)
    },
    followupQuestions: {
      headache: {
        pt: [
          "Você já pensou no impacto que estas dores podem ter a longo prazo?",
          "Como estas dores afetam a sua rotina diária ou trabalho?",
          "Está ciente que alguns analgésicos, se usados em excesso, podem piorar as dores?",
          "Gostaria de entender melhor os riscos de não investigar a causa?",
          "Podemos falar sobre como a dor crónica pode afetar o bem-estar geral?",
          "Interessado em explorar abordagens para prevenir que piore?"
          // ... (mais 3-6 perguntas únicas)
        ],
        en: [
          "Have you thought about the long-term impact these pains might have?",
          "How do these pains affect your daily routine or work?",
          "Are you aware that some painkillers, if overused, can worsen headaches?",
          "Would you like to better understand the risks of not investigating the cause?",
          "Can we talk about how chronic pain can affect overall well-being?",
          "Interested in exploring approaches to prevent it from getting worse?"
          // ... (add 3-6 more unique questions)
        ]
      },
       // ... (perguntas para outros sintomas)
    }
  },
  3: { // Fase 3: O que está realmente arriscando (agravamento)
    intros: { /* ... (variações com tom mais sério) ... */ },
    explanations: {
       headache: {
        pt: [
          "Aqui a conversa fica mais séria. Dores de cabeça persistentes e ignoradas podem, em alguns casos, estar ligadas a problemas vasculares ou neurológicos. Cerca de 15% das enxaquecas crónicas não tratadas aumentam o risco de complicações.",
          "Não é só a dor. Ignorar sinais como este pode levar a danos que afetam a sua qualidade de vida permanentemente. Estamos a falar de um risco real, embora pequeno, de problemas mais graves se a causa não for identificada."
        ],
        en: [
          "This is where the conversation gets more serious. Persistent, ignored headaches can, in some cases, be linked to vascular or neurological problems. About 15% of untreated chronic migraines increase the risk of complications.",
          "It's not just the pain. Ignoring signals like this can lead to damage that permanently affects your quality of life. We're talking about a real, albeit small, risk of more serious problems if the cause isn't identified."
        ]
      },
      // ... (explicações para outros sintomas, focando em riscos e estatísticas mais alarmantes)
    },
    followupQuestions: {
      headache: {
        pt: [
          "Percebe que continuar assim pode ter consequências sérias para a sua saúde?",
          "Está disposto a investigar a fundo para descartar problemas maiores?",
          "Você sabia que a dor crónica pode alterar a estrutura do cérebro a longo prazo?",
          "Quer discutir como a prevenção é fundamental nesta fase?",
          "Podemos analisar como identificar a causa raiz é crucial agora?",
          "Interessado em saber como a nutrição pode influenciar problemas neurológicos?"
          // ... (mais 3-6 perguntas únicas)
        ],
        en: [
          "Do you realize that continuing like this could have serious health consequences?",
          "Are you willing to investigate thoroughly to rule out major problems?",
          "Did you know that chronic pain can alter brain structure in the long run?",
          "Want to discuss how prevention is crucial at this stage?",
          "Can we analyze how identifying the root cause is crucial now?",
          "Interested in knowing how nutrition can influence neurological problems?"
          // ... (add 3-6 more unique questions)
        ]
      },
       // ... (perguntas para outros sintomas)
    }
  },
  4: { // Fase 4: Nutrientes e plantas naturais
     intros: { /* ... (variações focadas em soluções naturais) ... */ },
    explanations: {
       headache: {
        pt: [
          "Muitas vezes, o corpo precisa de 'ferramentas' específicas que a alimentação comum não fornece em quantidade suficiente. Nutrientes como Magnésio e Coenzima Q10 são essenciais para a saúde neurológica e podem ajudar a reduzir a frequência das dores.",
          "Existem plantas usadas há séculos, como a Gengibre ou a Valeriana (dependendo do tipo de dor), que têm propriedades anti-inflamatórias e relaxantes comprovadas, ajudando a aliviar a tensão que causa dores de cabeça."
        ],
        en: [
          "Often, the body needs specific 'tools' that the common diet doesn't provide in sufficient amounts. Nutrients like Magnesium and Coenzyme Q10 are essential for neurological health and can help reduce headache frequency.",
          "There are plants used for centuries, like Ginger or Valerian (depending on the type of pain), that have proven anti-inflammatory and relaxing properties, helping to relieve the tension that causes headaches."
        ]
      },
      // ... (explicações para outros sintomas, introduzindo nutrientes e plantas relevantes)
    },
    followupQuestions: {
      headache: {
        pt: [
          "Interessado em saber quais nutrientes específicos podem ajudar no seu caso?",
          "Quer conhecer plantas medicinais que podem aliviar a dor de forma natural?",
          "Sabia que a combinação certa de vitaminas pode ser mais eficaz que alguns remédios?",
          "Gostaria de discutir como a alimentação pode ser otimizada para a saúde cerebral?",
          "Podemos explorar como suplementos naturais podem complementar a sua dieta?",
          "Quer entender a ciência por trás destes nutrientes e plantas?"
          // ... (mais 3-6 perguntas únicas)
        ],
        en: [
          "Interested in knowing which specific nutrients might help in your case?",
          "Want to learn about medicinal plants that can relieve pain naturally?",
          "Did you know the right combination of vitamins can be more effective than some medications?",
          "Would you like to discuss how diet can be optimized for brain health?",
          "Can we explore how natural supplements can complement your diet?",
          "Want to understand the science behind these nutrients and plants?"
          // ... (add 3-6 more unique questions)
        ]
      },
       // ... (perguntas para outros sintomas)
    }
  },
  5: { // Fase 5: Suplemento como solução completa
    intros: { /* ... (variações focadas na solução integrada) ... */ },
    explanations: {
       headache: {
        pt: [
          "Considerando tudo o que falámos, uma abordagem integrada pode ser o ideal. Existem suplementos que combinam os nutrientes e extratos de plantas mais eficazes, como [Nome do Suplemento], formulado para atacar as causas comuns das dores de cabeça.",
          "Muitas pessoas acham difícil obter todos os nutrientes necessários apenas com a dieta. Um suplemento bem formulado garante que você recebe as doses certas para apoiar a saúde neurológica e reduzir a inflamação, de forma prática."
        ],
        en: [
          "Considering everything we've discussed, an integrated approach might be ideal. There are supplements that combine the most effective nutrients and plant extracts, like [Supplement Name], formulated to target common causes of headaches.",
          "Many people find it difficult to get all the necessary nutrients from diet alone. A well-formulated supplement ensures you get the right doses to support neurological health and reduce inflammation, conveniently."
        ]
      },
      // ... (explicações para outros sintomas, apresentando o suplemento)
    },
    followupQuestions: {
      headache: {
        pt: [
          "Quer conhecer em detalhe a fórmula deste suplemento e como ele funciona?",
          "Gostaria de ver testemunhos de pessoas que tiveram bons resultados?",
          "Interessado em saber como este suplemento se compara a outras opções?",
          "Podemos discutir como integrar este suplemento na sua rotina?",
          "Tem alguma dúvida específica sobre os ingredientes ou a segurança?",
          "Pronto para considerar uma solução que ataca a causa raiz do problema?"
          // ... (mais 3-6 perguntas únicas)
        ],
        en: [
          "Want to know the details of this supplement's formula and how it works?",
          "Would you like to see testimonials from people who had good results?",
          "Interested in knowing how this supplement compares to other options?",
          "Can we discuss how to integrate this supplement into your routine?",
          "Do you have any specific questions about the ingredients or safety?",
          "Ready to consider a solution that tackles the root cause of the problem?"
          // ... (add 3-6 more unique questions)
        ]
      },
       // ... (perguntas para outros sintomas)
    }
  },
  6: { // Fase 6: Plano B
    intros: { /* ... (variações com abordagem alternativa, mais suave) ... */ },
    explanations: {
       headache: {
        pt: [
          "Entendo que possa ter dúvidas. Talvez precise de mais tempo ou informação. Só queria reforçar que cuidar da saúde preventivamente costuma ser mais simples e económico do que tratar problemas depois.",
          "Não há pressão, a decisão é sua. Mas considere que pequenas mudanças hoje podem fazer uma grande diferença no seu bem-estar futuro. Continuar a sentir dor não precisa ser o 'normal'."
        ],
        en: [
          "I understand you might have doubts. Maybe you need more time or information. I just wanted to reinforce that taking care of your health preventively is usually simpler and more economical than treating problems later.",
          "There's no pressure, the decision is yours. But consider that small changes today can make a big difference in your future well-being. Continuing to feel pain doesn't have to be the 'normal'."
        ]
      },
      // ... (explicações para outros sintomas, com reforço suave)
    },
    followupQuestions: {
      headache: {
        pt: [
          "Gostaria de rever alguma informação sobre as causas das dores de cabeça?",
          "Quer explorar outras dicas de estilo de vida que podem ajudar?",
          "Há alguma preocupação específica que o impede de experimentar uma solução natural?",
          "Podemos falar sobre os benefícios de uma abordagem preventiva?",
          "Interessado em ler mais sobre os estudos científicos que mencionámos?",
          "Quer discutir como pequenas mudanças podem ter um grande impacto?"
          // ... (mais 3-6 perguntas únicas)
        ],
        en: [
          "Would you like to review any information about the causes of headaches?",
          "Want to explore other lifestyle tips that might help?",
          "Is there any specific concern preventing you from trying a natural solution?",
          "Can we talk about the benefits of a preventive approach?",
          "Interested in reading more about the scientific studies we mentioned?",
          "Want to discuss how small changes can have a big impact?"
          // ... (add 3-6 more unique questions)
        ]
      },
       // ... (perguntas para outros sintomas)
    }
  }
};

// Função simplificada para identificar o sintoma principal e o idioma
function detectSymptomAndLanguage(message) {
  const lowerMessage = String(message).toLowerCase();
  let sintomaKey = "unknown";
  let language = "en"; // Default to English

  // Detectar idioma (simples)
  if (lowerMessage.includes("dor") || lowerMessage.includes("cabeça") || lowerMessage.includes("estomago") || lowerMessage.includes("costas") || lowerMessage.includes("cansado") || lowerMessage.includes("fadiga") || lowerMessage.includes("oi") || lowerMessage.includes("olá")) {
    language = "pt";
  }

  // Detectar sintoma (simplificado)
  if (lowerMessage.includes("stomach") || lowerMessage.includes("digest") || lowerMessage.includes("azia") || lowerMessage.includes("estômago") || lowerMessage.includes("barriga")) {
    sintomaKey = "stomach_pain";
  } else if (lowerMessage.includes("head") || lowerMessage.includes("migraine") || lowerMessage.includes("cabeça") || lowerMessage.includes("enxaqueca")) {
    sintomaKey = "headache";
  } else if (lowerMessage.includes("tired") || lowerMessage.includes("fatigue") || lowerMessage.includes("cansado") || lowerMessage.includes("fadiga") || lowerMessage.includes("energia")) {
    sintomaKey = "fatigue";
  } else if (lowerMessage.includes("back") || lowerMessage.includes("spine") || lowerMessage.includes("costas") || lowerMessage.includes("lombar") || lowerMessage.includes("coluna")) {
    sintomaKey = "back_pain";
  }
  
  return { sintomaKey, language };
}

// Função principal exportada - Adaptada para fases e evitar repetição de perguntas
function getSymptomContext(userMessage, userName = "", userAge = "", userWeight = "", funnelPhase = 1, previousSymptom = null, usedQuestions = []) {
  try {
    // Garantir que userMessage seja string
    const messageText = String(userMessage || "");
    
    // Detectar sintoma e idioma
    const { sintomaKey: detectedSymptom, language } = detectSymptomAndLanguage(messageText);
    
    // Manter o sintoma anterior se o atual for 'unknown' e houver um anterior
    const sintomaKey = (detectedSymptom === "unknown" && previousSymptom && previousSymptom !== "unknown") ? previousSymptom : detectedSymptom;
    
    // Garantir que a fase do funil seja válida (1-6)
    const phase = Math.min(Math.max(funnelPhase, 1), 6);
    
    // Obter conteúdo para a fase atual do funil
    const phaseContent = funnelPhases[phase];
    if (!phaseContent) throw new Error(`Fase do funil inválida: ${phase}`);

    // Obter introdução para o sintoma e fase atual
    const introOptions = phaseContent.intros?.[sintomaKey]?.[language] || phaseContent.intros?.unknown?.[language] || ["Olá! Como posso ajudar?"];
    const intro = getRandomItem(introOptions).replace("{userName}", userName || "");
    
    // Obter explicação científica para o sintoma e fase atual
    const explanationOptions = phaseContent.explanations?.[sintomaKey]?.[language] || phaseContent.explanations?.unknown?.[language] || ["Vamos analisar a sua situação."];
    const scientificExplanation = getRandomItem(explanationOptions);
    
    // Obter perguntas de follow-up para o sintoma e fase atual, excluindo as já usadas
    const allPhaseQuestions = phaseContent.followupQuestions?.[sintomaKey]?.[language] || phaseContent.followupQuestions?.unknown?.[language] || [];
    const availableQuestions = allPhaseQuestions.filter(q => !usedQuestions.includes(q));
    
    // Selecionar 3 perguntas únicas (ou menos se não houver suficientes)
    let selectedQuestions = [];
    let shuffledAvailable = [...availableQuestions].sort(() => 0.5 - Math.random()); // Embaralhar para variedade
    selectedQuestions = shuffledAvailable.slice(0, 3);

    // Se não houver perguntas novas suficientes, preencher com perguntas genéricas (ou repetir menos usadas, mas por agora genéricas)
    if (selectedQuestions.length < 3) {
        const genericQuestions = language === 'pt' ? [
            "Quer explorar outro tópico?",
            "Posso ajudar com mais alguma coisa?",
            "Tem mais alguma dúvida?"
        ] : [
            "Want to explore another topic?",
            "Can I help with anything else?",
            "Do you have any other questions?"
        ];
        let needed = 3 - selectedQuestions.length;
        for (let i = 0; i < needed; i++) {
            if (genericQuestions[i] && !selectedQuestions.includes(genericQuestions[i])) {
                selectedQuestions.push(genericQuestions[i]);
            }
        }
    }
    
    return {
      sintoma: sintomaKey,
      language: language,
      intro: intro,
      scientificExplanation: scientificExplanation,
      followupQuestions: selectedQuestions, // Retorna as 3 perguntas selecionadas
      phase: phase
    };
  } catch (error) {
    console.error("Erro em getSymptomContext:", error);
    // Retornar um contexto de erro padrão
    return {
      sintoma: "error",
      language: "en",
      intro: "Oops, something went wrong on my end.",
      scientificExplanation: "I couldn't process that properly. Could you try asking differently?",
      followupQuestions: ["Try again?", "Ask something else?", "Need help?"],
      phase: 1
    };
  }
}

// Exportar a função principal
export { getSymptomContext, detectSymptomAndLanguage }; // Exportar também detectSymptomAndLanguage se chat.js precisar

