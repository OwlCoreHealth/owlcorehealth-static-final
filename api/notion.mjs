import { Client } from "@notionhq/client";

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

// Função principal para consulta ao Notion
export async function getSymptomContext(userMessage, userName) {
  try {
    // Detectar idioma da mensagem
    const language = detectLanguage(userMessage);
    
    // Frases de abertura sarcástica quando o formulário não for preenchido
    const frasesSarcasticas = {
      pt: [
        "Sem seu nome, idade ou peso, posso te dar conselhos… tão úteis quanto ler a sorte no biscoito da sorte.",
        "Ignorar o formulário? Estratégia ousada. Vamos ver no que dá.",
        "Você ignora sua saúde assim também? Posso tentar adivinhar seu perfil com superpoderes… ou não."
      ],
      en: [
        "Without your name, age or weight, my advice is about as useful as a fortune cookie.",
        "Skipping the form? Bold move. Let's see how that works out.",
        "Do you ignore your health like this too? I could guess with superpowers… or not."
      ]
    };

    // Verificando se o formulário foi preenchido
    const hasForm = userName && userName.trim() !== ""; // Verifica se o nome foi fornecido
    const intro = hasForm
      ? language === "pt" 
        ? `${userName}, vamos focar nisso.` 
        : `${userName}, let's focus on this.`
      : frasesSarcasticas[language][Math.floor(Math.random() * frasesSarcasticas[language].length)]; // Escolhe uma frase sarcástica aleatória

    const keywords = extractKeywords(userMessage);
    console.log("🧠 Palavras-chave extraídas:", keywords);

    if (!keywords.length) {
      return {
        sintoma: "unknown",
        intro: intro,
        scientificExplanation: getScientificExplanation("unknown", language),
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
      scientificExplanation: getScientificExplanation(sintomaKey, language),
      followupQuestions: getFollowupQuestions(sintomaKey, language)
    };

  } catch (error) {
    console.error("❌ Erro ao consultar o Notion:", error);
    return {
      sintoma: "unknown",
      intro: language === "pt" ? "Desculpe, tive um problema ao processar sua consulta." : "Sorry, I had an issue processing your query.",
      scientificExplanation: getScientificExplanation("unknown", language),
      followupQuestions: getFollowupQuestions("unknown", language)
    };
  }
}

// Função para obter explicações científicas com base no sintoma e idioma
function getScientificExplanation(symptom, language) {
  const explanations = {
    stomach_pain: {
      pt: `As dores de estômago podem ter diversas causas, desde simples até mais complexas. Vamos explorar algumas possibilidades científicas:

A dor abdominal é processada através de nociceptores (receptores de dor) que enviam sinais ao cérebro via nervos aferentes. Estes sinais são interpretados pelo córtex somatossensorial, resultando na sensação de dor que você experimenta.

Causas comuns incluem:

1. **Gastrite ou Inflamação Gástrica**: Ocorre quando o revestimento do estômago se inflama, geralmente devido à infecção por H. pylori ou uso prolongado de anti-inflamatórios. A inflamação ativa os nociceptores da mucosa gástrica.

2. **Refluxo Gastroesofágico**: Acontece quando o ácido estomacal retorna ao esôfago, irritando seu revestimento. O esfíncter esofágico inferior (EEI) normalmente impede esse refluxo, mas pode enfraquecer devido a diversos fatores.

3. **Síndrome do Intestino Irritável**: Condição funcional que afeta o movimento intestinal e a sensibilidade visceral. Estudos mostram uma desregulação do eixo cérebro-intestino, com hipersensibilidade dos nervos entéricos.

4. **Estresse e Ansiedade**: O eixo hipotálamo-pituitária-adrenal (HPA) ativa-se durante o estresse, liberando cortisol e adrenalina, que podem alterar a motilidade gastrointestinal e aumentar a sensibilidade à dor.`,
      
      en: `Stomach pain can have various causes, ranging from simple to more complex. Let's explore some scientific possibilities:

Abdominal pain is processed through nociceptors (pain receptors) that send signals to the brain via afferent nerves. These signals are interpreted by the somatosensory cortex, resulting in the pain sensation you experience.

Common causes include:

1. **Gastritis or Gastric Inflammation**: Occurs when the stomach lining becomes inflamed, usually due to H. pylori infection or prolonged use of anti-inflammatory drugs. The inflammation activates nociceptors in the gastric mucosa.

2. **Gastroesophageal Reflux**: Happens when stomach acid flows back into the esophagus, irritating its lining. The lower esophageal sphincter (LES) normally prevents this reflux but can weaken due to various factors.

3. **Irritable Bowel Syndrome**: A functional condition affecting intestinal movement and visceral sensitivity. Studies show a dysregulation of the brain-gut axis, with hypersensitivity of enteric nerves.

4. **Stress and Anxiety**: The hypothalamic-pituitary-adrenal (HPA) axis activates during stress, releasing cortisol and adrenaline, which can alter gastrointestinal motility and increase pain sensitivity.`
    },
    
    headache: {
      pt: `As dores de cabeça são uma das queixas mais comuns e podem ter diversas origens neurológicas e vasculares. Vamos explorar a ciência por trás delas:

A dor de cabeça ocorre quando receptores de dor nas estruturas sensíveis da cabeça são ativados. Estes incluem vasos sanguíneos, músculos, nervos e tecidos que envolvem o cérebro. Curiosamente, o próprio tecido cerebral não possui receptores de dor.

Tipos comuns e suas causas:

1. **Enxaqueca**: Caracterizada por dor pulsátil, geralmente unilateral, e frequentemente acompanhada de náusea e sensibilidade à luz. Estudos neurofisiológicos mostram que a enxaqueca envolve a ativação do sistema trigeminovascular, com liberação de neuropeptídeos inflamatórios como o peptídeo relacionado ao gene da calcitonina (CGRP).

2. **Cefaleia Tensional**: A mais comum, caracterizada por dor em pressão bilateral. Está associada à contração prolongada dos músculos pericranianos e cervicais, com sensibilização dos nociceptores periféricos e centrais.

3. **Cefaleia em Salvas**: Extremamente dolorosa, ocorre em períodos ou "salvas". Envolve ativação do nervo trigêmeo e do hipotálamo, com dilatação dos vasos sanguíneos da região orbital.

4. **Cefaleia por Uso Excessivo de Medicamentos**: Paradoxalmente, o uso frequente de analgésicos pode levar a dores de cabeça crônicas, através de mecanismos de sensibilização central e alterações nos receptores de dor.`,
      
      en: `Headaches are one of the most common complaints and can have various neurological and vascular origins. Let's explore the science behind them:

Headache occurs when pain receptors in the head's sensitive structures are activated. These include blood vessels, muscles, nerves, and tissues surrounding the brain. Interestingly, brain tissue itself doesn't have pain receptors.

Common types and their causes:

1. **Migraine**: Characterized by pulsating pain, usually unilateral, and often accompanied by nausea and light sensitivity. Neurophysiological studies show that migraine involves activation of the trigeminovascular system, with the release of inflammatory neuropeptides such as calcitonin gene-related peptide (CGRP).

2. **Tension Headache**: The most common type, characterized by bilateral pressure pain. It's associated with prolonged contraction of pericranial and cervical muscles, with sensitization of peripheral and central nociceptors.

3. **Cluster Headache**: Extremely painful, occurring in periods or "clusters." It involves activation of the trigeminal nerve and hypothalamus, with dilation of blood vessels in the orbital region.

4. **Medication Overuse Headache**: Paradoxically, frequent use of painkillers can lead to chronic headaches, through mechanisms of central sensitization and changes in pain receptors.`
    },
    
    fatigue: {
      pt: `A fadiga é uma sensação complexa de cansaço que vai além do simples desgaste físico. Vamos explorar os mecanismos científicos por trás desse sintoma:

A fadiga envolve múltiplos sistemas fisiológicos e é regulada por uma interação complexa entre o sistema nervoso central, o sistema endócrino e o sistema imunológico.

Causas biológicas comuns:

1. **Depleção Energética Celular**: A fadiga frequentemente resulta de alterações no metabolismo energético celular. As mitocôndrias, "usinas de energia" das células, podem ter sua função comprometida por diversos fatores, reduzindo a produção de ATP (adenosina trifosfato), a principal molécula energética do corpo.

2. **Desregulação do Eixo HPA**: O eixo hipotálamo-pituitária-adrenal regula nossa resposta ao estresse e os níveis de cortisol. O estresse crônico pode levar à desregulação deste eixo, resultando em fadiga persistente e alterações no ciclo sono-vigília.

3. **Inflamação Sistêmica**: Citocinas pró-inflamatórias como IL-6, TNF-alfa e IL-1beta podem induzir comportamento de doença, que inclui fadiga como sintoma protetor. Este mecanismo evolutivo conserva energia durante infecções ou lesões.

4. **Desequilíbrios Hormonais**: Alterações nos níveis de hormônios como tireoidianos, cortisol, melatonina e hormônios sexuais podem afetar significativamente os níveis de energia. Por exemplo, o hipotireoidismo reduz o metabolismo basal, resultando em fadiga.`,
      
      en: `Fatigue is a complex sensation of tiredness that goes beyond simple physical wear. Let's explore the scientific mechanisms behind this symptom:

Fatigue involves multiple physiological systems and is regulated by a complex interaction between the central nervous system, the endocrine system, and the immune system.

Common biological causes:

1. **Cellular Energy Depletion**: Fatigue often results from alterations in cellular energy metabolism. Mitochondria, the cell's "power plants," can have their function compromised by various factors, reducing the production of ATP (adenosine triphosphate), the body's main energy molecule.

2. **HPA Axis Dysregulation**: The hypothalamic-pituitary-adrenal axis regulates our stress response and cortisol levels. Chronic stress can lead to dysregulation of this axis, resulting in persistent fatigue and alterations in the sleep-wake cycle.

3. **Systemic Inflammation**: Pro-inflammatory cytokines such as IL-6, TNF-alpha, and IL-1beta can induce sickness behavior, which includes fatigue as a protective symptom. This evolutionary mechanism conserves energy during infections or injuries.

4. **Hormonal Imbalances**: Changes in hormone levels such as thyroid hormones, cortisol, melatonin, and sex hormones can significantly affect energy levels. For example, hypothyroidism reduces basal metabolism, resulting in fatigue.`
    },
    
    back_pain: {
      pt: `A dor nas costas, especialmente na região lombar, é uma das queixas mais comuns e pode ter origens complexas. Vamos explorar a ciência por trás desse sintoma:

A dor lombar envolve uma interação entre estruturas anatômicas, processos inflamatórios e mecanismos neurais de processamento da dor.

Causas anatômicas e fisiológicas:

1. **Disfunção Musculoesquelética**: A coluna vertebral é sustentada por músculos, ligamentos e tendões. Desequilíbrios na força muscular, especialmente no core (músculos abdominais e paravertebrais), podem levar a sobrecarga e microlesões nas estruturas de suporte, ativando nociceptores locais.

2. **Alterações Discais**: Os discos intervertebrais funcionam como amortecedores entre as vértebras. Com o tempo ou devido a traumas, podem ocorrer protrusões ou hérnias discais, onde o núcleo pulposo pressiona raízes nervosas, causando dor radicular (ciática).

3. **Sensibilização Central**: Em casos crônicos, ocorre um fenômeno chamado sensibilização central, onde o sistema nervoso se torna hipersensível, amplificando sinais de dor mesmo após a resolução da lesão inicial. Neurotransmissores como substância P e glutamato estão envolvidos neste processo.

4. **Componente Psicossocial**: Estudos mostram que fatores como estresse, ansiedade e depressão podem amplificar a percepção da dor lombar através da modulação descendente da dor, envolvendo áreas cerebrais como a substância cinzenta periaquedutal e o locus coeruleus.`,
      
      en: `Back pain, especially in the lumbar region, is one of the most common complaints and can have complex origins. Let's explore the science behind this symptom:

Lumbar pain involves an interaction between anatomical structures, inflammatory processes, and neural mechanisms of pain processing.

Anatomical and physiological causes:

1. **Musculoskeletal Dysfunction**: The spine is supported by muscles, ligaments, and tendons. Imbalances in muscle strength, especially in the core (abdominal and paravertebral muscles), can lead to overload and microinjuries in supporting structures, activating local nociceptors.

2. **Disc Changes**: Intervertebral discs function as cushions between vertebrae. Over time or due to trauma, disc protrusions or herniations can occur, where the nucleus pulposus presses on nerve roots, causing radicular pain (sciatica).

3. **Central Sensitization**: In chronic cases, a phenomenon called central sensitization occurs, where the nervous system becomes hypersensitive, amplifying pain signals even after resolution of the initial injury. Neurotransmitters such as substance P and glutamate are involved in this process.

4. **Psychosocial Component**: Studies show that factors such as stress, anxiety, and depression can amplify the perception of back pain through descending pain modulation, involving brain areas such as the periaqueductal gray matter and locus coeruleus.`
    },
    
    unknown: {
      pt: `Quando os sintomas não são específicos, é importante considerar uma abordagem científica abrangente. Vamos explorar alguns conceitos gerais sobre como o corpo processa sintomas:

Os sintomas são sinais de que algo pode estar fora do equilíbrio no organismo. Do ponto de vista científico, eles representam:

1. **Mecanismos de Alerta**: O corpo possui sistemas sofisticados de detecção de alterações internas e externas. Receptores especializados (nociceptores, mecanorreceptores, quimiorreceptores) captam estímulos potencialmente prejudiciais e os transformam em sinais elétricos.

2. **Integração Neural**: Estes sinais são processados pelo sistema nervoso central, especialmente pelo tálamo e córtex somatossensorial, que interpretam a natureza, localização e intensidade do estímulo.

3. **Resposta Inflamatória**: Muitos sintomas estão associados à inflamação, um mecanismo protetor que envolve a liberação de mediadores como histamina, prostaglandinas e citocinas. Estes mediadores podem ativar receptores de dor e causar outros sintomas como inchaço e calor local.

4. **Eixo Psiconeuroendocrinoimunológico**: Existe uma comunicação bidirecional entre o sistema nervoso, endócrino e imunológico. Fatores psicológicos como estresse e ansiedade podem influenciar processos fisiológicos através deste eixo, alterando a percepção e manifestação de sintomas.`,
      
      en: `When symptoms are not specific, it's important to consider a comprehensive scientific approach. Let's explore some general concepts about how the body processes symptoms:

Symptoms are signs that something may be out of balance in the organism. From a scientific perspective, they represent:

1. **Alert Mechanisms**: The body has sophisticated systems for detecting internal and external changes. Specialized receptors (nociceptors, mechanoreceptors, chemoreceptors) capture potentially harmful stimuli and transform them into electrical signals.

2. **Neural Integration**: These signals are processed by the central nervous system, especially by the thalamus and somatosensory cortex, which interpret the nature, location, and intensity of the stimulus.

3. **Inflammatory Response**: Many symptoms are associated with inflammation, a protective mechanism involving the release of mediators such as histamine, prostaglandins, and cytokines. These mediators can activate pain receptors and cause other symptoms such as swelling and local heat.

4. **Psychoneuroendocrinoimmunological Axis**: There is bidirectional communication between the nervous, endocrine, and immune systems. Psychological factors such as stress and anxiety can influence physiological processes through this axis, altering the perception and manifestation of symptoms.`
    }
  };
  
  return explanations[symptom][language] || explanations.unknown[language];
}

// Função para obter perguntas de follow-up com base no sintoma e idioma
function getFollowupQuestions(symptom, language) {
  const questions = {
    stomach_pain: {
      pt: [
        "Você tem comido alimentos picantes ou gordurosos recentemente?",
        "Você tem se sentido estressado ultimamente? O estresse pode afetar seu estômago.",
        "Você tem histórico de condições como gastrite ou refluxo?"
      ],
      en: [
        "Have you been eating spicy or fatty foods recently?",
        "Have you been feeling stressed lately? Stress can affect your stomach.",
        "Do you have a history of conditions such as gastritis or reflux?"
      ]
    },
    headache: {
      pt: [
        "Você tem dormido o suficiente nas últimas noites?",
        "Você tem histórico de enxaquecas ou dores de cabeça tensionais?",
        "Você passou por situações de estresse intenso recentemente?"
      ],
      en: [
        "Have you been getting enough sleep in the last few nights?",
        "Do you have a history of migraines or tension headaches?",
        "Have you experienced intense stress situations recently?"
      ]
    },
    fatigue: {
      pt: [
        "Você tem se alimentado de forma equilibrada e regular?",
        "Você tem praticado atividade física regularmente?",
        "Você tem notado outros sintomas além da fadiga, como dores musculares ou alterações de humor?"
      ],
      en: [
        "Have you been eating a balanced and regular diet?",
        "Have you been exercising regularly?",
        "Have you noticed other symptoms besides fatigue, such as muscle pain or mood changes?"
      ]
    },
    back_pain: {
      pt: [
        "Você passa muito tempo sentado ou em posições que sobrecarregam a coluna?",
        "Você realiza exercícios específicos para fortalecer a musculatura das costas?",
        "A dor irradia para outras partes do corpo, como pernas ou braços?"
      ],
      en: [
        "Do you spend a lot of time sitting or in positions that overload your spine?",
        "Do you perform specific exercises to strengthen your back muscles?",
        "Does the pain radiate to other parts of your body, such as legs or arms?"
      ]
    },
    unknown: {
      pt: [
        "Você poderia descrever mais detalhadamente os sintomas que está sentindo?",
        "Há quanto tempo você vem sentindo esses sintomas?",
        "Você notou algum padrão ou fator que parece piorar ou melhorar os sintomas?"
      ],
      en: [
        "Could you describe in more detail the symptoms you are feeling?",
        "How long have you been experiencing these symptoms?",
        "Have you noticed any pattern or factor that seems to worsen or improve the symptoms?"
      ]
    }
  };
  
  return questions[symptom][language] || questions.unknown[language];
}

// Testando a função
// const userMessage = "I have stomach pain"; // Altere conforme necessário
// const userName = "João";  // Substitua pelo nome do usuário real

// getSymptomContext(userMessage, userName).then(response => {
//   console.log("🔎 Resultado final:", response);
//   if (!response) {
//     console.log("⚠️ Nenhum resultado encontrado.");
//   } else {
//     console.log("✅ Resultado encontrado!");
//   }
// });
