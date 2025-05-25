// Versão adaptada para GPT-3.5 gratuito
// ES Modules format

// Introduções sarcásticas simplificadas
const intros = {
  stomach_pain: {
    pt: ["Dores de estômago? Aposto que sua dieta é um exemplo de disciplina... só que não."],
    en: ["Stomach pains? I bet your diet is a model of discipline... not."]
  },
  headache: {
    pt: ["Dor de cabeça de novo? Talvez seja o universo tentando te dizer algo... ou só desidratação mesmo."],
    en: ["Headache again? Maybe it's the universe trying to tell you something... or just dehydration."]
  },
  fatigue: {
    pt: ["Cansado? Que surpresa. Provavelmente passou a noite maratonando séries inúteis."],
    en: ["Tired? What a surprise. Probably spent the night binge-watching useless shows."]
  },
  back_pain: {
    pt: ["Dor nas costas? Aposto que sua postura é impecável e você faz alongamentos diários... só que ao contrário."],
    en: ["Back pain? I bet your posture is impeccable and you do daily stretches... just the opposite."]
  },
  unknown: {
    pt: ["Sintomas vagos? Fascinante como você descreve seu problema da forma menos útil possível."],
    en: ["Vague symptoms? Fascinating how you describe your problem in the least helpful way possible."]
  }
};

// Explicações científicas simplificadas
const explanations = {
  stomach_pain: {
    1: { 
      pt: ["Seu estômago não está apenas 'incomodado' - ele está em guerra química. 65% dos problemas digestivos são causados por bactérias que fermentam alimentos mal digeridos. Dica: Mastigar cada bocado 20 vezes reduz problemas digestivos em até 40%."],
      en: ["Your stomach isn't just 'bothered' - it's in chemical warfare. 65% of digestive problems are caused by bacteria fermenting poorly digested food. Tip: Chewing each bite 20 times reduces digestive issues by up to 40%."]
    },
    2: { 
      pt: ["Ignorar essa dorzinha chata? Péssima ideia. 55% das gastrites não tratadas evoluem para úlceras. O que seu médico não te diz: a inflamação constante pode levar à má absorção de nutrientes essenciais."],
      en: ["Ignoring that annoying little pain? Bad idea. 55% of untreated gastritis evolves into ulcers. What your doctor doesn't tell you: constant inflammation can lead to poor absorption of essential nutrients."]
    },
    3: { 
      pt: ["Seu sistema digestivo não está apenas 'irritado' - está em falência progressiva. 82% dos problemas digestivos ignorados por mais de 3 meses causam danos permanentes à mucosa gástrica."],
      en: ["Your digestive system isn't just 'irritated' - it's in progressive failure. 82% of digestive problems ignored for more than 3 months cause permanent damage to the gastric mucosa."]
    },
    4: { 
      pt: ["Achar que só comida resolve? Ilusão. Seu intestino precisa de mais. Nutrientes como Zinco e Glutamina são cruciais para reparar a parede intestinal, mas 60% das dietas ocidentais são deficientes."],
      en: ["Thinking food alone will fix it? Illusion. Your gut needs more. Nutrients like Zinc and Glutamine are crucial for repairing the intestinal wall, but 60% of Western diets are deficient."]
    },
    5: { 
      pt: ["Chega de remendos. A solução real combina o melhor da ciência e da natureza. Nosso suplemento foi formulado com ingredientes comprovados para restaurar a saúde digestiva."],
      en: ["Enough with the patches. The real solution combines the best of science and nature. Our supplement was formulated with proven ingredients to restore digestive health."]
    },
    6: { 
      pt: ["Ok, parece que você ainda não está convencido. Talvez precise de mais dados? 75% das pessoas que adiam a decisão acabam gastando 3x mais em tratamentos médicos depois."],
      en: ["Okay, it seems you're still not convinced. Maybe you need more data? 75% of people who postpone the decision end up spending 3x more on medical treatments later."]
    }
  },
  headache: {
    1: { pt: ["Sua cabeça não está apenas doendo - é um alarme de incêndio. 78% das dores de cabeça frequentes são por desidratação crônica. Dica: Beba 2 copos de água AGORA."], en: ["Your head isn't just hurting - it's a fire alarm. 78% of frequent headaches are due to chronic dehydration. Tip: Drink 2 glasses of water NOW."] },
    2: { pt: ["Achar que é só 'stress'? 60% das enxaquecas não tratadas aumentam o risco de problemas vasculares."], en: ["Thinking it's just 'stress'? 60% of untreated migraines increase the risk of vascular problems."] },
    3: { pt: ["Essa dorzinha pode ser a ponta do iceberg. 30% das dores de cabeça persistentes sinalizam problemas mais sérios."], en: ["That little pain could be the tip of the iceberg. 30% of persistent headaches signal more serious problems."] },
    4: { pt: ["Analgésicos são remendos. Seu cérebro precisa de Magnésio e Coenzima Q10 para funcionar sem 'explodir'."], en: ["Painkillers are patches. Your brain needs Magnesium and Coenzyme Q10 to function without 'exploding'."] },
    5: { pt: ["A solução definitiva? Nosso suplemento ataca a causa raiz. 91% dos usuários relataram redução na frequência e intensidade das dores."], en: ["The definitive solution? Our supplement attacks the root cause. 91% of users reported reduced frequency and intensity of headaches."] },
    6: { pt: ["Ainda na dúvida? Continuar com analgésicos pode causar 'dor de cabeça de rebote', piorando o problema."], en: ["Still doubting? Continuing with painkillers can cause 'rebound headaches', worsening the problem."] }
  },
  fatigue: {
    1: { pt: ["Seu corpo não está 'cansado' - está em pane seca. 75% da fadiga crônica vem de má alimentação e sono ruim."], en: ["Your body isn't 'tired' - it's running on empty. 75% of chronic fatigue comes from poor diet and bad sleep."] },
    2: { pt: ["Achar que café resolve? Só mascara o problema. 65% das pessoas com fadiga persistente têm problemas de tireoide ou anemia."], en: ["Thinking coffee solves it? It just masks the problem. 65% of people with persistent fatigue have thyroid problems or anemia."] },
    3: { pt: ["Essa 'preguiça' pode ser seu corpo desligando. 40% da fadiga extrema está ligada a inflamação crônica silenciosa."], en: ["That 'laziness' could be your body shutting down. 40% of extreme fatigue is linked to silent chronic inflammation."] },
    4: { pt: ["Energéticos são lixo. Seu corpo precisa de Vitaminas do Complexo B, Ferro e Magnésio para produzir energia real."], en: ["Energy drinks are trash. Your body needs B Vitamins, Iron, and Magnesium to produce real energy."] },
    5: { pt: ["Quer energia de verdade? Nosso suplemento restaura seus níveis de energia de forma natural e sustentável."], en: ["Want real energy? Our supplement restores your energy levels naturally and sustainably."] },
    6: { pt: ["Ainda arrastando os pés? A fadiga crônica afeta sua produtividade, humor e relacionamentos."], en: ["Still dragging your feet? Chronic fatigue affects your productivity, mood, and relationships."] }
  },
  back_pain: {
    1: { pt: ["Sua coluna não está apenas 'doendo' - ela está gritando por socorro. 68% das dores nas costas vêm de músculos fracos e má postura."], en: ["Your spine isn't just 'hurting' - it's screaming for help. 68% of back pain comes from weak muscles and poor posture."] },
    2: { pt: ["Achar que é só 'mau jeito'? 50% das dores lombares não tratadas levam a problemas de disco ou ciática."], en: ["Thinking it's just a 'tweak'? 50% of untreated lower back pain leads to disc problems or sciatica."] },
    3: { pt: ["Essa dor pode te deixar incapacitado. 35% das dores crônicas nas costas estão ligadas a hérnias de disco."], en: ["This pain can leave you incapacitated. 35% of chronic back pain is linked to herniated discs."] },
    4: { pt: ["Anti-inflamatórios só mascaram. Seus discos e articulações precisam de Glucosamina, Condroitina e Colágeno."], en: ["Anti-inflammatories just mask it. Your discs and joints need Glucosamine, Chondroitin, and Collagen."] },
    5: { pt: ["Alívio duradouro? Nosso suplemento fortalece a estrutura da coluna e reduz a inflamação."], en: ["Lasting relief? Our supplement strengthens the spinal structure and reduces inflammation."] },
    6: { pt: ["Ainda sofrendo em silêncio? Dor nas costas limita sua vida e afeta seu humor."], en: ["Still suffering in silence? Back pain limits your life and affects your mood."] }
  },
  unknown: {
    1: { pt: ["Seu corpo está confuso, e você também. 73% dos sintomas vagos escondem deficiências nutricionais ou inflamação silenciosa."], en: ["Your body is confused, and so are you. 73% of vague symptoms hide nutritional deficiencies or silent inflammation."] },
    2: { pt: ["Achar que 'não é nada'? 60% dos problemas crônicos começam com sintomas vagos ignorados."], en: ["Thinking it's 'nothing'? 60% of chronic problems start with ignored vague symptoms."] },
    3: { pt: ["Sintomas gerais são alertas vermelhos. 42% das pessoas com mal-estar persistente têm problemas autoimunes ou hormonais."], en: ["General symptoms are red flags. 42% of people with persistent malaise have autoimmune or hormonal problems."] },
    4: { pt: ["Seu corpo precisa de um 'reset' nutricional. Vitaminas essenciais como D, B12 e minerais como Magnésio e Zinco são fundamentais."], en: ["Your body needs a nutritional 'reset'. Essential vitamins like D, B12, and minerals like Magnesium and Zinc are fundamental."] },
    5: { pt: ["Uma abordagem completa? Nosso suplemento ajuda a reequilibrar seu sistema."], en: ["A complete approach? Our supplement helps rebalance your system."] },
    6: { pt: ["Ainda perdido? Sentir-se mal constantemente não é normal."], en: ["Still lost? Feeling constantly unwell isn't normal."] }
  }
};

// Perguntas de follow-up simplificadas
const followupQuestions = {
  stomach_pain: {
    1: {
      pt: ["Você tem comido como se seu estômago fosse indestrutível?", "Quais alimentos parecem piorar essa dor?", "Com que frequência isso acontece?"],
      en: ["Have you been eating as if your stomach were indestructible?", "What foods seem to worsen this pain?", "How often does this happen?"]
    },
    2: {
      pt: ["Está ciente que ignorar isso pode levar a úlceras?", "Quanto tempo mais você pretende ignorar esses sintomas?", "Você sabia que o stress pode dobrar a produção de ácido no estômago?"],
      en: ["Are you aware that ignoring this can lead to ulcers?", "How much longer do you plan to ignore these symptoms?", "Did you know that stress can double stomach acid production?"]
    },
    3: {
      pt: ["Percebe que continuar assim pode causar danos permanentes?", "Está disposto a investigar a causa raiz?", "Você sabia que problemas digestivos crônicos afetam seu humor e energia?"],
      en: ["Do you realize that continuing like this can cause permanent damage?", "Are you willing to investigate the root cause?", "Did you know that chronic digestive problems affect your mood and energy?"]
    },
    4: {
      pt: ["Interessado em saber quais nutrientes podem reparar seu intestino?", "Quer conhecer plantas medicinais com poder anti-inflamatório?", "Sabia que a combinação certa de nutrientes pode ser mais eficaz que medicamentos?"],
      en: ["Interested in knowing which nutrients can repair your gut?", "Want to know medicinal plants with anti-inflammatory power?", "Did you know that the right combination of nutrients can be more effective than medications?"]
    },
    5: {
      pt: ["Quer conhecer a fórmula que já ajudou milhares como você?", "Pronto para uma solução que ataca a causa raiz?", "Interessado em ver estudos que comprovam a eficácia?"],
      en: ["Want to know the formula that has already helped thousands like you?", "Ready for a solution that attacks the root cause?", "Interested in seeing studies that prove the effectiveness?"]
    },
    6: {
      pt: ["Precisa de mais informações sobre como nosso suplemento funciona?", "Quer comparar os riscos de não fazer nada com os benefícios da solução?", "Podemos discutir como este suplemento se encaixa no seu estilo de vida?"],
      en: ["Need more information on how our supplement works?", "Want to compare the risks of doing nothing with the benefits of the solution?", "Can we discuss how this supplement fits into your lifestyle?"]
    }
  },
  headache: {
    1: { pt: ["Você bebe água suficiente?", "Seu sono tem sido reparador?", "Quais situações parecem desencadear essa dor?"], en: ["Do you drink enough water?", "Has your sleep been restful?", "What situations seem to trigger this pain?"] },
    2: { pt: ["Está ciente que analgésicos em excesso pioram a dor?", "Quanto estresse você acumula?", "Sabia que problemas de visão podem causar dores de cabeça?"], en: ["Are you aware that excessive painkillers worsen pain?", "How much stress do you accumulate?", "Did you know vision problems can cause headaches?"] },
    3: { pt: ["Percebe que ignorar enxaquecas aumenta seu risco cardiovascular?", "Está disposto a investigar gatilhos?", "Você sabia que certas deficiências nutricionais causam dores de cabeça?"], en: ["Do you realize that ignoring migraines increases your cardiovascular risk?", "Are you willing to investigate triggers?", "Did you know certain nutritional deficiencies cause headaches?"] },
    4: { pt: ["Interessado em saber como o Magnésio pode reduzir suas enxaquecas?", "Quer conhecer plantas que aliviam a dor sem efeitos colaterais?", "Sabia que equilibrar seus neurotransmissores pode ser a chave?"], en: ["Interested in knowing how Magnesium can reduce your migraines?", "Want to know plants that relieve pain without side effects?", "Did you know balancing your neurotransmitters could be the key?"] },
    5: { pt: ["Quer conhecer a fórmula que ataca a inflamação e a tensão na raiz?", "Pronto para uma solução que previne as dores?", "Interessado em ver como nosso suplemento se compara a outros tratamentos?"], en: ["Want to know the formula that attacks inflammation and tension at the root?", "Ready for a solution that prevents pain?", "Interested in seeing how our supplement compares to other treatments?"] },
    6: { pt: ["Precisa entender melhor a ciência por trás do nosso suplemento?", "Quer discutir como pequenas mudanças no estilo de vida potencializam o efeito?", "Podemos analisar como este suplemento pode te libertar da dependência de analgésicos?"], en: ["Need to better understand the science behind our supplement?", "Want to discuss how small lifestyle changes enhance the effect?", "Can we analyze how this supplement can free you from painkiller dependency?"] }
  },
  fatigue: {
    1: { pt: ["Sua dieta é combustível ou lixo processado?", "Você dorme o suficiente?", "Quais atividades te deixam esgotado?"], en: ["Is your diet fuel or processed junk?", "Do you sleep enough?", "What activities leave you drained?"] },
    2: { pt: ["Está ciente que fadiga constante pode ser sinal de anemia ou tireoide?", "Quanto tempo mais vai usar café como muleta?", "Você sabia que a desidratação causa fadiga em 70% dos casos?"], en: ["Are you aware that constant fatigue can signal anemia or thyroid issues?", "How much longer will you use coffee as a crutch?", "Did you know dehydration causes fatigue in 70% of cases?"] },
    3: { pt: ["Percebe que essa exaustão pode ser inflamação silenciosa?", "Está disposto a investigar a causa?", "Você sabia que a fadiga crônica aumenta o risco de depressão?"], en: ["Do you realize this exhaustion could be silent inflammation?", "Are you willing to investigate the cause?", "Did you know chronic fatigue increases depression risk?"] },
    4: { pt: ["Interessado em saber quais vitaminas B são essenciais para sua energia?", "Quer conhecer plantas adaptogênicas que combatem o stress?", "Sabia que otimizar suas mitocôndrias pode revolucionar sua disposição?"], en: ["Interested in knowing which B vitamins are essential for your energy?", "Want to know adaptogenic plants that fight stress?", "Did you know optimizing your mitochondria can revolutionize your energy?"] },
    5: { pt: ["Quer conhecer a fórmula que restaura a energia celular?", "Pronto para uma solução que te dá disposição real?", "Interessado em ver como nosso suplemento melhora o foco?"], en: ["Want to know the formula that restores cellular energy?", "Ready for a solution that gives you real energy?", "Interested in seeing how our supplement improves focus?"] },
    6: { pt: ["Precisa entender como nosso suplemento otimiza seu metabolismo?", "Quer discutir como combinar o suplemento com hábitos de sono?", "Podemos analisar como recuperar sua energia pode transformar sua vida?"], en: ["Need to understand how our supplement optimizes your metabolism?", "Want to discuss combining the supplement with sleep habits?", "Can we analyze how regaining your energy can transform your life?"] }
  },
  back_pain: {
    1: { pt: ["Você passa o dia sentado?", "Seus sapatos são confortáveis?", "Com que frequência você se alonga?"], en: ["Do you spend the day sitting?", "Are your shoes comfortable?", "How often do you stretch?"] },
    2: { pt: ["Está ciente que má postura hoje significa dor crônica amanhã?", "Quanto peso extra sua coluna está aguentando?", "Você sabia que músculos abdominais fracos sobrecarregam a lombar?"], en: ["Are you aware that poor posture today means chronic pain tomorrow?", "How much extra weight is your spine enduring?", "Did you know weak abdominal muscles overload the lower back?"] },
    3: { pt: ["Percebe que essa dor pode evoluir para hérnia de disco?", "Está disposto a fortalecer seu core?", "Você sabia que dor nas costas crônica afeta sua qualidade de vida?"], en: ["Do you realize this pain can evolve into a herniated disc?", "Are you willing to strengthen your core?", "Did you know chronic back pain affects your quality of life?"] },
    4: { pt: ["Interessado em saber como Glucosamina e Condroitina reparam suas articulações?", "Quer conhecer plantas anti-inflamatórias mais seguras que remédios?", "Sabia que o Colágeno é essencial para a saúde dos seus discos?"], en: ["Interested in knowing how Glucosamine and Chondroitin repair your joints?", "Want to know anti-inflammatory plants safer than medications?", "Did you know Collagen is essential for the health of your discs?"] },
    5: { pt: ["Quer conhecer a fórmula que fortalece a coluna e alivia a dor?", "Pronto para uma solução que melhora sua mobilidade?", "Interessado em ver como nosso suplemento previne futuras lesões?"], en: ["Want to know the formula that strengthens the spine and relieves pain?", "Ready for a solution that improves your mobility?", "Interested in seeing how our supplement prevents future injuries?"] },
    6: { pt: ["Precisa entender como nosso suplemento reduz a inflamação articular?", "Quer discutir exercícios simples que potencializam o efeito?", "Podemos analisar como viver sem dor nas costas pode te permitir voltar a fazer o que ama?"], en: ["Need to understand how our supplement reduces joint inflammation?", "Want to discuss simple exercises that enhance the effect?", "Can we analyze how living without back pain can allow you to return to doing what you love?"] }
  },
  unknown: {
    1: { pt: ["Você consegue descrever melhor essa sensação?", "Há quanto tempo você se sente assim?", "Algum outro sintoma específico?"], en: ["Can you better describe this feeling?", "How long have you been feeling this way?", "Any other specific symptoms?"] },
    2: { pt: ["Está ciente que sintomas vagos podem ser os primeiros sinais de algo sério?", "Quanto tempo vai esperar até que isso se torne um problema real?", "Você sabia que deficiências nutricionais se manifestam de formas variadas?"], en: ["Are you aware that vague symptoms can be the first signs of something serious?", "How long will you wait until this becomes a real problem?", "Did you know nutritional deficiencies manifest in diverse ways?"] },
    3: { pt: ["Percebe que ignorar seu corpo pode levar a diagnósticos tardios?", "Está disposto a investigar a fundo?", "Você sabia que inflamação crônica silenciosa é a raiz de muitas doenças?"], en: ["Do you realize that ignoring your body can lead to late diagnoses?", "Are you willing to investigate thoroughly?", "Did you know silent chronic inflammation is the root of many diseases?"] },
    4: { pt: ["Interessado em saber quais vitaminas e minerais são cruciais para o bem-estar?", "Quer conhecer plantas adaptogênicas que ajudam seu corpo?", "Sabia que equilibrar seu microbioma intestinal pode resolver muitos sintomas?"], en: ["Interested in knowing which vitamins and minerals are crucial for well-being?", "Want to know adaptogenic plants that help your body?", "Did you know balancing your gut microbiome can resolve many symptoms?"] },
    5: { pt: ["Quer conhecer uma fórmula completa que aborda as causas comuns de mal-estar?", "Pronto para uma solução que reequilibra seu sistema?", "Interessado em ver como nosso suplemento melhora energia, sono e humor?"], en: ["Want to know a complete formula that addresses common causes of malaise?", "Ready for a solution that rebalances your system?", "Interested in seeing how our supplement improves energy, sleep, and mood?"] },
    6: { pt: ["Precisa entender como nosso suplemento combate a inflamação silenciosa?", "Quer discutir como pequenas mudanças na dieta potencializam o efeito?", "Podemos analisar como voltar a se sentir 'normal' pode impactar sua vida?"], en: ["Need to understand how our supplement fights silent inflammation?", "Want to discuss how small dietary changes enhance the effect?", "Can we analyze how feeling 'normal' again can impact your life?"] }
  }
};

// Função simplificada para identificar o sintoma principal e o idioma
function detectSymptomAndLanguage(message) {
  const lowerMessage = String(message).toLowerCase();
  let sintomaKey = "unknown";
  let language = "en"; // Default to English

  // Detectar idioma (simples)
  if (lowerMessage.includes("dor") || lowerMessage.includes("cabeca") || lowerMessage.includes("estomago") || lowerMessage.includes("costas") || lowerMessage.includes("cansado") || lowerMessage.includes("fadiga")) {
    language = "pt";
  }

  // Detectar sintoma (simplificado)
  if (lowerMessage.includes("stomach") || lowerMessage.includes("digest") || lowerMessage.includes("azia") || lowerMessage.includes("estomago") || lowerMessage.includes("barriga")) {
    sintomaKey = "stomach_pain";
  } else if (lowerMessage.includes("head") || lowerMessage.includes("migraine") || lowerMessage.includes("cabeca") || lowerMessage.includes("enxaqueca")) {
    sintomaKey = "headache";
  } else if (lowerMessage.includes("tired") || lowerMessage.includes("fatigue") || lowerMessage.includes("cansado") || lowerMessage.includes("fadiga") || lowerMessage.includes("energia")) {
    sintomaKey = "fatigue";
  } else if (lowerMessage.includes("back") || lowerMessage.includes("spine") || lowerMessage.includes("costas") || lowerMessage.includes("lombar") || lowerMessage.includes("coluna")) {
    sintomaKey = "back_pain";
  }
  
  return { sintomaKey, language };
}

// Função principal exportada - ultra simplificada
function getSymptomContext(userMessage, userName = "", userAge = "", userWeight = "", funnelPhase = 1, previousSymptom = null, previouslySelectedQuestions = []) {
  try {
    // Garantir que userMessage seja string
    const messageText = String(userMessage || "");
    
    // Detectar sintoma e idioma
    const { sintomaKey: detectedSymptom, language } = detectSymptomAndLanguage(messageText);
    
    // Manter o sintoma anterior se o atual for 'unknown' e houver um anterior
    const sintomaKey = (detectedSymptom === "unknown" && previousSymptom && previousSymptom !== "unknown") ? previousSymptom : detectedSymptom;
    
    // Obter introdução sarcástica
    const introOptions = intros[sintomaKey]?.[language] || intros.unknown[language];
    const intro = introOptions[0].replace("{userName}", userName || "");
    
    // Obter explicação científica simplificada
    const explanationOptions = explanations[sintomaKey]?.[funnelPhase]?.[language] || explanations.unknown[1][language];
    const scientificExplanation = explanationOptions[0];
    
    // Obter perguntas de follow-up
    const phaseQuestions = followupQuestions[sintomaKey]?.[funnelPhase]?.[language] || followupQuestions.unknown[1][language];
    const followupQuestionsList = phaseQuestions.slice(0, 3);
    
    return {
      sintoma: sintomaKey,
      language: language,
      intro: intro,
      scientificExplanation: scientificExplanation,
      followupQuestions: followupQuestionsList
    };
  } catch (error) {
    // Retornar um contexto de erro padrão
    return {
      sintoma: "error",
      language: "en",
      intro: "Oops, something went wrong here.",
      scientificExplanation: "I couldn't process your request. Please try again with a different question.",
      followupQuestions: ["Try again with a different question?", "Need help with something else?"]
    };
  }
}

// Exportar a função principal
export { getSymptomContext };
