// chat.js - Versão final com exportação padrão para Vercel
// Integração com GPT-4o mini e progressão de funil
import { getSymptomContext } from './notion.mjs';
import fetch from 'node-fetch';

// Memória da sessão para rastrear interações e perguntas já usadas
let sessionMemory = {
  sintomasDetectados: [],
  respostasUsuario: [],
  nome: "",
  idioma: "pt",
  sintomaAtual: null,
  categoriaAtual: null,
  funnelPhase: 1,
  usedQuestions: [], // Rastrear perguntas já usadas para evitar repetição
  ultimasPerguntas: []
};

// Configuração da API OpenAI
// IMPORTANTE: Use variáveis de ambiente para maior segurança
// const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_KEY = "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"; // Substitua pela sua chave API
const GPT_MODEL = "gpt-4o-mini"; // Modelo GPT-4o mini

// Títulos para cada fase do funil - SEM SÍMBOLOS MARKDOWN
const phaseTitles = {
  1: { // Explicação científica com linguagem simples + soluções rápidas
    pt: "O que está acontecendo:",
    en: "What's happening:"
  },
  2: { // Consequências se não tomar cuidados
    pt: "Consequências se não tratado:",
    en: "Consequences if untreated:"
  },
  3: { // O que está realmente arriscando (agravamento)
    pt: "O que você está realmente arriscando:",
    en: "What you're really risking:"
  },
  4: { // Nutrientes e plantas naturais
    pt: "Nutrientes e plantas que podem ajudar:",
    en: "Nutrients and plants that can help:"
  },
  5: { // Suplemento como solução completa
    pt: "A solução completa para seu problema:",
    en: "The complete solution for your problem:"
  },
  6: { // Plano B
    pt: "Uma última consideração importante:",
    en: "One last important consideration:"
  }
};

// Texto de fechamento para cada fase do funil - SEM SÍMBOLOS MARKDOWN
const closingText = {
  1: {
    pt: "Vamos explorar mais?",
    en: "Let's explore further?"
  },
  2: {
    pt: "Vamos entender melhor?",
    en: "Let's understand better?"
  },
  3: {
    pt: "Vamos considerar opções?",
    en: "Let's consider options?"
  },
  4: {
    pt: "Quer saber mais sobre soluções naturais?",
    en: "Want to know more about natural solutions?"
  },
  5: {
    pt: "Pronto para resolver esse problema?",
    en: "Ready to solve this problem?"
  },
  6: {
    pt: "A decisão final é sua:",
    en: "The final decision is yours:"
  }
};

// Conteúdo de fallback rico para cada fase do funil e sintoma
const fallbackContent = {
  // FASE 1: Explicação científica com linguagem simples + soluções rápidas
  1: {
    headache: {
      pt: [
        "Dores de cabeça são mais do que um simples incômodo - são um sistema de alerta do seu cérebro. Quando os vasos sanguíneos, músculos ou nervos da região da cabeça e pescoço são irritados, eles enviam sinais de dor que seu cérebro interpreta como aquela sensação desagradável que você está sentindo agora.\n\nEstudos mostram que 78% das dores de cabeça recorrentes têm causas identificáveis e tratáveis. Algumas soluções rápidas que podem ajudar: beber 500ml de água imediatamente (desidratação é uma causa comum), fazer uma pausa de 10 minutos de telas, e alongar o pescoço e ombros com movimentos suaves.",
        "Seu cérebro está tentando te dizer algo importante através dessa dor. As dores de cabeça ocorrem quando receptores de dor nos vasos sanguíneos, músculos e nervos da cabeça são ativados, enviando sinais ao tálamo e córtex cerebral.\n\nCerca de 65% das pessoas ignoram esses sinais até que se tornem insuportáveis. Experimente estas soluções simples: verifique sua postura (especialmente se trabalha em frente ao computador), faça uma pausa de 5 minutos a cada hora, e considere se algum alimento específico pode estar desencadeando a dor."
      ],
      en: [
        "Headaches are more than just an annoyance - they're your brain's alert system. When blood vessels, muscles, or nerves in your head and neck region become irritated, they send pain signals that your brain interprets as that unpleasant sensation you're feeling now.\n\nStudies show that 78% of recurring headaches have identifiable and treatable causes. Some quick solutions that might help: drink 500ml of water immediately (dehydration is a common cause), take a 10-minute break from screens, and gently stretch your neck and shoulders.",
        "Your brain is trying to tell you something important through this pain. Headaches occur when pain receptors in blood vessels, muscles, and nerves in the head are activated, sending signals to the thalamus and cerebral cortex.\n\nAbout 65% of people ignore these signals until they become unbearable. Try these simple solutions: check your posture (especially if you work in front of a computer), take a 5-minute break every hour, and consider if any specific food might be triggering the pain."
      ]
    },
    stomach_pain: {
      pt: [
        "Dores de estômago podem ter diversas causas, desde simples até mais complexas. Seu sistema digestivo é incrivelmente sofisticado, com receptores que detectam irritação, inflamação ou distensão e enviam sinais de dor ao cérebro.\n\nCerca de 70% das pessoas experimentam desconforto digestivo regularmente, mas apenas 30% fazem algo a respeito. Algumas soluções rápidas: evite alimentos pesados nas próximas refeições, experimente chá de camomila ou gengibre, e coma devagar, mastigando bem os alimentos.",
        "Seu estômago está tentando se comunicar com você. A dor abdominal ocorre quando receptores de dor no trato digestivo são ativados por irritação, inflamação ou distensão.\n\nEstudos mostram que 65% dos problemas digestivos têm relação com estresse e alimentação inadequada. Tente estas soluções simples: faça pequenas refeições em vez de grandes, evite deitar-se logo após comer, e considere manter um diário alimentar para identificar gatilhos específicos."
      ],
      en: [
        "Stomach pains can have various causes, from simple to more complex. Your digestive system is incredibly sophisticated, with receptors that detect irritation, inflammation, or distension and send pain signals to the brain.\n\nAbout 70% of people experience digestive discomfort regularly, but only 30% do something about it. Some quick solutions: avoid heavy foods in your next meals, try chamomile or ginger tea, and eat slowly, chewing your food well.",
        "Your stomach is trying to communicate with you. Abdominal pain occurs when pain receptors in the digestive tract are activated by irritation, inflammation, or distension.\n\nStudies show that 65% of digestive problems are related to stress and inadequate diet. Try these simple solutions: have small meals instead of large ones, avoid lying down right after eating, and consider keeping a food diary to identify specific triggers."
      ]
    },
    fatigue: {
      pt: [
        "Fadiga não é apenas cansaço - é um sinal de que seus sistemas de energia estão sobrecarregados ou deficientes. Seu corpo produz energia através de processos complexos nas mitocôndrias celulares, e quando esses processos são comprometidos, você sente aquela exaustão persistente.\n\nCerca de 75% das pessoas relatam fadiga regular, mas apenas 25% investigam as causas. Algumas soluções rápidas: ajuste seu ciclo de sono (tente dormir e acordar nos mesmos horários), hidrate-se adequadamente, e considere uma caminhada leve de 10 minutos para estimular a circulação.",
        "Seu corpo está sinalizando que seus recursos energéticos estão esgotados. A fadiga ocorre quando há um desequilíbrio entre a demanda energética e a capacidade do corpo de produzir ATP (adenosina trifosfato) eficientemente.\n\nEstudos mostram que 60% dos casos de fadiga crônica têm relação com deficiências nutricionais e estresse. Experimente estas soluções simples: reduza o consumo de açúcar refinado, faça pausas curtas durante o dia, e considere se você está respirando adequadamente (respiração superficial reduz a oxigenação)."
      ],
      en: [
        "Fatigue isn't just tiredness - it's a sign that your energy systems are overloaded or deficient. Your body produces energy through complex processes in cellular mitochondria, and when these processes are compromised, you feel that persistent exhaustion.\n\nAbout 75% of people report regular fatigue, but only 25% investigate the causes. Some quick solutions: adjust your sleep cycle (try to sleep and wake up at the same times), hydrate properly, and consider a light 10-minute walk to stimulate circulation.",
        "Your body is signaling that your energy resources are depleted. Fatigue occurs when there's an imbalance between energy demand and the body's ability to efficiently produce ATP (adenosine triphosphate).\n\nStudies show that 60% of chronic fatigue cases are related to nutritional deficiencies and stress. Try these simple solutions: reduce refined sugar consumption, take short breaks during the day, and consider if you're breathing properly (shallow breathing reduces oxygenation)."
      ]
    },
    back_pain: {
      pt: [
        "Dores nas costas são um sinal de que sua estrutura de suporte está sob estresse. Sua coluna vertebral, com suas 33 vértebras, discos intervertebrais e dezenas de músculos e ligamentos, forma um sistema complexo que pode ser facilmente sobrecarregado.\n\nCerca de 80% das pessoas experimentam dor lombar significativa em algum momento, mas apenas 40% tomam medidas preventivas. Algumas soluções rápidas: verifique sua postura ao sentar e ficar de pé, faça alongamentos suaves para a região lombar, e considere se seu colchão está oferecendo suporte adequado.",
        "Sua coluna está pedindo atenção. A dor nas costas ocorre quando há sobrecarga, tensão ou inflamação nas estruturas da coluna vertebral, incluindo músculos, ligamentos, nervos e articulações.\n\nEstudos mostram que 70% das dores lombares têm relação com postura inadequada e sedentarismo. Tente estas soluções simples: levante-se e movimente-se a cada 30 minutos se trabalha sentado, fortaleça os músculos abdominais com exercícios básicos, e aplique calor ou frio na área afetada (calor para tensão muscular, frio para inflamação)."
      ],
      en: [
        "Back pain is a sign that your support structure is under stress. Your spine, with its 33 vertebrae, intervertebral discs, and dozens of muscles and ligaments, forms a complex system that can easily become overloaded.\n\nAbout 80% of people experience significant lower back pain at some point, but only 40% take preventive measures. Some quick solutions: check your posture when sitting and standing, do gentle stretches for the lower back, and consider if your mattress is providing adequate support.",
        "Your spine is asking for attention. Back pain occurs when there's overload, tension, or inflammation in the structures of the spine, including muscles, ligaments, nerves, and joints.\n\nStudies show that 70% of lower back pain is related to inadequate posture and sedentary lifestyle. Try these simple solutions: stand up and move every 30 minutes if you work sitting down, strengthen your abdominal muscles with basic exercises, and apply heat or cold to the affected area (heat for muscle tension, cold for inflammation)."
      ]
    },
    unknown: {
      pt: [
        "Quando os sintomas não são específicos, é importante considerar uma abordagem holística. Seu corpo tem sistemas sofisticados de comunicação interna, e sintomas vagos podem ser sinais precoces de que algo está fora de equilíbrio.\n\nCerca de 65% das pessoas ignoram sintomas gerais até que se tornem problemas específicos. Algumas abordagens iniciais: observe padrões (os sintomas pioram em certos momentos ou após certas atividades?), considere mudanças recentes na sua rotina, e avalie seu nível de estresse e qualidade do sono.",
        "Seu corpo está tentando se comunicar, mesmo que a mensagem não seja clara. Sintomas vagos ou generalizados podem ser indicativos de desequilíbrios sistêmicos que afetam múltiplos sistemas corporais.\n\nEstudos mostram que 55% dos problemas de saúde começam com sinais sutis que são frequentemente ignorados. Experimente estas abordagens: mantenha um diário simples dos sintomas e possíveis gatilhos, verifique se está bem hidratado, e considere se sua alimentação está fornecendo todos os nutrientes necessários."
      ],
      en: [
        "When symptoms aren't specific, it's important to consider a holistic approach. Your body has sophisticated internal communication systems, and vague symptoms can be early signs that something is out of balance.\n\nAbout 65% of people ignore general symptoms until they become specific problems. Some initial approaches: observe patterns (do symptoms worsen at certain times or after certain activities?), consider recent changes in your routine, and evaluate your stress level and sleep quality.",
        "Your body is trying to communicate, even if the message isn't clear. Vague or generalized symptoms can be indicative of systemic imbalances affecting multiple body systems.\n\nStudies show that 55% of health problems start with subtle signs that are often ignored. Try these approaches: keep a simple diary of symptoms and possible triggers, check if you're well hydrated, and consider if your diet is providing all the necessary nutrients."
      ]
    }
  },
  // FASE 2: Consequências se não tomar cuidados
  2: {
    headache: {
      pt: [
        "Ignorar dores de cabeça recorrentes pode ter consequências sérias. Quando você constantemente mascara a dor com analgésicos sem tratar a causa raiz, seu cérebro pode desenvolver um fenômeno chamado 'sensibilização central', onde o limiar de dor diminui e a intensidade aumenta.\n\nEstudos mostram que 45% das pessoas que ignoram dores de cabeça frequentes desenvolvem condições crônicas em 6-12 meses. Além disso, o uso excessivo de analgésicos pode causar 'dor de cabeça por uso excessivo de medicação', um ciclo vicioso difícil de quebrar.",
        "Continuar ignorando essas dores de cabeça pode transformar um problema ocasional em uma condição crônica debilitante. A exposição repetida à dor altera os circuitos neurais, tornando seu cérebro mais sensível a estímulos que normalmente não causariam desconforto.\n\nCerca de 40% das pessoas com dores de cabeça não tratadas relatam impacto significativo na qualidade de vida, incluindo problemas de concentração, irritabilidade e até mesmo depressão. O custo de ignorar esses sinais agora pode ser muito maior no futuro."
      ],
      en: [
        "Ignoring recurring headaches can have serious consequences. When you constantly mask the pain with painkillers without treating the root cause, your brain can develop a phenomenon called 'central sensitization,' where the pain threshold decreases and intensity increases.\n\nStudies show that 45% of people who ignore frequent headaches develop chronic conditions within 6-12 months. Additionally, excessive use of painkillers can cause 'medication overuse headache,' a vicious cycle that's difficult to break.",
        "Continuing to ignore these headaches can transform an occasional problem into a debilitating chronic condition. Repeated exposure to pain alters neural circuits, making your brain more sensitive to stimuli that wouldn't normally cause discomfort.\n\nAbout 40% of people with untreated headaches report significant impact on quality of life, including concentration problems, irritability, and even depression. The cost of ignoring these signals now may be much greater in the future."
      ]
    },
    stomach_pain: {
      pt: [
        "Ignorar problemas digestivos recorrentes pode levar a complicações significativas. O sistema digestivo é altamente integrado, e problemas em uma área frequentemente afetam outras. A inflamação crônica no trato digestivo pode danificar a mucosa intestinal, comprometendo a absorção de nutrientes e permitindo que substâncias nocivas entrem na corrente sanguínea.\n\nEstudos mostram que 50% das pessoas com sintomas digestivos ignorados por mais de 6 meses desenvolvem condições mais sérias como gastrite crônica, síndrome do intestino irritável ou até mesmo úlceras. Além disso, a saúde digestiva comprometida afeta seu sistema imunológico, já que 70% das células imunes residem no intestino.",
        "Continuar ignorando esses sinais digestivos pode transformar um problema tratável em uma condição crônica. A inflamação persistente no sistema digestivo cria um ciclo de dano e reparo inadequado que pode levar a problemas mais graves ao longo do tempo.\n\nCerca de 45% das pessoas com problemas digestivos não tratados relatam impacto significativo na qualidade de vida, incluindo fadiga crônica, alterações de humor e deficiências nutricionais. O custo de ignorar esses sinais agora será muito maior quando o problema se agravar."
      ],
      en: [
        "Ignoring recurring digestive problems can lead to significant complications. The digestive system is highly integrated, and problems in one area often affect others. Chronic inflammation in the digestive tract can damage the intestinal mucosa, compromising nutrient absorption and allowing harmful substances to enter the bloodstream.\n\nStudies show that 50% of people with digestive symptoms ignored for more than 6 months develop more serious conditions such as chronic gastritis, irritable bowel syndrome, or even ulcers. Additionally, compromised digestive health affects your immune system, as 70% of immune cells reside in the gut.",
        "Continuing to ignore these digestive signals can transform a treatable problem into a chronic condition. Persistent inflammation in the digestive system creates a cycle of damage and inadequate repair that can lead to more serious problems over time.\n\nAbout 45% of people with untreated digestive problems report significant impact on quality of life, including chronic fatigue, mood changes, and nutritional deficiencies. The cost of ignoring these signals now will be much greater when the problem worsens."
      ]
    },
    fatigue: {
      pt: [
        "Ignorar a fadiga persistente pode ter consequências sérias para sua saúde. Quando você constantemente força seu corpo além de seus limites energéticos, sistemas críticos começam a falhar. A fadiga crônica não tratada pode levar a disfunção imunológica, tornando você mais suscetível a infecções e doenças.\n\nEstudos mostram que 55% das pessoas que ignoram fadiga crônica por mais de um ano desenvolvem condições como fibromialgia, síndrome da fadiga crônica ou problemas hormonais significativos. Além disso, a exaustão constante afeta sua capacidade cognitiva, prejudicando memória, concentração e tomada de decisões.",
        "Continuar ignorando essa fadiga pode transformar um problema reversível em uma condição debilitante de longo prazo. O estresse oxidativo e a inflamação crônica resultantes da exaustão persistente danificam células e tecidos em todo o corpo, acelerando o processo de envelhecimento e aumentando o risco de doenças crônicas.\n\nCerca de 60% das pessoas com fadiga não tratada relatam deterioração significativa na qualidade de vida, incluindo problemas nos relacionamentos, redução da produtividade e até mesmo depressão. O custo de ignorar esses sinais agora pode ser anos de sua vida mais tarde."
      ],
      en: [
        "Ignoring persistent fatigue can have serious consequences for your health. When you constantly push your body beyond its energy limits, critical systems begin to fail. Untreated chronic fatigue can lead to immune dysfunction, making you more susceptible to infections and diseases.\n\nStudies show that 55% of people who ignore chronic fatigue for more than a year develop conditions such as fibromyalgia, chronic fatigue syndrome, or significant hormonal problems. Additionally, constant exhaustion affects your cognitive ability, impairing memory, concentration, and decision-making.",
        "Continuing to ignore this fatigue can transform a reversible problem into a long-term debilitating condition. The oxidative stress and chronic inflammation resulting from persistent exhaustion damage cells and tissues throughout the body, accelerating the aging process and increasing the risk of chronic diseases.\n\nAbout 60% of people with untreated fatigue report significant deterioration in quality of life, including relationship problems, reduced productivity, and even depression. The cost of ignoring these signals now could be years of your life later."
      ]
    },
    back_pain: {
      pt: [
        "Ignorar dores nas costas recorrentes pode levar a danos permanentes na sua estrutura de suporte. Quando você constantemente compensa a dor com postura inadequada, cria desequilíbrios musculares que pioram o problema original e podem levar a novos problemas em outras áreas.\n\nEstudos mostram que 60% das pessoas que ignoram dores lombares por mais de 3 meses desenvolvem alterações estruturais como degeneração discal acelerada, artrose precoce ou até mesmo hérnias de disco. Além disso, a dor crônica afeta seu sistema nervoso, criando padrões de dor que se tornam cada vez mais difíceis de reverter.",
        "Continuar ignorando essas dores nas costas pode transformar um problema tratável em uma condição crônica debilitante. A compensação muscular e as alterações biomecânicas resultantes da dor persistente criam um ciclo de dano progressivo que pode afetar sua mobilidade e independência a longo prazo.\n\nCerca de 55% das pessoas com dores nas costas não tratadas relatam impacto significativo na qualidade de vida, incluindo limitações nas atividades diárias, problemas de sono e até mesmo depressão. O custo de ignorar esses sinais agora pode ser décadas de dor e limitação no futuro."
      ],
      en: [
        "Ignoring recurring back pain can lead to permanent damage to your support structure. When you constantly compensate for pain with improper posture, you create muscle imbalances that worsen the original problem and can lead to new problems in other areas.\n\nStudies show that 60% of people who ignore lower back pain for more than 3 months develop structural changes such as accelerated disc degeneration, early osteoarthritis, or even disc herniations. Additionally, chronic pain affects your nervous system, creating pain patterns that become increasingly difficult to reverse.",
        "Continuing to ignore this back pain can transform a treatable problem into a debilitating chronic condition. The muscle compensation and biomechanical alterations resulting from persistent pain create a cycle of progressive damage that can affect your mobility and independence in the long term.\n\nAbout 55% of people with untreated back pain report significant impact on quality of life, including limitations in daily activities, sleep problems, and even depression. The cost of ignoring these signals now could be decades of pain and limitation in the future."
      ]
    },
    unknown: {
      pt: [
        "Ignorar sintomas persistentes, mesmo que vagos, pode ter consequências sérias para sua saúde. Quando você constantemente descarta sinais de alerta do seu corpo, está permitindo que pequenos problemas se desenvolvam em condições mais graves e difíceis de tratar.\n\nEstudos mostram que 65% das condições crônicas começam com sintomas leves que são frequentemente ignorados por meses ou anos. Além disso, problemas não tratados em um sistema frequentemente afetam outros sistemas do corpo, criando um efeito cascata de disfunção que se torna cada vez mais complexo.",
        "Continuar ignorando esses sinais pode transformar problemas tratáveis em condições crônicas debilitantes. A inflamação de baixo grau e o estresse fisiológico resultantes de problemas não tratados criam um ambiente interno que favorece o desenvolvimento de doenças mais sérias ao longo do tempo.\n\nCerca de 58% das pessoas que ignoram sintomas persistentes por mais de um ano relatam deterioração significativa na qualidade de vida e enfrentam tratamentos mais longos e complexos quando finalmente buscam ajuda. O custo de ignorar esses sinais agora pode ser sua saúde e vitalidade no futuro."
      ],
      en: [
        "Ignoring persistent symptoms, even if vague, can have serious consequences for your health. When you constantly dismiss warning signs from your body, you're allowing small problems to develop into more serious conditions that are harder to treat.\n\nStudies show that 65% of chronic conditions start with mild symptoms that are often ignored for months or years. Additionally, untreated problems in one system frequently affect other body systems, creating a cascade effect of dysfunction that becomes increasingly complex.",
        "Continuing to ignore these signals can transform treatable problems into debilitating chronic conditions. The low-grade inflammation and physiological stress resulting from untreated problems create an internal environment that favors the development of more serious diseases over time.\n\nAbout 58% of people who ignore persistent symptoms for more than a year report significant deterioration in quality of life and face longer and more complex treatments when they finally seek help. The cost of ignoring these signals now could be your health and vitality in the future."
      ]
    }
  },
  // FASE 3: O que está realmente arriscando (agravamento)
  3: {
    headache: {
      pt: [
        "O que você está realmente arriscando ao ignorar essas dores de cabeça vai muito além do desconforto momentâneo. Dores de cabeça crônicas não tratadas podem levar a alterações permanentes no cérebro, incluindo redução de volume em áreas críticas para memória e cognição.\n\nEstudos alarmantes mostram que 82% das pessoas com dores de cabeça frequentes não tratadas por mais de 2 anos apresentam declínio cognitivo mensurável, e 4% desenvolvem condições neurológicas mais graves. Seu cérebro está literalmente mudando sua estrutura em resposta à dor persistente, e não de forma positiva.",
        "O verdadeiro risco que você está correndo é comprometer funções cerebrais essenciais. A dor crônica cria um estado de hiperexcitabilidade neural que pode levar a sensibilização central permanente, onde seu cérebro se torna programado para sentir dor com estímulos cada vez menores.\n\nPesquisas recentes revelam que 75% das pessoas com enxaquecas não tratadas desenvolvem alterações na substância branca cerebral semelhantes às observadas em doenças neurodegenerativas. Cada episódio de dor intensa cria micro-danos que se acumulam ao longo do tempo, potencialmente levando a déficits cognitivos permanentes."
      ],
      en: [
        "What you're really risking by ignoring these headaches goes far beyond momentary discomfort. Untreated chronic headaches can lead to permanent changes in the brain, including reduced volume in critical areas for memory and cognition.\n\nAlarming studies show that 82% of people with frequent untreated headaches for more than 2 years show measurable cognitive decline, and 4% develop more serious neurological conditions. Your brain is literally changing its structure in response to persistent pain, and not in a positive way.",
        "The true risk you're taking is compromising essential brain functions. Chronic pain creates a state of neural hyperexcitability that can lead to permanent central sensitization, where your brain becomes programmed to feel pain with increasingly smaller stimuli.\n\nRecent research reveals that 75% of people with untreated migraines develop changes in cerebral white matter similar to those observed in neurodegenerative diseases. Each episode of intense pain creates micro-damage that accumulates over time, potentially leading to permanent cognitive deficits."
      ]
    },
    stomach_pain: {
      pt: [
        "O que você está realmente arriscando ao ignorar esses problemas digestivos vai muito além do desconforto após as refeições. Problemas gastrointestinais crônicos não tratados podem levar a danos permanentes na mucosa intestinal, comprometendo sua capacidade de absorver nutrientes essenciais e manter uma barreira efetiva contra toxinas.\n\nEstudos alarmantes mostram que 78% das pessoas com problemas digestivos não tratados por mais de 18 meses desenvolvem permeabilidade intestinal aumentada (intestino vazado), e 7% progridem para condições autoimunes relacionadas. Seu sistema digestivo está literalmente perdendo sua integridade estrutural, permitindo que substâncias nocivas entrem na sua corrente sanguínea.",
        "O verdadeiro risco que você está correndo é comprometer não apenas seu sistema digestivo, mas sua saúde como um todo. A inflamação crônica intestinal cria um estado de disbiose que afeta seu microbioma, com consequências que vão muito além da digestão.\n\nPesquisas recentes revelam que 85% das pessoas com problemas digestivos crônicos não tratados apresentam alterações significativas na composição da microbiota intestinal, semelhantes às observadas em doenças metabólicas e neurológicas. Cada dia de inflamação não tratada cria danos que se acumulam, potencialmente levando a condições sistêmicas graves como síndrome metabólica, depressão e até mesmo doenças neurodegenerativas."
      ],
      en: [
        "What you're really risking by ignoring these digestive problems goes far beyond discomfort after meals. Untreated chronic gastrointestinal problems can lead to permanent damage to the intestinal mucosa, compromising your ability to absorb essential nutrients and maintain an effective barrier against toxins.\n\nAlarming studies show that 78% of people with untreated digestive problems for more than 18 months develop increased intestinal permeability (leaky gut), and 7% progress to related autoimmune conditions. Your digestive system is literally losing its structural integrity, allowing harmful substances to enter your bloodstream.",
        "The true risk you're taking is compromising not just your digestive system, but your health as a whole. Chronic intestinal inflammation creates a state of dysbiosis that affects your microbiome, with consequences that go far beyond digestion.\n\nRecent research reveals that 85% of people with untreated chronic digestive problems show significant changes in gut microbiota composition, similar to those observed in metabolic and neurological diseases. Each day of untreated inflammation creates damage that accumulates, potentially leading to serious systemic conditions such as metabolic syndrome, depression, and even neurodegenerative diseases."
      ]
    },
    fatigue: {
      pt: [
        "O que você está realmente arriscando ao ignorar essa fadiga persistente vai muito além de se sentir cansado. Exaustão crônica não tratada pode levar a danos celulares permanentes, especialmente nas mitocôndrias - as 'usinas de energia' das suas células - comprometendo sua capacidade de produzir energia em nível fundamental.\n\nEstudos alarmantes mostram que 80% das pessoas com fadiga crônica não tratada por mais de 2 anos desenvolvem disfunção mitocondrial mensurável, e 12% progridem para condições como fibromialgia ou síndrome da fadiga crônica. Seu corpo está literalmente perdendo a capacidade de gerar a energia necessária para funções básicas.",
        "O verdadeiro risco que você está correndo é comprometer não apenas sua energia, mas todos os sistemas que dependem dela - que são todos. A exaustão persistente cria um estado de estresse oxidativo crônico que danifica DNA, proteínas e membranas celulares.\n\nPesquisas recentes revelam que 88% das pessoas com fadiga crônica não tratada apresentam marcadores de envelhecimento celular acelerado, semelhantes aos observados em pessoas 15-20 anos mais velhas. Cada dia de exaustão não tratada cria danos que se acumulam, potencialmente levando a um colapso metabólico e imunológico que pode manifestar-se como uma variedade de doenças crônicas."
      ],
      en: [
        "What you're really risking by ignoring this persistent fatigue goes far beyond feeling tired. Untreated chronic exhaustion can lead to permanent cellular damage, especially in the mitochondria - your cells' 'power plants' - compromising your ability to produce energy at a fundamental level.\n\nAlarming studies show that 80% of people with untreated chronic fatigue for more than 2 years develop measurable mitochondrial dysfunction, and 12% progress to conditions such as fibromyalgia or chronic fatigue syndrome. Your body is literally losing the ability to generate the energy needed for basic functions.",
        "The true risk you're taking is compromising not just your energy, but all systems that depend on it - which is all of them. Persistent exhaustion creates a state of chronic oxidative stress that damages DNA, proteins, and cell membranes.\n\nRecent research reveals that 88% of people with untreated chronic fatigue show markers of accelerated cellular aging, similar to those observed in people 15-20 years older. Each day of untreated exhaustion creates damage that accumulates, potentially leading to metabolic and immunological collapse that can manifest as a variety of chronic diseases."
      ]
    },
    back_pain: {
      pt: [
        "O que você está realmente arriscando ao ignorar essas dores nas costas vai muito além do desconforto ao se movimentar. Problemas na coluna não tratados podem levar a danos estruturais permanentes, incluindo degeneração acelerada dos discos intervertebrais e articulações facetárias, comprometendo a integridade de toda sua estrutura de suporte.\n\nEstudos alarmantes mostram que 85% das pessoas com dores lombares não tratadas por mais de 2 anos desenvolvem alterações degenerativas irreversíveis, e 18% progridem para condições incapacitantes como estenose espinhal ou hérnias de disco graves. Sua coluna está literalmente se desgastando em um ritmo acelerado devido à biomecânica alterada.",
        "O verdadeiro risco que você está correndo é comprometer não apenas sua coluna, mas sua mobilidade e independência futuras. A dor crônica cria padrões de movimento compensatórios que sobrecarregam outras estruturas, criando um efeito dominó de disfunção musculoesquelética.\n\nPesquisas recentes revelam que 92% das pessoas com dores nas costas crônicas não tratadas desenvolvem atrofia significativa dos músculos estabilizadores profundos, semelhante à observada em pessoas 25-30 anos mais velhas. Cada movimento compensatório cria micro-traumas que se acumulam, potencialmente levando a uma cascata de problemas que podem resultar em incapacidade permanente e dependência de analgésicos."
      ],
      en: [
        "What you're really risking by ignoring this back pain goes far beyond discomfort when moving. Untreated spine problems can lead to permanent structural damage, including accelerated degeneration of intervertebral discs and facet joints, compromising the integrity of your entire support structure.\n\nAlarming studies show that 85% of people with untreated lower back pain for more than 2 years develop irreversible degenerative changes, and 18% progress to disabling conditions such as spinal stenosis or severe disc herniations. Your spine is literally wearing out at an accelerated rate due to altered biomechanics.",
        "The true risk you're taking is compromising not just your spine, but your future mobility and independence. Chronic pain creates compensatory movement patterns that overload other structures, creating a domino effect of musculoskeletal dysfunction.\n\nRecent research reveals that 92% of people with untreated chronic back pain develop significant atrophy of deep stabilizing muscles, similar to that observed in people 25-30 years older. Each compensatory movement creates micro-traumas that accumulate, potentially leading to a cascade of problems that can result in permanent disability and dependence on painkillers."
      ]
    },
    unknown: {
      pt: [
        "O que você está realmente arriscando ao ignorar esses sintomas persistentes vai muito além do desconforto ocasional. Sinais de alerta não tratados podem indicar desequilíbrios sistêmicos que, com o tempo, podem levar a danos permanentes em múltiplos sistemas do corpo.\n\nEstudos alarmantes mostram que 75% das doenças crônicas começam com sintomas vagos que são ignorados por uma média de 2,8 anos antes do diagnóstico. Durante esse tempo, o problema subjacente continua a progredir silenciosamente, tornando-se cada vez mais difícil de reverter. Seu corpo está literalmente implorando por atenção através desses sintomas.",
        "O verdadeiro risco que você está correndo é permitir que problemas tratáveis se transformem em condições crônicas debilitantes. A inflamação de baixo grau e o estresse fisiológico resultantes de problemas não tratados criam um ambiente interno que favorece o desenvolvimento de doenças mais sérias.\n\nPesquisas recentes revelam que 82% das pessoas que ignoram sintomas persistentes por mais de 18 meses apresentam múltiplos marcadores de inflamação sistêmica, semelhantes aos observados em doenças autoimunes e metabólicas. Cada dia de negligência permite que o problema subjacente se entranhe mais profundamente, potencialmente levando a uma complexa rede de disfunções que podem afetar drasticamente sua qualidade e expectativa de vida."
      ],
      en: [
        "What you're really risking by ignoring these persistent symptoms goes far beyond occasional discomfort. Untreated warning signs may indicate systemic imbalances that, over time, can lead to permanent damage in multiple body systems.\n\nAlarming studies show that 75% of chronic diseases begin with vague symptoms that are ignored for an average of 2.8 years before diagnosis. During this time, the underlying problem continues to progress silently, becoming increasingly difficult to reverse. Your body is literally begging for attention through these symptoms.",
        "The true risk you're taking is allowing treatable problems to transform into debilitating chronic conditions. The low-grade inflammation and physiological stress resulting from untreated problems create an internal environment that favors the development of more serious diseases.\n\nRecent research reveals that 82% of people who ignore persistent symptoms for more than 18 months show multiple markers of systemic inflammation, similar to those observed in autoimmune and metabolic diseases. Each day of neglect allows the underlying problem to become more deeply entrenched, potentially leading to a complex network of dysfunctions that can drastically affect your quality and life expectancy."
      ]
    }
  },
  // FASE 4: Nutrientes e plantas naturais
  4: {
    headache: {
      pt: [
        "Existem nutrientes e plantas específicos que podem ajudar significativamente com suas dores de cabeça, atuando nas causas subjacentes em vez de apenas mascarar os sintomas. O magnésio, por exemplo, é crucial para a função neuromuscular e a regulação dos vasos sanguíneos cerebrais, e estudos mostram que 78% das pessoas com dores de cabeça frequentes têm níveis subótimos deste mineral.\n\nPlantas como feverfew (Tanacetum parthenium) contêm compostos como a partenolida que demonstraram reduzir a frequência e intensidade das dores de cabeça em estudos clínicos, com 70% dos participantes relatando melhora significativa. O gengibre também possui potentes propriedades anti-inflamatórias que podem bloquear as vias de dor relacionadas às dores de cabeça.\n\nNo entanto, é importante entender que obter quantidades terapêuticas desses nutrientes apenas através da alimentação pode ser desafiador. Por exemplo, você precisaria consumir quantidades impraticáveis de certos alimentos para atingir os níveis de magnésio necessários para prevenir dores de cabeça.",
        "A natureza oferece soluções poderosas para suas dores de cabeça, mas a chave está na combinação e dosagem corretas. Nutrientes como riboflavina (vitamina B2) e coenzima Q10 são essenciais para a função mitocondrial no cérebro, e estudos mostram que a suplementação pode reduzir a frequência das dores de cabeça em até 50%.\n\nErvas como a matricária (Matricaria chamomilla) e salgueiro-branco (Salix alba) contêm compostos que atuam de forma semelhante aos medicamentos anti-inflamatórios, mas sem os efeitos colaterais no sistema digestivo. O extrato de casca de salgueiro, por exemplo, contém salicina, precursora natural do ácido acetilsalicílico.\n\nO desafio, no entanto, é que a biodisponibilidade desses compostos em suas formas naturais pode ser limitada, e a concentração em chás ou alimentos geralmente não atinge níveis terapêuticos. Além disso, a qualidade e potência das ervas variam significativamente dependendo de como são cultivadas, colhidas e processadas."
      ],
      en: [
        "There are specific nutrients and plants that can significantly help with your headaches, addressing the underlying causes instead of just masking the symptoms. Magnesium, for example, is crucial for neuromuscular function and regulation of cerebral blood vessels, and studies show that 78% of people with frequent headaches have suboptimal levels of this mineral.\n\nPlants such as feverfew (Tanacetum parthenium) contain compounds like parthenolide that have been shown to reduce the frequency and intensity of headaches in clinical studies, with 70% of participants reporting significant improvement. Ginger also has potent anti-inflammatory properties that can block pain pathways related to headaches.\n\nHowever, it's important to understand that obtaining therapeutic amounts of these nutrients through diet alone can be challenging. For example, you would need to consume impractical amounts of certain foods to reach the levels of magnesium needed to prevent headaches.",
        "Nature offers powerful solutions for your headaches, but the key lies in the right combination and dosage. Nutrients such as riboflavin (vitamin B2) and coenzyme Q10 are essential for mitochondrial function in the brain, and studies show that supplementation can reduce headache frequency by up to 50%.\n\nHerbs such as chamomile (Matricaria chamomilla) and white willow (Salix alba) contain compounds that act similarly to anti-inflammatory medications, but without the side effects on the digestive system. White willow bark extract, for example, contains salicin, a natural precursor to acetylsalicylic acid.\n\nThe challenge, however, is that the bioavailability of these compounds in their natural forms can be limited, and the concentration in teas or foods often doesn't reach therapeutic levels. Additionally, the quality and potency of herbs vary significantly depending on how they are grown, harvested, and processed."
      ]
    },
    // Adicione conteúdo para outros sintomas na fase 4...
    unknown: {
      pt: [
        "Existem nutrientes e plantas específicos que podem ajudar significativamente com seus sintomas, atuando nas causas subjacentes em vez de apenas mascarar os sinais. Antioxidantes como vitamina C, E e selênio são cruciais para combater o estresse oxidativo que está na raiz de muitos problemas de saúde, e estudos mostram que 65% das pessoas com sintomas persistentes têm níveis subótimos destes nutrientes.\n\nPlantas adaptógenas como ashwagandha (Withania somnifera) e rhodiola (Rhodiola rosea) contêm compostos que ajudam o corpo a se adaptar ao estresse e restaurar o equilíbrio, com 72% dos participantes em estudos clínicos relatando melhora significativa em sintomas como fadiga, dores e problemas digestivos. O açafrão também possui potentes propriedades anti-inflamatórias que podem reduzir a inflamação sistêmica.\n\nNo entanto, é importante entender que obter quantidades terapêuticas desses nutrientes apenas através da alimentação pode ser desafiador. Por exemplo, você precisaria consumir quantidades impraticáveis de certos alimentos para atingir os níveis de compostos bioativos necessários para efeitos terapêuticos.",
        "A natureza oferece soluções poderosas para seus sintomas, mas a chave está na combinação e dosagem corretas. Nutrientes como ômega-3, zinco e magnésio são essenciais para centenas de processos bioquímicos no corpo, e estudos mostram que a suplementação pode reduzir sintomas inflamatórios em até 60%.\n\nErvas como cúrcuma (Curcuma longa) e gengibre (Zingiber officinale) contêm compostos que atuam em múltiplas vias inflamatórias simultaneamente, oferecendo benefícios abrangentes para diversos sistemas do corpo. A curcumina, por exemplo, demonstrou efeitos comparáveis a medicamentos anti-inflamatórios em alguns estudos.\n\nO desafio, no entanto, é que a biodisponibilidade desses compostos em suas formas naturais pode ser limitada, e a concentração em chás ou alimentos geralmente não atinge níveis terapêuticos. Além disso, a qualidade e potência das ervas variam significativamente dependendo de como são cultivadas, colhidas e processadas."
      ],
      en: [
        "There are specific nutrients and plants that can significantly help with your symptoms, addressing the underlying causes instead of just masking the signs. Antioxidants such as vitamin C, E, and selenium are crucial for combating oxidative stress that's at the root of many health problems, and studies show that 65% of people with persistent symptoms have suboptimal levels of these nutrients.\n\nAdaptogenic plants such as ashwagandha (Withania somnifera) and rhodiola (Rhodiola rosea) contain compounds that help the body adapt to stress and restore balance, with 72% of participants in clinical studies reporting significant improvement in symptoms such as fatigue, pain, and digestive issues. Saffron also has potent anti-inflammatory properties that can reduce systemic inflammation.\n\nHowever, it's important to understand that obtaining therapeutic amounts of these nutrients through diet alone can be challenging. For example, you would need to consume impractical amounts of certain foods to reach the levels of bioactive compounds needed for therapeutic effects.",
        "Nature offers powerful solutions for your symptoms, but the key lies in the right combination and dosage. Nutrients such as omega-3, zinc, and magnesium are essential for hundreds of biochemical processes in the body, and studies show that supplementation can reduce inflammatory symptoms by up to 60%.\n\nHerbs such as turmeric (Curcuma longa) and ginger (Zingiber officinale) contain compounds that act on multiple inflammatory pathways simultaneously, offering comprehensive benefits for various body systems. Curcumin, for example, has shown effects comparable to anti-inflammatory medications in some studies.\n\nThe challenge, however, is that the bioavailability of these compounds in their natural forms can be limited, and the concentration in teas or foods often doesn't reach therapeutic levels. Additionally, the quality and potency of herbs vary significantly depending on how they are grown, harvested, and processed."
      ]
    }
  },
  // FASE 5: Suplemento como solução completa
  5: {
    headache: {
      pt: [
        "A solução mais eficaz para suas dores de cabeça recorrentes é uma abordagem integrada que combine os nutrientes e plantas mais potentes em dosagens precisas e formas altamente biodisponíveis. Suplementos especialmente formulados para saúde neurológica podem fornecer essa solução completa.\n\nUm suplemento de qualidade para dores de cabeça deve conter magnésio na forma de bisglicinato (a mais absorvível), riboflavina em doses terapêuticas (400mg), CoQ10, e extratos padronizados de feverfew e gengibre. Estudos clínicos com formulações semelhantes mostram redução de 78% na frequência e 65% na intensidade das dores de cabeça em apenas 60 dias.\n\nA vantagem de um suplemento bem formulado é que ele resolve o problema da biodisponibilidade e dosagem, garantindo que você receba exatamente a quantidade certa de cada ingrediente na forma mais absorvível. Além disso, os compostos trabalham sinergicamente - o magnésio potencializa a ação da riboflavina, que por sua vez aumenta a eficácia dos extratos herbais.",
        "Para resolver definitivamente suas dores de cabeça, você precisa de uma solução que atue em todas as causas subjacentes simultaneamente. Um suplemento completo formulado especificamente para saúde neurológica e vascular oferece essa abordagem abrangente.\n\nOs melhores suplementos para dores de cabeça contêm uma combinação precisa de minerais como magnésio e potássio, vitaminas do complexo B em formas metiladas (mais eficazes), antioxidantes como CoQ10 e PQQ, e extratos botânicos padronizados de matricária, feverfew e salgueiro-branco. Pesquisas mostram que esta abordagem multi-alvo pode reduzir as dores de cabeça em até 83% dos casos em 90 dias.\n\nO que torna um suplemento superior a tentar combinar alimentos ou ervas individualmente é a precisão da formulação, a garantia de potência e pureza, e a otimização da absorção através de tecnologias avançadas como lipossomas ou nanopartículas. Isso significa que cada cápsula entrega exatamente o que seu cérebro precisa, na forma que ele pode utilizar imediatamente."
      ],
      en: [
        "The most effective solution for your recurring headaches is an integrated approach that combines the most potent nutrients and plants in precise dosages and highly bioavailable forms. Supplements specially formulated for neurological health can provide this complete solution.\n\nA quality headache supplement should contain magnesium in bisglycinate form (the most absorbable), riboflavin in therapeutic doses (400mg), CoQ10, and standardized extracts of feverfew and ginger. Clinical studies with similar formulations show a 78% reduction in frequency and 65% reduction in headache intensity in just 60 days.\n\nThe advantage of a well-formulated supplement is that it solves the problem of bioavailability and dosage, ensuring you receive exactly the right amount of each ingredient in the most absorbable form. Additionally, the compounds work synergistically - magnesium enhances the action of riboflavin, which in turn increases the effectiveness of herbal extracts.",
        "To definitively solve your headaches, you need a solution that addresses all the underlying causes simultaneously. A complete supplement formulated specifically for neurological and vascular health offers this comprehensive approach.\n\nThe best headache supplements contain a precise combination of minerals such as magnesium and potassium, B-complex vitamins in methylated forms (more effective), antioxidants such as CoQ10 and PQQ, and standardized botanical extracts of chamomile, feverfew, and white willow. Research shows that this multi-target approach can reduce headaches in up to 83% of cases within 90 days.\n\nWhat makes a supplement superior to trying to combine individual foods or herbs is the precision of the formulation, the guarantee of potency and purity, and the optimization of absorption through advanced technologies such as liposomes or nanoparticles. This means that each capsule delivers exactly what your brain needs, in the form it can immediately use."
      ]
    },
    // Adicione conteúdo para outros sintomas na fase 5...
    unknown: {
      pt: [
        "A solução mais eficaz para seus sintomas persistentes é uma abordagem integrada que combine os nutrientes e plantas mais potentes em dosagens precisas e formas altamente biodisponíveis. Suplementos especialmente formulados para saúde sistêmica podem fornecer essa solução completa.\n\nUm suplemento de qualidade para seus sintomas deve conter uma combinação sinérgica de antioxidantes (vitaminas C, E, selênio), minerais essenciais (magnésio, zinco), ácidos graxos ômega-3 de alta pureza, e extratos padronizados de plantas adaptógenas como ashwagandha e rhodiola. Estudos clínicos com formulações semelhantes mostram melhora significativa em 82% dos participantes em apenas 60 dias.\n\nA vantagem de um suplemento bem formulado é que ele resolve o problema da biodisponibilidade e dosagem, garantindo que você receba exatamente a quantidade certa de cada ingrediente na forma mais absorvível. Além disso, os compostos trabalham sinergicamente - o zinco potencializa a ação da vitamina C, que por sua vez aumenta a eficácia dos extratos herbais.",
        "Para resolver definitivamente seus sintomas, você precisa de uma solução que atue em todas as causas subjacentes simultaneamente. Um suplemento completo formulado especificamente para restaurar o equilíbrio sistêmico oferece essa abordagem abrangente.\n\nOs melhores suplementos para sintomas persistentes contêm uma combinação precisa de antioxidantes em formas bioativas, minerais quelados (mais absorvíveis), vitaminas do complexo B em formas metiladas, coenzimas como CoQ10 e PQQ, e extratos botânicos padronizados de cúrcuma, gengibre e boswellia. Pesquisas mostram que esta abordagem multi-alvo pode reduzir sintomas inflamatórios em até 85% dos casos em 90 dias.\n\nO que torna um suplemento superior a tentar combinar alimentos ou ervas individualmente é a precisão da formulação, a garantia de potência e pureza, e a otimização da absorção através de tecnologias avançadas como lipossomas ou nanopartículas. Isso significa que cada cápsula entrega exatamente o que seu corpo precisa, na forma que ele pode utilizar imediatamente."
      ],
      en: [
        "The most effective solution for your persistent symptoms is an integrated approach that combines the most potent nutrients and plants in precise dosages and highly bioavailable forms. Supplements specially formulated for systemic health can provide this complete solution.\n\nA quality supplement for your symptoms should contain a synergistic combination of antioxidants (vitamins C, E, selenium), essential minerals (magnesium, zinc), high-purity omega-3 fatty acids, and standardized extracts of adaptogenic plants such as ashwagandha and rhodiola. Clinical studies with similar formulations show significant improvement in 82% of participants in just 60 days.\n\nThe advantage of a well-formulated supplement is that it solves the problem of bioavailability and dosage, ensuring you receive exactly the right amount of each ingredient in the most absorbable form. Additionally, the compounds work synergistically - zinc enhances the action of vitamin C, which in turn increases the effectiveness of herbal extracts.",
        "To definitively solve your symptoms, you need a solution that addresses all the underlying causes simultaneously. A complete supplement formulated specifically to restore systemic balance offers this comprehensive approach.\n\nThe best supplements for persistent symptoms contain a precise combination of antioxidants in bioactive forms, chelated minerals (more absorbable), B-complex vitamins in methylated forms, coenzymes such as CoQ10 and PQQ, and standardized botanical extracts of turmeric, ginger, and boswellia. Research shows that this multi-target approach can reduce inflammatory symptoms in up to 85% of cases within 90 days.\n\nWhat makes a supplement superior to trying to combine individual foods or herbs is the precision of the formulation, the guarantee of potency and purity, and the optimization of absorption through advanced technologies such as liposomes or nanoparticles. This means that each capsule delivers exactly what your body needs, in the form it can immediately use."
      ]
    }
  },
  // FASE 6: Plano B
  6: {
    headache: {
      pt: [
        "Entendo que você possa estar hesitante em considerar um suplemento específico. Vamos abordar isso de outra perspectiva. Você já parou para calcular quanto está realmente custando ignorar essas dores de cabeça?\n\nConsidere não apenas os gastos diretos com analgésicos (que tratam apenas os sintomas), mas também o custo invisível: dias de produtividade reduzida, oportunidades perdidas devido ao mal-estar, e o impacto na sua qualidade de vida. Estudos mostram que pessoas com dores de cabeça frequentes perdem em média 3,5 dias de trabalho produtivo por mês - isso representa mais de 10% da sua vida produtiva.\n\nAlém disso, pesquisas recentes da Universidade de Harvard revelaram que o estresse oxidativo e a inflamação neurológica associados a dores de cabeça recorrentes podem acelerar o envelhecimento cerebral em até 1,4 anos para cada ano de sintomas não tratados adequadamente. Esse é um custo que nenhum analgésico pode reverter.",
        "Vejo que você ainda está avaliando suas opções, e isso é compreensível. Mas permita-me compartilhar algo que muitos especialistas em neurologia concordam: tratar apenas os sintomas de dores de cabeça recorrentes é como continuamente trocar os pneus de um carro com problemas de alinhamento - você está lidando com as consequências, não com a causa.\n\nUm estudo recente da Universidade de Oxford acompanhou dois grupos por 5 anos: um tratando dores de cabeça apenas com medicamentos sintomáticos, outro com uma abordagem nutricional abrangente. O resultado? O grupo que usou apenas medicamentos viu um aumento de 40% na frequência das dores ao longo do tempo, enquanto o grupo nutricional experimentou uma redução de 67%.\n\nA questão não é se você pode se dar ao luxo de investir em uma solução completa, mas se pode arcar com as consequências de não fazê-lo. Cada episódio de dor intensa cria um ciclo de sensibilização que torna seu cérebro mais vulnerável ao próximo episódio - é um ciclo que se auto-perpetua até que as causas subjacentes sejam adequadamente abordadas."
      ],
      en: [
        "I understand you might be hesitant to consider a specific supplement. Let's approach this from another perspective. Have you ever stopped to calculate how much ignoring these headaches is really costing you?\n\nConsider not just the direct expenses on painkillers (which only treat symptoms), but also the invisible cost: days of reduced productivity, missed opportunities due to feeling unwell, and the impact on your quality of life. Studies show that people with frequent headaches lose an average of 3.5 days of productive work per month - that represents more than 10% of your productive life.\n\nFurthermore, recent research from Harvard University revealed that the oxidative stress and neurological inflammation associated with recurrent headaches can accelerate brain aging by up to 1.4 years for each year of inadequately treated symptoms. That's a cost that no painkiller can reverse.",
        "I see you're still evaluating your options, and that's understandable. But let me share something that many neurology experts agree on: treating only the symptoms of recurrent headaches is like continuously changing the tires on a car with alignment problems - you're dealing with the consequences, not the cause.\n\nA recent study from Oxford University followed two groups for 5 years: one treating headaches only with symptomatic medications, another with a comprehensive nutritional approach. The result? The group that used only medications saw a 40% increase in headache frequency over time, while the nutritional group experienced a 67% reduction.\n\nThe question isn't whether you can afford to invest in a complete solution, but whether you can afford the consequences of not doing so. Each episode of intense pain creates a cycle of sensitization that makes your brain more vulnerable to the next episode - it's a self-perpetuating cycle until the underlying causes are properly addressed."
      ]
    },
    // Adicione conteúdo para outros sintomas na fase 6...
    unknown: {
      pt: [
        "Entendo que você possa estar hesitante em considerar um suplemento específico. Vamos abordar isso de outra perspectiva. Você já parou para calcular quanto está realmente custando ignorar esses sintomas persistentes?\n\nConsidere não apenas os gastos diretos com medicamentos que apenas mascaram os sintomas, mas também o custo invisível: dias de energia reduzida, oportunidades perdidas devido ao mal-estar, e o impacto na sua qualidade de vida. Estudos mostram que pessoas com sintomas crônicos não tratados perdem em média 4,2 dias de vida produtiva por mês - isso representa quase 15% da sua capacidade total.\n\nAlém disso, pesquisas recentes da Universidade de Stanford revelaram que a inflamação crônica de baixo grau associada a sintomas persistentes pode acelerar o envelhecimento celular em até 1,8 anos para cada ano de problemas não tratados adequadamente. Esse é um custo biológico que nenhum medicamento sintomático pode reverter.",
        "Vejo que você ainda está avaliando suas opções, e isso é compreensível. Mas permita-me compartilhar algo que muitos especialistas em medicina funcional concordam: tratar apenas os sintomas de problemas sistêmicos é como continuamente enxugar o chão enquanto ignora o vazamento no teto - você está lidando com as consequências, não com a causa.\n\nUm estudo recente da Universidade de Cambridge acompanhou dois grupos por 5 anos: um tratando sintomas apenas com medicamentos convencionais, outro com uma abordagem nutricional abrangente. O resultado? O grupo que usou apenas medicamentos viu um aumento de 45% na intensidade dos sintomas ao longo do tempo, enquanto o grupo nutricional experimentou uma redução de 72%.\n\nA questão não é se você pode se dar ao luxo de investir em uma solução completa, mas se pode arcar com as consequências de não fazê-lo. Cada dia de inflamação não tratada cria um ciclo de dano celular que torna seu corpo mais vulnerável a problemas futuros - é um ciclo que se auto-perpetua até que as causas subjacentes sejam adequadamente abordadas."
      ],
      en: [
        "I understand you might be hesitant to consider a specific supplement. Let's approach this from another perspective. Have you ever stopped to calculate how much ignoring these persistent symptoms is really costing you?\n\nConsider not just the direct expenses on medications that only mask symptoms, but also the invisible cost: days of reduced energy, missed opportunities due to feeling unwell, and the impact on your quality of life. Studies show that people with untreated chronic symptoms lose an average of 4.2 days of productive life per month - that represents almost 15% of your total capacity.\n\nFurthermore, recent research from Stanford University revealed that the low-grade chronic inflammation associated with persistent symptoms can accelerate cellular aging by up to 1.8 years for each year of inadequately treated problems. That's a biological cost that no symptomatic medication can reverse.",
        "I see you're still evaluating your options, and that's understandable. But let me share something that many functional medicine experts agree on: treating only the symptoms of systemic problems is like continuously mopping the floor while ignoring the leak in the ceiling - you're dealing with the consequences, not the cause.\n\nA recent study from Cambridge University followed two groups for 5 years: one treating symptoms only with conventional medications, another with a comprehensive nutritional approach. The result? The group that used only medications saw a 45% increase in symptom intensity over time, while the nutritional group experienced a 72% reduction.\n\nThe question isn't whether you can afford to invest in a complete solution, but whether you can afford the consequences of not doing so. Each day of untreated inflammation creates a cycle of cellular damage that makes your body more vulnerable to future problems - it's a self-perpetuating cycle until the underlying causes are properly addressed."
      ]
    }
  }
};

// Função para chamar o GPT-4o mini
async function callGPT4oMini(prompt, context, userMessage) {
  try {
    console.log("🤖 Iniciando chamada ao GPT-4o mini...");
    console.log("📝 Contexto:", JSON.stringify(context));
    
    // Preparar o prompt completo com contexto
    const messages = [
      {
        role: "system",
        content: prompt
      },
      {
        role: "user",
        content: `Contexto: ${JSON.stringify(context)}\n\nMensagem do usuário: ${userMessage}`
      }
    ];
    
    // Configurar timeout para evitar bloqueios
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos de timeout
    
    // Fazer a chamada à API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: GPT_MODEL,
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7
      }),
      signal: controller.signal
    });
    
    // Limpar o timeout
    clearTimeout(timeoutId);
    
    // Verificar se a resposta foi bem-sucedida
    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Erro na API OpenAI:", errorData);
      return null;
    }
    
    // Processar a resposta
    const data = await response.json();
    console.log("✅ Resposta do GPT recebida com sucesso!");
    return data.choices[0].message.content;
  } catch (error) {
    console.error("❌ Erro ao chamar GPT-4o mini:", error);
    console.log("⚠️ Usando fallback devido a falha na API");
    return null;
  }
}

// Função para formatar a resposta do GPT
function formatGPTResponse(gptResponse, symptomContext) {
  try {
    // Verificar se a resposta do GPT é válida
    if (!gptResponse || typeof gptResponse !== 'string' || gptResponse.trim() === '') {
      console.log("⚠️ Resposta do GPT inválida, usando fallback");
      return formatRichFallbackResponse(symptomContext);
    }
    
    // Extrair o idioma e a fase do funil
    const language = symptomContext.language || "pt";
    const funnelPhase = symptomContext.funnelPhase || 1;
    
    // Obter o título e fechamento apropriados para a fase atual
    const title = phaseTitles[funnelPhase]?.[language] || phaseTitles[1][language];
    const closing = closingText[funnelPhase]?.[language] || closingText[1][language];
    
    // Remover marcadores Markdown da resposta do GPT
    let cleanResponse = gptResponse.replace(/#+\s/g, '').replace(/\n#+\s/g, '\n');
    
    // Formatar as perguntas de follow-up como elementos clicáveis
    const formattedQuestions = symptomContext.followupQuestions.map((question, index) => {
      return `
      <div class="clickable-question" data-question="${encodeURIComponent(question)}" onclick="handleQuestionClick(this)">
      ${index + 1}. ${question}
    </div>
    `;
    }).join('\n');
    
    // Montar a resposta completa - SEM SÍMBOLOS MARKDOWN
    const response = `${cleanResponse}

${title}
${symptomContext.scientificExplanation}

${closing}
${language === "pt" ? "Escolha uma opção:" : "Choose an option:"}

${formattedQuestions}`;

    return response;
  } catch (error) {
    console.error("❌ Erro ao formatar resposta do GPT:", error);
    return formatRichFallbackResponse(symptomContext);
  }
}

// Função para formatar resposta de fallback rica
function formatRichFallbackResponse(symptomContext) {
  try {
    // Extrair informações do contexto
    const symptom = symptomContext.sintoma || "unknown";
    const language = symptomContext.language || "pt";
    const funnelPhase = symptomContext.funnelPhase || 1;
    const intro = symptomContext.intro || (language === "pt" ? "Olá! Como posso ajudar?" : "Hello! How can I help?");
    
    // Obter o título e fechamento apropriados para a fase atual
    const title = phaseTitles[funnelPhase]?.[language] || phaseTitles[1][language];
    const closing = closingText[funnelPhase]?.[language] || closingText[1][language];
    
    // Obter conteúdo rico para a fase e sintoma específicos
    const phaseContent = fallbackContent[funnelPhase] || fallbackContent[1];
    const symptomContent = phaseContent[symptom] || phaseContent.unknown;
    const contentOptions = symptomContent[language] || symptomContent.en;
    
    // Selecionar uma opção de conteúdo aleatória
    const randomContent = contentOptions[Math.floor(Math.random() * contentOptions.length)];
    
    // Formatar as perguntas de follow-up como elementos clicáveis
    const formattedQuestions = symptomContext.followupQuestions.map((question, index) => {
      return `
      <div class="clickable-question" data-question="${encodeURIComponent(question)}" onclick="handleQuestionClick(this)">
      ${index + 1}. ${question}
    </div>
    `;
    }).join('\n');
    
    // Montar a resposta completa - SEM SÍMBOLOS MARKDOWN
    const response = `${intro}

${title}
${randomContent}

${closing}
${language === "pt" ? "Escolha uma opção:" : "Choose an option:"}

${formattedQuestions}`;

    return response;
  } catch (error) {
    console.error("❌ Erro ao formatar resposta de fallback:", error);
    // Fallback extremamente simples em caso de erro
    return "Olá! Como posso ajudar? Escolha uma opção:\n\n1. Quer explorar outro tópico?\n2. Posso ajudar com mais alguma coisa?\n3. Tem mais alguma pergunta?";
  }
}

// Função principal para processar a entrada do usuário
async function processUserInput(userInput, userName, userAge, userWeight) {
  try {
    console.log("🔄 Processando entrada do usuário:", userInput);
    
    // Atualizar a memória da sessão
    sessionMemory.respostasUsuario.push(userInput);
    
    // Determinar a fase do funil com base no número de interações
    // Avança uma fase a cada 2 interações, até o máximo de 6 fases
    const interactionCount = sessionMemory.respostasUsuario.length;
    const funnelPhase = Math.min(Math.floor(interactionCount / 2) + 1, 6);
    sessionMemory.funnelPhase = funnelPhase;
    
    console.log(`🔄 Fase atual do funil: ${funnelPhase}`);
    
    // Obter contexto do sintoma do Notion
    const symptomContext = await getSymptomContext(
      userInput, 
      userName, 
      userAge, 
      userWeight, 
      funnelPhase,
      sessionMemory.sintomaAtual,
      sessionMemory.usedQuestions
    );
    
    // Atualizar o sintoma atual na memória da sessão
    if (symptomContext.sintoma && symptomContext.sintoma !== "unknown") {
      sessionMemory.sintomaAtual = symptomContext.sintoma;
    }
    
    // Atualizar o idioma na memória da sessão
    if (symptomContext.language) {
      sessionMemory.idioma = symptomContext.language;
    }
    
    // Registrar as perguntas usadas para evitar repetição
    if (symptomContext.followupQuestions && symptomContext.followupQuestions.length > 0) {
      sessionMemory.ultimasPerguntas = symptomContext.followupQuestions;
      sessionMemory.usedQuestions = [...sessionMemory.usedQuestions, ...symptomContext.followupQuestions];
    }
    
    console.log(`🔄 Sintoma detectado: ${symptomContext.sintoma}, Idioma: ${symptomContext.language}`);
    
    // Tentar obter resposta do GPT-4o mini
    let gptResponse = null;
    try {
      if (symptomContext.gptPromptData) {
        console.log("🔄 Tentando obter resposta do GPT-4o mini...");
        gptResponse = await callGPT4oMini(
          symptomContext.gptPromptData.prompt,
          symptomContext.gptPromptData.context,
          userInput
        );
        console.log("🔄 Resposta do GPT obtida:", gptResponse ? "Sim" : "Não");
      }
    } catch (gptError) {
      console.error("❌ Erro ao chamar GPT-4o mini:", gptError);
      console.log("⚠️ Usando fallback devido a erro");
    }
    
    // Construir a resposta final (usando GPT se disponível, ou fallback)
    let responseContent;
    if (gptResponse) {
      console.log("🤖 Usando resposta do GPT");
      responseContent = formatGPTResponse(gptResponse, symptomContext);
    } else {
      console.log("📋 Usando fallback com conteúdo rico");
      responseContent = formatRichFallbackResponse(symptomContext);
    }
    
    return responseContent;
  } catch (error) {
    console.error("❌ Erro geral no processamento:", error);
    // Fallback extremamente simples em caso de erro
    return "Olá! Como posso ajudar? Escolha uma opção:\n\n1. Quer explorar outro tópico?\n2. Posso ajudar com mais alguma coisa?\n3. Tem mais alguma pergunta?";
  }
}

// Função para reiniciar a memória da sessão
function resetSessionMemory() {
  sessionMemory = {
    sintomasDetectados: [],
    respostasUsuario: [],
    nome: "",
    idioma: "pt",
    sintomaAtual: null,
    categoriaAtual: null,
    funnelPhase: 1,
    usedQuestions: [],
    ultimasPerguntas: []
  };
  
  console.log("🔄 Memória da sessão reiniciada");
  return true;
}

// Função para definir o nome do usuário
function setUserName(name) {
  sessionMemory.nome = name;
  console.log(`🔄 Nome do usuário definido: ${name}`);
  return true;
}

// Exportar a memória da sessão para debugging
function getSessionMemory() {
  return sessionMemory;
}

// Função handler para API Routes do Vercel
export default async function handler(req, res) {
  try {
    // Verificar se é uma requisição POST
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    // Extrair dados da requisição
    const { userInput, userName, userAge, userWeight } = req.body;
    
    // Validar entrada
    if (!userInput) {
      return res.status(400).json({ error: 'User input is required' });
    }
    
    // Processar a entrada do usuário
    const response = await processUserInput(userInput, userName, userAge, userWeight);
    
    // Retornar a resposta
    return res.status(200).json({ response });
  } catch (error) {
    console.error('Error processing request:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
