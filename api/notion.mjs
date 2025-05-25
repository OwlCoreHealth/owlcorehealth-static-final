// notion.mjs - Versão adaptada do código funcional com estrutura de funil e conteúdo rico

// Importação do cliente Notion (manter se necessário, mas comentado por agora)
// import { Client } from "@notionhq/client";
// const notion = new Client({ auth: process.env.NOTION_API_KEY }); // Use variável de ambiente!

// --- ESTRUTURA DE DADOS COM CONTEÚDO RICO E FUNIL ---

const funnelPhases = {
  // Fase 1: Explicação científica simples + soluções rápidas
  1: {
    titles: {
      pt: "Entendendo os Sinais Iniciais",
      en: "Understanding the Initial Signals"
    },
    closings: {
      pt: "Vamos explorar mais?",
      en: "Let's explore further?"
    },
    content: {
      headache: {
        pt: [
          "Dores de cabeça frequentes podem ser um sinal do seu corpo pedindo atenção. Muitas vezes, fatores simples como desidratação, tensão muscular ou falta de sono podem ser a causa. Tente beber mais água e fazer pequenas pausas para alongar durante o dia.",
          "Sua cabeça está sinalizando algo. Pode ser estresse, cansaço visual ou até mesmo sua postura. Pequenas mudanças, como ajustar a iluminação ou garantir que está bem hidratado, podem fazer diferença. Vamos investigar mais a fundo?"
        ],
        en: [
          "Frequent headaches can be your body's way of asking for attention. Often, simple factors like dehydration, muscle tension, or lack of sleep can be the cause. Try drinking more water and taking short breaks to stretch during the day.",
          "Your head is signaling something. It could be stress, eye strain, or even your posture. Small changes, like adjusting lighting or ensuring you're well-hydrated, can make a difference. Shall we investigate further?"
        ]
      },
      stomach_pain: {
        pt: [
          "Dores de estômago podem indicar desde algo que você comeu até níveis de estresse elevados. Seu sistema digestivo é sensível. Tente observar se a dor está ligada a certos alimentos ou situações. Chás calmantes como camomila podem ajudar temporariamente.",
          "Esse desconforto no estômago pode ser uma resposta a diversos fatores, incluindo dieta e ansiedade. Manter um diário alimentar simples por alguns dias pode revelar padrões. Que tal explorarmos as possíveis causas?"
        ],
        en: [
          "Stomach pain can indicate anything from something you ate to high stress levels. Your digestive system is sensitive. Try to observe if the pain is linked to certain foods or situations. Calming teas like chamomile might help temporarily.",
          "That stomach discomfort could be a response to various factors, including diet and anxiety. Keeping a simple food diary for a few days might reveal patterns. How about we explore the possible causes?"
        ]
      },
      // Adicionar outros sintomas (fatigue, back_pain) com conteúdo similar
      fatigue: {
        pt: [
          "Sentir-se cansado constantemente pode ser mais do que apenas 'falta de sono'. Pode envolver nutrição, estresse ou outros fatores. Garantir uma boa higiene do sono e verificar sua dieta são bons primeiros passos.",
          "Essa fadiga persistente merece atenção. Seu corpo pode estar com falta de nutrientes essenciais ou sobrecarregado. Pequenos ajustes na rotina, como uma caminhada leve ou garantir vitaminas, podem ajudar. Quer investigar mais?"
        ],
        en: [
          "Feeling constantly tired might be more than just 'lack of sleep'. It could involve nutrition, stress, or other factors. Ensuring good sleep hygiene and checking your diet are good first steps.",
          "This persistent fatigue deserves attention. Your body might be lacking essential nutrients or be overloaded. Small routine adjustments, like a light walk or ensuring vitamins, can help. Want to investigate further?"
        ]
      },
      back_pain: {
        pt: [
          "Dores nas costas são comuns, mas não devem ser ignoradas. Podem vir de má postura, sedentarismo ou tensão. Alongamentos suaves e atenção à ergonomia no trabalho ou em casa podem aliviar. Vamos ver o que mais pode estar influenciando?",
          "Sua coluna pode estar protestando! Muitas vezes, dores nas costas estão ligadas a hábitos diários. Fortalecer a musculatura do core e corrigir a postura ao sentar/levantar peso são cruciais. Quer explorar outras possíveis causas?"
        ],
        en: [
          "Back pain is common but shouldn't be ignored. It can stem from poor posture, lack of movement, or tension. Gentle stretches and attention to ergonomics at work or home can provide relief. Let's see what else might be influencing it?",
          "Your spine might be protesting! Often, back pain is linked to daily habits. Strengthening core muscles and correcting posture when sitting/lifting are crucial. Want to explore other possible causes?"
        ]
      },
      unknown: {
        pt: [
          "Quando os sintomas não são específicos, é importante considerar uma abordagem holística. Seu corpo tem sistemas sofisticados de comunicação interna, e sintomas vagos podem ser sinais precoces de que algo está fora de equilíbrio. Tente observar padrões.",
          "Sentir-se 'estranho' pode ser o corpo pedindo mais atenção. Vamos tentar observar se há algum padrão: acontece depois de comer? Depois de stress? Pequenos detalhes podem dar pistas importantes."
        ],
        en: [
          "When symptoms aren't specific, it's important to consider a holistic approach. Your body has sophisticated internal communication systems, and vague symptoms can be early signs that something is out of balance. Try observing patterns.",
          "Feeling 'off' might be your body asking for more attention. Let's try to observe if there's a pattern: does it happen after eating? After stress? Small details can provide important clues."
        ]
      }
    },
    questions: {
      pt: [
        "Como tem sido a qualidade do seu sono ultimamente?",
        "Você tem se hidratado bem ao longo do dia?",
        "Houve alguma mudança recente na sua rotina ou dieta?",
        "Como está seu nível de estresse atualmente?",
        "Você pratica alguma atividade física regularmente?"
      ],
      en: [
        "How has the quality of your sleep been lately?",
        "Have you been hydrating well throughout the day?",
        "Have there been any recent changes in your routine or diet?",
        "How is your current stress level?",
        "Do you engage in regular physical activity?"
      ]
    }
  },
  // Fase 2: Consequências se não tomar cuidados
  2: {
    titles: {
      pt: "Ignorar os Sinais: Quais as Consequências?",
      en: "Ignoring the Signs: What are the Consequences?"
    },
    closings: {
      pt: "Quer entender melhor os riscos?",
      en: "Want to better understand the risks?"
    },
    content: {
      // Usar copy adaptada do funcional, focando em estatísticas moderadas e piora
      headache: {
        pt: [
          "Ignorar dores de cabeça frequentes pode levar a problemas crônicos. Estudos mostram que 37% dos casos como o seu pioram significativamente em 6 meses sem intervenção. Não é apenas 'dor', é um sinal de desequilíbrio.",
          "Não tratar a causa raiz das dores de cabeça pode impactar sua qualidade de vida e produtividade. Cerca de 40% das pessoas relatam piora dos sintomas quando não buscam entender a origem do problema."
        ],
        en: [
          "Ignoring frequent headaches can lead to chronic issues. Studies show that 37% of cases like yours worsen significantly within 6 months without intervention. It's not just 'pain', it's a sign of imbalance.",
          "Not addressing the root cause of headaches can impact your quality of life and productivity. About 40% of people report worsening symptoms when they don't seek to understand the origin of the problem."
        ]
      },
      // Adicionar outros sintomas
      stomach_pain: {
        pt: [
          "Dores de estômago persistentes podem evoluir para condições mais sérias como gastrite ou úlceras se a causa não for tratada. Cerca de 35% dos problemas digestivos se agravam sem mudanças na dieta ou estilo de vida.",
          "A saúde do seu intestino é fundamental. Ignorar esses sinais pode levar a problemas de absorção de nutrientes e inflamação crônica. Não subestime o que seu estômago está tentando dizer."
        ],
        en: [
          "Persistent stomach pain can evolve into more serious conditions like gastritis or ulcers if the cause isn't addressed. About 35% of digestive issues worsen without changes in diet or lifestyle.",
          "Your gut health is fundamental. Ignoring these signals can lead to nutrient absorption problems and chronic inflammation. Don't underestimate what your stomach is trying to tell you."
        ]
      },
      fatigue: {
        pt: [
          "A fadiga crônica não tratada pode afetar sua imunidade, humor e capacidade cognitiva. Cerca de 45% das pessoas com fadiga persistente relatam impacto negativo no trabalho e vida social.",
          "Seu corpo precisa de energia para funcionar. Ignorar a fadiga é como dirigir com o tanque vazio - eventualmente, você para. Isso pode levar a 'burnout' e outros problemas de saúde."
        ],
        en: [
          "Untreated chronic fatigue can affect your immunity, mood, and cognitive ability. About 45% of people with persistent fatigue report a negative impact on work and social life.",
          "Your body needs energy to function. Ignoring fatigue is like driving on an empty tank – eventually, you stop. This can lead to burnout and other health issues."
        ]
      },
      back_pain: {
        pt: [
          "Ignorar dores nas costas pode levar a problemas de mobilidade, danos nos nervos e dor crônica incapacitante. Cerca de 30% das dores agudas se tornam crônicas se não tratadas adequadamente.",
          "Sua coluna suporta todo o seu corpo. Negligenciar a dor pode resultar em problemas posturais permanentes e limitação de movimentos. É hora de dar a devida atenção."
        ],
        en: [
          "Ignoring back pain can lead to mobility issues, nerve damage, and disabling chronic pain. About 30% of acute back pain becomes chronic if not properly treated.",
          "Your spine supports your entire body. Neglecting the pain can result in permanent postural problems and limited movement. It's time to give it proper attention."
        ]
      },
      unknown: {
        pt: [
          "Sintomas gerais não tratados podem mascarar condições subjacentes que pioram com o tempo. Cerca de 40% das pessoas com sintomas vagos descobrem problemas mais sérios tardiamente.",
          "Ignorar esses sinais é arriscado. O corpo está a tentar comunicar algo. Não dar atenção pode significar perder a chance de intervir cedo em algo que pode se agravar."
        ],
        en: [
          "Untreated general symptoms can mask underlying conditions that worsen over time. About 40% of people with vague symptoms discover more serious problems later on.",
          "Ignoring these signs is risky. The body is trying to communicate something. Not paying attention might mean missing the chance to intervene early in something that could worsen."
        ]
      }
    },
    questions: {
      pt: [
        "Quer explorar o que pode acontecer se estes sintomas persistirem?",
        "Como esses sintomas têm impactado seu dia a dia?",
        "Você já pensou nas consequências a longo prazo de não tratar isso?",
        "O que mais te preocupa em relação a esses sintomas?",
        "Podemos falar sobre como seu estilo de vida pode estar afetando sua saúde?"
      ],
      en: [
        "Want to explore what might happen if these symptoms persist?",
        "How have these symptoms impacted your daily life?",
        "Have you considered the long-term consequences of not addressing this?",
        "What else concerns you about these symptoms?",
        "Can we talk about how your lifestyle might be affecting your health?"
      ]
    }
  },
  // Fase 3: O que está realmente arriscando (agravamento)
  3: {
    titles: {
      pt: "O Risco Real: Agravamento e Complicações",
      en: "The Real Risk: Worsening and Complications"
    },
    closings: {
      pt: "Pronto para considerar soluções mais eficazes?",
      en: "Ready to consider more effective solutions?"
    },
    content: {
      // Usar copy adaptada do funcional, focando em estatísticas altas e linguagem forte
      headache: {
        pt: [
          "Dores de cabeça crônicas podem levar a problemas neurológicos sérios e impactar permanentemente sua capacidade de concentração. 43% das pessoas com seu perfil desenvolvem complicações graves se não tratarem a causa raiz.",
          "Não é só dor. É inflamação neurológica. Ignorar isso é brincar com fogo. O risco de desenvolver enxaqueca crônica ou outros distúrbios aumenta significativamente a cada mês de negligência."
        ],
        en: [
          "Chronic headaches can lead to serious neurological problems and permanently impact your ability to concentrate. 43% of people with your profile develop serious complications if they don't treat the root cause.",
          "It's not just pain. It's neurological inflammation. Ignoring this is playing with fire. The risk of developing chronic migraine or other disorders increases significantly with each month of neglect."
        ]
      },
      // Adicionar outros sintomas
      stomach_pain: {
        pt: [
          "Problemas digestivos crônicos podem levar a danos permanentes no revestimento do estômago ou intestino, má absorção severa de nutrientes e até aumentar o risco de certas doenças. 45% dos casos não tratados evoluem para condições crônicas.",
          "Seu sistema digestivo é a base da sua saúde. Permitir que a inflamação persista pode comprometer todo o seu sistema imunológico e bem-estar geral. O risco é real."
        ],
        en: [
          "Chronic digestive problems can lead to permanent damage to the stomach or intestinal lining, severe nutrient malabsorption, and even increase the risk of certain diseases. 45% of untreated cases evolve into chronic conditions.",
          "Your digestive system is the foundation of your health. Allowing inflammation to persist can compromise your entire immune system and overall well-being. The risk is real."
        ]
      },
      fatigue: {
        pt: [
          "A exaustão crônica pode levar a um colapso do sistema imunológico, problemas cardíacos e distúrbios metabólicos. 50% das pessoas com fadiga extrema não tratada desenvolvem problemas de saúde adicionais.",
          "Seu corpo está operando com reservas críticas. Continuar assim pode levar a um 'burnout' completo, afetando sua saúde física e mental de forma duradoura. É hora de reverter isso."
        ],
        en: [
          "Chronic exhaustion can lead to immune system collapse, heart problems, and metabolic disorders. 50% of people with untreated extreme fatigue develop additional health problems.",
          "Your body is operating on critical reserves. Continuing like this can lead to complete burnout, affecting your physical and mental health long-term. It's time to reverse this."
        ]
      },
      back_pain: {
        pt: [
          "Dor nas costas crônica pode resultar em hérnias de disco, compressão nervosa permanente e perda significativa de mobilidade. 40% dos casos não tratados levam a limitações funcionais severas.",
          "Não é só desconforto. É o risco de danos estruturais permanentes na sua coluna. A capacidade de se mover livremente está em jogo. Ignorar isso pode ter consequências irreversíveis."
        ],
        en: [
          "Chronic back pain can result in herniated discs, permanent nerve compression, and significant loss of mobility. 40% of untreated cases lead to severe functional limitations.",
          "It's not just discomfort. It's the risk of permanent structural damage to your spine. The ability to move freely is at stake. Ignoring this can have irreversible consequences."
        ]
      },
      unknown: {
        pt: [
          "Sintomas vagos persistentes podem ser a ponta do iceberg de condições autoimunes, deficiências nutricionais severas ou problemas metabólicos. 48% das pessoas que ignoram esses sinais acabam com diagnósticos mais graves.",
          "Seu corpo está claramente em desequilíbrio. Não investigar a fundo o que está acontecendo pode permitir que um problema sério se desenvolva silenciosamente. O risco de complicações futuras é alto."
        ],
        en: [
          "Persistent vague symptoms can be the tip of the iceberg for autoimmune conditions, severe nutritional deficiencies, or metabolic problems. 48% of people who ignore these signs end up with more serious diagnoses.",
          "Your body is clearly out of balance. Not thoroughly investigating what's happening can allow a serious problem to develop silently. The risk of future complications is high."
        ]
      }
    },
    questions: {
      pt: [
        "Está ciente dos riscos de não tratar a causa raiz desses sintomas?",
        "O que você mais teme que possa acontecer se isso continuar?",
        "Podemos discutir como evitar que esses problemas se tornem permanentes?",
        "Quão importante é para você resolver isso de forma definitiva?",
        "Já considerou soluções que vão além de aliviar os sintomas temporariamente?"
      ],
      en: [
        "Are you aware of the risks of not treating the root cause of these symptoms?",
        "What do you fear most might happen if this continues?",
        "Can we discuss how to prevent these problems from becoming permanent?",
        "How important is it for you to resolve this definitively?",
        "Have you considered solutions that go beyond temporarily relieving symptoms?"
      ]
    }
  },
  // Fase 4: Nutrientes e plantas naturais
  4: {
    titles: {
      pt: "O Poder da Natureza: Nutrientes e Plantas",
      en: "The Power of Nature: Nutrients and Plants"
    },
    closings: {
      pt: "Interessado em saber mais sobre soluções naturais?",
      en: "Interested in learning more about natural solutions?"
    },
    content: {
      // Conteúdo genérico sobre nutrientes e plantas, pode ser melhorado pelo GPT
      headache: {
        pt: [
          "Muitas vezes, dores de cabeça estão ligadas a deficiências nutricionais ou inflamação que podem ser combatidas com elementos naturais. Magnésio, vitaminas do complexo B e certas plantas como a Gengibre têm mostrado resultados promissores em estudos.",
          "A natureza oferece ferramentas poderosas para equilibrar o corpo. Nutrientes específicos podem ajudar a relaxar os vasos sanguíneos e reduzir a inflamação no cérebro, abordando a causa da dor, não apenas o sintoma."
        ],
        en: [
          "Often, headaches are linked to nutritional deficiencies or inflammation that can be addressed with natural elements. Magnesium, B vitamins, and certain plants like Ginger have shown promising results in studies.",
          "Nature offers powerful tools to balance the body. Specific nutrients can help relax blood vessels and reduce brain inflammation, addressing the cause of the pain, not just the symptom."
        ]
      },
      // Adicionar outros sintomas
      stomach_pain: {
        pt: [
          "A saúde digestiva pode ser restaurada com a ajuda de probióticos, enzimas digestivas e plantas calmantes como a Hortelã-pimenta ou a Camomila. Esses elementos naturais ajudam a equilibrar a flora intestinal e reduzir a inflamação.",
          "Nutrientes como a Glutamina e o Zinco são essenciais para reparar a mucosa intestinal. Combinados com plantas certas, podem oferecer uma solução natural e eficaz para o desconforto digestivo."
        ],
        en: [
          "Digestive health can be restored with the help of probiotics, digestive enzymes, and calming plants like Peppermint or Chamomile. These natural elements help balance gut flora and reduce inflammation.",
          "Nutrients like Glutamine and Zinc are essential for repairing the intestinal lining. Combined with the right plants, they can offer a natural and effective solution for digestive discomfort."
        ]
      },
      fatigue: {
        pt: [
          "Para combater a fadiga, o corpo precisa dos nutrientes certos para produção de energia, como Coenzima Q10, Ferro e vitaminas do complexo B. Plantas adaptogênicas como a Rhodiola ou Ashwagandha também ajudam o corpo a lidar com o estresse.",
          "A energia não vem do nada. Nutrientes específicos alimentam suas mitocôndrias (as usinas de energia das células). Soluções naturais focam em otimizar essa produção de energia na fonte."
        ],
        en: [
          "To combat fatigue, the body needs the right nutrients for energy production, like Coenzyme Q10, Iron, and B vitamins. Adaptogenic plants like Rhodiola or Ashwagandha also help the body cope with stress.",
          "Energy doesn't come from nowhere. Specific nutrients fuel your mitochondria (the power plants of your cells). Natural solutions focus on optimizing this energy production at the source."
        ]
      },
      back_pain: {
        pt: [
          "A inflamação é uma causa comum de dor nas costas. Nutrientes anti-inflamatórios como Ômega-3 e Curcumina, junto com minerais como Magnésio para relaxamento muscular, podem ser muito eficazes.",
          "Soluções naturais podem ajudar a reduzir a inflamação, relaxar os músculos e fortalecer as estruturas da coluna. Elementos como a Boswellia e o Colágeno tipo II têm mostrado benefícios."
        ],
        en: [
          "Inflammation is a common cause of back pain. Anti-inflammatory nutrients like Omega-3 and Curcumin, along with minerals like Magnesium for muscle relaxation, can be very effective.",
          "Natural solutions can help reduce inflammation, relax muscles, and strengthen spinal structures. Elements like Boswellia and Type II Collagen have shown benefits."
        ]
      },
      unknown: {
        pt: [
          "Muitas vezes, sintomas gerais indicam deficiências nutricionais ou desequilíbrios que podem ser corrigidos com suplementação direcionada e o uso de plantas adaptogênicas que ajudam o corpo a se regular.",
          "A abordagem natural busca reequilibrar o corpo como um todo, fornecendo os blocos de construção (nutrientes) e os reguladores (plantas) que ele precisa para funcionar otimamente."
        ],
        en: [
          "Often, general symptoms indicate nutritional deficiencies or imbalances that can be corrected with targeted supplementation and the use of adaptogenic plants that help the body regulate itself.",
          "The natural approach seeks to rebalance the body as a whole, providing the building blocks (nutrients) and regulators (plants) it needs to function optimally."
        ]
      }
    },
    questions: {
      pt: [
        "Você acredita no poder das soluções naturais para a saúde?",
        "Já tentou usar nutrientes ou plantas para seus sintomas antes?",
        "Gostaria de saber como elementos naturais específicos podem ajudar no seu caso?",
        "Está aberto a explorar abordagens que vão além da medicina convencional?",
        "Podemos falar sobre como a nutrição impacta diretamente seus sintomas?"
      ],
      en: [
        "Do you believe in the power of natural solutions for health?",
        "Have you tried using nutrients or plants for your symptoms before?",
        "Would you like to know how specific natural elements can help in your case?",
        "Are you open to exploring approaches beyond conventional medicine?",
        "Can we talk about how nutrition directly impacts your symptoms?"
      ]
    }
  },
  // Fase 5: Suplemento como solução completa
  5: {
    titles: {
      pt: "A Solução Integrada: Suplementação Inteligente",
      en: "The Integrated Solution: Smart Supplementation"
    },
    closings: {
      pt: "Pronto para dar o próximo passo rumo ao bem-estar?",
      en: "Ready to take the next step towards well-being?"
    },
    content: {
      // Conteúdo genérico sobre suplemento, pode ser melhorado pelo GPT
      headache: {
        pt: [
          "Imagine combinar os nutrientes e extratos de plantas mais eficazes para dores de cabeça numa única fórmula otimizada. É isso que a suplementação inteligente oferece: uma abordagem completa e direcionada para resolver a causa raiz.",
          "Nossa fórmula [Nome Genérico do Suplemento] foi desenvolvida com base em estudos científicos para combater a inflamação neurológica e o desequilíbrio vascular associados à dor de cabeça. 85% dos usuários relatam melhora significativa."
        ],
        en: [
          "Imagine combining the most effective nutrients and plant extracts for headaches into a single optimized formula. That's what smart supplementation offers: a complete and targeted approach to address the root cause.",
          "Our [Generic Supplement Name] formula was developed based on scientific studies to combat neurological inflammation and vascular imbalance associated with headaches. 85% of users report significant improvement."
        ]
      },
      // Adicionar outros sintomas
      stomach_pain: {
        pt: [
          "A suplementação direcionada pode fornecer probióticos, enzimas e nutrientes reparadores em doses eficazes para restaurar a saúde digestiva de forma completa. Nossa fórmula [Nome Genérico] atua em múltiplas frentes para alívio duradouro.",
          "Com [Nome Genérico do Suplemento], você obtém uma combinação sinérgica de ingredientes naturais para acalmar a inflamação, equilibrar a flora e fortalecer a barreira intestinal. 88% dos usuários sentem a diferença."
        ],
        en: [
          "Targeted supplementation can provide probiotics, enzymes, and repairing nutrients in effective doses to fully restore digestive health. Our [Generic Name] formula acts on multiple fronts for lasting relief.",
          "With [Generic Supplement Name], you get a synergistic combination of natural ingredients to soothe inflammation, balance flora, and strengthen the intestinal barrier. 88% of users feel the difference."
        ]
      },
      fatigue: {
        pt: [
          "Recupere sua energia com uma fórmula completa que combina vitaminas, minerais e adaptógenos essenciais. [Nome Genérico do Suplemento] foi criado para otimizar a produção de energia celular e combater o estresse que causa a fadiga.",
          "Chega de se arrastar! Nossa suplementação inteligente fornece ao seu corpo exatamente o que ele precisa para recarregar as baterias. 90% dos usuários relatam aumento de energia e disposição."
        ],
        en: [
          "Regain your energy with a complete formula combining essential vitamins, minerals, and adaptogens. [Generic Supplement Name] was created to optimize cellular energy production and combat the stress that causes fatigue.",
          "Stop dragging yourself around! Our smart supplementation provides your body exactly what it needs to recharge. 90% of users report increased energy and vitality."
        ]
      },
      back_pain: {
        pt: [
          "Nossa fórmula [Nome Genérico do Suplemento] combina anti-inflamatórios naturais potentes com nutrientes que apoiam a saúde das articulações e músculos, oferecendo uma solução completa para dor nas costas. 82% dos usuários relatam redução da dor e melhora na mobilidade.",
          "A suplementação inteligente pode fornecer os componentes necessários para reduzir a inflamação, relaxar a musculatura e apoiar a regeneração dos tecidos da coluna, atacando a dor na origem."
        ],
        en: [
          "Our [Generic Supplement Name] formula combines potent natural anti-inflammatories with nutrients that support joint and muscle health, offering a complete solution for back pain. 82% of users report pain reduction and improved mobility.",
          "Smart supplementation can provide the necessary components to reduce inflammation, relax muscles, and support spinal tissue regeneration, attacking the pain at its source."
        ]
      },
      unknown: {
        pt: [
          "Quando o corpo está desequilibrado, uma suplementação abrangente pode ajudar a restaurar a harmonia. [Nome Genérico do Suplemento] fornece uma base de nutrientes essenciais e adaptógenos para apoiar o bem-estar geral.",
          "Nossa fórmula foi pensada para quem busca uma solução completa para reequilibrar o corpo, combatendo deficiências e estresse que podem causar sintomas gerais. 80% dos usuários relatam sentir-se melhor de forma geral."
        ],
        en: [
          "When the body is out of balance, comprehensive supplementation can help restore harmony. [Generic Supplement Name] provides a foundation of essential nutrients and adaptogens to support overall well-being.",
          "Our formula was designed for those seeking a complete solution to rebalance the body, combating deficiencies and stress that can cause general symptoms. 80% of users report feeling better overall."
        ]
      }
    },
    questions: {
      pt: [
        "Gostaria de conhecer em detalhes a fórmula que recomendamos para o seu caso?",
        "Quer saber como a suplementação inteligente pode ser a chave para resolver seus sintomas?",
        "Podemos discutir como nossa solução se compara a outras abordagens?",
        "Está pronto para investir na sua saúde com uma solução comprovada?",
        "Tem alguma dúvida específica sobre como a suplementação funciona?"
      ],
      en: [
        "Would you like to know the details of the formula we recommend for your case?",
        "Want to know how smart supplementation could be the key to resolving your symptoms?",
        "Can we discuss how our solution compares to other approaches?",
        "Are you ready to invest in your health with a proven solution?",
        "Do you have any specific questions about how supplementation works?"
      ]
    }
  },
  // Fase 6: Plano B (abordagem alternativa)
  6: {
    titles: {
      pt: "Uma Perspectiva Diferente Sobre Sua Saúde",
      en: "A Different Perspective On Your Health"
    },
    closings: {
      pt: "A decisão final é sua:",
      en: "The final decision is yours:"
    },
    content: {
      // Conteúdo genérico de reforço, pode ser melhorado pelo GPT
      headache: {
        pt: [
          "Entendo que possa ter dúvidas. Mas considere: quanto tempo mais você vai conviver com essa dor de cabeça antes de buscar uma solução que ataque a causa? Cada dia de espera é um dia a menos de qualidade de vida.",
          "Talvez você precise de mais informações. Sabia que a inflamação silenciosa no cérebro, muitas vezes ligada a dores de cabeça, também está associada a riscos cognitivos a longo prazo? Nossa fórmula ajuda a combater essa inflamação."
        ],
        en: [
          "I understand you might have doubts. But consider: how much longer will you live with this headache before seeking a solution that addresses the cause? Every day you wait is a day less of quality life.",
          "Maybe you need more information. Did you know that silent brain inflammation, often linked to headaches, is also associated with long-term cognitive risks? Our formula helps combat this inflammation."
        ]
      },
      // Adicionar outros sintomas
      stomach_pain: {
        pt: [
          "Adiar a decisão de cuidar da sua saúde digestiva pode custar caro no futuro, não só financeiramente, mas em bem-estar. Pense no impacto que isso tem na sua alimentação e energia diária.",
          "Muitas pessoas se acostumam com o desconforto digestivo, mas isso não é normal. Recuperar a saúde do seu intestino pode transformar sua energia e imunidade. Nossa solução foi criada para isso."
        ],
        en: [
          "Postponing the decision to take care of your digestive health can be costly in the future, not just financially, but in well-being. Think about the impact this has on your diet and daily energy.",
          "Many people get used to digestive discomfort, but it's not normal. Restoring your gut health can transform your energy and immunity. Our solution was created for this."
        ]
      },
      fatigue: {
        pt: [
          "Viver cansado não é viver plenamente. Quanto vale ter energia para aproveitar seu dia, sua família, seus hobbies? Continuar adiando uma solução é escolher continuar limitado pela fadiga.",
          "Talvez você pense que 'é só cansaço'. Mas a fadiga crônica é um sinal de que seu corpo está em desequilíbrio profundo. Nossa fórmula ajuda a restaurar esse equilíbrio de forma natural e sustentável."
        ],
        en: [
          "Living tired is not living fully. How much is it worth to have the energy to enjoy your day, your family, your hobbies? Continuing to postpone a solution is choosing to remain limited by fatigue.",
          "Maybe you think it's 'just tiredness'. But chronic fatigue is a sign that your body is deeply out of balance. Our formula helps restore this balance naturally and sustainably."
        ]
      },
      back_pain: {
        pt: [
          "Conviver com dor nas costas limita suas atividades e sua liberdade. Quanto tempo mais você vai aceitar essa limitação? Uma solução eficaz pode devolver sua qualidade de vida.",
          "A dor nas costas muitas vezes envolve inflamação e desgaste que só pioram com o tempo. Agir agora com uma solução completa pode prevenir problemas muito mais sérios no futuro."
        ],
        en: [
          "Living with back pain limits your activities and freedom. How much longer will you accept this limitation? An effective solution can give you back your quality of life.",
          "Back pain often involves inflammation and wear and tear that only worsen over time. Acting now with a complete solution can prevent much more serious problems in the future."
        ]
      },
      unknown: {
        pt: [
          "Ignorar sintomas gerais é como navegar sem bússola. Você não sabe para onde está indo, e pode acabar em maus lençóis. Investigar e agir é a escolha inteligente para sua saúde a longo prazo.",
          "Seu corpo está pedindo ajuda. Mesmo que os sinais sejam vagos, eles indicam um desequilíbrio. Nossa abordagem visa restaurar esse equilíbrio fundamental para que você se sinta bem novamente."
        ],
        en: [
          "Ignoring general symptoms is like navigating without a compass. You don't know where you're going, and you could end up in trouble. Investigating and acting is the smart choice for your long-term health.",
          "Your body is asking for help. Even if the signs are vague, they indicate an imbalance. Our approach aims to restore this fundamental balance so you can feel well again."
        ]
      }
    },
    questions: {
      pt: [
        "Qual sua maior dúvida ou receio em relação a experimentar nossa solução?",
        "O que te impediria de tomar uma decisão hoje para melhorar sua saúde?",
        "Podemos rever os benefícios específicos que nossa fórmula oferece para você?",
        "Existe alguma informação adicional que te ajudaria a decidir?",
        "Quer comparar nossa abordagem com outras opções que você já considerou?"
      ],
      en: [
        "What is your biggest doubt or fear about trying our solution?",
        "What would prevent you from making a decision today to improve your health?",
        "Can we review the specific benefits our formula offers for you?",
        "Is there any additional information that would help you decide?",
        "Want to compare our approach with other options you've considered?"
      ]
    }
  }
};

// --- FUNÇÕES AUXILIARES ---

// Função para detectar idioma (simplificada)
function detectLanguage(text) {
  const portugueseKeywords = ['dor', 'cabeça', 'estômago', 'cansaço', 'costas', 'você', 'obrigado', 'olá', 'como', 'está'];
  const englishKeywords = ['pain', 'headache', 'stomach', 'fatigue', 'back', 'you', 'thank', 'hello', 'how', 'are'];
  let ptScore = 0;
  let enScore = 0;

  const lowerText = text.toLowerCase();

  portugueseKeywords.forEach(kw => {
    if (lowerText.includes(kw)) ptScore++;
  });
  englishKeywords.forEach(kw => {
    if (lowerText.includes(kw)) enScore++;
  });

  // Detecção básica de caracteres acentuados comuns em PT
  if (/[áàâãéêíóôõúüç]/i.test(text)) {
    ptScore += 2; // Dar mais peso se houver acentos
  }

  return ptScore >= enScore ? 'pt' : 'en';
}

// Função para detectar sintoma principal
function detectSymptom(text) {
  const lowerText = text.toLowerCase();
  if (/cabeça|headache|cefaleia|migraine/i.test(lowerText)) return 'headache';
  if (/estômago|estomago|stomach|digest|azia|refluxo|indigest|náusea|nausea/i.test(lowerText)) return 'stomach_pain';
  if (/cansaço|cansaco|fadiga|fatigue|energia|energy|exausto|exhausted/i.test(lowerText)) return 'fatigue';
  if (/costas|coluna|lombar|dorsal|back|spine|lumbar/i.test(lowerText)) return 'back_pain';
  return 'unknown'; // Sintoma desconhecido ou geral
}

// Função principal para obter contexto e perguntas (substitui a chamada Notion por agora)
async function getSymptomContext(userInput, userName, funnelPhase = 1, usedQuestions = []) {
  const language = detectLanguage(userInput);
  const symptom = detectSymptom(userInput);

  // Selecionar conteúdo da fase atual
  const phaseData = funnelPhases[funnelPhase] || funnelPhases[1]; // Default para fase 1 se inválida
  const symptomContent = phaseData.content[symptom] || phaseData.content['unknown'];

  // Escolher uma variação da introdução/explicação aleatoriamente
  const introVariations = symptomContent[language] || symptomContent['en'];
  const explanation = introVariations[Math.floor(Math.random() * introVariations.length)];

  // Personalizar introdução
  let intro = explanation.split('\n\n')[0]; // Pega a primeira parte como intro
  if (userName) {
    intro = `${userName}, ${intro.charAt(0).toLowerCase() + intro.slice(1)}`; // Adiciona nome e ajusta capitalização
  } else {
    // Tenta usar uma frase de entrada genérica se não houver nome
    const genericIntros = {
      pt: ["Oi! Vamos entender melhor o que está acontecendo.", "Olá! Percebi que você mencionou algo. Vamos investigar.", "Certo, recebi sua mensagem. Vamos analisar isso juntos."],
      en: ["Hi! Let's understand better what's happening.", "Hello! I noticed you mentioned something. Let's investigate.", "Okay, got your message. Let's analyze this together."]
    };
    intro = genericIntros[language][Math.floor(Math.random() * genericIntros[language].length)];
  }
  
  const scientificExplanation = explanation.split('\n\n').slice(1).join('\n\n'); // Pega o resto como explicação

  // Selecionar perguntas não repetidas
  const availableQuestions = phaseData.questions[language].filter(q => !usedQuestions.includes(q));
  let selectedQuestions = [];
  if (availableQuestions.length >= 3) {
    // Seleciona 3 aleatórias das disponíveis
    selectedQuestions = availableQuestions.sort(() => 0.5 - Math.random()).slice(0, 3);
  } else {
    // Se não houver 3 novas, preenche com as disponíveis e depois com genéricas ou repetidas (último caso)
    selectedQuestions = [...availableQuestions];
    const needed = 3 - selectedQuestions.length;
    const fallbackQuestions = phaseData.questions[language]; // Pode incluir repetidas se necessário
    for (let i = 0; i < needed; i++) {
      const q = fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];
      if (!selectedQuestions.includes(q)) {
          selectedQuestions.push(q);
      }
    }
    // Garante 3 perguntas, mesmo que repetidas como último recurso
    while (selectedQuestions.length < 3 && fallbackQuestions.length > 0) {
        selectedQuestions.push(fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)]);
    }
     while (selectedQuestions.length < 3) { // Fallback absoluto
        selectedQuestions.push(language === 'pt' ? "Podemos explorar outro tópico?" : "Want to explore another topic?");
    }
  }

  // Preparar dados para possível chamada GPT (a ser feita no chat.js)
  const gptPromptData = {
    context: {
      userName: userName || null,
      symptom: symptom,
      language: language,
      funnelPhase: funnelPhase,
      history: [], // Histórico da conversa pode ser adicionado aqui
      previousQuestions: usedQuestions
    },
    // Prompt base pode ser definido aqui ou no chat.js
    prompt: `Você é Owl Savage, um assistente sarcástico, direto e motivador. O usuário ${userName || 'anônimo'} está na fase ${funnelPhase} do funil, relatando sintomas de ${symptom || 'gerais'} no idioma ${language}. Gere uma resposta elaborada seguindo a personalidade, usando o contexto e a explicação base: ${scientificExplanation}. Finalize sugerindo sutilmente as próximas perguntas.`
  };

  return {
    intro: intro,
    scientificExplanation: scientificExplanation,
    followupQuestions: selectedQuestions,
    sintoma: symptom,
    language: language,
    funnelPhase: funnelPhase,
    title: phaseData.titles[language],
    closing: phaseData.closings[language],
    gptPromptData: gptPromptData // Dados para a chamada GPT
  };
}

// Exportar a função principal
export { getSymptomContext };

