import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { exerciseService } from '@/services/exerciseService';
import { Exercise, Profile } from '@/types/exercise';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Edit, Sparkles, Link as LinkIcon, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Topic } from '@/types/topic';
import { topicService } from '@/services/topicService';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { roleService, UserRole } from '@/services/roleService';
import { configService, CONFIG_KEYS, AppConfig } from '@/services/configService';

export default function Admin() {
  const { user, loading } = useAuth();
  const { isAdmin, loading: roleLoading } = useRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [isCreatingTopic, setIsCreatingTopic] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicDescription, setNewTopicDescription] = useState('');
  const [newTopicYoutubeUrl, setNewTopicYoutubeUrl] = useState('');
  const [newTopicExplanationUrl, setNewTopicExplanationUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState('1');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  
  // TTS Settings
  const [ttsVoice, setTtsVoice] = useState('default');
  const [ttsRate, setTtsRate] = useState(0.8);
  const [ttsPitch, setTtsPitch] = useState(1);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Generate form
  const [generateLevel, setGenerateLevel] = useState('1');
  const [generateTopic, setGenerateTopic] = useState('');
  const [generateCount, setGenerateCount] = useState('5');
  const [generateType, setGenerateType] = useState<string>('all');

  // App Configuration
  const [appConfigs, setAppConfigs] = useState<AppConfig[]>([]);
  const [defaultTopic, setDefaultTopic] = useState('');
  const [appName, setAppName] = useState('');
  const [maxDailyExercisesFree, setMaxDailyExercisesFree] = useState(10);
  const [enableTts, setEnableTts] = useState(true);
  const [configLoading, setConfigLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      toast({
        title: t('admin.accessDenied'),
        description: t('admin.noPermission'),
        variant: 'destructive',
      });
      navigate('/');
    }
  }, [isAdmin, roleLoading, navigate, toast]);

  useEffect(() => {
    if (isAdmin) {
      loadExercises();
      loadTopics();
      loadProfiles();
      loadAppConfig();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      loadExercises();
    }
  }, [selectedLevel, selectedTopic, selectedType, isAdmin]);

  useEffect(() => {
    // Load TTS settings
    const savedSettings = localStorage.getItem('ttsSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setTtsVoice(settings.voice || 'default');
      setTtsRate(settings.rate || 0.8);
      setTtsPitch(settings.pitch || 1);
    }

    // Load available voices
    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      const germanVoices = availableVoices.filter(v => v.lang.startsWith('de'));
      setVoices(germanVoices.length > 0 ? germanVoices : availableVoices);
    };

    loadVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const loadExercises = async () => {
    try {
      let data = await exerciseService.getExercisesByLevel(
        Number(selectedLevel), 
        selectedTopic === 'all' ? undefined : selectedTopic
      );
      
      // Filter by type if not 'all'
      if (selectedType !== 'all') {
        data = data.filter(exercise => exercise.type === selectedType);
      }
      
      setExercises(data);
    } catch (error) {
      console.error('Error loading exercises:', error);
    }
  };

  const loadTopics = async () => {
    try {
      const data = await topicService.getAllTopics();
      setTopics(data);
    } catch (error) {
      console.error('Error loading topics:', error);
    }
  };

  const loadProfiles = async () => {
    try {
      // Get profiles with email from auth.users
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (profileError) throw profileError;
      
      // Get emails and roles for each user
      const profilesWithDetails = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: { user } } = await supabase.auth.admin.getUserById(profile.id);
          const roles = await roleService.getUserRoles(profile.id);
          const primaryRole = roles.length > 0 ? roles[0] : 'USER';
          
          return {
            ...profile,
            email: user?.email || 'N/A',
            role: primaryRole
          };
        })
      );
      
      setProfiles(profilesWithDetails);
    } catch (error) {
      console.error('Error loading profiles:', error);
    }
  };

  const loadAppConfig = async () => {
    setConfigLoading(true);
    try {
      const configs = await configService.getAll();
      setAppConfigs(configs);
      
      // Set individual values
      configs.forEach(config => {
        switch (config.key) {
          case CONFIG_KEYS.DEFAULT_TOPIC:
            setDefaultTopic(config.value || '');
            break;
          case CONFIG_KEYS.APP_NAME:
            setAppName(config.value || '');
            break;
          case CONFIG_KEYS.MAX_DAILY_EXERCISES_FREE:
            setMaxDailyExercisesFree(Number(config.value) || 10);
            break;
          case CONFIG_KEYS.ENABLE_TTS:
            setEnableTts(config.value === true || config.value === 'true');
            break;
        }
      });
    } catch (error) {
      console.error('Error loading app config:', error);
    } finally {
      setConfigLoading(false);
    }
  };

  const saveAppConfig = async () => {
    setConfigLoading(true);
    try {
      const success = await configService.setMultiple([
        { key: CONFIG_KEYS.DEFAULT_TOPIC, value: defaultTopic, description: 'Tema por defecto para usuarios FREE o sin registrar' },
        { key: CONFIG_KEYS.APP_NAME, value: appName, description: 'Nombre de la aplicación' },
        { key: CONFIG_KEYS.MAX_DAILY_EXERCISES_FREE, value: maxDailyExercisesFree, description: 'Máximo de ejercicios diarios para usuarios FREE' },
        { key: CONFIG_KEYS.ENABLE_TTS, value: enableTts, description: 'Habilitar Text-to-Speech en ejercicios' },
      ]);
      
      if (success) {
        // Refresh cache
        await configService.refreshCache();
        toast({
          title: 'Configuración guardada',
          description: 'Los cambios se han guardado correctamente',
        });
      } else {
        throw new Error('Error al guardar');
      }
    } catch (error) {
      console.error('Error saving app config:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar la configuración',
        variant: 'destructive',
      });
    } finally {
      setConfigLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!generateLevel || Number(generateLevel) < 1 || Number(generateLevel) > 6) {
      toast({
        title: 'Error',
        description: 'Debes especificar un nivel válido (1-6)',
        variant: 'destructive',
      });
      return;
    }
    
    if (!generateTopic.trim()) {
      toast({
        title: 'Error',
        description: 'Debes especificar un tema',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const generated = await exerciseService.generateExercises(
        Number(generateLevel),
        generateTopic,
        Number(generateCount),
        generateType === 'all' ? undefined : generateType
      );

      const missingTranslations = generated.filter(
        (ex) =>
          ex.type === 'FILL_IN_THE_BLANK' &&
          (!ex.word_translations || Object.keys(ex.word_translations).length === 0)
      );

      if (missingTranslations.length > 0) {
        console.warn('Generated FILL_IN_THE_BLANK without word_translations:', missingTranslations);
        toast({
          title: 'Aviso',
          description: `${missingTranslations.length} ejercicio(s) de “Rellenar el hueco” se generaron sin traducción palabra a palabra.`,
        });
      }

      // Insert each exercise
      for (const exercise of generated) {
        await exerciseService.createExercise(exercise);
      }

      toast({
        title: '¡Ejercicios generados!',
        description: `Se han creado ${generated.length} ejercicios nuevos`,
      });

      loadExercises();
    } catch (error: any) {
      console.error('Error generating exercises:', error);
      
      // Check if error has validation details
      if (error.validationErrors && Array.isArray(error.validationErrors)) {
        toast({
          title: 'Errores de validación',
          description: error.validationErrors.join('\n'),
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: error.message || 'No se pudieron generar los ejercicios',
          variant: 'destructive',
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este ejercicio?')) return;
    
    try {
      await exerciseService.deleteExercise(id);
      toast({
        title: 'Ejercicio eliminado',
      });
      loadExercises();
    } catch (error) {
      console.error('Error deleting exercise:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el ejercicio',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateExercise = async (exercise: Exercise) => {
    try {
      await exerciseService.updateExercise(exercise.id, exercise);
      toast({
        title: 'Ejercicio actualizado',
      });
      setEditingExercise(null);
      loadExercises();
    } catch (error) {
      console.error('Error updating exercise:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el ejercicio',
        variant: 'destructive',
      });
    }
  };

  const copyTopicLink = (topicTitle: string) => {
    const link = `${window.location.origin}/game/1?topic=${encodeURIComponent(topicTitle)}`;
    navigator.clipboard.writeText(link);
    toast({
      title: 'Enlace copiado',
      description: `Enlace del tema "${topicTitle}" copiado al portapapeles`,
    });
  };

  const handleCreateTopic = async () => {
    if (!newTopicTitle.trim()) {
      toast({
        title: 'Error',
        description: 'El título del tema es obligatorio',
        variant: 'destructive',
      });
      return;
    }

    try {
      await topicService.createTopic({
        title: newTopicTitle.trim(),
        description: newTopicDescription.trim() || null,
        youtube_url: newTopicYoutubeUrl.trim() || null,
        explanation_url: newTopicExplanationUrl.trim() || null,
        is_visible: false
      });
      toast({
        title: 'Tema creado',
        description: `El tema "${newTopicTitle}" se ha creado correctamente`,
      });
      setIsCreatingTopic(false);
      setNewTopicTitle('');
      setNewTopicDescription('');
      setNewTopicYoutubeUrl('');
      setNewTopicExplanationUrl('');
      loadTopics();
    } catch (error: any) {
      console.error('Error creating topic:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear el tema',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateTopic = async (topic: Topic) => {
    try {
      await topicService.updateTopic(topic.id, {
        title: topic.title,
        description: topic.description,
        youtube_url: topic.youtube_url,
        explanation_url: topic.explanation_url,
        is_visible: topic.is_visible
      });
      toast({
        title: 'Tema actualizado',
        description: `El tema "${topic.title}" se ha actualizado correctamente`,
      });
      setEditingTopic(null);
      loadTopics();
    } catch (error: any) {
      console.error('Error updating topic:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el tema',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTopic = async (id: string, title: string) => {
    if (!confirm(`¿Estás seguro de eliminar el tema "${title}"? Esto no eliminará los ejercicios asociados.`)) return;
    
    try {
      await topicService.deleteTopic(id);
      toast({
        title: 'Tema eliminado',
        description: `El tema "${title}" se ha eliminado correctamente`,
      });
      loadTopics();
    } catch (error: any) {
      console.error('Error deleting topic:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar el tema',
        variant: 'destructive',
      });
    }
  };

  const saveTtsSettings = () => {
    const settings = {
      voice: ttsVoice,
      rate: ttsRate,
      pitch: ttsPitch
    };
    localStorage.setItem('ttsSettings', JSON.stringify(settings));
    toast({
      title: 'Configuración guardada',
      description: 'Los ajustes de texto a voz se han guardado correctamente',
    });
  };

  const handleUpdateProfile = async (profile: Profile & { role?: UserRole }) => {
    try {
      // Update profile data
      await supabase
        .from('profiles')
        .update({ 
          username: profile.username,
          level_progress: profile.level_progress
        })
        .eq('id', profile.id);
      
      // Update role if changed
      if (profile.role) {
        // Get current roles
        const currentRoles = await roleService.getUserRoles(profile.id);
        
        // Remove all current roles
        await Promise.all(
          currentRoles.map(role => roleService.removeRole(profile.id, role))
        );
        
        // Assign new role
        await roleService.assignRole(profile.id, profile.role);
      }
      
      toast({
        title: 'Usuario actualizado',
      });
      setEditingProfile(null);
      loadProfiles();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el usuario',
        variant: 'destructive',
      });
    }
  };

  if (loading || roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background p-4 pt-20">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-center">Panel de Administración</h1>

        <Tabs defaultValue="exercises" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="exercises">Ejercicios</TabsTrigger>
            <TabsTrigger value="generate">Generar</TabsTrigger>
            <TabsTrigger value="topics">Temas</TabsTrigger>
            <TabsTrigger value="users">Usuarios</TabsTrigger>
            <TabsTrigger value="config">Configuración</TabsTrigger>
          </TabsList>

          {/* Exercises Tab */}
          <TabsContent value="exercises" className="space-y-4">
            <Card className="p-6 bg-card/50 backdrop-blur-xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Ejercicios del Nivel {selectedLevel}</h2>
                <div className="flex gap-2">
                  <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6].map(level => (
                        <SelectItem key={level} value={String(level)}>
                          Nivel {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Seleccionar tema" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los temas</SelectItem>
                      {topics.map(topic => (
                        <SelectItem key={topic.id} value={topic.title}>
                          {topic.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="w-56">
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los tipos</SelectItem>
                      <SelectItem value="FILL_IN_THE_BLANK">Rellenar huecos</SelectItem>
                      <SelectItem value="FILL_IN_THE_BLANK_WRITING">Rellenar huecos tecleando</SelectItem>
                      <SelectItem value="IDENTIFY_THE_WORD">Identificar palabra</SelectItem>
                      <SelectItem value="LISTENING">Listening</SelectItem>
                      <SelectItem value="WHEEL_OF_FORTUNE">Rueda de la fortuna</SelectItem>
                      <SelectItem value="FREE_WRITING">Redacción libre</SelectItem>
                      <SelectItem value="WORD_SEARCH">Sopa de Letras</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {exercises.map(exercise => (
                  <div key={exercise.id} className="p-4 bg-secondary rounded-lg">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex gap-2 mb-2">
                          <span className="px-2 py-1 bg-primary/20 text-primary rounded text-xs font-semibold">
                            {exercise.type}
                          </span>
                          <span className="px-2 py-1 bg-accent/20 text-accent rounded text-xs font-semibold">
                            {exercise.topic}
                          </span>
                        </div>
                        <p className="font-medium">{exercise.statement}</p>
                        <p className="text-sm text-primary mt-1">✓ {exercise.correct_answer}</p>
                        {exercise.incorrect_answer_1 && (
                          <p className="text-sm text-muted-foreground">✗ {exercise.incorrect_answer_1}</p>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setEditingExercise(exercise)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Editar Ejercicio</DialogTitle>
                            </DialogHeader>
                            {editingExercise && (
                              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                                <div>
                                  <Label>Enunciado</Label>
                                  <Input
                                    value={editingExercise.statement}
                                    onChange={(e) => setEditingExercise({...editingExercise, statement: e.target.value})}
                                  />
                                </div>
                                <div>
                                  <Label>Respuesta Correcta</Label>
                                  <Input
                                    value={editingExercise.correct_answer}
                                    onChange={(e) => setEditingExercise({...editingExercise, correct_answer: e.target.value})}
                                  />
                                </div>
                                <div>
                                  <Label>Respuesta Incorrecta 1</Label>
                                  <Input
                                    value={editingExercise.incorrect_answer_1 || ''}
                                    onChange={(e) => setEditingExercise({...editingExercise, incorrect_answer_1: e.target.value})}
                                  />
                                </div>
                                <div>
                                  <Label>Explicación 1</Label>
                                  <Input
                                    value={editingExercise.incorrect_answer_1_explanation || ''}
                                    onChange={(e) => setEditingExercise({...editingExercise, incorrect_answer_1_explanation: e.target.value})}
                                  />
                                </div>
                                <div>
                                  <Label>Respuesta Incorrecta 2</Label>
                                  <Input
                                    value={editingExercise.incorrect_answer_2 || ''}
                                    onChange={(e) => setEditingExercise({...editingExercise, incorrect_answer_2: e.target.value})}
                                  />
                                </div>
                                <div>
                                  <Label>Explicación 2</Label>
                                  <Input
                                    value={editingExercise.incorrect_answer_2_explanation || ''}
                                    onChange={(e) => setEditingExercise({...editingExercise, incorrect_answer_2_explanation: e.target.value})}
                                  />
                                </div>
                                <div>
                                  <Label>Respuesta Incorrecta 3</Label>
                                  <Input
                                    value={editingExercise.incorrect_answer_3 || ''}
                                    onChange={(e) => setEditingExercise({...editingExercise, incorrect_answer_3: e.target.value})}
                                  />
                                </div>
                                <div>
                                  <Label>Explicación 3</Label>
                                  <Input
                                    value={editingExercise.incorrect_answer_3_explanation || ''}
                                    onChange={(e) => setEditingExercise({...editingExercise, incorrect_answer_3_explanation: e.target.value})}
                                  />
                                </div>
                                <div>
                                  <Label>Tema</Label>
                                  <Input
                                    value={editingExercise.topic}
                                    onChange={(e) => setEditingExercise({...editingExercise, topic: e.target.value})}
                                  />
                                </div>
                                <div>
                                  <Label>Palabra en alemán (LISTENING)</Label>
                                  <Input
                                    value={editingExercise.german_word || ''}
                                    onChange={(e) => setEditingExercise({...editingExercise, german_word: e.target.value})}
                                  />
                                </div>
                                <div>
                                  <Label>Traducción al español (LISTENING)</Label>
                                  <Input
                                    value={editingExercise.spanish_translation || ''}
                                    onChange={(e) => setEditingExercise({...editingExercise, spanish_translation: e.target.value})}
                                  />
                                </div>
                                <div>
                                  <Label>Emoji (IDENTIFY_THE_WORD)</Label>
                                  <Input
                                    value={editingExercise.emoji || ''}
                                    onChange={(e) => setEditingExercise({...editingExercise, emoji: e.target.value})}
                                  />
                                </div>
                                <div>
                                  <Label>Pista (WHEEL_OF_FORTUNE / IDENTIFY_THE_WORD)</Label>
                                  <Input
                                    value={editingExercise.hint || ''}
                                    onChange={(e) => setEditingExercise({...editingExercise, hint: e.target.value})}
                                  />
                                </div>
                                <div>
                                  <Label>Traducciones de palabras (JSON)</Label>
                                  <Textarea
                                    value={editingExercise.word_translations ? JSON.stringify(editingExercise.word_translations, null, 2) : ''}
                                    onChange={(e) => {
                                      try {
                                        const parsed = e.target.value ? JSON.parse(e.target.value) : null;
                                        setEditingExercise({...editingExercise, word_translations: parsed});
                                      } catch {
                                        // Allow invalid JSON while typing
                                        setEditingExercise({...editingExercise, word_translations: e.target.value as any});
                                      }
                                    }}
                                    placeholder='{"Wort": "palabra", "Satz": "frase"}'
                                    rows={4}
                                  />
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Parejas palabra alemán - traducción español en formato JSON
                                  </p>
                                </div>
                                <div>
                                  <Label>Nivel</Label>
                                  <Select 
                                    value={String(editingExercise.level)} 
                                    onValueChange={(val) => setEditingExercise({...editingExercise, level: Number(val)})}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {[1, 2, 3, 4, 5, 6].map(level => (
                                        <SelectItem key={level} value={String(level)}>
                                          Nivel {level}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label>Tipo de ejercicio</Label>
                                  <Select 
                                    value={editingExercise.type} 
                                    onValueChange={(val) => setEditingExercise({...editingExercise, type: val as any})}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="FILL_IN_THE_BLANK">Fill in the blank</SelectItem>
                                      <SelectItem value="FILL_IN_THE_BLANK_WRITING">Fill in the blank writing</SelectItem>
                                      <SelectItem value="LISTENING">Listening</SelectItem>
                                      <SelectItem value="IDENTIFY_THE_WORD">Identify the word</SelectItem>
                                      <SelectItem value="WHEEL_OF_FORTUNE">Wheel of fortune</SelectItem>
                                      <SelectItem value="FREE_WRITING">Free writing</SelectItem>
                                      <SelectItem value="WORD_SEARCH">Sopa de Letras</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Button onClick={() => handleUpdateExercise(editingExercise)} className="w-full">
                                  Guardar Cambios
                                </Button>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(exercise.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {exercises.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No hay ejercicios en este nivel
                  </p>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Generate Tab */}
          <TabsContent value="generate">
            <Card className="p-6 bg-card/50 backdrop-blur-xl border-primary/20">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-bold">Generar Ejercicios con IA</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nivel (1-6)</Label>
                    <Select value={generateLevel} onValueChange={setGenerateLevel}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6].map(level => (
                          <SelectItem key={level} value={String(level)}>
                            Nivel {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Tema</Label>
                    <Select value={generateTopic} onValueChange={setGenerateTopic}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tema" />
                      </SelectTrigger>
                      <SelectContent>
                        {topics.map(topic => (
                          <SelectItem key={topic.id} value={topic.title}>
                            {topic.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Cantidad</Label>
                    <Input
                      type="number"
                      value={generateCount}
                      onChange={(e) => setGenerateCount(e.target.value)}
                      min="1"
                      max="20"
                    />
                  </div>

                  <div>
                    <Label>Tipo de ejercicio</Label>
                    <Select value={generateType} onValueChange={setGenerateType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los tipos (aleatorio)</SelectItem>
                        <SelectItem value="FILL_IN_THE_BLANK">Rellenar huecos</SelectItem>
                        <SelectItem value="FILL_IN_THE_BLANK_WRITING">Rellenar huecos tecleando</SelectItem>
                        <SelectItem value="IDENTIFY_THE_WORD">Identificar palabra</SelectItem>
                        <SelectItem value="LISTENING">Listening</SelectItem>
                        <SelectItem value="WHEEL_OF_FORTUNE">Rueda de la fortuna</SelectItem>
                        <SelectItem value="FREE_WRITING">Redacción libre</SelectItem>
                        <SelectItem value="WORD_SEARCH">Sopa de Letras</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="btn-duolingo w-full"
                >
                  {isGenerating ? 'Generando...' : 'Generar Ejercicios'}
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Topics Tab */}
          <TabsContent value="topics">
            <Card className="p-6 bg-card/50 backdrop-blur-xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Temas Disponibles</h2>
                <Button onClick={() => setIsCreatingTopic(true)} className="btn-duolingo">
                  + Crear Tema
                </Button>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {topics.map(topic => (
                  <div key={topic.id} className="p-4 bg-secondary rounded-lg">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">{topic.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {topic.description || 'Sin descripción'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setEditingTopic(topic)}
                          variant="outline"
                          size="sm"
                          className="gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Editar
                        </Button>
                        <Button
                          onClick={() => copyTopicLink(topic.title)}
                          variant="outline"
                          size="sm"
                          className="gap-2"
                        >
                          <LinkIcon className="w-4 h-4" />
                          Copiar Enlace
                        </Button>
                        <Button
                          onClick={() => handleDeleteTopic(topic.id, topic.title)}
                          variant="destructive"
                          size="sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {topics.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No hay temas disponibles
                  </p>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card className="p-6 bg-card/50 backdrop-blur-xl">
              <h2 className="text-2xl font-bold mb-4">Usuarios</h2>
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {profiles.map(profile => (
                  <div key={profile.id} className="p-4 bg-secondary rounded-lg">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="w-4 h-4" />
                          <h3 className="font-bold">{profile.username}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">ID: {profile.user_id}</p>
                        <p className="text-sm text-muted-foreground">
                          Creado: {new Date(profile.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setEditingProfile(profile)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Editar Usuario</DialogTitle>
                          </DialogHeader>
                          {editingProfile && (
                            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                              <div className="grid gap-4">
                                {/* Read-only fields */}
                                <div className="space-y-2 p-3 bg-muted rounded-md">
                                  <h4 className="text-sm font-semibold">Información del sistema (solo lectura)</h4>
                                  <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                      <Label className="text-muted-foreground">ID</Label>
                                      <p className="font-mono text-xs break-all">{editingProfile.id}</p>
                                    </div>
                                    <div>
                                      <Label className="text-muted-foreground">User ID</Label>
                                      <p className="font-mono text-xs break-all">{editingProfile.user_id}</p>
                                    </div>
                                    <div>
                                      <Label className="text-muted-foreground">Email</Label>
                                      <p className="text-xs">{editingProfile.email || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <Label className="text-muted-foreground">Creado</Label>
                                      <p className="text-xs">{new Date(editingProfile.created_at).toLocaleString()}</p>
                                    </div>
                                    <div>
                                      <Label className="text-muted-foreground">Actualizado</Label>
                                      <p className="text-xs">{new Date(editingProfile.updated_at).toLocaleString()}</p>
                                    </div>
                                  </div>
                                </div>

                                {/* Editable fields */}
                                <div>
                                  <Label htmlFor="username">Nombre de usuario *</Label>
                                  <Input
                                    id="username"
                                    value={editingProfile.username}
                                    onChange={(e) => setEditingProfile({...editingProfile, username: e.target.value})}
                                    placeholder="Nombre de usuario"
                                  />
                                </div>

                                <div>
                                  <Label htmlFor="role">Tipo de usuario *</Label>
                                  <Select
                                    value={(editingProfile as any).role || 'USER'}
                                    onValueChange={(value: UserRole) => 
                                      setEditingProfile({...editingProfile, role: value} as any)
                                    }
                                  >
                                    <SelectTrigger id="role" className="bg-background">
                                      <SelectValue placeholder="Seleccionar tipo" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-background z-50">
                                      <SelectItem value="USER">FREE - Usuario gratuito</SelectItem>
                                      <SelectItem value="PRO">PRO - Usuario premium</SelectItem>
                                      <SelectItem value="ADMIN">ADMIN - Administrador</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Define el nivel de acceso y permisos del usuario
                                  </p>
                                </div>
                                
                                <div>
                                  <Label htmlFor="level_progress">Progreso de niveles (JSON)</Label>
                                  <Textarea
                                    id="level_progress"
                                    className="font-mono text-sm min-h-[150px]"
                                    value={JSON.stringify(editingProfile.level_progress, null, 2)}
                                    onChange={(e) => {
                                      try {
                                        const parsed = JSON.parse(e.target.value);
                                        setEditingProfile({...editingProfile, level_progress: parsed});
                                      } catch {
                                        // Invalid JSON, don't update
                                      }
                                    }}
                                  />
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Formato JSON válido requerido. Ejemplo: {`{"1": 95, "2": 80}`}
                                  </p>
                                </div>
                              </div>
                              
                              <Button onClick={() => handleUpdateProfile(editingProfile as any)} className="w-full btn-duolingo">
                                Guardar Cambios
                              </Button>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ))}
                {profiles.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No hay usuarios registrados
                  </p>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Config Tab */}
          <TabsContent value="config" className="space-y-6">
            {/* App Configuration Card */}
            <Card className="p-6 bg-card/50 backdrop-blur-xl">
              <h2 className="text-2xl font-bold mb-6">Configuración de la Aplicación</h2>
              <p className="text-muted-foreground mb-6">
                Configura los parámetros generales de la aplicación. Estos valores se almacenan en base de datos y se cachean en memoria para acceso rápido.
              </p>
              
              <div className="space-y-6 max-w-2xl">
                <div className="space-y-2">
                  <Label>Nombre de la aplicación</Label>
                  <Input
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    placeholder="German Learning App"
                    disabled={configLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Nombre que se mostrará en la aplicación
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Tema por defecto</Label>
                  <Select value={defaultTopic} onValueChange={setDefaultTopic} disabled={configLoading}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tema por defecto" />
                    </SelectTrigger>
                    <SelectContent>
                      {topics.map(topic => (
                        <SelectItem key={topic.id} value={topic.title}>
                          {topic.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Tema al que se redirigirá a usuarios FREE o sin registrar cuando accedan sin parámetro de tema
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Máximo de ejercicios diarios (FREE): {maxDailyExercisesFree}</Label>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="5"
                    value={maxDailyExercisesFree}
                    onChange={(e) => setMaxDailyExercisesFree(parseInt(e.target.value))}
                    className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                    disabled={configLoading}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>5</span>
                    <span>25</span>
                    <span>50</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Número máximo de ejercicios que pueden hacer los usuarios FREE por día
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Text-to-Speech habilitado</Label>
                    <p className="text-xs text-muted-foreground">
                      Activa/desactiva la funcionalidad de texto a voz en ejercicios
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableTts}
                    onChange={(e) => setEnableTts(e.target.checked)}
                    className="h-5 w-5 accent-primary"
                    disabled={configLoading}
                  />
                </div>

                <Button onClick={saveAppConfig} className="w-full btn-duolingo" disabled={configLoading}>
                  {configLoading ? 'Guardando...' : 'Guardar Configuración de Aplicación'}
                </Button>
              </div>
            </Card>

            {/* TTS Configuration Card */}
            <Card className="p-6 bg-card/50 backdrop-blur-xl">
              <h2 className="text-2xl font-bold mb-6">Configuración Text-to-Speech (Local)</h2>
              <p className="text-muted-foreground mb-6">
                Configura cómo se reproducirán las palabras en alemán. Estos ajustes se guardan localmente en el navegador.
              </p>
              
              <div className="space-y-6 max-w-2xl">
                <div className="space-y-2">
                  <Label>Voz</Label>
                  <Select value={ttsVoice} onValueChange={setTtsVoice}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar voz" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Voz por defecto del sistema</SelectItem>
                      {voices.map((voice) => (
                        <SelectItem key={voice.name} value={voice.name}>
                          {voice.name} ({voice.lang})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Selecciona una voz en alemán para mejor pronunciación
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Velocidad: {ttsRate.toFixed(1)}</Label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={ttsRate}
                    onChange={(e) => setTtsRate(parseFloat(e.target.value))}
                    className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Lenta (0.5x)</span>
                    <span>Normal (1.0x)</span>
                    <span>Rápida (2.0x)</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tono: {ttsPitch.toFixed(1)}</Label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={ttsPitch}
                    onChange={(e) => setTtsPitch(parseFloat(e.target.value))}
                    className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Grave (0.5)</span>
                    <span>Normal (1.0)</span>
                    <span>Agudo (2.0)</span>
                  </div>
                </div>

                <Button onClick={saveTtsSettings} className="w-full btn-duolingo">
                  Guardar Configuración TTS
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog for Creating Topic */}
        <Dialog open={isCreatingTopic} onOpenChange={setIsCreatingTopic}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Tema</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Título del tema *</Label>
                <Input
                  value={newTopicTitle}
                  onChange={(e) => setNewTopicTitle(e.target.value)}
                  placeholder="ej: Saludos y presentaciones"
                />
              </div>
              <div>
                <Label>Descripción del tema</Label>
                <Textarea
                  value={newTopicDescription}
                  onChange={(e) => setNewTopicDescription(e.target.value)}
                  placeholder="Describe el contenido y enfoque de este tema. Esta información será usada por la IA para generar ejercicios apropiados."
                  rows={10}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  La descripción ayuda a la IA a generar ejercicios más precisos y relevantes para el tema.
                </p>
              </div>
              <div>
                <Label>URL de YouTube (opcional)</Label>
                <Input
                  value={newTopicYoutubeUrl}
                  onChange={(e) => setNewTopicYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Video explicativo del tema que se mostrará durante los ejercicios.
                </p>
              </div>
              <div>
                <Label>URL de explicación (opcional)</Label>
                <Input
                  value={newTopicExplanationUrl}
                  onChange={(e) => setNewTopicExplanationUrl(e.target.value)}
                  placeholder="https://ejemplo.com/explicacion"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enlace a una web externa con la explicación detallada del tema.
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateTopic} className="flex-1 btn-duolingo">
                  Crear Tema
                </Button>
                <Button onClick={() => {
                  setIsCreatingTopic(false);
                  setNewTopicTitle('');
                  setNewTopicDescription('');
                  setNewTopicYoutubeUrl('');
                  setNewTopicExplanationUrl('');
                }} variant="outline">
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog for Editing Topic */}
        <Dialog open={!!editingTopic} onOpenChange={(open) => !open && setEditingTopic(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Tema</DialogTitle>
            </DialogHeader>
            {editingTopic && (
              <div className="space-y-4">
                <div>
                  <Label>Título del tema *</Label>
                  <Input
                    value={editingTopic.title}
                    onChange={(e) => setEditingTopic({...editingTopic, title: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Descripción del tema</Label>
                  <Textarea
                    value={editingTopic.description || ''}
                    onChange={(e) => setEditingTopic({...editingTopic, description: e.target.value})}
                    placeholder="Describe el contenido y enfoque de este tema."
                    rows={10}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Esta descripción se usa para que la IA genere ejercicios más apropiados.
                  </p>
                </div>
                <div>
                  <Label>URL de YouTube (opcional)</Label>
                  <Input
                    value={editingTopic.youtube_url || ''}
                    onChange={(e) => setEditingTopic({...editingTopic, youtube_url: e.target.value})}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Video explicativo del tema que se mostrará durante los ejercicios.
                  </p>
                </div>
                <div>
                  <Label>URL de explicación (opcional)</Label>
                  <Input
                    value={editingTopic.explanation_url || ''}
                    onChange={(e) => setEditingTopic({...editingTopic, explanation_url: e.target.value})}
                    placeholder="https://ejemplo.com/explicacion"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enlace a una web externa con la explicación detallada del tema.
                  </p>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <Label>Visible para usuarios PRO</Label>
                    <p className="text-xs text-muted-foreground">
                      Si está activado, el tema aparecerá en el panel de temas para usuarios PRO y ADMIN.
                    </p>
                  </div>
                  <Switch
                    checked={editingTopic.is_visible}
                    onCheckedChange={(checked) => setEditingTopic({...editingTopic, is_visible: checked})}
                  />
                </div>
                <Button onClick={() => handleUpdateTopic(editingTopic)} className="w-full btn-duolingo">
                  Guardar Cambios
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
