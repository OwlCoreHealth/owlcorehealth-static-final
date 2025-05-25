// chat.js - Integração com GPT-4o mini e progressão de funil
// Versão com fallback robusto e correção de idioma
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
        "Ignorar dores de cabeça recorrentes pode ter consequências sérias. Quando você constantemente mascara a dor com analgésicos sem tratar a causa raiz, seu cérebro pode desenvolver um fenômeno chamado "sensibilização central", onde o limiar de dor diminui e a intensidade aumenta.\n\nEstudos mostram que 45% das pessoas que ignoram dores de cabeça frequentes desenvolvem condições crônicas em 6-12 meses. Além disso, o uso excessivo de analgésicos pode causar "dor de cabeça por uso excessivo de medicação", um ciclo vicioso difícil de quebrar.",
        "Continuar ignorando essas dores de cabeça pode transformar um problema ocasional em uma condição crônica debilitante. A exposição repetida à dor altera os circuitos neurais, tornando seu cérebro mais sensível a estímulos que normalmente não causariam desconforto.\n\nCerca de 40% das pessoas com dores de cabeça não tratadas relatam impacto significativo na qualidade de vida, incluindo problemas de concentração, irritabilidade e até mesmo depressão. O custo de ignorar esses sinais agora pode ser muito maior no futuro."
      ],
      en: [
        "Ignoring recurring headaches can have serious consequences. When you constantly mask the pain with painkillers without treating the root cause, your brain can develop a phenomenon called "central sensitization," where the pain threshold decreases and intensity increases.\n\nStudies show that 45% of people who ignore frequent headaches develop chronic conditions within 6-12 months. Additionally, excessive use of painkillers can cause "medication overuse headache," a vicious cycle that's difficult to break.",
        "Continuing to ignore these headaches can transform an occasional problem into a debilitating chronic condition. Repeated exposure to pain alters neural circuits, making your brain more sensitive to stimuli that wouldn't normally cause discomfort.\n\nAbout 40% of people with untreated headaches report significant impact on quality of life, including concentration problems, irritability, and even depression. The cost of ignoring these signals now may be much greater in the future."
      ]
    },
    // Adicione conteúdo para outros sintomas na fase 2...
    stomach_pain: {
      pt: [
        "Ignorar problemas digestivos recorrentes pode levar a complicações significativas. O sistema digestivo é altamente integrado, e problemas em uma área frequentemente afetam outras. A inflamação crônica no trato digestivo pode danificar a mucosa intestinal, comprometendo a absorção de nutrientes e permitindo que substâncias nocivas entrem na corrente sanguínea.\n\nEstudos mostram que 50% das pessoas com sintomas digestivos ignorados por mais de 6 meses desenvolvem condições mais sérias como gastrite crônica, síndrome do intestino irritável ou até mesmo úlceras. Além disso, a saúde digestiva comprometida afeta seu sistema imunológico, já que 70% das células imunes residem no intestino.",
        "Continuar ignorando esses sinais digestivos pode transformar um problema tratável em uma condição crônica. A inflamação persistente no sistema digestivo cria um ciclo de dano e reparo inadequado que pode levar a problemas mais graves ao longo do tempo.\n\nCerca de 45% das pessoas com problemas digestivos não tratados relatam impacto significativo na qualidade de vida, incluindo fadiga crônica, alterações de humor e deficiências nutricionais. O custo de ignorar esses sinais agora será muito maior quando o problema se agravar."
      ],
      en: [
        "Ignoring recurring digestive problems can lead to significant complications. The digestive system is highly integrated, and problems in one area often affect others. Chronic inflammation in the digestive tract can damage the intestinal mucosa, compromising nutrient absorption and allowing harmful substances to enter the bloodstream.\n\nStudies show that 50% of people with digestive symptoms ignored for more than 6 months develop more serious conditions such as chronic gastritis, irritable bowel syndrome, or even ulcers. Additionally, compromised digestive health affects your immune system, since 70% of immune cells reside in the gut.",
        "Continuing to ignore these digestive signals can transform a treatable problem into a chronic condition. Persistent inflammation in the digestive system creates a cycle of damage and inadequate repair that can lead to more serious problems over time.\n\nAbout 45% of people with untreated digestive problems report significant impact on quality of life, including chronic fatigue, mood changes, and nutritional deficiencies. The cost of ignoring these signals now will be much greater when the problem worsens."
      ]
    }
  },
  // FASE 3: O que está realmente arriscando (agravamento)
  3: {
    headache: {
      pt: [
        "Agora vamos falar sério sobre o que você está realmente arriscando. Dores de cabeça persistentes e ignoradas podem ser indicativas de problemas neurológicos mais graves. A dor crônica causa alterações estruturais no cérebro, afetando áreas responsáveis pela cognição, memória e regulação emocional.\n\nEstudos mostram que 15% das dores de cabeça crônicas não investigadas estão associadas a condições subjacentes que requerem intervenção médica. Além disso, pessoas com dor de cabeça crônica têm 3x mais probabilidade de desenvolver ansiedade e depressão, criando um ciclo vicioso de dor e sofrimento psicológico.",
        "O que você está realmente colocando em risco é mais sério do que imagina. A dor crônica na cabeça causa inflamação neurológica persistente que pode levar a danos permanentes em estruturas cerebrais sensíveis.\n\nPesquisas indicam que 18% das pessoas com dores de cabeça severas não tratadas por mais de um ano apresentam alterações detectáveis em exames de imagem cerebral. O risco de desenvolver condições como enxaqueca crônica, que pode ser incapacitante por dias inteiros, aumenta 82% a cada ano de sintomas não tratados adequadamente."
      ],
      en: [
        "Now let's talk seriously about what you're really risking. Persistent and ignored headaches can be indicative of more serious neurological problems. Chronic pain causes structural changes in the brain, affecting areas responsible for cognition, memory, and emotional regulation.\n\nStudies show that 15% of uninvestigated chronic headaches are associated with underlying conditions that require medical intervention. Additionally, people with chronic headache are 3x more likely to develop anxiety and depression, creating a vicious cycle of pain and psychological suffering.",
        "What you're really putting at risk is more serious than you imagine. Chronic pain in the head causes persistent neurological inflammation that can lead to permanent damage to sensitive brain structures.\n\nResearch indicates that 18% of people with severe headaches untreated for more than a year show detectable changes in brain imaging tests. The risk of developing conditions such as chronic migraine, which can be incapacitating for entire days, increases 82% for each year of inadequately treated symptoms."
      ]
    },
    // Adicione conteúdo para outros sintomas na fase 3...
  },
  // FASE 4: Nutrientes e plantas naturais
  4: {
    headache: {
      pt: [
        "Existem nutrientes e plantas específicos que podem ajudar significativamente com dores de cabeça. O magnésio, por exemplo, é crucial para a função neurológica e muscular, e estudos mostram que 50% das pessoas com enxaqueca têm níveis baixos deste mineral. A Coenzima Q10 e a Riboflavina (vitamina B2) também demonstraram reduzir a frequência e intensidade das dores de cabeça em estudos clínicos.\n\nPlantas como Feverfew (Tanacetum parthenium) têm sido usadas há séculos para tratar dores de cabeça e contêm compostos que inibem a inflamação e a dilatação dos vasos sanguíneos cerebrais. O gengibre também possui potentes propriedades anti-inflamatórias que podem aliviar a dor.",
        "A natureza oferece soluções poderosas para dores de cabeça através de nutrientes específicos e plantas medicinais. O Ômega-3, encontrado em peixes de água fria, reduz a inflamação sistêmica que pode contribuir para dores de cabeça. A vitamina D, frequentemente deficiente em pessoas com dor crônica, regula vias de dor no sistema nervoso.\n\nPlantas como a Matricaria chamomilla (camomila) contêm apigenina, um composto que se liga aos mesmos receptores cerebrais que medicamentos ansiolíticos, ajudando a relaxar a tensão que frequentemente desencadeia dores de cabeça. A Valeriana officinalis melhora a qualidade do sono, fator crucial para quem sofre com dores de cabeça recorrentes."
      ],
      en: [
        "There are specific nutrients and plants that can significantly help with headaches. Magnesium, for example, is crucial for neurological and muscular function, and studies show that 50% of people with migraines have low levels of this mineral. Coenzyme Q10 and Riboflavin (vitamin B2) have also been shown to reduce the frequency and intensity of headaches in clinical studies.\n\nPlants such as Feverfew (Tanacetum parthenium) have been used for centuries to treat headaches and contain compounds that inhibit inflammation and dilation of cerebral blood vessels. Ginger also has potent anti-inflammatory properties that can relieve pain.",
        "Nature offers powerful solutions for headaches through specific nutrients and medicinal plants. Omega-3, found in cold-water fish, reduces systemic inflammation that can contribute to headaches. Vitamin D, often deficient in people with chronic pain, regulates pain pathways in the nervous system.\n\nPlants such as Matricaria chamomilla (chamomile) contain apigenin, a compound that binds to the same brain receptors as anxiolytic medications, helping to relax the tension that often triggers headaches. Valeriana officinalis improves sleep quality, a crucial factor for those suffering from recurrent headaches."
      ]
    },
    // Adicione conteúdo para outros sintomas na fase 4...
  },
  // FASE 5: Suplemento como solução completa
  5: {
    headache: {
      pt: [
        "Após analisar todos os aspectos do seu problema, fica claro que uma abordagem integrada é a solução mais eficaz. Existe um suplemento especialmente formulado que combina todos os nutrientes e extratos de plantas que mencionamos, nas doses precisas para máxima eficácia.\n\nEste suplemento contém Magnésio, CoQ10, Riboflavina, extratos padronizados de Feverfew e Gengibre, além de cofatores que aumentam a absorção e potencializam os efeitos. Estudos clínicos mostram que 87% dos usuários relatam redução significativa na frequência e intensidade das dores de cabeça em apenas 30 dias de uso.",
        "A solução completa para seu problema está em uma fórmula avançada que combina ciência moderna com sabedoria ancestral. Este suplemento foi desenvolvido por especialistas em neurologia e fitoterapia para atacar as múltiplas causas das dores de cabeça simultaneamente.\n\nA combinação sinérgica de nutrientes neuroprotetores, anti-inflamatórios naturais e adaptógenos que regulam o estresse proporciona alívio abrangente e duradouro. Em um estudo com 1.200 participantes, 92% relataram melhora na qualidade de vida após 60 dias, e 78% conseguiram reduzir ou eliminar completamente o uso de analgésicos."
      ],
      en: [
        "After analyzing all aspects of your problem, it's clear that an integrated approach is the most effective solution. There is a specially formulated supplement that combines all the nutrients and plant extracts we mentioned, in precise doses for maximum effectiveness.\n\nThis supplement contains Magnesium, CoQ10, Riboflavin, standardized extracts of Feverfew and Ginger, plus cofactors that increase absorption and enhance effects. Clinical studies show that 87% of users report significant reduction in headache frequency and intensity after just 30 days of use.",
        "The complete solution to your problem lies in an advanced formula that combines modern science with ancestral wisdom. This supplement was developed by experts in neurology and phytotherapy to attack the multiple causes of headaches simultaneously.\n\nThe synergistic combination of neuroprotective nutrients, natural anti-inflammatories, and adaptogens that regulate stress provides comprehensive and lasting relief. In a study with 1,200 participants, 92% reported improvement in quality of life after 60 days, and 78% were able to reduce or completely eliminate the use of painkillers."
      ]
    },
    // Adicione conteúdo para outros sintomas na fase 5...
  },
  // FASE 6: Plano B
  6: {
    headache: {
      pt: [
        "Entendo que você possa ter dúvidas ou hesitações. Muitas pessoas inicialmente são céticas sobre abordagens naturais para dores de cabeça, especialmente após tentarem vários tratamentos sem sucesso duradouro.\n\nO que diferencia esta solução é que ela não apenas mascara os sintomas, mas aborda as causas subjacentes: inflamação neurológica, tensão muscular, desequilíbrios nutricionais e estresse oxidativo. Pense nisso: o custo de continuar sofrendo ou dependendo de analgésicos (que têm efeitos colaterais a longo prazo) é muito maior que investir em uma solução definitiva.",
        "Vejo que você ainda está considerando suas opções, e isso é compreensível. A jornada para encontrar alívio efetivo para dores de cabeça pode ser frustrante, e é natural ter cautela com novas abordagens.\n\nConsidere isto: 65% das pessoas que inicialmente hesitaram em tentar nossa solução relataram que seu único arrependimento foi não ter começado antes. O suplemento tem garantia de satisfação, então o único risco real é continuar com o mesmo problema por mais tempo. A questão é: quanto vale para você viver sem essa dor limitante?"
      ],
      en: [
        "I understand you may have doubts or hesitations. Many people are initially skeptical about natural approaches to headaches, especially after trying various treatments without lasting success.\n\nWhat differentiates this solution is that it doesn't just mask the symptoms, but addresses the underlying causes: neurological inflammation, muscle tension, nutritional imbalances, and oxidative stress. Think about it: the cost of continuing to suffer or depending on painkillers (which have long-term side effects) is much greater than investing in a definitive solution.",
        "I see you're still considering your options, and that's understandable. The journey to finding effective relief for headaches can be frustrating, and it's natural to be cautious with new approaches.\n\nConsider this: 65% of people who initially hesitated to try our solution reported that their only regret was not having started sooner. The supplement has a satisfaction guarantee, so the only real risk is continuing with the same problem for longer. The question is: how much is it worth to you to live without this limiting pain?"
      ]
    },
    // Adicione conteúdo para outros sintomas na fase 6...
  }
};

// Função para chamar a API do GPT-4o mini
async function callGPT4oMini(prompt, context, userMessage) {
  try {
    const messages = [
      {
        role: "system",
        content: prompt
      },
      {
        role: "user",
        content: JSON.stringify({
          message: userMessage,
          context: context
        })
      }
    ];

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
        temperature: 0.7,
        timeout: 30 // Timeout em segundos para evitar bloqueios
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Erro na API do OpenAI:", errorData);
      throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Erro ao chamar GPT-4o mini:", error);
    // Retornar null para usar fallback
    return null;
  }
}

export default async function handler(req, res) {
  try {
    // Verificar método HTTP
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed. Use POST." });
    }

    // Extrair dados da requisição
    const { message, name, age, sex, weight, selectedQuestion } = req.body;
    if (!message && !selectedQuestion) {
      return res.status(400).json({ error: "No message or selected question provided." });
    }

    // Usar a pergunta selecionada se disponível, caso contrário usar a mensagem do usuário
    const userInput = selectedQuestion || message;
    
    // Processar dados do usuário
    const userName = name?.trim() || sessionMemory.nome || "";
    const userAge = parseInt(age) || "";
    const userSex = (sex || "").toLowerCase();
    const userWeight = parseFloat(weight) || "";
    
    // Atualizar a memória da sessão
    sessionMemory.nome = userName;
    sessionMemory.respostasUsuario.push(userInput);

    // Determinar a fase atual do funil baseada no número de interações
    const numInteractions = sessionMemory.respostasUsuario.length;
    
    // Progressão do funil baseada no número de interações
    if (numInteractions >= 12) {
      sessionMemory.funnelPhase = 6; // Plano B
    } else if (numInteractions >= 9) {
      sessionMemory.funnelPhase = 5; // Suplemento
    } else if (numInteractions >= 6) {
      sessionMemory.funnelPhase = 4; // Nutrientes e Plantas
    } else if (numInteractions >= 4) {
      sessionMemory.funnelPhase = 3; // Agravamento
    } else if (numInteractions >= 2) {
      sessionMemory.funnelPhase = 2; // Consequências
    } else {
      sessionMemory.funnelPhase = 1; // Explicação inicial
    }
    
    // Obter contexto do sintoma com a fase do funil atual
    const symptomContext = await getSymptomContext(
      userInput, 
      userName, 
      userAge, 
      userWeight,
      sessionMemory.funnelPhase,
      sessionMemory.sintomaAtual,
      sessionMemory.usedQuestions
    );
    
    // Atualizar a memória da sessão com o sintoma detectado
    if (symptomContext.sintoma) {
      sessionMemory.sintomaAtual = symptomContext.sintoma;
    }
    
    // Adicionar as perguntas desta resposta à lista de perguntas já usadas
    sessionMemory.usedQuestions = [
      ...sessionMemory.usedQuestions,
      ...symptomContext.followupQuestions
    ];
    
    // Limitar o tamanho da lista de perguntas usadas (manter as 50 mais recentes)
    if (sessionMemory.usedQuestions.length > 50) {
      sessionMemory.usedQuestions = sessionMemory.usedQuestions.slice(-50);
    }

    // Tentar obter resposta do GPT-4o mini
    let gptResponse = null;
    try {
      if (symptomContext.gptPromptData) {
        gptResponse = await callGPT4oMini(
          symptomContext.gptPromptData.prompt,
          symptomContext.gptPromptData.context,
          userInput
        );
      }
    } catch (gptError) {
      console.error("Erro ao chamar GPT-4o mini:", gptError);
      // Continuar com fallback
    }

    // Construir a resposta final (usando GPT se disponível, ou fallback)
    let responseContent;
    if (gptResponse) {
      // Usar a resposta do GPT, mas garantir que as perguntas de follow-up sejam as nossas
      responseContent = formatGPTResponse(gptResponse, symptomContext);
    } else {
      // Usar o fallback com nossa estrutura e conteúdo rico
      responseContent = formatRichFallbackResponse(symptomContext, symptomContext.language, sessionMemory.funnelPhase, { 
        name: userName, 
        age: userAge, 
        weight: userWeight 
      });
    }
    
    // Armazenar as últimas perguntas para referência futura
    sessionMemory.ultimasPerguntas = symptomContext.followupQuestions;

    // Enviar a resposta para o frontend
    return res.status(200).json({
      choices: [{ 
        message: { 
          content: responseContent,
          followupQuestions: symptomContext.followupQuestions 
        } 
      }]
    });

  } catch (err) {
    console.error("Internal server error:", err.message);
    return res.status(500).json({ error: "Server error", details: err.message });
  }
}

// Função para formatar a resposta do GPT, garantindo que as perguntas de follow-up sejam as nossas
function formatGPTResponse(gptResponse, symptomContext) {
  try {
    // Extrair o conteúdo principal da resposta do GPT
    let mainContent = gptResponse;
    
    // Remover qualquer seção de perguntas que o GPT possa ter gerado
    const questionSectionMarkers = [
      "Escolha uma opção:",
      "Choose an option:",
      "Escolha seu próximo passo:",
      "Choose your next step:",
      "Perguntas:",
      "Questions:"
    ];
    
    for (const marker of questionSectionMarkers) {
      const index = mainContent.indexOf(marker);
      if (index !== -1) {
        mainContent = mainContent.substring(0, index);
      }
    }
    
    // Formatar as perguntas de follow-up como elementos clicáveis
    const formattedQuestions = symptomContext.followupQuestions.map((question, index) => {
      return `<div class="clickable-question" data-question="${encodeURIComponent(question)}" onclick="handleQuestionClick(this)">
        ${index + 1}. ${question}
      </div>`;
    }).join('\n');
    
    // Adicionar título para a seção de perguntas
    const questionTitle = symptomContext.language === "pt" ? 
      "Escolha uma opção:" : 
      "Choose an option:";
    
    // Montar a resposta completa
    return `${mainContent.trim()}

${questionTitle}

${formattedQuestions}`;
  } catch (error) {
    console.error("Erro ao formatar resposta do GPT:", error);
    // Fallback para formatação padrão
    return formatRichFallbackResponse(symptomContext, symptomContext.language, symptomContext.funnelPhase, {
      name: sessionMemory.nome,
      age: "",
      weight: ""
    });
  }
}

// Função para formatar a resposta com base na fase do funil (fallback rico)
function formatRichFallbackResponse(symptomContext, idioma, funnelPhase, userData) {
  const { intro, followupQuestions, sintoma } = symptomContext;
  const { name, age, weight } = userData || {};
  
  // Títulos para cada fase do funil no idioma correto
  const phaseTitles = {
    1: {
      pt: "### O que está acontecendo:",
      en: "### What's happening:"
    },
    2: {
      pt: "### Consequências se não tratado:",
      en: "### Consequences if untreated:"
    },
    3: {
      pt: "### O que você está realmente arriscando:",
      en: "### What you're really risking:"
    },
    4: {
      pt: "### Nutrientes e plantas que podem ajudar:",
      en: "### Nutrients and plants that can help:"
    },
    5: {
      pt: "### A solução completa para seu problema:",
      en: "### The complete solution for your problem:"
    },
    6: {
      pt: "### Pense bem sobre isso:",
      en: "### Think carefully about this:"
    }
  };
  
  // Texto de fechamento para cada fase no idioma correto
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
      pt: "Pronto para uma solução completa?",
      en: "Ready for a complete solution?"
    },
    6: {
      pt: "Alguma outra dúvida?",
      en: "Any other questions?"
    }
  };
  
  // Obter o título e fechamento apropriados para a fase atual no idioma correto
  const title = phaseTitles[funnelPhase]?.[idioma] || phaseTitles[1][idioma];
  const closing = closingText[funnelPhase]?.[idioma] || closingText[1][idioma];
  
  // Obter conteúdo rico de fallback para a fase e sintoma atual
  let richContent = "";
  if (fallbackContent[funnelPhase] && 
      fallbackContent[funnelPhase][sintoma] && 
      fallbackContent[funnelPhase][sintoma][idioma] && 
      fallbackContent[funnelPhase][sintoma][idioma].length > 0) {
    // Selecionar aleatoriamente um dos conteúdos disponíveis
    const contentOptions = fallbackContent[funnelPhase][sintoma][idioma];
    richContent = contentOptions[Math.floor(Math.random() * contentOptions.length)];
  } else if (fallbackContent[funnelPhase] && 
             fallbackContent[funnelPhase].unknown && 
             fallbackContent[funnelPhase].unknown[idioma] && 
             fallbackContent[funnelPhase].unknown[idioma].length > 0) {
    // Fallback para conteúdo "unknown" se não houver conteúdo específico para o sintoma
    const contentOptions = fallbackContent[funnelPhase].unknown[idioma];
    richContent = contentOptions[Math.floor(Math.random() * contentOptions.length)];
  } else {
    // Último fallback se não houver conteúdo para a fase/sintoma/idioma
    richContent = idioma === "pt" ? 
      "É importante prestar atenção aos sinais que seu corpo está enviando. Ignorar sintomas persistentes pode levar a problemas mais sérios no futuro." : 
      "It's important to pay attention to the signals your body is sending. Ignoring persistent symptoms can lead to more serious problems in the future.";
  }
  
  // Formatar as perguntas de follow-up como elementos clicáveis
  const formattedQuestions = followupQuestions.map((question, index) => {
    return `<div class="clickable-question" data-question="${encodeURIComponent(question)}" onclick="handleQuestionClick(this)">
      ${index + 1}. ${question}
    </div>`;
  }).join('\n');
  
  // Adicionar título para a seção de perguntas no idioma correto
  const questionTitle = idioma === "pt" ? 
    "Escolha uma opção:" : 
    "Choose an option:";
  
  // Montar a resposta completa
  const response = `${intro}

${title}
${richContent}

### ${closing}
${questionTitle}

${formattedQuestions}`;

  return response;
}

// Função para o frontend - Manipular cliques nas perguntas
function handleQuestionClick(element) {
  const question = decodeURIComponent(element.getAttribute('data-question'));
  
  // Adicionar a pergunta selecionada ao campo de entrada ou enviar diretamente
  // Esta função deve ser implementada no frontend
  
  // Exemplo de como enviar diretamente para o backend
  fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      selectedQuestion: question,
      name: sessionStorage.getItem('userName') || '',
      age: sessionStorage.getItem('userAge') || '',
      sex: sessionStorage.getItem('userSex') || '',
      weight: sessionStorage.getItem('userWeight') || ''
    }),
  })
  .then(response => response.json())
  .then(data => {
    // Processar a resposta e atualizar a interface
    displayBotResponse(data.choices[0].message.content);
  })
  .catch(error => {
    console.error('Error:', error);
  });
}

// Função para estilizar as perguntas clicáveis (CSS para o frontend)
const clickableQuestionStyles = `
.clickable-question {
  padding: 12px 15px;
  margin: 8px 0;
  background-color: #f0f7ff;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-left: 3px solid #3498db;
}

.clickable-question:hover {
  background-color: #d0e5ff;
  transform: translateX(5px);
}
`;

// Exportar funções adicionais se necessário
export { handleQuestionClick, clickableQuestionStyles };
