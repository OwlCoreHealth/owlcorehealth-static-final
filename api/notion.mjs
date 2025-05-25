// ES Modules format
import { Client } from "@notionhq/client";
import { NotionAPI } from "notion-client"; // Assuming this is used for public pages if needed

// --- Configuração Inicial ---
const notion = new Client({
  auth: process.env.NOTION_TOKEN, // Certifique-se de que NOTION_TOKEN está configurado no ambiente
});
const notionUnofficial = new NotionAPI(); // Para páginas públicas, se necessário

// --- Funções de Utilidade ---

// Função para obter um elemento aleatório de um array
function getRandomElement(arr) {
  if (!arr || arr.length === 0) return "";
  return arr[Math.floor(Math.random() * arr.length)];
}

// Função para criar um timeout para promessas
function promiseWithTimeout(promise, ms, timeoutError = new Error("Operação excedeu o tempo limite")) {
  // Criar uma promessa que rejeita após ms milissegundos
  const timeoutPromise = new Promise((_, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject(timeoutError);
    }, ms);
  });

  // Retornar a promessa que resolver primeiro (a original ou o timeout)
  return Promise.race([promise, timeoutPromise]);
}

// --- Conteúdo do Bot (Exemplos) ---

// Introduções Sarcásticas
const intros = {
  stomach_pain: {
    pt: [
      "Ah, então você, {userName} está surpreso que comer como se não houvesse amanhã tenha consequências? Fascinante.",
      "Dores de estômago, {userName}? Que original. Aposto que sua dieta é impecável, não é?",
      "Seu estômago está protestando, {userName}? Talvez ele esteja cansado de ser tratado como lixeira."
    ],
    en: [
      "Ah, so you, {userName} are surprised that eating like there's no tomorrow has consequences? Fascinating.",
      "Stomach pains, {userName}? How original. I bet your diet is impeccable, right?",
      "Your stomach is protesting, {userName}? Maybe it's tired of being treated like a dumpster."
    ]
  },
  headache: {
    pt: [
      "Dor de cabeça de novo, {userName}? Talvez seja o universo tentando te dizer algo... ou só desidratação mesmo.",
      "Se sua cabeça doesse menos, {userName}, talvez você pensasse em cuidar melhor de si mesmo.",
      "Outra dor de cabeça, {userName}? Quantas você coleciona por semana?"
    ],
    en: [
      "Headache again, {userName}? Maybe it's the universe trying to tell you something... or just dehydration.",
      "If your head hurt less, {userName}, maybe you'd think about taking better care of yourself.",
      "Another headache, {userName}? How many do you collect per week?"
    ]
  },
  fatigue: {
    pt: [
      "Cansado, {userName}? Que choque. Dormir é para os fracos, aparentemente.",
      "Sua energia está baixa, {userName}? Talvez devesse tentar ligar o corpo na tomada.",
      "Fadiga, {userName}? Bem-vindo ao clube. A diferença é que alguns fazem algo a respeito."
    ],
    en: [
      "Tired, {userName}? What a shock. Sleep is for the weak, apparently.",
      "Your energy is low, {userName}? Maybe you should try plugging your body into the wall socket.",
      "Fatigue, {userName}? Welcome to the club. The difference is some do something about it."
    ]
  },
  back_pain: {
    pt: [
      "Dor nas costas, {userName}? Provavelmente de carregar o peso das suas más decisões de saúde.",
      "Sua coluna está reclamando, {userName}? Talvez ela não goste de ficar curvada sobre o celular o dia todo.",
      "Ah, a clássica dor nas costas, {userName}. Um sinal universal de que você não se alonga."
    ],
    en: [
      "Back pain, {userName}? Probably from carrying the weight of your poor health decisions.",
      "Your spine is complaining, {userName}? Maybe it doesn't like being hunched over your phone all day.",
      "Ah, the classic back pain, {userName}. A universal sign that you don't stretch."
    ]
  },
  unknown: {
    pt: [
      "Sintomas vagos, {userName}? Fascinante como você descreve seu sofrimento da forma menos útil possível.",
      "{userName}, seu corpo está mandando sinais em código morse e você está sem o decodificador?",
      "Não sabe o que tem, {userName}? Que conveniente. A ignorância é uma bênção... até deixar de ser."
    ],
    en: [
      "Vague symptoms, {userName}? Fascinating how you describe your suffering in the least helpful way possible.",
      "{userName}, your body is sending signals in Morse code and you're without the decoder?",
      "Don't know what you have, {userName}? How convenient. Ignorance is bliss... until it's not."
    ]
  }
};

// Explicações Científicas Simplificadas e Dicas Práticas (Organizadas por Fase)
const explanations = {
  stomach_pain: {
    1: { // Fase 1: Explicação + Soluções Rápidas
      pt: [
        "Seu estômago não está apenas \'incomodado\' - ele está em guerra química. 65% dos problemas digestivos são causados por bactérias que fermentam alimentos mal digeridos. Dica 1: Mastigar cada bocado 20 vezes reduz problemas digestivos em até 40%. Dica 2: Chá de gengibre morno 15 minutos antes de comer acalma a inflamação.",
        "Essa \'azia\' é seu estômago gritando por socorro. 70% das vezes, é excesso de ácido ou falta dele - paradoxal, né? Dica 1: Beber 1 copo de água com 1 colher de chá de vinagre de maçã antes da refeição pode equilibrar o pH. Dica 2: Evite deitar logo após comer; espere pelo menos 2 horas."
      ],
      en: [
        "Your stomach isn't just 'bothered' - it's in chemical warfare. 65% of digestive problems are caused by bacteria fermenting poorly digested food. Tip 1: Chewing each bite 20 times reduces digestive issues by up to 40%. Tip 2: Warm ginger tea 15 minutes before eating calms inflammation.",
        "That 'heartburn' is your stomach screaming for help. 70% of the time, it's either too much acid or too little - paradoxical, right? Tip 1: Drinking 1 glass of water with 1 teaspoon of apple cider vinegar before meals can balance pH. Tip 2: Avoid lying down right after eating; wait at least 2 hours."
      ]
    },
    2: { // Fase 2: Consequências Iniciais
      pt: [
        "Ignorar essa dor pode levar a gastrite crônica em 55% dos casos. Isso significa inflamação constante que dificulta a absorção de nutrientes essenciais como Vitamina B12.",
        "Continuar assim aumenta em 40% a chance de desenvolver síndrome do intestino irritável, transformando sua vida num ciclo de dor e desconforto."
      ],
      en: [
        "Ignoring this pain can lead to chronic gastritis in 55% of cases. This means constant inflammation that hinders the absorption of essential nutrients like Vitamin B12.",
        "Continuing like this increases the chance of developing irritable bowel syndrome by 40%, turning your life into a cycle of pain and discomfort."
      ]
    },
    3: { // Fase 3: Agravamento (Riscos Sérios)
      pt: [
        "Seu sistema digestivo não está apenas \'irritado\' - está em falência progressiva. Sabia que 34% das pessoas com esses sintomas estão ignorando um problema potencialmente sério como úlceras ou H. pylori?",
        "82% dos problemas digestivos ignorados por mais de 3 meses causam danos permanentes à mucosa gástrica. O que seu médico não te conta: cada episódio de refluxo ácido aumenta em 4% o risco de desenvolver condições pré-cancerosas no esôfago. Enquanto você ignora, seu estômago está sendo corroído por dentro."
      ],
      en: [
        "Your digestive system isn't just 'irritated' - it's in progressive failure. Did you know that 34% of people with these symptoms are ignoring a potentially serious problem like ulcers or H. pylori?",
        "82% of digestive problems ignored for more than 3 months cause permanent damage to the gastric mucosa. What your doctor doesn't tell you: each episode of acid reflux increases the risk of developing pre-cancerous conditions in the esophagus by 4%. While you ignore it, your stomach is being corroded from the inside."
      ]
    },
    4: { // Fase 4: Nutrientes e Plantas
      pt: [
        "Achar que só comida resolve é ingenuidade. Seu intestino precisa de mais. A enzima bromelina do abacaxi ajuda na digestão, mas para reparar a mucosa, você precisa de L-Glutamina e Zinco Carnosina, nutrientes que raramente estão em níveis ótimos na dieta.",
        "Plantas como Alcaçuz (DGL) e Marshmallow Root criam uma camada protetora no estômago, algo que nenhum alimento faz. Mas a concentração necessária para efeito terapêutico é muito maior do que um simples chá pode oferecer."
      ],
      en: [
        "Thinking food alone will fix it is naive. Your gut needs more. The enzyme bromelain from pineapple aids digestion, but to repair the mucosa, you need L-Glutamine and Zinc Carnosine, nutrients rarely optimal in diet.",
        "Plants like Licorice (DGL) and Marshmallow Root create a protective layer in the stomach, something no food does. But the concentration needed for therapeutic effect is much higher than a simple tea can provide."
      ]
    },
    5: { // Fase 5: Suplemento
      pt: [
        "Nossa fórmula combina DGL, Marshmallow, L-Glutamina e Zinco Carnosina nas doses exatas que 88% dos estudos mostram ser eficazes para alívio e reparação gástrica. Pare de tentar remendos e use uma solução completa.",
        "Quer continuar com chazinhos ou usar uma solução baseada em ciência que já ajudou 91% dos nossos clientes com problemas semelhantes aos seus a sentir alívio em menos de 15 dias?"
      ],
      en: [
        "Our formula combines DGL, Marshmallow, L-Glutamine, and Zinc Carnosine in the exact doses that 88% of studies show are effective for gastric relief and repair. Stop trying patches and use a complete solution.",
        "Do you want to continue with little teas or use a science-based solution that has already helped 91% of our clients with problems similar to yours feel relief in less than 15 days?"
      ]
    },
    6: { // Fase 6: Plano B
      pt: [
        "Ok, você ainda está cético. Entendo. Mas considere isto: quanto vale sua qualidade de vida? Continuar com dor e desconforto afeta seu trabalho, seus relacionamentos, seu humor. Nossa solução não é mágica, é ciência concentrada para resultados rápidos.",
        "Pense no custo de não fazer nada: mais consultas médicas, exames caros, talvez até cirurgia no futuro. Investir na sua saúde digestiva agora é a decisão mais inteligente e econômica a longo prazo. O que você prefere?"
      ],
      en: [
        "Okay, you're still skeptical. I get it. But consider this: what is your quality of life worth? Continuing with pain and discomfort affects your work, your relationships, your mood. Our solution isn't magic, it's concentrated science for fast results.",
        "Think about the cost of doing nothing: more doctor visits, expensive tests, maybe even surgery in the future. Investing in your digestive health now is the smartest and most economical long-term decision. What do you prefer?"
      ]
    }
  },
  // ... (Adicionar explicações para headache, fatigue, back_pain, unknown para todas as 6 fases)
  headache: {
    1: { pt: ["Sua cabeça não está apenas doendo - é um alarme de incêndio. 78% das dores de cabeça frequentes vêm de desidratação crônica. Dica 1: Beba 2 litros de água por dia, religiosamente. Dica 2: Massageie as têmporas com óleo essencial de hortelã-pimenta."], en: ["Your head isn't just hurting - it's a fire alarm. 78% of frequent headaches come from chronic dehydration. Tip 1: Drink 2 liters of water daily, religiously. Tip 2: Massage temples with peppermint essential oil."] },
    2: { pt: ["Ignorar isso pode levar a enxaquecas crônicas em 60% dos casos, afetando sua produtividade e vida social."], en: ["Ignoring this can lead to chronic migraines in 60% of cases, affecting your productivity and social life."] },
    3: { pt: ["Essa dor pode ser um sinal de alerta para problemas mais sérios como pressão alta ou até aneurismas em 15% dos casos persistentes. O que seu médico não diz: Dores de cabeça tensionais crônicas aumentam em 50% o risco de depressão."], en: ["This pain could be a warning sign for more serious issues like high blood pressure or even aneurysms in 15% of persistent cases. What your doctor doesn't say: Chronic tension headaches increase the risk of depression by 50%."] },
    4: { pt: ["Magnésio e Coenzima Q10 são cruciais para a função neurológica e relaxamento vascular, mas difíceis de obter em doses terapêuticas só com comida. Plantas como Butterbur (Petasites hybridus) mostraram reduzir a frequência de enxaquecas em até 58%."], en: ["Magnesium and Coenzyme Q10 are crucial for neurological function and vascular relaxation, but hard to get in therapeutic doses from food alone. Plants like Butterbur (Petasites hybridus) have shown to reduce migraine frequency by up to 58%."] },
    5: { pt: ["Nossa fórmula contém Magnésio Bisglicinato, CoQ10 e Butterbur nas doses comprovadas em estudos para alívio rápido e prevenção. Chega de analgésicos que só mascaram o problema."], en: ["Our formula contains Magnesium Bisglycinate, CoQ10, and Butterbur in doses proven in studies for fast relief and prevention. Enough with painkillers that just mask the problem."] },
    6: { pt: ["Você pode continuar refém dos analgésicos e seus efeitos colaterais, ou pode tratar a causa raiz com uma abordagem natural e cientificamente validada. Qual caminho parece mais inteligente?"], en: ["You can remain hostage to painkillers and their side effects, or you can treat the root cause with a natural and scientifically validated approach. Which path seems smarter?"] }
  },
  fatigue: {
    1: { pt: ["Seu corpo não está \'cansado\' - está operando com o tanque na reserva. 75% da fadiga persistente está ligada a deficiências de vitaminas do complexo B e ferro. Dica 1: Coma mais carne vermelha magra e vegetais verde-escuros. Dica 2: Durma 7-8 horas por noite, sem exceção."], en: ["Your body isn't 'tired' - it's running on empty. 75% of persistent fatigue is linked to B vitamin and iron deficiencies. Tip 1: Eat more lean red meat and dark leafy greens. Tip 2: Sleep 7-8 hours per night, no exceptions."] },
    2: { pt: ["Continuar se arrastando aumenta em 60% o risco de burnout e problemas de concentração, afetando seu desempenho no trabalho e segurança."], en: ["Continuing to drag yourself increases the risk of burnout and concentration problems by 60%, affecting your work performance and safety."] },
    3: { pt: ["Essa fadiga pode ser um sinal de problemas na tireoide ou anemia severa em 25% dos casos. O que ninguém te conta: Fadiga crônica não tratada sobrecarrega o coração, aumentando o risco de problemas cardíacos em 30%."], en: ["This fatigue could be a sign of thyroid problems or severe anemia in 25% of cases. What nobody tells you: Untreated chronic fatigue overloads the heart, increasing the risk of heart problems by 30%."] },
    4: { pt: ["Seu corpo precisa de energia celular (ATP), e para isso, CoQ10 e D-Ribose são essenciais, mas a produção diminui com a idade e estresse. Plantas adaptogênicas como Rhodiola Rosea e Ashwagandha combatem a fadiga adrenal, mas a dose certa é crucial."], en: ["Your body needs cellular energy (ATP), and for that, CoQ10 and D-Ribose are essential, but production decreases with age and stress. Adaptogenic plants like Rhodiola Rosea and Ashwagandha combat adrenal fatigue, but the right dose is crucial."] },
    5: { pt: ["Nossa fórmula energética combina vitaminas B ativas, Ferro Quelato, CoQ10, D-Ribose e adaptógenos nas doses ideais para restaurar sua energia de forma sustentável, sem os picos e quedas da cafeína."], en: ["Our energy formula combines active B vitamins, Chelated Iron, CoQ10, D-Ribose, and adaptogens in ideal doses to restore your energy sustainably, without the peaks and crashes of caffeine."] },
    6: { pt: ["Você pode continuar dependente de estimulantes que te deixam exausto a longo prazo, ou investir em nutrir suas células para ter energia real e duradoura. A escolha é óbvia, não?"], en: ["You can continue depending on stimulants that leave you exhausted in the long run, or invest in nourishing your cells for real, lasting energy. The choice is obvious, isn't it?"] }
  },
  back_pain: {
    1: { pt: ["Sua coluna não está apenas \'doendo\' - ela está gritando por socorro. 68% das dores nas costas vêm de músculos abdominais fracos. Dica 1: Deite no chão 10 minutos por dia com joelhos dobrados para aliviar a pressão. Dica 2: Fortaleça o core com pranchas (comece com 30 segundos)."], en: ["Your spine isn't just 'hurting' - it's screaming for help. 68% of back pain comes from weak core muscles. Tip 1: Lie on the floor 10 minutes daily with knees bent to relieve pressure. Tip 2: Strengthen your core with planks (start with 30 seconds)."] },
    2: { pt: ["Ignorar essa dor aumenta em 50% a chance de desenvolver problemas crônicos como hérnia de disco ou ciática."], en: ["Ignoring this pain increases the chance of developing chronic problems like herniated discs or sciatica by 50%."] },
    3: { pt: ["Essa dor pode indicar problemas sérios como estenose espinhal ou compressão nervosa em 20% dos casos persistentes. O que ninguém diz: Dor lombar crônica está ligada a uma redução de 11% no volume do cérebro devido ao estresse constante."], en: ["This pain could indicate serious problems like spinal stenosis or nerve compression in 20% of persistent cases. What nobody says: Chronic lower back pain is linked to an 11% reduction in brain volume due to constant stress."] },
    4: { pt: ["Colágeno Tipo II e MSM (Enxofre Orgânico) são essenciais para a saúde das articulações e discos, mas a absorção pela comida é baixa. Plantas anti-inflamatórias como Cúrcuma (com piperina) e Boswellia Serrata reduzem a dor e inflamação de forma mais eficaz que muitos analgésicos."], en: ["Collagen Type II and MSM (Organic Sulfur) are essential for joint and disc health, but absorption from food is low. Anti-inflammatory plants like Turmeric (with piperine) and Boswellia Serrata reduce pain and inflammation more effectively than many painkillers."] },
    5: { pt: ["Nossa fórmula para articulações combina Colágeno UC-II, MSM, Cúrcuma BCM-95® e Boswellia nas doses clinicamente estudadas para alívio da dor, redução da inflamação e reparação da cartilagem."], en: ["Our joint formula combines UC-II Collagen, MSM, Turmeric BCM-95®, and Boswellia in clinically studied doses for pain relief, inflammation reduction, and cartilage repair."] },
    6: { pt: ["Você pode continuar tomando anti-inflamatórios que destroem seu estômago, ou pode nutrir suas articulações de dentro para fora com ingredientes naturais comprovados. Qual abordagem faz mais sentido a longo prazo?"], en: ["You can keep taking anti-inflammatories that destroy your stomach, or you can nourish your joints from the inside out with proven natural ingredients. Which approach makes more sense long-term?"] }
  },
  unknown: {
    1: { pt: ["Seu corpo está confuso, e você também. 73% dos sintomas vagos escondem deficiências nutricionais ou inflamação silenciosa. Dica 1: Faça um diário detalhado dos sintomas por 1 semana (o que, quando, intensidade). Dica 2: Elimine alimentos processados e açúcar por 7 dias e veja se melhora."], en: ["Your body is confused, and so are you. 73% of vague symptoms hide nutritional deficiencies or silent inflammation. Tip 1: Keep a detailed symptom diary for 1 week (what, when, intensity). Tip 2: Eliminate processed foods and sugar for 7 days and see if it improves."] },
    2: { pt: ["Ignorar sintomas gerais aumenta em 45% o risco de um diagnóstico tardio de condições autoimunes ou metabólicas."], en: ["Ignoring general symptoms increases the risk of a late diagnosis of autoimmune or metabolic conditions by 45%."] },
    3: { pt: ["Esses sintomas podem ser a ponta do iceberg de problemas como fadiga adrenal, disbiose intestinal ou toxicidade por metais pesados em 30% dos casos. O que ninguém te fala: Inflamação crônica de baixo grau, muitas vezes sem sintomas claros, é a raiz de 8 das 10 principais causas de morte."], en: ["These symptoms could be the tip of the iceberg for issues like adrenal fatigue, gut dysbiosis, or heavy metal toxicity in 30% of cases. What nobody tells you: Chronic low-grade inflammation, often without clear symptoms, is the root of 8 out of the 10 leading causes of death."] },
    4: { pt: ["Um corpo desregulado precisa de suporte fundamental. Vitaminas B, Magnésio, Vitamina D e Ômega-3 são essenciais, mas a qualidade e forma importam. Adaptógenos como Ashwagandha ajudam o corpo a lidar com o estresse, a causa raiz de muitos sintomas vagos."], en: ["A dysregulated body needs fundamental support. B vitamins, Magnesium, Vitamin D, and Omega-3 are essential, but quality and form matter. Adaptogens like Ashwagandha help the body cope with stress, the root cause of many vague symptoms."] },
    5: { pt: ["Nossa fórmula de suporte geral fornece nutrientes essenciais nas formas mais biodisponíveis e adaptógenos clinicamente dosados para ajudar seu corpo a reencontrar o equilíbrio e combater a inflamação silenciosa."], en: ["Our general support formula provides essential nutrients in the most bioavailable forms and clinically dosed adaptogens to help your body regain balance and fight silent inflammation."] },
    6: { pt: ["Você pode continuar perdido nesse nevoeiro de sintomas, ou pode dar ao seu corpo o suporte fundamental que ele precisa para se recuperar. Qual opção te parece mais promissora?"], en: ["You can remain lost in this fog of symptoms, or you can give your body the fundamental support it needs to recover. Which option seems more promising to you?"] }
  }
};

// Perguntas de Follow-up (Organizadas por Fase)
const followupQuestions = {
  stomach_pain: {
    1: { // Fase 1
      pt: [
        "Você tem notado outros sintomas digestivos como gases ou inchaço?",
        "Com que frequência você sente essa dor? É depois de comer?",
        "Você costuma comer muito rápido ou sob estresse?"
      ],
      en: [
        "Have you noticed other digestive symptoms like gas or bloating?",
        "How often do you feel this pain? Is it after eating?",
        "Do you usually eat very fast or under stress?"
      ]
    },
    2: { // Fase 2
      pt: [
        "Você já teve gastrite ou refluxo diagnosticado antes?",
        "Quanto tempo mais você pretende ignorar esses sintomas antes de agir?",
        "Você sabia que problemas digestivos crônicos afetam seu humor e energia?"
      ],
      en: [
        "Have you ever been diagnosed with gastritis or reflux before?",
        "How much longer do you plan to ignore these symptoms before taking action?",
        "Did you know that chronic digestive problems affect your mood and energy?"
      ]
    },
    3: { // Fase 3
      pt: [
        "Está ciente que ignorar isso pode levar a problemas que exigem medicação forte ou cirurgia?",
        "Você tem histórico familiar de problemas gástricos sérios?",
        "Você sabia que a má digestão impede a absorção de nutrientes vitais para todo o corpo?"
      ],
      en: [
        "Are you aware that ignoring this can lead to problems requiring strong medication or surgery?",
        "Do you have a family history of serious gastric problems?",
        "Did you know that poor digestion prevents the absorption of vital nutrients for the entire body?"
      ]
    },
    4: { // Fase 4
      pt: [
        "Você acredita que apenas a alimentação pode resolver um problema crônico?",
        "Já ouviu falar dos benefícios da L-Glutamina para a saúde intestinal?",
        "Você sabia que plantas como Alcaçuz são usadas há séculos para problemas digestivos?"
      ],
      en: [
        "Do you believe that diet alone can solve a chronic problem?",
        "Have you heard about the benefits of L-Glutamine for gut health?",
        "Did you know that plants like Licorice have been used for centuries for digestive problems?"
      ]
    },
    5: { // Fase 5
      pt: [
        "Quer conhecer a fórmula exata que combina os melhores ingredientes naturais?",
        "Prefere uma solução comprovada ou continuar tentando coisas aleatórias?",
        "Está pronto para investir na sua saúde digestiva e sentir a diferença?"
      ],
      en: [
        "Want to know the exact formula that combines the best natural ingredients?",
        "Prefer a proven solution or keep trying random things?",
        "Are you ready to invest in your digestive health and feel the difference?"
      ]
    },
    6: { // Fase 6 (Plano B)
      pt: [
        "Quanto vale para você comer sem medo ou dor?",
        "Você já calculou quanto gasta com remédios paliativos por ano?",
        "Está disposto a dar uma chance a uma abordagem que trata a causa raiz?"
      ],
      en: [
        "How much is eating without fear or pain worth to you?",
        "Have you calculated how much you spend on palliative remedies per year?",
        "Are you willing to give a chance to an approach that treats the root cause?"
      ]
    }
  },
  // ... (Adicionar perguntas para headache, fatigue, back_pain, unknown para todas as 6 fases)
  headache: {
    1: { pt: ["Essa dor é pulsante ou uma pressão constante?", "Você bebe café ou outras bebidas com cafeína regularmente?", "Você passa muitas horas em frente a telas?"], en: ["Is this pain pulsating or a constant pressure?", "Do you drink coffee or other caffeinated beverages regularly?", "Do you spend many hours in front of screens?"] },
    2: { pt: ["Com que frequência você precisa tomar analgésicos?", "A dor te impede de realizar suas atividades normais?", "Você sabia que o uso excessivo de analgésicos pode piorar as dores de cabeça?"], en: ["How often do you need to take painkillers?", "Does the pain prevent you from performing your normal activities?", "Did you know that overuse of painkillers can worsen headaches?"] },
    3: { pt: ["Você já fez exames para investigar a causa dessas dores?", "Você tem outros sintomas como tontura ou alterações na visão?", "Está ciente que dores de cabeça podem ser sintoma de problemas vasculares?"], en: ["Have you had tests to investigate the cause of these pains?", "Do you have other symptoms like dizziness or vision changes?", "Are you aware that headaches can be a symptom of vascular problems?"] },
    4: { pt: ["Você consome alimentos ricos em magnésio (folhas verdes, nozes)?", "Já ouviu falar dos benefícios da Coenzima Q10 para energia celular?", "Você sabia que a planta Butterbur é estudada para prevenção de enxaquecas?"], en: ["Do you consume foods rich in magnesium (leafy greens, nuts)?", "Have you heard about the benefits of Coenzyme Q10 for cellular energy?", "Did you know the Butterbur plant is studied for migraine prevention?"] },
    5: { pt: ["Quer conhecer a combinação de nutrientes que ataca as causas da dor?", "Prefere tratar a raiz do problema ou só aliviar o sintoma temporariamente?", "Está pronto para reduzir a dependência de analgésicos?"], en: ["Want to know the nutrient combination that attacks the causes of pain?", "Prefer to treat the root cause or just relieve the symptom temporarily?", "Are you ready to reduce reliance on painkillers?"] },
    6: { pt: ["Quanto vale um dia sem dor de cabeça para você?", "Você já pensou no impacto cumulativo dos analgésicos no seu fígado e rins?", "Está disposto a tentar uma solução natural com respaldo científico?"], en: ["How much is a headache-free day worth to you?", "Have you thought about the cumulative impact of painkillers on your liver and kidneys?", "Are you willing to try a natural solution with scientific backing?"] }
  },
  fatigue: {
    1: { pt: ["Essa fadiga é mais física ou mental?", "Como é a qualidade do seu sono? Você acorda cansado?", "Sua dieta é rica em alimentos processados ou açúcar?"], en: ["Is this fatigue more physical or mental?", "How is the quality of your sleep? Do you wake up tired?", "Is your diet high in processed foods or sugar?"] },
    2: { pt: ["Você depende de cafeína ou energéticos para passar o dia?", "Essa fadiga está afetando seu trabalho ou relacionamentos?", "Você sabia que a fadiga crônica pode enfraquecer seu sistema imunológico?"], en: ["Do you rely on caffeine or energy drinks to get through the day?", "Is this fatigue affecting your work or relationships?", "Did you know that chronic fatigue can weaken your immune system?"] },
    3: { pt: ["Você já fez exames de sangue para verificar tireoide, ferro e vitaminas?", "Você tem outros sintomas como ganho de peso inexplicado ou queda de cabelo?", "Está ciente que a fadiga pode ser um sintoma precoce de doenças crônicas?"], en: ["Have you had blood tests to check thyroid, iron, and vitamins?", "Do you have other symptoms like unexplained weight gain or hair loss?", "Are you aware that fatigue can be an early symptom of chronic diseases?"] },
    4: { pt: ["Você consome fontes de CoQ10 (carnes, peixes)?", "Já ouviu falar sobre plantas adaptogênicas como Rhodiola para combater o estresse?", "Você sabia que a D-Ribose é um açúcar que ajuda a produzir energia celular?"], en: ["Do you consume sources of CoQ10 (meats, fish)?", "Have you heard about adaptogenic plants like Rhodiola to combat stress?", "Did you know that D-Ribose is a sugar that helps produce cellular energy?"] },
    5: { pt: ["Quer conhecer a fórmula que fornece energia sustentável sem estimulantes artificiais?", "Prefere nutrir suas células ou continuar usando \'muletas\' energéticas?", "Está pronto para acordar sentindo-se realmente descansado e energizado?"], en: ["Want to know the formula that provides sustainable energy without artificial stimulants?", "Prefer to nourish your cells or continue using energy 'crutches'?", "Are you ready to wake up feeling truly rested and energized?"] },
    6: { pt: ["Quanto vale ter energia para aproveitar a vida ao máximo?", "Você já pensou no custo de oportunidade da sua baixa energia (projetos adiados, momentos perdidos)?", "Está disposto a investir em uma solução que restaura sua vitalidade de forma natural?"], en: ["How much is having the energy to enjoy life to the fullest worth?", "Have you thought about the opportunity cost of your low energy (postponed projects, missed moments)?", "Are you willing to invest in a solution that restores your vitality naturally?"] }
  },
  back_pain: {
    1: { pt: ["A dor piora ao ficar sentado ou em pé por muito tempo?", "Você pratica alguma atividade física regularmente?", "Você se senta com a postura correta na maior parte do dia?"], en: ["Does the pain worsen when sitting or standing for long periods?", "Do you practice any physical activity regularly?", "Do you sit with correct posture most of the day?"] },
    2: { pt: ["Essa dor limita seus movimentos ou atividades diárias?", "Você já precisou faltar ao trabalho por causa da dor?", "Você sabia que a dor crônica pode levar a alterações na estrutura cerebral?"], en: ["Does this pain limit your movements or daily activities?", "Have you ever had to miss work because of the pain?", "Did you know that chronic pain can lead to changes in brain structure?"] },
    3: { pt: ["Você sente a dor irradiar para as pernas ou pés?", "Você já fez ressonância magnética ou raio-x da coluna?", "Está ciente que problemas na coluna podem afetar a função de outros órgãos?"], en: ["Do you feel the pain radiating down your legs or feet?", "Have you had an MRI or X-ray of your spine?", "Are you aware that spinal problems can affect the function of other organs?"] },
    4: { pt: ["Sua dieta inclui fontes de colágeno (caldo de ossos, pele de frango)?", "Já ouviu falar dos benefícios do MSM para inflamação articular?", "Você sabia que a Cúrcuma precisa de pimenta preta (piperina) para ser bem absorvida?"], en: ["Does your diet include sources of collagen (bone broth, chicken skin)?", "Have you heard about the benefits of MSM for joint inflammation?", "Did you know that Turmeric needs black pepper (piperine) to be well absorbed?"] },
    5: { pt: ["Quer conhecer a combinação de ingredientes que nutre suas articulações e reduz a dor?", "Prefere uma solução que repara a cartilagem ou só alivia a dor temporariamente?", "Está pronto para se mover com mais liberdade e menos dor?"], en: ["Want to know the combination of ingredients that nourishes your joints and reduces pain?", "Prefer a solution that repairs cartilage or just relieves pain temporarily?", "Are you ready to move more freely and with less pain?"] },
    6: { pt: ["Quanto vale poder brincar com seus filhos ou netos sem dor?", "Você já pensou nos efeitos colaterais a longo prazo dos anti-inflamatórios?", "Está disposto a tentar uma abordagem que fortalece sua coluna de dentro para fora?"], en: ["How much is being able to play with your children or grandchildren without pain worth?", "Have you thought about the long-term side effects of anti-inflammatories?", "Are you willing to try an approach that strengthens your spine from the inside out?"] }
  },
  unknown: {
    1: { pt: ["Você consegue descrever melhor algum desses sintomas? Qual te incomoda mais?", "Esses sintomas apareceram de repente ou foram piorando com o tempo?", "Houve alguma mudança recente na sua dieta, rotina ou níveis de estresse?"], en: ["Can you better describe any of these symptoms? Which one bothers you the most?", "Did these symptoms appear suddenly or worsen over time?", "Has there been any recent change in your diet, routine, or stress levels?"] },
    2: { pt: ["Você já consultou um médico sobre esses sintomas? O que ele disse?", "Esses sintomas estão impactando sua qualidade de vida? De que forma?", "Você sabia que sintomas vagos podem ser um sinal de desequilíbrio hormonal?"], en: ["Have you consulted a doctor about these symptoms? What did they say?", "Are these symptoms impacting your quality of life? In what way?", "Did you know that vague symptoms can be a sign of hormonal imbalance?"] },
    3: { pt: ["Você tem outros sintomas como problemas de pele, alergias ou névoa mental?", "Você já fez exames para verificar inflamação (PCR, VHS) ou deficiências nutricionais?", "Está ciente que a saúde do intestino está ligada a quase todos os sistemas do corpo?"], en: ["Do you have other symptoms like skin problems, allergies, or brain fog?", "Have you had tests to check for inflammation (CRP, ESR) or nutritional deficiencies?", "Are you aware that gut health is linked to almost every system in the body?"] },
    4: { pt: ["Você toma algum multivitamínico ou suplemento atualmente? Qual?", "Já ouviu falar sobre o papel da Vitamina D na imunidade e inflamação?", "Você sabia que adaptógenos ajudam o corpo a se adaptar ao estresse físico e mental?"], en: ["Do you currently take any multivitamins or supplements? Which ones?", "Have you heard about the role of Vitamin D in immunity and inflammation?", "Did you know that adaptogens help the body adapt to physical and mental stress?"] },
    5: { pt: ["Quer conhecer uma fórmula de suporte básico que aborda as causas comuns de sintomas vagos?", "Prefere uma abordagem que fortalece seu corpo como um todo ou continuar tratando sintomas isolados?", "Está pronto para dar ao seu corpo os nutrientes que ele precisa para funcionar corretamente?"], en: ["Want to know a basic support formula that addresses common causes of vague symptoms?", "Prefer an approach that strengthens your body as a whole or continue treating isolated symptoms?", "Are you ready to give your body the nutrients it needs to function correctly?"] },
    6: { pt: ["Quanto vale se sentir bem e com energia na maior parte do tempo?", "Você já pensou no impacto que esses sintomas têm na sua felicidade e bem-estar geral?", "Está disposto a investir em uma base sólida para sua saúde?"], en: ["How much is feeling good and energetic most of the time worth?", "Have you thought about the impact these symptoms have on your happiness and overall well-being?", "Are you willing to invest in a solid foundation for your health?"] }
  }
};

// --- Lógica Principal ---

// Função para detectar o idioma da mensagem
function detectLanguage(message) {
  // Lógica simples (pode ser melhorada com bibliotecas de detecção de idioma)
  const portugueseKeywords = ["dor", "cabeça", "estômago", "costas", "fadiga", "cansaço", "você", "está", "tenho"];
  const lowerMessage = message.toLowerCase();
  const ptCount = portugueseKeywords.filter(kw => lowerMessage.includes(kw)).length;
  return ptCount > 0 ? "pt" : "en"; // Assume inglês como padrão se não detectar português
}

// Função para identificar o sintoma principal
function identifySymptom(message) {
  const lowerMessage = message.toLowerCase();
  // Melhorar a deteção com mais variações e termos
  if (lowerMessage.includes("estomago") || lowerMessage.includes("azia") || lowerMessage.includes("digestão") || lowerMessage.includes("digestao") || lowerMessage.includes("barriga")) return "stomach_pain";
  if (lowerMessage.includes("cabeça") || lowerMessage.includes("cabeca") || lowerMessage.includes("enxaqueca") || lowerMessage.includes("headache") || lowerMessage.includes("migraine")) return "headache";
  if (lowerMessage.includes("fadiga") || lowerMessage.includes("cansaço") || lowerMessage.includes("cansaco") || lowerMessage.includes("energia") || lowerMessage.includes("fatigue") || lowerMessage.includes("tired")) return "fatigue";
  if (lowerMessage.includes("costas") || lowerMessage.includes("lombar") || lowerMessage.includes("coluna") || lowerMessage.includes("back pain")) return "back_pain";
  return "unknown";
}

// Memória para rastrear conteúdo usado na sessão atual (simples, pode ser melhorado)
let sessionMemory = {
  usedIntros: [],
  usedExplanations: {},
  usedFollowups: []
};

// Função principal para obter o contexto do sintoma
async function getSymptomContext(userMessage, userName = "amigo", userAge = "", userWeight = "", funnelPhase = 1, previousSymptom = null, previouslySelectedQuestions = []) {
  // Adicionar timeout de 55 segundos para a função inteira
  try {
    return await promiseWithTimeout(async () => {
      const language = detectLanguage(userMessage);
      let sintomaKey = identifySymptom(userMessage);
      
      // Manter o sintoma anterior se o atual for desconhecido e houver um anterior
      if (sintomaKey === "unknown" && previousSymptom && previousSymptom !== "unknown") {
        sintomaKey = previousSymptom;
      }
      
      // Garantir que a chave do sintoma exista nos dados
      if (!intros[sintomaKey]) sintomaKey = "unknown";
      
      // Selecionar Introdução Sarcástica (evitando repetição na sessão)
      const availableIntros = intros[sintomaKey][language].filter(intro => !sessionMemory.usedIntros.includes(intro));
      let intro = getRandomElement(availableIntros.length > 0 ? availableIntros : intros[sintomaKey][language]);
      if (availableIntros.length > 0) sessionMemory.usedIntros.push(intro);
      if (sessionMemory.usedIntros.length > 5) sessionMemory.usedIntros.shift(); // Limitar memória
      intro = intro.replace("{userName}", userName || (language === 'pt' ? 'amigo' : 'friend'));
      
      // Selecionar Explicação Científica (evitando repetição para esta fase/sintoma)
      const phaseExplanations = explanations[sintomaKey]?.[funnelPhase]?.[language] || explanations["unknown"]?.[funnelPhase]?.[language] || [];
      const explanationKey = `${sintomaKey}-${funnelPhase}`;
      if (!sessionMemory.usedExplanations[explanationKey]) sessionMemory.usedExplanations[explanationKey] = [];
      const availableExplanations = phaseExplanations.filter(exp => !sessionMemory.usedExplanations[explanationKey].includes(exp));
      let scientificExplanation = getRandomElement(availableExplanations.length > 0 ? availableExplanations : phaseExplanations);
      if (availableExplanations.length > 0) sessionMemory.usedExplanations[explanationKey].push(scientificExplanation);
      if (sessionMemory.usedExplanations[explanationKey].length > 3) sessionMemory.usedExplanations[explanationKey].shift(); // Limitar memória
      
      // Selecionar Perguntas de Follow-up (evitando repetição geral e selecionadas anteriormente)
      const phaseFollowups = followupQuestions[sintomaKey]?.[funnelPhase]?.[language] || followupQuestions["unknown"]?.[funnelPhase]?.[language] || [];
      const availableFollowups = phaseFollowups.filter(q => 
        !sessionMemory.usedFollowups.includes(q) && 
        !previouslySelectedQuestions.includes(q)
      );
      
      let selectedFollowups = [];
      let potentialFollowups = availableFollowups.length > 0 ? [...availableFollowups] : [...phaseFollowups]; // Usar todas se não houver novas
      
      // Embaralhar e selecionar 3 perguntas únicas
      potentialFollowups.sort(() => 0.5 - Math.random()); 
      while (selectedFollowups.length < 3 && potentialFollowups.length > 0) {
        const question = potentialFollowups.shift();
        if (!selectedFollowups.includes(question)) {
          selectedFollowups.push(question);
          sessionMemory.usedFollowups.push(question); // Adicionar à memória geral de usadas
        }
      }
      // Se ainda faltarem perguntas, pegar das já usadas (menos recentes primeiro)
      const needed = 3 - selectedFollowups.length;
      if (needed > 0) {
         const olderUsed = sessionMemory.usedFollowups.filter(q => phaseFollowups.includes(q) && !selectedFollowups.includes(q));
         selectedFollowups.push(...olderUsed.slice(0, needed));
      }
      // Limitar memória geral de perguntas usadas
      if (sessionMemory.usedFollowups.length > 50) sessionMemory.usedFollowups = sessionMemory.usedFollowups.slice(-50);

      // Resetar memória se ficar muito grande (exemplo)
      if (sessionMemory.usedIntros.length > 10) sessionMemory.usedIntros = [];
      if (Object.keys(sessionMemory.usedExplanations).length > 20) sessionMemory.usedExplanations = {};

      // --- Integração Notion (Placeholder) ---
      // Aqui seria o local para chamar a API do Notion se necessário para esta fase
      // Exemplo: if (funnelPhase >= 4) { const notionData = await getNotionData(sintomaKey); ... }
      // Por agora, não faz chamadas para evitar timeouts
      
      return {
        sintoma: sintomaKey,
        intro,
        scientificExplanation,
        followupQuestions: selectedFollowups.slice(0, 3) // Garantir que sejam exatamente 3
      };
    }, 55000, new Error("Processamento interno demorou muito.")); // Timeout de 55 segundos

  } catch (error) {
    console.error("❌ Erro em getSymptomContext:", error);
    // Retornar uma resposta de erro padrão, mas com contexto
    const language = detectLanguage(userMessage);
    return {
      sintoma: "error",
      intro: language === 'pt' ? "Ops, {userName}, parece que meus circuitos deram um nó." : "Oops, {userName}, looks like my circuits got tangled.".replace("{userName}", userName || (language === 'pt' ? 'amigo' : 'friend')),
      scientificExplanation: language === 'pt' ? `Não consegui processar sua solicitação (${error.message}). Tente reformular a pergunta ou aguarde um momento.` : `I couldn't process your request (${error.message}). Try rephrasing or wait a moment.`,
      followupQuestions: language === 'pt' ? [
        "Quer tentar descrever o sintoma de outra forma?",
        "Podemos falar sobre outro sintoma?",
        "Quer que eu apenas espere um pouco?"
      ] : [
        "Want to try describing the symptom differently?",
        "Can we talk about another symptom?",
        "Want me to just wait a bit?"
      ]
    };
  }
}

// Exportar usando ES Modules
export { getSymptomContext };

