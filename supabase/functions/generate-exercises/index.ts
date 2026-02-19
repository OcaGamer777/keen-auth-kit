import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WordTranslations {
  [germanWord: string]: string;
}

interface Exercise {
  level: number;
  type: 'FILL_IN_THE_BLANK' | 'FILL_IN_THE_BLANK_WRITING' | 'LISTENING' | 'IDENTIFY_THE_WORD' | 'WHEEL_OF_FORTUNE' | 'FREE_WRITING' | 'WORD_SEARCH';
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
  word_translations?: WordTranslations | null;
}

function sanitizeToken(token: string): string {
  // Lowercase + keep letters/diacritics + keep hyphens. Strip punctuation/numbers/underscores.
  return (token ?? '')
    .toString()
    .toLowerCase()
    .replace(/[^-\u007F\u0080-\u00FF\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF\p{L}\p{M}-]+/gu, '')
    .trim();
}

function normalizeWordTranslations(input: unknown): WordTranslations | null {
  if (!input || typeof input !== 'object') return null;
  const out: WordTranslations = {};
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    const key = sanitizeToken(k);
    const val = typeof v === 'string' ? v.trim() : '';
    if (key && val) out[key] = val;
  }
  return Object.keys(out).length > 0 ? out : null;
}

function parseModelJson(text: string): unknown {
  const cleaned = (text ?? '')
    .toString()
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    // fall through
  }

  const start = cleaned.search(/[\[{]/);
  const end = Math.max(cleaned.lastIndexOf(']'), cleaned.lastIndexOf('}'));
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Could not parse JSON from model output');
  }

  return JSON.parse(cleaned.slice(start, end + 1));
}

async function generateWordTranslationsForSentence(
  geminiUrl: string,
  sentence: string,
): Promise<WordTranslations | null> {
  try {
    const translationPrompt = `Devuelve SOLO un objeto JSON con traducciones palabra-por-palabra al español para esta frase en alemán.

Frase (alemán): "${sentence}"

REGLAS (CRÍTICAS):
- Claves: palabras en alemán EN MINÚSCULAS y SIN puntuación.
- Incluye TODAS las palabras de la frase (excepto el hueco "___" si aparece).
- Valores: traducción al español teniendo en cuenta el contexto de la frase.
- NO añadas texto extra, SOLO JSON.`;

    const resp = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: translationPrompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      console.error('Gemini word_translations error:', resp.status, errorText);
      return null;
    }

    const data = await resp.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    const parsed = parseModelJson(text);
    return normalizeWordTranslations(parsed);
  } catch (e) {
    console.error('Error generating word_translations:', e);
    return null;
  }
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
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const GEMINI_API_KEY = Deno.env.get('gemini-key') ?? Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    // Get topic description and existing exercises from database
    let topicDescription = '';
    let existingExercisesSummary = '';
    
    try {
      if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
        
        // Fetch topic description
        const { data: topicData, error: topicError } = await supabaseAdmin
          .from('topics')
          .select('description')
          .eq('title', topic)
          .limit(1);

        if (topicError) {
          console.warn('Could not fetch topic description (client):', topicError);
        } else if (topicData && topicData.length > 0 && topicData[0]?.description) {
          topicDescription = topicData[0].description as string;
        }
        
        // Fetch existing exercises for this topic and level to avoid repetition
        const { data: existingExercises, error: exercisesError } = await supabaseAdmin
          .from('exercises')
          .select('type, statement, correct_answer, german_word')
          .eq('topic', topic)
          .eq('level', level)
          .limit(100);
        
        if (exercisesError) {
          console.warn('Could not fetch existing exercises:', exercisesError);
        } else if (existingExercises && existingExercises.length > 0) {
          console.log(`Found ${existingExercises.length} existing exercises for topic "${topic}" level ${level}`);
          
          // Create a summary of existing exercises to send to the AI
          const exerciseSummaries = existingExercises.map((ex: any) => {
            if (ex.type === 'LISTENING' && ex.german_word) {
              return `- [${ex.type}] Palabra: "${ex.german_word}"`;
            } else if (ex.type === 'FILL_IN_THE_BLANK') {
              return `- [${ex.type}] Frase: "${ex.statement}" → Respuesta: "${ex.correct_answer}"`;
            } else if (ex.type === 'FILL_IN_THE_BLANK_WRITING') {
              return `- [${ex.type}] Frase: "${ex.statement}" → Respuesta: "${ex.correct_answer}"`;
            } else if (ex.type === 'WHEEL_OF_FORTUNE') {
              return `- [${ex.type}] "${ex.correct_answer}"`;
            } else if (ex.type === 'IDENTIFY_THE_WORD') {
              return `- [${ex.type}] Palabra: "${ex.correct_answer}"`;
            } else if (ex.type === 'WORD_SEARCH') {
              return `- [${ex.type}] Palabra: "${ex.correct_answer}"`;
            } else {
              return `- [${ex.type}] "${ex.statement?.substring(0, 50)}..."`;
            }
          });
          
          existingExercisesSummary = exerciseSummaries.join('\n');
        }
      } else {
        console.warn('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing; topicDescription will be empty');
      }
    } catch (error) {
      console.warn('Could not fetch topic description or existing exercises:', error);
    }

    // Call Gemini API using REST
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const levelNames = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const levelName = levelNames[level - 1] || `Level ${level}`;

    // Build exercise type instructions
    let exerciseTypeInstructions = '';

    if (type && type !== 'all') {
      // Generate only specific type
      exerciseTypeInstructions = `CRITICAL: You MUST create ONLY exercises of type ${type}. DO NOT create any other type of exercise.\n\nCreate ${count} ${type} exercises following these EXACT rules:\n\n`;

      switch (type) {
        case 'FILL_IN_THE_BLANK':
          exerciseTypeInstructions += `FILL_IN_THE_BLANK:
   - statement: German sentence with ___ where word is missing
   - correct_answer: the missing German word
   - incorrect_answer_1/2/3: plausible wrong German words
   - CRÍTICO para las explicaciones (incorrect_answer_X_explanation): Deben explicar POR QUÉ esa respuesta es incorrecta, pero SIN REVELAR cuál es la respuesta correcta. El alumno tendrá una segunda oportunidad para acertar.
   - word_translations: REQUIRED - JSON object with contextual Spanish translations for EACH German word in the statement. The key is the German word (lowercase, without punctuation), the value is its Spanish translation considering the sentence context.`;
          break;
        case 'FILL_IN_THE_BLANK_WRITING':
          exerciseTypeInstructions += `FILL_IN_THE_BLANK_WRITING:
   - statement: German sentence with ___ where word is missing
   - correct_answer: the missing German word
   - word_translations: REQUIRED - JSON object with contextual Spanish translations for EACH German word in the statement. The key is the German word (lowercase, without punctuation), the value is its Spanish translation considering the sentence context.`;
          break;
        case 'LISTENING':
          exerciseTypeInstructions += `LISTENING:
   - statement: "Escucha la palabra y selecciona la traducción correcta"
   - german_word: a word in German
   - correct_answer: Spanish translation
   - incorrect_answer_1/2/3: wrong Spanish translations (other Spanish words that are NOT the correct translation)
   - CRÍTICO para las explicaciones (incorrect_answer_X_explanation): Deben explicar POR QUÉ esa respuesta es incorrecta, pero SIN REVELAR cuál es la respuesta correcta. El alumno tendrá una segunda oportunidad para acertar. Ejemplo: "Esta palabra significa [significado incorrecto], no es lo que estás buscando."
   - spanish_translation: same as correct_answer
   - word_translations: must be null`;
          break;
        case 'IDENTIFY_THE_WORD':
          exerciseTypeInstructions += `IDENTIFY_THE_WORD (ONLY for words/expressions that can be represented by an emoji):
   - emoji: a single emoji (REQUIRED, must be representative of the word)
   - statement: "¿Qué es esto?"
   - correct_answer: German word for the emoji
   - incorrect_answer_1/2/3: wrong German words (other German words that do NOT match the emoji)
   - CRÍTICO para las explicaciones (incorrect_answer_X_explanation): Deben explicar POR QUÉ esa respuesta es incorrecta, pero SIN REVELAR cuál es la respuesta correcta. El alumno tendrá una segunda oportunidad para acertar. Ejemplo: "Esta palabra significa [significado incorrecto], no corresponde al emoji mostrado."
   - hint: helpful Spanish hint about the word (REQUIRED)
   - IMPORTANT: Only create IDENTIFY_THE_WORD exercises for concepts that have a clear emoji representation
   - word_translations: must be null`;
          break;
        case 'WHEEL_OF_FORTUNE':
          exerciseTypeInstructions += `WHEEL_OF_FORTUNE:
   - statement: German phrase or word to guess
   - correct_answer: same as statement
   - spanish_translation: Spanish translation of the German phrase/word (REQUIRED)
   - hint: helpful Spanish hint
   - All incorrect_answer fields must be null
   - word_translations: must be null`;
          break;
        case 'FREE_WRITING':
          exerciseTypeInstructions += `FREE_WRITING:
   - statement: Detailed writing task in Spanish describing what the student should write about
   - correct_answer: "N/A" (this is a free writing exercise, no single correct answer)
   - All incorrect_answer fields must be null
   - hint: Additional guidance in Spanish (optional)
   - IMPORTANT: Make the statement a complete, clear writing prompt that explains the task in detail
   - word_translations: must be null`;
          break;
        case 'WORD_SEARCH':
          exerciseTypeInstructions += `WORD_SEARCH:
   - statement: German description of the word to find
   - correct_answer: german word to find
   - spanish_translation: Spanish translation of the German word to find (REQUIRED)
   - hint: helpful Spanish hint
   - All incorrect_answer fields must be null
   - word_translations: REQUIRED - JSON object with contextual Spanish translations for EACH German word in the statement. The key is the German word (lowercase, without punctuation), the value is its Spanish translation considering the sentence context.`;
          break;
      }

      exerciseTypeInstructions += `\n\nREMEMBER: ALL ${count} exercises must be type: "${type}". Do not create any other type.`;
    } else {
      // Generate mixed types
      exerciseTypeInstructions = `Create ${count} diverse exercises following these rules and distribution:

1. FILL_IN_THE_BLANK:
   - Create ${(count-4*Math.trunc(count / 10))/3} exercises of this type
   - statement: German sentence with ___ where word is missing. MUY IMPORTANTE: esta frase debe ser siempre en alemán.
   - correct_answer: the missing German word
   - incorrect_answer_1/2/3: plausible wrong German words
   - CRÍTICO para las explicaciones (incorrect_answer_X_explanation): Deben explicar POR QUÉ esa respuesta es incorrecta, pero SIN REVELAR cuál es la respuesta correcta. El alumno tendrá una segunda oportunidad para acertar.
   - CRÍTICO: la frase a rellenar y las respuestas deben ser en idioma ALEMÁN. Las explicaciones en ESPAÑOL.
   - word_translations: REQUIRED - JSON object with contextual Spanish translations for EACH German word in the statement. The key is the German word (lowercase, without punctuation), the value is its Spanish translation considering the sentence context.

2. FILL_IN_THE_BLANK_WRITING:
   - Create ${Math.trunc(count / 10)} exercises of this type
   - statement: German sentence with ___ where word is missing. MUY IMPORTANTE: esta frase debe ser siempre en alemán.
   - correct_answer: the missing German word
   - word_translations: REQUIRED - JSON object with contextual Spanish translations for EACH German word in the statement. The key is the German word (lowercase, without punctuation), the value is its Spanish translation considering the sentence context.

3. LISTENING:
   - Create ${(count-4*Math.trunc(count / 10))/3} exercises of this type
   - statement: "Escucha la palabra y selecciona la traducción correcta"
   - german_word: a German word
   - correct_answer: Spanish translation
   - incorrect_answer_1/2/3: wrong Spanish translations (other Spanish words that are NOT the correct translation)
   - cuando se trate de un sustantivo, todas las respuestas (correcta o incorrectas) debe llevar el articulo para aprender el género que le corresponde.
   - CRÍTICO para las explicaciones (incorrect_answer_X_explanation): Deben explicar POR QUÉ esa respuesta es incorrecta, pero SIN REVELAR cuál es la respuesta correcta. El alumno tendrá una segunda oportunidad para acertar. Ejemplo: "Esta palabra significa [significado incorrecto], no es lo que estás buscando."
   - spanish_translation: same as correct_answer
   - word_translations: must be null

4. IDENTIFY_THE_WORD (ONLY for words/expressions that can be represented by an emoji):
   - Create ${count-(4*Math.trunc(count / 10)-2*((count-4*Math.trunc(count / 10))/3)} exercises of this type
   - emoji: a single emoji (REQUIRED, must be representative of the word)
   - statement: "¿Qué es esto?"
   - correct_answer: German word for the emoji
   - incorrect_answer_1/2/3: wrong German words (other German words that do NOT match the emoji)
   - cuando se trate de un sustantivo, todas las respuestas (correcta o incorrectas) debe llevar el articulo para aprender el género que le corresponde.
   - CRÍTICO para las explicaciones (incorrect_answer_X_explanation): Deben explicar POR QUÉ esa respuesta es incorrecta, pero SIN REVELAR cuál es la respuesta correcta. El alumno tendrá una segunda oportunidad para acertar. Ejemplo: "Esta palabra significa [significado incorrecto], no corresponde al emoji mostrado."
   - hint: helpful Spanish hint about the word (REQUIRED)
   - IMPORTANT: Only create IDENTIFY_THE_WORD exercises for concepts that have a clear emoji representation
   - word_translations: must be null

5. WHEEL_OF_FORTUNE:
   - Create ${Math.trunc(count / 10)} exercises of this type
   - statement: German phrase or word to guess
   - correct_answer: same as statement
   - spanish_translation: Spanish translation of the German phrase/word (REQUIRED)
   - hint: helpful Spanish hint
   - All incorrect_answer fields must be null
   - word_translations: must be null

6. FREE_WRITING:
   - Create ${Math.trunc(count / 10)} exercises of this type
   - statement: Detailed writing task in Spanish describing what the student should write about
   - correct_answer: "N/A" (this is a free writing exercise, no single correct answer)
   - All incorrect_answer fields must be null
   - hint: Additional guidance in Spanish (optional)
   - IMPORTANT: Make the statement a complete, clear writing prompt that explains the task in detail
   - word_translations: must be null

7. WORD_SEARCH:
   - Create ${Math.trunc(count / 10)} exercises of this type
   - statement: German description of the word to find
   - correct_answer: german word to find
   - spanish_translation: Spanish translation of the German word to find (REQUIRED)
   - hint: helpful Spanish hint
   - All incorrect_answer fields must be null
   - word_translations: REQUIRED - JSON object with contextual Spanish translations for EACH German word in the statement. The key is the German word (lowercase, without punctuation), the value is its Spanish translation considering the sentence context.

Mix the exercise types.`;
    }

    const levelDescriptions = {
      A1: 'principiantes absolutos (vocabulario básico, frases simples, presente)',
      A2: 'nivel elemental (vocabulario cotidiano, pasado simple, futuro básico)',
      B1: 'nivel intermedio (conversaciones complejas, subjuntivo, vocabulario amplio)',
      B2: 'nivel intermedio-avanzado (textos complejos, todos los tiempos verbales, expresiones idiomáticas)',
      C1: 'nivel intermedio-avanzado en alemán (textos complejos, todos los tiempos verbales, refranes, frases hechas, expresiones coloquiales)',
      C2: 'nivel avanzado (comprensión total, expresiones nativas, vocabulario completo, refranes, frases hechas, expresiones coloquiales)',
    };

    const prompt = `Eres un experto en crear ejercicios de alemán para hispanohablantes en nivel ${levelName} (${levelDescriptions[levelName as keyof typeof levelDescriptions]}).

IMPORTANTE - REQUISITOS DEL NIVEL ${levelName}:
- Crea ejercicios apropiados ESPECÍFICAMENTE para nivel ${levelName} 
- El vocabulario, gramática y complejidad deben ser EXACTAMENTE del nivel ${levelName}
- Los ejercicios de selección de respuesta, sólo la respuesta correcta debe ser gramaticalmente correcta. Las otras respuestas deben ser gramaticalmente incorrectas (no sólo descartarlas por el contexto o el tema de la lección)
- NO uses vocabulario o estructuras de niveles superiores o inferiores
- Los enunciados en los niveles A1,A2,B1 y B2 deben estar en español. Los enunciados de los niveles C1 y C2 en alemán.
- Los ejercicios no deben requirir ningún contexto para poder resolverse. Explica al alumno las respuestas incorrectas si, por ejemplo, el género no coincide con la declinación, etc. pero nunca debería hacerse referencia a ningún contexto fuera de la frase o pregunta formulada.

TEMA ESPECÍFICO: ${topic}
DESCRIPCIÓN DEL TEMA:\n${topicDescription}
IMPORTANTE: Usa esta descripción como guía para crear ejercicios relevantes y específicos a este tema:
- TODOS los ejercicios deben estar relacionados con los conceptos explicados en la descripción del tema "${topic}"

Número de ejercicios a crear: ${count}

${exerciseTypeInstructions}

REGLA GLOBAL (CRÍTICA):
- Incluye SIEMPRE la propiedad "word_translations" en TODOS los ejercicios.
- En FILL_IN_THE_BLANK y FILL_IN_THE_BLANK_WRITING debe ser un objeto JSON con la traducción palabra-por-palabra de TODO el "statement".
- En cualquier otro tipo debe ser null.

VARIEDAD Y CREATIVIDAD:
- Cada ejercicio debe ser ÚNICO y DIFERENTE de los demás. No repitas las palabras en alemán.
- Usa contextos variados dentro del tema "${topic}"
- Varía la dificultad dentro del rango del nivel ${levelName}
- NO repitas palabras, estructuras o contextos similares
- No hagas preguntas sobre la explicación teórica. Haz ejercicios con ejemplos del empleo práctico del vocabulario o expresiones explicadas.
- Puedes incluir palabras y expresiones relacionadas con el tema "${topic}" aunque no estén explícitamente mencionadas en la descripción, siempre que sean apropiadas para el nivel ${levelName}.

${existingExercisesSummary ? `
EJERCICIOS YA EXISTENTES (NO REPETIR):
Los siguientes ejercicios ya existen para este tema y nivel. Los nuevos ejercicios que crees deben ser COMPLETAMENTE DIFERENTES:
- NO uses las mismas palabras alemanas como respuesta correcta
- NO uses las mismas frases o estructuras similares
- Busca vocabulario y contextos NUEVOS dentro del tema

Ejercicios existentes:
${existingExercisesSummary}

IMPORTANTE: Crea ejercicios que complementen los existentes, usando vocabulario y frases DISTINTAS.
` : ''}

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
            text: prompt,
          }],
        }],
        generationConfig: {
          temperature: 0.9,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API failed: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    console.log('Gemini response received');

    const text = geminiData.candidates[0].content.parts[0].text;
    const exercisesRawUnknown = parseModelJson(text);

    if (!Array.isArray(exercisesRawUnknown)) {
      console.error('Model did not return a JSON array:', exercisesRawUnknown);
      throw new Error('Model did not return a JSON array');
    }

    const exercisesRaw = exercisesRawUnknown as any[];

    // Normalize exercise types to match DB enum (uppercase with underscores)
    const normalizeType = (t: string) => {
      if (!t) return t as unknown as string;
      return t.replaceAll('-', '_').replaceAll(' ', '_').toUpperCase();
    };

    const exercisesBase: Exercise[] = exercisesRaw.map((ex: any) => {
      // Only pick known columns to avoid Supabase schema cache errors (Gemini may return extra/wrong keys)
      const mapped: Exercise = {
        level: level, // Force the requested level
        type: normalizeType(ex?.type) as Exercise['type'],
        topic: ex?.topic ?? topic,
        statement: ex?.statement ?? '',
        correct_answer: ex?.correct_answer ?? '',
        incorrect_answer_1: ex?.incorrect_answer_1 ?? null,
        incorrect_answer_2: ex?.incorrect_answer_2 ?? null,
        incorrect_answer_3: ex?.incorrect_answer_3 ?? null,
        incorrect_answer_1_explanation: ex?.incorrect_answer_1_explanation ?? ex?.explanation_1 ?? null,
        incorrect_answer_2_explanation: ex?.incorrect_answer_2_explanation ?? ex?.explanation_2 ?? null,
        incorrect_answer_3_explanation: ex?.incorrect_answer_3_explanation ?? ex?.explanation_3 ?? null,
        german_word: ex?.german_word ?? null,
        spanish_translation: ex?.spanish_translation ?? ex?.correct_answer ?? null,
        emoji: ex?.emoji ?? null,
        hint: ex?.hint ?? null,
        word_translations: normalizeWordTranslations(ex?.word_translations),
      };
      return mapped;
    });

    // Fallback: if Gemini didn't generate word_translations for FILL_IN_THE_BLANK, generate it in a second call.
    const exercises = await Promise.all(
      exercisesBase.map(async (exercise, index) => {
        if (exercise.type !== 'FILL_IN_THE_BLANK' && exercise.type !== 'FILL_IN_THE_BLANK_WRITING') return exercise;

        if (!exercise.word_translations || Object.keys(exercise.word_translations).length === 0) {
          console.warn(
            `Exercise ${index + 1} (FILL_IN_THE_BLANK): Missing/empty word_translations; generating fallback...`,
          );
          const generated = await generateWordTranslationsForSentence(geminiUrl, exercise.statement);
          return { ...exercise, word_translations: generated };
        }

        return exercise;
      }),
    );

    // Ensure the property exists on all returned objects (so the client can persist it)
    const exercisesNormalized: Exercise[] = exercises.map((ex) => ({
      ...ex,
      word_translations: (ex.type === 'FILL_IN_THE_BLANK' || ex.type === 'FILL_IN_THE_BLANK_WRITING') ? (ex.word_translations ?? null) : null,
    }));

    // Validate exercises have required fields based on type
    const validationErrors: string[] = [];
    const validatedExercises = exercisesNormalized.filter((exercise: Exercise, index: number) => {
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

      if (exercise.type === 'WHEEL_OF_FORTUNE') {
        if (!exercise.spanish_translation || exercise.spanish_translation.trim() === '') {
          errors.push(`Exercise ${index + 1} (WHEEL_OF_FORTUNE): Missing spanish_translation field`);
        }
      }

      if (exercise.type === 'FILL_IN_THE_BLANK') {
        if (!exercise.word_translations || Object.keys(exercise.word_translations).length === 0) {
          console.warn(
            `Exercise ${index + 1} (FILL_IN_THE_BLANK): Still missing word_translations after fallback`,
          );
          // Don't filter it out, but log the warning
        } else {
          console.log(
            `Exercise ${index + 1} (FILL_IN_THE_BLANK): word_translations generated with ${Object.keys(exercise.word_translations).length} words`,
          );
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
          validationErrors,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    console.log(
      `Returning ${validatedExercises.length} valid exercises (${exercises.length - validatedExercises.length} filtered out)`,
    );

    return new Response(JSON.stringify(validatedExercises), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating exercises:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
    
