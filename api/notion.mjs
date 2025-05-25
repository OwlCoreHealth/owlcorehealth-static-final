// notion.mjs - Integração híbrida com GPT-4o mini e tabela Notion
// Versão com prevenção de repetição de perguntas e progressão de funil

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
   - Fase 1: Explicação científica com linguagem simples + soluções rápidas
   - Fase 2: Consequências se não tomar cuidados
   - Fase 3: O que está realmente arriscando (agravamento)
   - Fase 4: Nutrientes e plantas naturais
   - Fase 5: Suplemento como solução completa
   - Fase 6: Plano B (se o utilizador continuar sem interesse)

4. REGRAS ESPECÍFICAS:
   - Se o utilizador não preencher o formulário, use uma das frases sarcásticas aleatórias sobre "adivinhar com biscoito da sorte"
   - Se o utilizador preencher o formulário, use sempre o nome dele e mencione estatísticas relacionadas à idade/peso
   - Varie suas respostas, nunca use o mesmo texto duas vezes
   - As 3 perguntas finais devem sempre conduzir para o próximo passo do funil, mas parecer que dão liberdade de escolha
   - Use a informação da tabela do Notion quando relevante, mas mantenha a liberdade de improvisar respostas no estilo Owl Savage
   - NUNCA REPITA AS MESMAS PERGUNTAS EM INTERAÇÕES DIFERENTES
   - Adapte o conteúdo com base na fase atual do funil (1-6)
   - Forneça respostas elaboradas e detalhadas, com bastante conteúdo em cada fase
`;

// ✅ Instanciando o cliente do Notion
const notion = new Client({
  auth: "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" // Chave de autenticação
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
  const portugueseWords = ["é", "você", "tem", "dores", "sintoma", "dor", "cabeça", "estômago", "costas", "cansado"];
  const englishWords = ["is", "you", "have", "pain", "symptom", "head", "stomach", "back", "tired"];
  
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

// Função para obter explicações científicas com base no sintoma e idioma
function getScientificExplanation(symptom, language, userName, userAge, userWeight) {
  // Estatística personalizada baseada nos dados do usuário
  const personalizedStat = getPersonalizedStatistic(symptom, userAge, userWeight, language);
  
  const explanations = {
    stomach_pain: {
      pt: `As dores de estômago podem ter diversas causas, desde simples até mais complexas. E não, não é "só uma dorzinha" como você provavelmente está pensando.

A dor abdominal é processada através de nociceptores (receptores de dor) que enviam sinais ao cérebro via nervos aferentes. Estes sinais são interpretados pelo córtex somatossensorial, resultando na sensação de dor que você experimenta.

${personalizedStat}

Mecanismos que você está ignorando:

1. **Mecanismos de Alerta**: O corpo possui sistemas sofisticados para detectar alterações internas e externas. Receptores especializados (nociceptores, mecanorreceptores, quimiorreceptores) captam estímulos potencialmente nocivos e os transformam em sinais elétricos. Seu corpo está literalmente gritando por atenção, e você está com os fones de ouvido no volume máximo.

2. **Integração Neural**: Esses sinais são processados pelo sistema nervoso central, especialmente pelo tálamo e córtex somatossensorial, que interpretam a natureza, localização e intensidade do estímulo. Seu cérebro está tentando decifrar um código de emergência, e você está ignorando a mensagem.

3. **Resposta Inflamatória**: Muitos sintomas estão associados à inflamação, um mecanismo protetor que envolve a liberação de mediadores como histamina, prostaglandinas e citocinas. Esses mediadores podem ativar receptores de dor e causar outros sintomas como inchaço e calor local. Seu corpo está literalmente em chamas por dentro, e você está tratando como uma fogueira controlada.

4. **Eixo Psiconeuroimunoendocrinológico**: Existe uma comunicação bidirecional entre os sistemas nervoso, endócrino e imunológico. Fatores psicológicos como estresse e ansiedade podem influenciar processos fisiológicos através deste eixo, alterando a percepção e manifestação dos sintomas. Sua mente e corpo estão em guerra civil, e você está fingindo que é apenas um pequeno desentendimento.`,
      en: `Stomach pains can have various causes, from simple to more complex. And no, it's not "just a little pain" as you're probably thinking.

Abdominal pain is processed through nociceptors (pain receptors) that send signals to the brain via afferent nerves. These signals are interpreted by the somatosensory cortex, resulting in the pain sensation you experience.

${personalizedStat}

Mechanisms you're ignoring:

1. **Alert Mechanisms**: The body has sophisticated systems for detecting internal and external changes. Specialized receptors (nociceptors, mechanoreceptors, chemoreceptors) capture potentially harmful stimuli and transform them into electrical signals. Your body is literally screaming for attention, and you have your headphones on max volume.

2. **Neural Integration**: These signals are processed by the central nervous system, especially by the thalamus and somatosensory cortex, which interpret the nature, location, and intensity of the stimulus. Your brain is trying to decipher an emergency code, and you're ignoring the message.

3. **Inflammatory Response**: Many symptoms are associated with inflammation, a protective mechanism involving the release of mediators such as histamine, prostaglandins, and cytokines. These mediators can activate pain receptors and cause other symptoms such as swelling and local heat. Your body is literally on fire inside, and you're treating it like a controlled bonfire.

4. **Psychoneuroendocrinoimmunological Axis**: There is bidirectional communication between the nervous, endocrine, and immune systems. Psychological factors such as stress and anxiety can influence physiological processes through this axis, altering the perception and manifestation of symptoms. Your mind and body are in a civil war, and you're pretending it's just a small disagreement.`
    },
    headache: {
      pt: `Dores de cabeça não são apenas um "incômodo" - são um sistema de alerta neurológico. E pelo visto, o seu está em modo de emergência.

A dor de cabeça ocorre quando receptores de dor nos vasos sanguíneos, músculos e nervos da cabeça e pescoço são ativados. Estes receptores enviam sinais através de vias nervosas para o tálamo, que processa e transmite a informação para o córtex cerebral, onde a dor é percebida e interpretada.

${personalizedStat}

Mecanismos que você está ignorando:

1. **Vasodilatação e Vasoconstricção**: Muitas dores de cabeça envolvem alterações no diâmetro dos vasos sanguíneos cerebrais. A dilatação ou contração anormal destes vasos pode estimular nociceptores (receptores de dor) nas meninges, resultando em dor. Seus vasos cerebrais estão fazendo uma montanha-russa, e você está fingindo que é apenas uma leve ondulação.

2. **Sensibilização Central**: A exposição repetida a estímulos dolorosos pode levar à sensibilização dos neurônios no sistema nervoso central, diminuindo o limiar de dor e aumentando a resposta a estímulos normalmente não dolorosos. Seu cérebro está literalmente se reprogramando para sentir mais dor, e você está tratando como uma atualização de software opcional.

3. **Neurotransmissores Desregulados**: Desequilíbrios em neurotransmissores como serotonina, dopamina e GABA podem contribuir para dores de cabeça. Estes mensageiros químicos regulam a transmissão da dor e o tônus vascular. Sua química cerebral está em caos, e você está agindo como se fosse apenas uma pequena flutuação.

4. **Inflamação Neurológica**: A liberação de neuropeptídeos inflamatórios como a substância P e o peptídeo relacionado ao gene da calcitonina (CGRP) pode causar inflamação neurogênica, contribuindo para a dor. Seu sistema nervoso está literalmente inflamado, e você está tratando como uma pequena irritação.`,
      en: `Headaches aren't just an "annoyance" - they're a neurological alert system. And apparently, yours is in emergency mode.

Headaches occur when pain receptors in blood vessels, muscles, and nerves of the head and neck are activated. These receptors send signals through nerve pathways to the thalamus, which processes and transmits the information to the cerebral cortex, where pain is perceived and interpreted.

${personalizedStat}

Mechanisms you're ignoring:

1. **Vasodilation and Vasoconstriction**: Many headaches involve changes in the diameter of cerebral blood vessels. Abnormal dilation or contraction of these vessels can stimulate nociceptors (pain receptors) in the meninges, resulting in pain. Your cerebral vessels are on a roller coaster, and you're pretending it's just a slight ripple.

2. **Central Sensitization**: Repeated exposure to painful stimuli can lead to sensitization of neurons in the central nervous system, lowering the pain threshold and increasing the response to normally non-painful stimuli. Your brain is literally reprogramming itself to feel more pain, and you're treating it like an optional software update.

3. **Dysregulated Neurotransmitters**: Imbalances in neurotransmitters such as serotonin, dopamine, and GABA can contribute to headaches. These chemical messengers regulate pain transmission and vascular tone. Your brain chemistry is in chaos, and you're acting like it's just a small fluctuation.

4. **Neurological Inflammation**: The release of inflammatory neuropeptides such as substance P and calcitonin gene-related peptide (CGRP) can cause neurogenic inflammation, contributing to pain. Your nervous system is literally inflamed, and you're treating it like a minor irritation.`
    },
    fatigue: {
      pt: `Fadiga crônica não é apenas "cansaço" - é um colapso sistêmico dos seus mecanismos de energia. E você está tratando como se fosse apenas uma "fase".

A fadiga ocorre quando há um desequilíbrio entre a demanda energética e a capacidade do corpo de produzir e utilizar energia eficientemente. Este processo envolve múltiplos sistemas, incluindo o metabolismo celular, função mitocondrial, e regulação hormonal.

${personalizedStat}

Mecanismos que você está ignorando:

1. **Disfunção Mitocondrial**: As mitocôndrias são as "usinas de energia" das células, responsáveis pela produção de ATP (adenosina trifosfato), a moeda energética do corpo. Quando as mitocôndrias não funcionam adequadamente, a produção de energia celular diminui drasticamente. Suas células estão literalmente sem combustível, e você está tratando como se o tanque estivesse apenas na reserva.

2. **Desregulação do Eixo HPA**: O eixo hipotálamo-pituitária-adrenal (HPA) regula a resposta ao estresse e a produção de cortisol. O estresse crônico pode levar à desregulação deste eixo, resultando em níveis anormais de cortisol e outros hormônios do estresse. Seu sistema de resposta ao estresse está em curto-circuito, e você está fingindo que é apenas uma pequena falha elétrica.

3. **Inflamação Sistêmica**: A inflamação crônica de baixo grau pode contribuir significativamente para a fadiga, afetando a função celular e a sinalização neuronal. Citocinas inflamatórias como IL-6 e TNF-alfa podem induzir comportamentos de doença, incluindo fadiga. Seu corpo está em estado de guerra interna, e você está tratando como uma pequena escaramuça.

4. **Depleção de Neurotransmissores**: Níveis inadequados de neurotransmissores como dopamina, serotonina e norepinefrina podem contribuir para a sensação de fadiga e falta de motivação. Estes mensageiros químicos são essenciais para a regulação do humor, cognição e energia. Sua química cerebral está esgotada, e você está agindo como se fosse apenas uma pequena flutuação.`,
      en: `Chronic fatigue isn't just "tiredness" - it's a systemic collapse of your energy mechanisms. And you're treating it like it's just a "phase."

Fatigue occurs when there's an imbalance between energy demand and the body's ability to produce and efficiently use energy. This process involves multiple systems, including cellular metabolism, mitochondrial function, and hormonal regulation.

${personalizedStat}

Mechanisms you're ignoring:

1. **Mitochondrial Dysfunction**: Mitochondria are the "power plants" of cells, responsible for producing ATP (adenosine triphosphate), the body's energy currency. When mitochondria don't function properly, cellular energy production drastically decreases. Your cells are literally out of fuel, and you're treating it like the tank is just on reserve.

2. **HPA Axis Dysregulation**: The hypothalamic-pituitary-adrenal (HPA) axis regulates stress response and cortisol production. Chronic stress can lead to dysregulation of this axis, resulting in abnormal levels of cortisol and other stress hormones. Your stress response system is short-circuiting, and you're pretending it's just a small electrical glitch.

3. **Systemic Inflammation**: Low-grade chronic inflammation can significantly contribute to fatigue, affecting cellular function and neuronal signaling. Inflammatory cytokines such as IL-6 and TNF-alpha can induce sickness behaviors, including fatigue. Your body is in a state of internal warfare, and you're treating it like a small skirmish.

4. **Neurotransmitter Depletion**: Inadequate levels of neurotransmitters such as dopamine, serotonin, and norepinephrine can contribute to feelings of fatigue and lack of motivation. These chemical messengers are essential for regulating mood, cognition, and energy. Your brain chemistry is depleted, and you're acting like it's just a small fluctuation.`
    },
    back_pain: {
      pt: `Dor nas costas não é apenas um "incômodo" - é um grito de socorro da sua estrutura de suporte. E você está fingindo que não ouve.

A dor lombar envolve uma complexa interação entre vértebras, discos intervertebrais, músculos, ligamentos e nervos. Quando qualquer componente deste sistema é comprometido, sinais de dor são transmitidos através de vias nociceptivas para o cérebro.

${personalizedStat}

Mecanismos que você está ignorando:

1. **Degeneração Estrutural**: Os discos intervertebrais, que atuam como amortecedores entre as vértebras, podem degenerar com o tempo, perdendo hidratação e elasticidade. Isso reduz sua capacidade de absorver choques e distribuir pressão, aumentando o estresse sobre outras estruturas da coluna. Sua coluna está literalmente se desgastando, e você está tratando como se fosse apenas um pequeno desgaste normal.

2. **Desequilíbrio Muscular**: Músculos fracos, tensos ou desequilibrados podem alterar a biomecânica da coluna, levando a padrões de movimento disfuncionais e estresse excessivo sobre estruturas específicas. Seu sistema de suporte muscular está falhando, e você está fingindo que é apenas uma pequena instabilidade.

3. **Compressão Neural**: Hérnias discais, estenose espinhal ou outras condições podem causar compressão de raízes nervosas, resultando em dor, formigamento ou fraqueza que pode irradiar para os membros. Seus nervos estão literalmente sendo esmagados, e você está tratando como um leve desconforto.

4. **Inflamação Articular**: Processos inflamatórios nas articulações facetárias, que conectam as vértebras, podem causar dor significativa e rigidez. Esta inflamação pode ser exacerbada por movimentos repetitivos, má postura ou condições como artrite. Suas articulações estão em chamas, e você está agindo como se fosse apenas um pequeno aquecimento.`,
      en: `Back pain isn't just an "inconvenience" - it's a cry for help from your support structure. And you're pretending not to hear it.

Lower back pain involves a complex interaction between vertebrae, intervertebral discs, muscles, ligaments, and nerves. When any component of this system is compromised, pain signals are transmitted through nociceptive pathways to the brain.

${personalizedStat}

Mechanisms you're ignoring:

1. **Structural Degeneration**: Intervertebral discs, which act as cushions between vertebrae, can degenerate over time, losing hydration and elasticity. This reduces their ability to absorb shock and distribute pressure, increasing stress on other spinal structures. Your spine is literally wearing down, and you're treating it like it's just normal wear and tear.

2. **Muscular Imbalance**: Weak, tight, or imbalanced muscles can alter spinal biomechanics, leading to dysfunctional movement patterns and excessive stress on specific structures. Your muscular support system is failing, and you're pretending it's just a minor instability.

3. **Neural Compression**: Disc herniations, spinal stenosis, or other conditions can cause compression of nerve roots, resulting in pain, tingling, or weakness that may radiate to the limbs. Your nerves are literally being crushed, and you're treating it like a slight discomfort.

4. **Joint Inflammation**: Inflammatory processes in the facet joints, which connect the vertebrae, can cause significant pain and stiffness. This inflammation can be exacerbated by repetitive movements, poor posture, or conditions such as arthritis. Your joints are on fire, and you're acting like it's just a small warm-up.`
    },
    unknown: {
      pt: `Quando os sintomas não são específicos, é importante considerar uma abordagem científica abrangente. E não, sintomas persistentes não são "apenas coisa da sua cabeça" como você provavelmente está tentando se convencer.

Sintomas são sinais de que algo pode estar fora de equilíbrio no organismo. Do ponto de vista científico, eles representam:

${personalizedStat}

Mecanismos que você está ignorando:

1. **Mecanismos de Alerta**: O corpo possui sistemas sofisticados para detectar alterações internas e externas. Receptores especializados (nociceptores, mecanorreceptores, quimiorreceptores) captam estímulos potencialmente nocivos e os transformam em sinais elétricos. Seu corpo está literalmente gritando por atenção, e você está com os fones de ouvido no volume máximo.

2. **Integração Neural**: Esses sinais são processados pelo sistema nervoso central, especialmente pelo tálamo e córtex somatossensorial, que interpretam a natureza, localização e intensidade do estímulo. Seu cérebro está tentando decifrar um código de emergência, e você está ignorando a mensagem.

3. **Resposta Inflamatória**: Muitos sintomas estão associados à inflamação, um mecanismo protetor que envolve a liberação de mediadores como histamina, prostaglandinas e citocinas. Esses mediadores podem ativar receptores de dor e causar outros sintomas como inchaço e calor local. Seu corpo está literalmente em chamas por dentro, e você está tratando como uma fogueira controlada.

4. **Eixo Psiconeuroimunoendocrinológico**: Existe uma comunicação bidirecional entre os sistemas nervoso, endócrino e imunológico. Fatores psicológicos como estresse e ansiedade podem influenciar processos fisiológicos através deste eixo, alterando a percepção e manifestação dos sintomas. Sua mente e corpo estão em guerra civil, e você está fingindo que é apenas um pequeno desentendimento.`,
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
  
  return explanations[symptom][language];
}

// Função para obter perguntas de follow-up com base no sintoma, idioma e fase do funil
function getFollowupQuestions(symptom, language, funnelPhase = 1, usedQuestions = []) {
  // Banco de perguntas por sintoma, fase do funil e idioma
  const allQuestions = {
    // FASE 1: Explicação científica com linguagem simples + soluções rápidas
    1: {
      stomach_pain: {
        pt: [
          "Você tem comido como se seu estômago fosse indestrutível?",
          "Quais alimentos parecem piorar essa dor?",
          "Com que frequência isso acontece?",
          "Já tentou alguma mudança na dieta?",
          "Nota alguma relação com estresse?",
          "Essa dor te acorda durante a noite?",
          "Já consultou um médico sobre isso?",
          "Tem histórico familiar de problemas digestivos?",
          "Costuma tomar medicamentos com frequência?"
        ],
        en: [
          "Have you been eating as if your stomach were indestructible?",
          "What foods seem to worsen this pain?",
          "How often does this happen?",
          "Have you tried any dietary changes?",
          "Do you notice any relationship with stress?",
          "Does this pain wake you up at night?",
          "Have you consulted a doctor about this?",
          "Do you have a family history of digestive problems?",
          "Do you often take medications?"
        ]
      },
      headache: {
        pt: [
          "Você bebe água suficiente?",
          "Seu sono tem sido reparador?",
          "Quais situações parecem desencadear essa dor?",
          "Já tentou algum remédio para aliviar?",
          "A dor piora com luz ou barulho?",
          "Tem histórico familiar de enxaqueca?",
          "Passa muito tempo em frente a telas?",
          "Costuma pular refeições?",
          "Consome muita cafeína?"
        ],
        en: [
          "Do you drink enough water?",
          "Has your sleep been restful?",
          "What situations seem to trigger this pain?",
          "Have you tried any medication for relief?",
          "Does the pain worsen with light or noise?",
          "Do you have a family history of migraines?",
          "Do you spend a lot of time in front of screens?",
          "Do you often skip meals?",
          "Do you consume a lot of caffeine?"
        ]
      },
      fatigue: {
        pt: [
          "Sua dieta é combustível ou lixo processado?",
          "Você dorme o suficiente?",
          "Quais atividades te deixam esgotado?",
          "Já fez exames de sangue recentemente?",
          "Pratica alguma atividade física?",
          "Tem histórico de problemas de tireoide?",
          "Costuma se sentir estressado?",
          "Bebe bastante água durante o dia?",
          "Toma algum suplemento vitamínico?"
        ],
        en: [
          "Is your diet fuel or processed junk?",
          "Do you sleep enough?",
          "What activities leave you drained?",
          "Have you had blood tests recently?",
          "Do you practice any physical activity?",
          "Do you have a history of thyroid problems?",
          "Do you often feel stressed?",
          "Do you drink plenty of water during the day?",
          "Do you take any vitamin supplements?"
        ]
      },
      back_pain: {
        pt: [
          "Você passa o dia sentado?",
          "Seus sapatos são confortáveis?",
          "Com que frequência você se alonga?",
          "Já fez fisioterapia alguma vez?",
          "Carrega peso de forma inadequada?",
          "Tem colchão adequado para seu peso?",
          "Pratica exercícios para fortalecer o core?",
          "A dor irradia para as pernas?",
          "Já fez exames de imagem da coluna?"
        ],
        en: [
          "Do you spend the day sitting?",
          "Are your shoes comfortable?",
          "How often do you stretch?",
          "Have you ever done physical therapy?",
          "Do you carry weight improperly?",
          "Do you have a mattress suitable for your weight?",
          "Do you practice exercises to strengthen your core?",
          "Does the pain radiate to your legs?",
          "Have you had imaging tests of your spine?"
        ]
      },
      unknown: {
        pt: [
          "Pode descrever melhor essa sensação? Onde a sente?",
          "Há quanto tempo se sente assim?",
          "Acontece em algum momento específico do dia?",
          "Notou alguma outra mudança no seu corpo ou rotina?",
          "Como tem sido a qualidade do seu sono?",
          "Sente mais stress ou ansiedade ultimamente?",
          "Fez alguma mudança recente na alimentação?",
          "Está tomando algum medicamento novo?",
          "Tem histórico familiar de alguma condição médica?"
        ],
        en: [
          "Can you better describe this feeling? Where do you feel it?",
          "How long have you been feeling this way?",
          "Does it happen at any specific time of day?",
          "Have you noticed any other changes in your body or routine?",
          "How has the quality of your sleep been?",
          "Feeling more stress or anxiety lately?",
          "Have you made any recent changes to your diet?",
          "Are you taking any new medication?",
          "Do you have a family history of any medical condition?"
        ]
      }
    },
    // FASE 2: Consequências se não tomar cuidados
    2: {
      stomach_pain: {
        pt: [
          "Está ciente que ignorar isso pode levar a úlceras?",
          "Quanto tempo mais você pretende ignorar esses sintomas?",
          "Você sabia que o stress pode dobrar a produção de ácido no estômago?",
          "Já pensou nas consequências a longo prazo desse problema?",
          "Sabia que problemas digestivos crônicos podem levar à má absorção de nutrientes?",
          "Está disposto a fazer mudanças na dieta antes que piore?",
          "Tem noção de como a inflamação intestinal afeta todo o corpo?",
          "Já considerou que pode ser algo além de 'má digestão'?",
          "Sabe que 40% dos problemas digestivos ignorados pioram em 6 meses?"
        ],
        en: [
          "Are you aware that ignoring this can lead to ulcers?",
          "How much longer do you plan to ignore these symptoms?",
          "Did you know that stress can double stomach acid production?",
          "Have you thought about the long-term consequences of this problem?",
          "Did you know that chronic digestive problems can lead to poor nutrient absorption?",
          "Are you willing to make dietary changes before it gets worse?",
          "Do you realize how intestinal inflammation affects the entire body?",
          "Have you considered it might be something beyond 'bad digestion'?",
          "Do you know that 40% of ignored digestive problems worsen within 6 months?"
        ]
      },
      // Adicione mais perguntas para outros sintomas na fase 2
      headache: {
        pt: [
          "Está ciente que analgésicos em excesso pioram a dor?",
          "Quanto estresse você acumula?",
          "Sabia que problemas de visão podem causar dores de cabeça?",
          "Já pensou nas consequências de ignorar dores frequentes?",
          "Tem noção de como a dor crônica afeta seu humor e produtividade?",
          "Sabia que 35% das dores de cabeça recorrentes têm causas tratáveis?",
          "Está disposto a investigar os gatilhos antes que piore?",
          "Já considerou que pode ser um sinal de algo mais sério?",
          "Sabe que dores ignoradas podem se tornar crônicas em apenas 3 meses?"
        ],
        en: [
          "Are you aware that excessive painkillers worsen pain?",
          "How much stress do you accumulate?",
          "Did you know vision problems can cause headaches?",
          "Have you thought about the consequences of ignoring frequent pain?",
          "Do you realize how chronic pain affects your mood and productivity?",
          "Did you know that 35% of recurrent headaches have treatable causes?",
          "Are you willing to investigate triggers before it gets worse?",
          "Have you considered it might be a sign of something more serious?",
          "Do you know that ignored pains can become chronic in just 3 months?"
        ]
      },
      // Adicione mais perguntas para outros sintomas na fase 2...
    },
    // FASE 3: O que está realmente arriscando (agravamento)
    3: {
      stomach_pain: {
        pt: [
          "Percebe que continuar assim pode causar danos permanentes?",
          "Está disposto a investigar a causa raiz?",
          "Você sabia que problemas digestivos crônicos afetam seu humor e energia?",
          "Tem noção de que 30% das úlceras não tratadas podem perfurar o estômago?",
          "Sabia que a inflamação intestinal crônica aumenta o risco de outras doenças?",
          "Está ciente que sua qualidade de vida está sendo comprometida?",
          "Já pensou no impacto financeiro de um problema que se agrava?",
          "Sabe que a microbiota intestinal afeta até mesmo sua saúde mental?",
          "Está disposto a agir agora ou prefere esperar uma emergência?"
        ],
        en: [
          "Do you realize that continuing like this can cause permanent damage?",
          "Are you willing to investigate the root cause?",
          "Did you know that chronic digestive problems affect your mood and energy?",
          "Do you realize that 30% of untreated ulcers can perforate the stomach?",
          "Did you know that chronic intestinal inflammation increases the risk of other diseases?",
          "Are you aware that your quality of life is being compromised?",
          "Have you thought about the financial impact of a worsening problem?",
          "Do you know that gut microbiota affects even your mental health?",
          "Are you willing to act now or prefer to wait for an emergency?"
        ]
      },
      // Adicione mais perguntas para outros sintomas na fase 3
    },
    // FASE 4: Nutrientes e plantas naturais
    4: {
      stomach_pain: {
        pt: [
          "Interessado em saber quais nutrientes podem reparar seu intestino?",
          "Quer conhecer plantas medicinais com poder anti-inflamatório?",
          "Sabia que a combinação certa de nutrientes pode ser mais eficaz que medicamentos?",
          "Já ouviu falar do poder da glutamina na regeneração da mucosa intestinal?",
          "Conhece os benefícios do zinco para a saúde digestiva?",
          "Sabia que o gengibre tem potente ação anti-inflamatória no trato digestivo?",
          "Já experimentou a erva-doce para aliviar espasmos intestinais?",
          "Tem interesse em saber como o ômega-3 pode reduzir a inflamação intestinal?",
          "Quer entender como a vitamina D influencia a saúde do seu intestino?"
        ],
        en: [
          "Interested in knowing which nutrients can repair your gut?",
          "Want to know medicinal plants with anti-inflammatory power?",
          "Did you know that the right combination of nutrients can be more effective than medications?",
          "Have you heard about the power of glutamine in regenerating intestinal mucosa?",
          "Do you know the benefits of zinc for digestive health?",
          "Did you know that ginger has potent anti-inflammatory action in the digestive tract?",
          "Have you tried fennel to relieve intestinal spasms?",
          "Are you interested in knowing how omega-3 can reduce intestinal inflammation?",
          "Want to understand how vitamin D influences your gut health?"
        ]
      },
      // Adicione mais perguntas para outros sintomas na fase 4
    },
    // FASE 5: Suplemento como solução completa
    5: {
      stomach_pain: {
        pt: [
          "Quer conhecer a fórmula que já ajudou milhares como você?",
          "Pronto para uma solução que ataca a causa raiz?",
          "Interessado em ver estudos que comprovam a eficácia?",
          "Quer saber como nosso suplemento combina os nutrientes essenciais para seu caso?",
          "Gostaria de conhecer os resultados de quem já experimentou?",
          "Sabia que 85% dos usuários relatam melhora significativa em 30 dias?",
          "Quer entender como o suplemento age em cada fase da digestão?",
          "Interessado em saber como é fácil incorporar na sua rotina?",
          "Pronto para investir na sua saúde digestiva de uma vez por todas?"
        ],
        en: [
          "Want to know the formula that has already helped thousands like you?",
          "Ready for a solution that attacks the root cause?",
          "Interested in seeing studies that prove the effectiveness?",
          "Want to know how our supplement combines the essential nutrients for your case?",
          "Would you like to know the results of those who have already tried it?",
          "Did you know that 85% of users report significant improvement in 30 days?",
          "Want to understand how the supplement acts at each stage of digestion?",
          "Interested in knowing how easy it is to incorporate into your routine?",
          "Ready to invest in your digestive health once and for all?"
        ]
      },
      // Adicione mais perguntas para outros sintomas na fase 5
    },
    // FASE 6: Plano B
    6: {
      stomach_pain: {
        pt: [
          "Precisa de mais informações sobre como nosso suplemento funciona?",
          "Quer comparar os riscos de não fazer nada com os benefícios da solução?",
          "Podemos discutir como este suplemento se encaixa no seu estilo de vida?",
          "Gostaria de ver depoimentos de pessoas que estavam céticas como você?",
          "Quer saber mais sobre nossa garantia de satisfação?",
          "Tem alguma preocupação específica sobre os ingredientes?",
          "Prefere começar com uma dose menor para testar?",
          "Quer discutir outras abordagens complementares?",
          "Posso te enviar mais informações científicas sobre a fórmula?"
        ],
        en: [
          "Need more information on how our supplement works?",
          "Want to compare the risks of doing nothing with the benefits of the solution?",
          "Can we discuss how this supplement fits into your lifestyle?",
          "Would you like to see testimonials from people who were skeptical like you?",
          "Want to know more about our satisfaction guarantee?",
          "Do you have any specific concerns about the ingredients?",
          "Would you prefer to start with a smaller dose to test?",
          "Want to discuss other complementary approaches?",
          "Can I send you more scientific information about the formula?"
        ]
      },
      // Adicione mais perguntas para outros sintomas na fase 6
    }
  };
  
  // Garantir que a fase do funil seja válida
  const phase = Math.min(Math.max(funnelPhase, 1), 6);
  
  // Obter todas as perguntas disponíveis para o sintoma, fase e idioma
  const availableQuestions = allQuestions[phase]?.[symptom]?.[language] || allQuestions[phase]?.unknown?.[language] || [];
  
  // Filtrar perguntas já usadas
  const unusedQuestions = availableQuestions.filter(q => !usedQuestions.includes(q));
  
  // Se não houver perguntas suficientes, usar perguntas genéricas
  if (unusedQuestions.length < 3) {
    const genericQuestions = language === 'pt' ? [
      "Quer explorar mais sobre este assunto?",
      "Gostaria de saber mais sobre as soluções disponíveis?",
      "Podemos discutir outras abordagens para seu problema?",
      "Tem alguma outra preocupação que gostaria de abordar?",
      "Quer conhecer mais sobre como cuidar da sua saúde?",
      "Posso te ajudar com mais informações específicas?"
    ] : [
      "Want to explore more about this topic?",
      "Would you like to know more about available solutions?",
      "Can we discuss other approaches to your problem?",
      "Do you have any other concerns you'd like to address?",
      "Want to learn more about how to take care of your health?",
      "Can I help you with more specific information?"
    ];
    
    // Adicionar perguntas genéricas que não foram usadas
    const unusedGeneric = genericQuestions.filter(q => !usedQuestions.includes(q));
    unusedQuestions.push(...unusedGeneric);
  }
  
  // Selecionar 3 perguntas aleatórias (ou menos se não houver suficientes)
  const shuffled = [...unusedQuestions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3);
}

// Função para construir o prompt para o GPT-4o mini
function buildGPTPrompt(symptom, language, userName, userAge, userWeight, userMessage, funnelPhase, usedQuestions) {
  // Obter introdução sarcástica
  const hasForm = userName && userName.trim() !== "";
  let intro;
  
  if (hasForm) {
    intro = getSarcasticIntro(symptom, language, userName);
  } else {
    intro = frasesSarcasticas[language][Math.floor(Math.random() * frasesSarcasticas[language].length)];
  }
  
  // Obter explicação científica
  const scientificExplanation = getScientificExplanation(symptom, language, userName, userAge, userWeight);
  
  // Obter perguntas de follow-up
  const followupQuestions = getFollowupQuestions(symptom, language, funnelPhase, usedQuestions);
  
  // Construir o contexto para o GPT
  const context = {
    symptom,
    language,
    userName,
    userAge,
    userWeight,
    userMessage,
    funnelPhase,
    intro,
    scientificExplanation,
    followupQuestions,
    usedQuestions
  };
  
  // Construir o prompt para o GPT-4o mini
  return {
    prompt: OWL_SAVAGE_PROMPT,
    context
  };
}

// Função principal para consulta ao Notion e integração com GPT-4o mini
export async function getSymptomContext(userMessage, userName = "", userAge = "", userWeight = "", funnelPhase = 1, previousSymptom = null, usedQuestions = []) {
  try {
    // Detectar idioma da mensagem
    const language = detectLanguage(userMessage);
    
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
    
    // Manter o sintoma anterior se o atual for 'unknown' e houver um anterior
    if (sintomaKey === "unknown" && previousSymptom && previousSymptom !== "unknown") {
      sintomaKey = previousSymptom;
    }
    
    // Extrair palavras-chave para consulta ao Notion
    const keywords = extractKeywords(userMessage);
    console.log("🧠 Palavras-chave extraídas:", keywords);
    
    // Consultar o banco de dados do Notion (se houver palavras-chave)
    let notionData = null;
    if (keywords.length > 0) {
      try {
        const filter = {
          or: keywords.map(word => ({
            property: "Palavras-chave",
            rich_text: {
              contains: word
            }
          }))
        };
        
        console.log("📦 Filtro enviado ao Notion:", JSON.stringify(filter, null, 2));
        
        const response = await notion.databases.query({
          database_id: databaseId,
          filter
        });
        
        console.log("📨 Resposta do Notion:", JSON.stringify(response, null, 2));
        
        if (response.results && response.results.length > 0) {
          notionData = response.results;
        }
      } catch (notionError) {
        console.error("❌ Erro ao consultar o Notion:", notionError);
        // Continuar sem os dados do Notion
      }
    }
    
    // Construir o prompt para o GPT-4o mini
    const gptPromptData = buildGPTPrompt(
      sintomaKey,
      language,
      userName,
      userAge,
      userWeight,
      userMessage,
      funnelPhase,
      usedQuestions
    );
    
    // Adicionar dados do Notion ao contexto (se disponíveis)
    if (notionData) {
      gptPromptData.context.notionData = notionData;
    }
    
    // Aqui seria feita a chamada ao GPT-4o mini
    // Como não podemos fazer a chamada real neste exemplo, vamos simular a resposta
    
    // Obter introdução sarcástica
    const intro = gptPromptData.context.intro;
    
    // Obter explicação científica
    const scientificExplanation = gptPromptData.context.scientificExplanation;
    
    // Obter perguntas de follow-up
    const followupQuestions = gptPromptData.context.followupQuestions;
    
    // Retornar o contexto do sintoma
    return {
      sintoma: sintomaKey,
      language: language,
      intro: intro,
      scientificExplanation: scientificExplanation,
      followupQuestions: followupQuestions,
      funnelPhase: funnelPhase,
      gptPromptData: gptPromptData // Incluir o prompt para referência
    };
  } catch (error) {
    console.error("❌ Erro em getSymptomContext:", error);
    
    // Retornar um contexto de erro padrão
    const language = detectLanguage(userMessage);
    return {
      sintoma: "error",
      language: language,
      intro: language === "pt" ? "Desculpe, tive um problema ao processar sua consulta." : "Sorry, I had an issue processing your query.",
      scientificExplanation: language === "pt" ? "Ocorreu um erro ao analisar seus sintomas. Por favor, tente novamente com uma descrição mais clara." : "An error occurred while analyzing your symptoms. Please try again with a clearer description.",
      followupQuestions: language === "pt" ? 
        ["Pode descrever seus sintomas novamente?", "Quer tentar com outras palavras?", "Podemos abordar outro assunto?"] : 
        ["Can you describe your symptoms again?", "Want to try with other words?", "Can we address another topic?"],
      funnelPhase: 1
    };
  }
}
