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

// Função para detectar o idioma da mensagem
function detectLanguage(message) {
  const portugueseWords = ["é", "você", "tem", "dores", "sintoma"];
  const englishWords = ["is", "you", "have", "pain", "symptom"];
  
  const messageLower = message.toLowerCase();
  let portugueseCount = 0;
  let englishCount = 0;
  
  portugueseWords.forEach(word => {
    if (messageLower.includes(word)) portugueseCount++;
  });
  
  englishWords.forEach(word => {
    if (messageLower.includes(word)) englishCount++;
  });

  return portugueseCount > englishCount ? "pt" : "en";
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

// Função principal para consulta ao Notion
export async function getSymptomContext(userMessage, userName, userAge, userWeight) {
  try {
    // Detectar idioma da mensagem
    const language = detectLanguage(userMessage);
    
    // Verificando se o formulário foi preenchido
    const hasForm = userName && userName.trim() !== ""; // Verifica se o nome foi fornecido
    
    // Escolher introdução com base no preenchimento do formulário
    let intro;
    if (hasForm) {
      // Detectando o sintoma com base nas palavras-chave
      let sintomaKey = "unknown";
      
      if (userMessage.toLowerCase().includes("stomach") || 
          userMessage.toLowerCase().includes("estômago") || 
          userMessage.toLowerCase().includes("estomago") || 
          userMessage.toLowerCase().includes("barriga")) {
        sintomaKey = "stomach_pain";
      } else if (userMessage.toLowerCase().includes("headache") || 
                userMessage.toLowerCase().includes("dor de cabeça") || 
                userMessage.toLowerCase().includes("cabeça")) {
        sintomaKey = "headache";
      } else if (userMessage.toLowerCase().includes("fatigue") || 
                userMessage.toLowerCase().includes("cansaço") || 
                userMessage.toLowerCase().includes("fadiga") || 
                userMessage.toLowerCase().includes("energia")) {
        sintomaKey = "fatigue";
      } else if (userMessage.toLowerCase().includes("back pain") || 
                userMessage.toLowerCase().includes("dor nas costas") || 
                userMessage.toLowerCase().includes("lombar")) {
        sintomaKey = "back_pain";
      }
      
      // Obter introdução sarcástica personalizada
      intro = getSarcasticIntro(sintomaKey, language, userName);
    } else {
      // Escolher uma frase sarcástica aleatória para formulário não preenchido
      intro = frasesSarcasticas[language][Math.floor(Math.random() * frasesSarcasticas[language].length)];
    }

    const keywords = extractKeywords(userMessage);
    console.log("🧠 Palavras-chave extraídas:", keywords);

    if (!keywords.length) {
      return {
        sintoma: "unknown",
        intro: intro,
        scientificExplanation: getScientificExplanation("unknown", language, userName, userAge, userWeight),
        followupQuestions: getFollowupQuestions("unknown", language)
      };
    }

    const filter = {
      or: keywords.map(word => ({
        property: "Palavras-chave", // Nome da propriedade no banco de dados do Notion
        rich_text: {
          contains: word // Verificar se cada palavra-chave está no campo "Palavras-chave"
        }
      }))
    };

    console.log("📦 Filtro enviado ao Notion:", JSON.stringify(filter, null, 2));

    const response = await notion.databases.query({
      database_id: databaseId // ID do banco de dados
    });

    console.log("📨 Resposta do Notion:", JSON.stringify(response, null, 2));

    // Detectando o sintoma com base nas palavras-chave
    let sintomaKey = "unknown";
    
    if (userMessage.toLowerCase().includes("stomach") || 
        userMessage.toLowerCase().includes("estômago") || 
        userMessage.toLowerCase().includes("estomago") || 
        userMessage.toLowerCase().includes("barriga")) {
      sintomaKey = "stomach_pain";
    } else if (userMessage.toLowerCase().includes("headache") || 
               userMessage.toLowerCase().includes("dor de cabeça") || 
               userMessage.toLowerCase().includes("cabeça")) {
      sintomaKey = "headache";
    } else if (userMessage.toLowerCase().includes("fatigue") || 
               userMessage.toLowerCase().includes("cansaço") || 
               userMessage.toLowerCase().includes("fadiga") || 
               userMessage.toLowerCase().includes("energia")) {
      sintomaKey = "fatigue";
    } else if (userMessage.toLowerCase().includes("back pain") || 
               userMessage.toLowerCase().includes("dor nas costas") || 
               userMessage.toLowerCase().includes("lombar")) {
      sintomaKey = "back_pain";
    }

    // Retornando um objeto estruturado com todas as informações necessárias
    return {
      sintoma: sintomaKey,
      intro: intro,
      scientificExplanation: getScientificExplanation(sintomaKey, language, userName, userAge, userWeight),
      followupQuestions: getFollowupQuestions(sintomaKey, language)
    };

  } catch (error) {
    console.error("❌ Erro ao consultar o Notion:", error);
    const language = detectLanguage(userMessage);
    return {
      sintoma: "unknown",
      intro: language === "pt" ? "Desculpe, tive um problema ao processar sua consulta." : "Sorry, I had an issue processing your query.",
      scientificExplanation: getScientificExplanation("unknown", language, userName, userAge, userWeight),
      followupQuestions: getFollowupQuestions("unknown", language)
    };
  }
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

Causas comuns que você provavelmente está ignorando:

1. **Gastrite ou Inflamação Gástrica**: Ocorre quando o revestimento do estômago se inflama, geralmente devido à infecção por H. pylori ou uso prolongado de anti-inflamatórios. A inflamação ativa os nociceptores da mucosa gástrica. E sim, aquela "pequena" dose diária de anti-inflamatório que você toma pode estar destruindo seu estômago.

2. **Refluxo Gastroesofágico**: Acontece quando o ácido estomacal retorna ao esôfago, irritando seu revestimento. O esfíncter esofágico inferior (EEI) normalmente impede esse refluxo, mas pode enfraquecer devido a diversos fatores. Aquela pizza às 23h? Está literalmente queimando seu esôfago enquanto você dorme.

3. **Síndrome do Intestino Irritável**: Condição funcional que afeta o movimento intestinal e a sensibilidade visceral. Estudos mostram uma desregulação do eixo cérebro-intestino, com hipersensibilidade dos nervos entéricos. Seu intestino está literalmente em guerra, e você está ignorando os sinais de fumaça.

4. **Estresse e Ansiedade**: O eixo hipotálamo-pituitária-adrenal (HPA) ativa-se durante o estresse, liberando cortisol e adrenalina, que podem alterar a motilidade gastrointestinal e aumentar a sensibilidade à dor. Seu estilo de vida caótico está transformando seu estômago em uma zona de guerra bioquímica.`,
      
      en: `Stomach pain can have various causes, ranging from simple to more complex. And no, it's not "just a little pain" as you're probably thinking.

Abdominal pain is processed through nociceptors (pain receptors) that send signals to the brain via afferent nerves. These signals are interpreted by the somatosensory cortex, resulting in the pain sensation you experience.

${personalizedStat}

Common causes you're probably ignoring:

1. **Gastritis or Gastric Inflammation**: Occurs when the stomach lining becomes inflamed, usually due to H. pylori infection or prolonged use of anti-inflammatory drugs. The inflammation activates nociceptors in the gastric mucosa. And yes, that "small" daily dose of anti-inflammatory you take might be destroying your stomach.

2. **Gastroesophageal Reflux**: Happens when stomach acid flows back into the esophagus, irritating its lining. The lower esophageal sphincter (LES) normally prevents this reflux but can weaken due to various factors. That pizza at 11 PM? It's literally burning your esophagus while you sleep.

3. **Irritable Bowel Syndrome**: A functional condition affecting intestinal movement and visceral sensitivity. Studies show a dysregulation of the brain-gut axis, with hypersensitivity of enteric nerves. Your intestine is literally at war, and you're ignoring the smoke signals.

4. **Stress and Anxiety**: The hypothalamic-pituitary-adrenal (HPA) axis activates during stress, releasing cortisol and adrenaline, which can alter gastrointestinal motility and increase pain sensitivity. Your chaotic lifestyle is turning your stomach into a biochemical war zone.`
    },
    
    headache: {
      pt: `As dores de cabeça são uma das queixas mais comuns e podem ter diversas origens neurológicas e vasculares. E não, não é "normal" ter dor de cabeça regularmente, por mais que você tente se convencer disso.

A dor de cabeça ocorre quando receptores de dor nas estruturas sensíveis da cabeça são ativados. Estes incluem vasos sanguíneos, músculos, nervos e tecidos que envolvem o cérebro. Curiosamente, o próprio tecido cerebral não possui receptores de dor.

${personalizedStat}

Tipos comuns que você está provavelmente subestimando:

1. **Enxaqueca**: Caracterizada por dor pulsátil, geralmente unilateral, e frequentemente acompanhada de náusea e sensibilidade à luz. Estudos neurofisiológicos mostram que a enxaqueca envolve a ativação do sistema trigeminovascular, com liberação de neuropeptídeos inflamatórios como o peptídeo relacionado ao gene da calcitonina (CGRP). Não é "só uma dor de cabeça" - é seu cérebro literalmente em pânico.

2. **Cefaleia Tensional**: A mais comum, caracterizada por dor em pressão bilateral. Está associada à contração prolongada dos músculos pericranianos e cervicais, com sensibilização dos nociceptores periféricos e centrais. Seu estilo de vida estressante está transformando seus músculos em cordas de violão desafinadas.

3. **Cefaleia em Salvas**: Extremamente dolorosa, ocorre em períodos ou "salvas". Envolve ativação do nervo trigêmeo e do hipotálamo, com dilatação dos vasos sanguíneos da região orbital. Pessoas descrevem como "um ferro quente sendo inserido no olho". Ainda acha que sua dor é "só um incômodo"?

4. **Cefaleia por Uso Excessivo de Medicamentos**: Paradoxalmente, o uso frequente de analgésicos pode levar a dores de cabeça crônicas, através de mecanismos de sensibilização central e alterações nos receptores de dor. Sim, aquele remédio que você toma como se fosse água está potencialmente piorando seu problema.`,
      
      en: `Headaches are one of the most common complaints and can have various neurological and vascular origins. And no, it's not "normal" to have headaches regularly, no matter how much you try to convince yourself.

Headache occurs when pain receptors in the head's sensitive structures are activated. These include blood vessels, muscles, nerves, and tissues surrounding the brain. Interestingly, brain tissue itself doesn't have pain receptors.

${personalizedStat}

Common types you're probably underestimating:

1. **Migraine**: Characterized by pulsating pain, usually unilateral, and often accompanied by nausea and light sensitivity. Neurophysiological studies show that migraine involves activation of the trigeminovascular system, with the release of inflammatory neuropeptides such as calcitonin gene-related peptide (CGRP). It's not "just a headache" - it's your brain literally in panic mode.

2. **Tension Headache**: The most common type, characterized by bilateral pressure pain. It's associated with prolonged contraction of pericranial and cervical muscles, with sensitization of peripheral and central nociceptors. Your stressful lifestyle is turning your muscles into out-of-tune violin strings.

3. **Cluster Headache**: Extremely painful, occurring in periods or "clusters." It involves activation of the trigeminal nerve and hypothalamus, with dilation of blood vessels in the orbital region. People describe it as "a hot poker being inserted into the eye." Still think your pain is "just a nuisance"?

4. **Medication Overuse Headache**: Paradoxically, frequent use of painkillers can lead to chronic headaches, through mechanisms of central sensitization and changes in pain receptors. Yes, that medicine you take like water is potentially making your problem worse.`
    },
    
    fatigue: {
      pt: `A fadiga é uma sensação complexa de cansaço que vai além do simples desgaste físico. E não, não é "normal" precisar de 5 cafés para funcionar ou dormir 8 horas e acordar cansado.

A fadiga envolve múltiplos sistemas fisiológicos e é regulada por uma interação complexa entre o sistema nervoso central, o sistema endócrino e o sistema imunológico.

${personalizedStat}

Causas biológicas que você está ignorando:

1. **Depleção Energética Celular**: A fadiga frequentemente resulta de alterações no metabolismo energético celular. As mitocôndrias, "usinas de energia" das células, podem ter sua função comprometida por diversos fatores, reduzindo a produção de ATP (adenosina trifosfato), a principal molécula energética do corpo. Suas células estão literalmente sem combustível, e você acha que mais um café vai resolver?

2. **Desregulação do Eixo HPA**: O eixo hipotálamo-pituitária-adrenal regula nossa resposta ao estresse e os níveis de cortisol. O estresse crônico pode levar à desregulação deste eixo, resultando em fadiga persistente e alterações no ciclo sono-vigília. Seu corpo está em modo de emergência permanente, e você ainda se pergunta por que está cansado?

3. **Inflamação Sistêmica**: Citocinas pró-inflamatórias como IL-6, TNF-alfa e IL-1beta podem induzir comportamento de doença, que inclui fadiga como sintoma protetor. Este mecanismo evolutivo conserva energia durante infecções ou lesões. Seu corpo está literalmente em guerra interna, e você está ignorando as sirenes de alerta.

4. **Desequilíbrios Hormonais**: Alterações nos níveis de hormônios como tireoidianos, cortisol, melatonina e hormônios sexuais podem afetar significativamente os níveis de energia. Por exemplo, o hipotireoidismo reduz o metabolismo basal, resultando em fadiga. Sua orquestra hormonal está desafinada, e você acha que é só "falta de motivação"?`,
      
      en: `Fatigue is a complex sensation of tiredness that goes beyond simple physical wear. And no, it's not "normal" to need 5 coffees to function or to sleep 8 hours and wake up tired.

Fatigue involves multiple physiological systems and is regulated by a complex interaction between the central nervous system, the endocrine system, and the immune system.

${personalizedStat}

Biological causes you're ignoring:

1. **Cellular Energy Depletion**: Fatigue often results from alterations in cellular energy metabolism. Mitochondria, the cell's "power plants," can have their function compromised by various factors, reducing the production of ATP (adenosine triphosphate), the body's main energy molecule. Your cells are literally out of fuel, and you think another coffee will solve it?

2. **HPA Axis Dysregulation**: The hypothalamic-pituitary-adrenal axis regulates our stress response and cortisol levels. Chronic stress can lead to dysregulation of this axis, resulting in persistent fatigue and alterations in the sleep-wake cycle. Your body is in permanent emergency mode, and you still wonder why you're tired?

3. **Systemic Inflammation**: Pro-inflammatory cytokines such as IL-6, TNF-alpha, and IL-1beta can induce sickness behavior, which includes fatigue as a protective symptom. This evolutionary mechanism conserves energy during infections or injuries. Your body is literally in internal warfare, and you're ignoring the alert sirens.

4. **Hormonal Imbalances**: Changes in hormone levels such as thyroid hormones, cortisol, melatonin, and sex hormones can significantly affect energy levels. For example, hypothyroidism reduces basal metabolism, resulting in fatigue. Your hormonal orchestra is out of tune, and you think it's just "lack of motivation"?`
    },
    
    back_pain: {
      pt: `A dor nas costas, especialmente na região lombar, é uma das queixas mais comuns e pode ter origens complexas. E não, não é "normal" sentir dor nas costas regularmente, por mais que você tente normalizar isso.

A dor lombar envolve uma interação entre estruturas anatômicas, processos inflamatórios e mecanismos neurais de processamento da dor.

${personalizedStat}

Causas que você está provavelmente subestimando:

1. **Disfunção Musculoesquelética**: A coluna vertebral é sustentada por músculos, ligamentos e tendões. Desequilíbrios na força muscular, especialmente no core (músculos abdominais e paravertebrais), podem levar a sobrecarga e microlesões nas estruturas de suporte, ativando nociceptores locais. Seu estilo de vida sedentário está transformando sua coluna em uma torre instável prestes a desabar.

2. **Alterações Discais**: Os discos intervertebrais funcionam como amortecedores entre as vértebras. Com o tempo ou devido a traumas, podem ocorrer protrusões ou hérnias discais, onde o núcleo pulposo pressiona raízes nervosas, causando dor radicular (ciática). Seus discos estão literalmente sendo esmagados enquanto você ignora os sinais.

3. **Sensibilização Central**: Em casos crônicos, ocorre um fenômeno chamado sensibilização central, onde o sistema nervoso se torna hipersensível, amplificando sinais de dor mesmo após a resolução da lesão inicial. Neurotransmissores como substância P e glutamato estão envolvidos neste processo. Seu sistema nervoso está em modo de alarme constante, e você acha que é "só uma dorzinha"?

4. **Componente Psicossocial**: Estudos mostram que fatores como estresse, ansiedade e depressão podem amplificar a percepção da dor lombar através da modulação descendente da dor, envolvendo áreas cerebrais como a substância cinzenta periaquedutal e o locus coeruleus. Sua mente está literalmente amplificando sua dor, e você continua ignorando a conexão mente-corpo.`,
      
      en: `Back pain, especially in the lumbar region, is one of the most common complaints and can have complex origins. And no, it's not "normal" to regularly feel back pain, no matter how much you try to normalize it.

Lumbar pain involves an interaction between anatomical structures, inflammatory processes, and neural mechanisms of pain processing.

${personalizedStat}

Causes you're probably underestimating:

1. **Musculoskeletal Dysfunction**: The spine is supported by muscles, ligaments, and tendons. Imbalances in muscle strength, especially in the core (abdominal and paravertebral muscles), can lead to overload and microinjuries in supporting structures, activating local nociceptors. Your sedentary lifestyle is turning your spine into an unstable tower about to collapse.

2. **Disc Changes**: Intervertebral discs function as cushions between vertebrae. Over time or due to trauma, disc protrusions or herniations can occur, where the nucleus pulposus presses on nerve roots, causing radicular pain (sciatica). Your discs are literally being crushed while you ignore the signs.

3. **Central Sensitization**: In chronic cases, a phenomenon called central sensitization occurs, where the nervous system becomes hypersensitive, amplifying pain signals even after resolution of the initial injury. Neurotransmitters such as substance P and glutamate are involved in this process. Your nervous system is in constant alarm mode, and you think it's "just a little pain"?

4. **Psychosocial Component**: Studies show that factors such as stress, anxiety, and depression can amplify the perception of back pain through descending pain modulation, involving brain areas such as the periaqueductal gray matter and locus coeruleus. Your mind is literally amplifying your pain, and you continue to ignore the mind-body connection.`
    },
    
    unknown: {
      pt: `Quando os sintomas não são específicos, é importante considerar uma abordagem científica abrangente. E não, sintomas persistentes não são "só coisa da sua cabeça" como você provavelmente está tentando se convencer.

Os sintomas são sinais de que algo pode estar fora do equilíbrio no organismo. Do ponto de vista científico, eles representam:

${personalizedStat}

Mecanismos que você está ignorando:

1. **Mecanismos de Alerta**: O corpo possui sistemas sofisticados de detecção de alterações internas e externas. Receptores especializados (nociceptores, mecanorreceptores, quimiorreceptores) captam estímulos potencialmente prejudiciais e os transformam em sinais elétricos. Seu corpo está literalmente gritando por atenção, e você está com os fones de ouvido no máximo.

2. **Integração Neural**: Estes sinais são processados pelo sistema nervoso central, especialmente pelo tálamo e córtex somatossensorial, que interpretam a natureza, localização e intensidade do estímulo. Seu cérebro está tentando decifrar um código de emergência, e você está ignorando a mensagem.

3. **Resposta Inflamatória**: Muitos sintomas estão associados à inflamação, um mecanismo protetor que envolve a liberação de mediadores como histamina, prostaglandinas e citocinas. Estes mediadores podem ativar receptores de dor e causar outros sintomas como inchaço e calor local. Seu corpo está literalmente em chamas por dentro, e você está tratando como uma fogueira controlada.

4. **Eixo Psiconeuroendocrinoimunológico**: Existe uma comunicação bidirecional entre o sistema nervoso, endócrino e imunológico. Fatores psicológicos como estresse e ansiedade podem influenciar processos fisiológicos através deste eixo, alterando a percepção e manifestação de sintomas. Sua mente e corpo estão em uma guerra civil, e você está fingindo que é apenas um pequeno desentendimento.`,
      
      en: `When symptoms are not specific, it's important to consider a comprehensive scientific approach. And no, persistent symptoms are not "just in your head" as you're probably trying to convince yourself.

Symptoms are signs that something may be out of balance in the organism. From a scientific perspective, they represent:

${personalizedStat}

Mechanisms you're ignoring:

1. **Alert Mechanisms**: The body has sophisticated systems for detecting internal and external changes. Specialized receptors (nociceptors, mechanoreceptors, chemoreceptors) capture potentially harmful stimuli and transform them into electrical signals. Your body is literally screaming for attention, and you have your headphones on max volume.

2. **Neural Integration**: These signals are processed by the central nervous system, especially by the thalamus and somatosensory cortex, which interpret the nature, location, and intensity of the stimulus. Your brain is trying to decipher an emergency code, and you're ignoring the message.

3. **Inflammatory Response**: Many symptoms are associated with inflammation, a protective mechanism involving the release of mediators such as histamine, prostaglandins, and cytokines. These mediators can activate pain receptors and cause other symptoms such as swelling and local heat. Your body is literally on fire inside, and you're treating it like a controlled bonfire.

4. **Psychoneuroendocrinoimmunological Axis**: There is bidirectional communication between the nervous, endocrine, and immune systems. Psychological factors such as stress and anxiety can influence physiological processes through this axis, altering the perception and manifestation of symptoms. Your mind and body are in a civil war, and you're pretending it's just a small disagreement.`
    }
  };
  
  return explanations[symptom][language] || explanations.unknown[language];
}

// Função para obter perguntas de follow-up com base no sintoma e idioma
function getFollowupQuestions(symptom, language) {
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
  
  // Escolher aleatoriamente uma fase do funil para as perguntas
  const phases = [phase1Questions, phase2Questions, phase3Questions];
  const selectedPhase = phases[Math.floor(Math.random() * phases.length)];
  
  return selectedPhase[symptom][language] || selectedPhase.unknown[language];
}

// Testando a função
// const userMessage = "I have stomach pain"; // Altere conforme necessário
// const userName = "João";  // Substitua pelo nome do usuário real
// const userAge = 35;
// const userWeight = 80;

// getSymptomContext(userMessage, userName, userAge, userWeight).then(response => {
//   console.log("🔎 Resultado final:", response);
//   if (!response) {
//     console.log("⚠️ Nenhum resultado encontrado.");
//   } else {
//     console.log("✅ Resultado encontrado!");
//   }
// });
