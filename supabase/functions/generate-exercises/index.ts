const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Exercise {
  level: number;
  type: 'FILL_IN_THE_BLANK' | 'LISTENING' | 'IDENTIFY_THE_WORD' | 'WHEEL_OF_FORTUNE';
  topic: string;
  statement: string;
  correct_answer: string;
  incorrect_answer_1?: string | null;
  incorrect_answer_2?: string | null;
  incorrect_answer_3?: string | null;
  incorrect_answer_1_explanation?: string | null;
  incorrect_answer_2_explanation?: string | null;
  incorrect_answer_3_explanation?: string | null;
  german_word?: string | null;
  spanish_translation?: string | null;
  emoji?: string | null;
  hint?: string | null;
}

Deno.serve(async (req) => {

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { level, topic, count, type } = await req.json();
    
    if (!level || !topic || !count) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: level, topic, count' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const GEMINI_API_KEY = Deno.env.get('gemini-key');
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'GEMINI_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call Gemini API using REST
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`;

    const levelNames = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const levelName = levelNames[level - 1] || `Level ${level}`;

    // Build exercise type instructions
    let exerciseTypeInstructions = '';
    
    if (type && type !== 'all') {
      // Generate only specific type
      exerciseTypeInstructions = `Create ONLY ${type} exercises following these rules:\n\n`;
      
      switch(type) {
        case 'FILL_IN_THE_BLANK':
          exerciseTypeInstructions += `FILL_IN_THE_BLANK:
   - statement: German sentence with ___ where word is missing
   - correct_answer: the missing German word
   - incorrect_answer_1/2/3: plausible wrong German words
   - All explanations in Spanish explaining why each incorrect answer is wrong`;
          break;
        case 'LISTENING':
          exerciseTypeInstructions += `LISTENING:
   - statement: "Escucha la palabra y selecciona la traducción correcta"
   - german_word: a German word
   - correct_answer: Spanish translation
   - incorrect_answer_1/2/3: wrong Spanish translations
   - spanish_translation: same as correct_answer`;
          break;
        case 'IDENTIFY_THE_WORD':
          exerciseTypeInstructions += `IDENTIFY_THE_WORD (ONLY for words/expressions that can be represented by an emoji):
   - emoji: a single emoji (REQUIRED, must be representative of the word)
   - statement: "¿Qué es esto?"
   - correct_answer: German word for the emoji
   - incorrect_answer_1/2/3: wrong German words
   - hint: helpful Spanish hint about the word (REQUIRED)
   - IMPORTANT: Only create IDENTIFY_THE_WORD exercises for concepts that have a clear emoji representation`;
          break;
        case 'WHEEL_OF_FORTUNE':
          exerciseTypeInstructions += `WHEEL_OF_FORTUNE:
   - statement: German phrase or word to guess
   - correct_answer: same as statement
   - hint: helpful Spanish hint
   - All incorrect_answer fields must be null`;
          break;
      }
    } else {
      // Generate mixed types
      exerciseTypeInstructions = `Create ${count} diverse exercises following these rules:

1. FILL_IN_THE_BLANK:
   - statement: German sentence with ___ where word is missing
   - correct_answer: the missing German word
   - incorrect_answer_1/2/3: plausible wrong German words
   - All explanations in Spanish explaining why each incorrect answer is wrong

2. LISTENING:
   - statement: "Escucha la palabra y selecciona la traducción correcta"
   - german_word: a German word
   - correct_answer: Spanish translation
   - incorrect_answer_1/2/3: wrong Spanish translations
   - spanish_translation: same as correct_answer

3. IDENTIFY_THE_WORD (ONLY for words/expressions that can be represented by an emoji):
   - emoji: a single emoji (REQUIRED, must be representative of the word)
   - statement: "¿Qué es esto?"
   - correct_answer: German word for the emoji
   - incorrect_answer_1/2/3: wrong German words
   - hint: helpful Spanish hint about the word (REQUIRED)
   - IMPORTANT: Only create IDENTIFY_THE_WORD exercises for concepts that have a clear emoji representation

4. WHEEL_OF_FORTUNE:
   - statement: German phrase or word to guess
   - correct_answer: same as statement
   - hint: helpful Spanish hint
   - All incorrect_answer fields must be null

Mix the exercise types.`;
    }

    const levelDescriptions = {
      'A1': 'principiantes absolutos (vocabulario básico, frases simples, presente)',
      'A2': 'nivel elemental (vocabulario cotidiano, pasado simple, futuro básico)',
      'B1': 'nivel intermedio (conversaciones complejas, subjuntivo, vocabulario amplio)',
      'B2': 'nivel intermedio-avanzado (textos complejos, todos los tiempos verbales, expresiones idiomáticas)',
      'C1': 'nivel avanzado (textos especializados, matices lingüísticos, vocabulario técnico)',
      'C2': 'nivel maestría (comprensión total, expresiones nativas, vocabulario completo)'
    };

    const prompt = `Eres un experto en crear ejercicios de alemán para hispanohablantes en nivel ${levelName} (${levelDescriptions[levelName as keyof typeof levelDescriptions]}).

IMPORTANTE - REQUISITOS DEL NIVEL ${levelName}:
- Crea ejercicios apropiados ESPECÍFICAMENTE para nivel ${levelName} según el Marco Común Europeo de Referencia (CEFR)
- El vocabulario, gramática y complejidad deben ser EXACTAMENTE del nivel ${levelName}
- NO uses vocabulario o estructuras de niveles superiores o inferiores
- Los ejercicios no deben requirir ningún contexto para poder resolverse. Explica al alumno las respuestas incorrectas si, por ejemplo, el género no coincide con la declinación, etc. pero nunca debería hacerse referencia a ningún contexto fuera de la frase o pregunta formulada.

TEMA ESPECÍFICO: ${topic}
- TODOS los ejercicios deben estar DIRECTAMENTE relacionados con "${topic}"
- NO incluyas vocabulario fuera del tema "${topic}"
- Asegúrate de que cada ejercicio trate específicamente sobre "${topic}"

Número de ejercicios a crear: ${count}

${exerciseTypeInstructions}

VARIEDAD Y CREATIVIDAD:
- Cada ejercicio debe ser ÚNICO y DIFERENTE de los demás
- Usa contextos variados dentro del tema "${topic}"
- Varía la dificultad dentro del rango del nivel ${levelName}
- NO repitas palabras, estructuras o contextos similares

Return ONLY a valid JSON array with no additional text.`;

    console.log('Calling Gemini API...');
    
    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 1.7,
          responseMimeType: "application/json",
          responseSchema: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                level: { type: "NUMBER" },
                type: { 
                  type: "STRING",
                  enum: ["FILL_IN_THE_BLANK", "LISTENING", "IDENTIFY_THE_WORD", "WHEEL_OF_FORTUNE"]
                },
                topic: { type: "STRING" },
                statement: { type: "STRING" },
                correct_answer: { type: "STRING" },
                incorrect_answer_1: { type: "STRING", nullable: true },
                incorrect_answer_2: { type: "STRING", nullable: true },
                incorrect_answer_3: { type: "STRING", nullable: true },
                incorrect_answer_1_explanation: { type: "STRING", nullable: true },
                incorrect_answer_2_explanation: { type: "STRING", nullable: true },
                incorrect_answer_3_explanation: { type: "STRING", nullable: true },
                german_word: { type: "STRING", nullable: true },
                spanish_translation: { type: "STRING", nullable: true },
                emoji: { type: "STRING", nullable: true },
                hint: { type: "STRING", nullable: true }
              },
              required: ["level", "type", "topic", "statement", "correct_answer"]
            }
          }
        }
      })
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API failed: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    console.log('Gemini response received');
    
    const text = geminiData.candidates[0].content.parts[0].text;
    const exercisesRaw = JSON.parse(text);

    // Normalize exercise types to match DB enum (uppercase with underscores)
    const normalizeType = (t: string) => {
      if (!t) return t as unknown as string;
      return t.replaceAll('-', '_').replaceAll(' ', '_').toUpperCase();
    };

    const exercises = exercisesRaw.map((ex: Exercise) => ({
      ...ex,
      level: level, // Force the requested level instead of using Gemini's response
      type: normalizeType((ex as any).type),
      spanish_translation: ex.spanish_translation ?? ex.correct_answer,
    }));

    // Validate exercises have required fields based on type
    const validationErrors: string[] = [];
    const validatedExercises = exercises.filter((exercise: Exercise, index: number) => {
      const errors: string[] = [];
      
      if (exercise.type === 'IDENTIFY_THE_WORD') {
        if (!exercise.emoji || exercise.emoji.trim() === '') {
          errors.push(`Exercise ${index + 1} (IDENTIFY_THE_WORD): Missing emoji field`);
        }
        
        if (!exercise.hint || exercise.hint.trim() === '') {
          errors.push(`Exercise ${index + 1} (IDENTIFY_THE_WORD): Missing hint field`);
        }
      }
      
      if (exercise.type === 'LISTENING') {
        if (!exercise.german_word || exercise.german_word.trim() === '') {
          errors.push(`Exercise ${index + 1} (LISTENING): Missing german_word field`);
        }
        
        if (!exercise.spanish_translation || exercise.spanish_translation.trim() === '') {
          errors.push(`Exercise ${index + 1} (LISTENING): Missing spanish_translation field`);
        }
      }
      
      if (errors.length > 0) {
        validationErrors.push(...errors);
        console.error(`VALIDATION ERROR for exercise ${index + 1}:`, errors);
        return false; // Filter out invalid exercises
      }
      
      return true;
    });

    // Log validation errors but continue with valid exercises
    if (validationErrors.length > 0) {
      console.warn('Some exercises were filtered out due to validation errors:', validationErrors);
    }

    // If no valid exercises remain, return error
    if (validatedExercises.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No valid exercises generated',
          validationErrors 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Returning ${validatedExercises.length} valid exercises (${exercises.length - validatedExercises.length} filtered out)`);

    return new Response(
      JSON.stringify(validatedExercises),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating exercises:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
