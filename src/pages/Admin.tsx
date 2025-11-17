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

export default function Admin() {
  const { user, loading } = useAuth();
  const { isAdmin, loading: roleLoading } = useRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
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
      const { data, error } = await supabase
        .from('exercises')
        .select('topic')
        .order('topic');
      
      if (error) throw error;
      
      const uniqueTopics = [...new Set(data?.map(e => e.topic) || [])];
      setTopics(uniqueTopics);
    } catch (error) {
      console.error('Error loading topics:', error);
    }
  };

  const loadProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error loading profiles:', error);
    }
  };

  const handleGenerate = async () => {
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

      // Insert each exercise
      for (const exercise of generated) {
        await exerciseService.createExercise(exercise);
      }

      toast({
        title: '¡Ejercicios generados!',
        description: `Se han creado ${generated.length} ejercicios nuevos`,
      });

      loadExercises();
      setGenerateTopic('');
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

  const copyTopicLink = (topic: string) => {
    const link = `${window.location.origin}/game/1?topic=${encodeURIComponent(topic)}`;
    navigator.clipboard.writeText(link);
    toast({
      title: 'Enlace copiado',
      description: `Enlace del tema "${topic}" copiado al portapapeles`,
    });
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

  const handleUpdateProfile = async (profile: Profile) => {
    try {
      await supabase
        .from('profiles')
        .update({ 
          username: profile.username,
          level_progress: profile.level_progress
        })
        .eq('id', profile.id);
      
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
                        <SelectItem key={topic} value={topic}>
                          {topic}
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
                      <SelectItem value="IDENTIFY_THE_WORD">Identificar palabra</SelectItem>
                      <SelectItem value="LISTENING">Listening</SelectItem>
                      <SelectItem value="WHEEL_OF_FORTUNE">Rueda de la fortuna</SelectItem>
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
                                      <SelectItem value="LISTENING">Listening</SelectItem>
                                      <SelectItem value="IDENTIFY_THE_WORD">Identify the word</SelectItem>
                                      <SelectItem value="WHEEL_OF_FORTUNE">Wheel of fortune</SelectItem>
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
                    <Input
                      value={generateTopic}
                      onChange={(e) => setGenerateTopic(e.target.value)}
                      placeholder="ej: Saludos, Comida, Viajes"
                    />
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
                        <SelectItem value="IDENTIFY_THE_WORD">Identificar palabra</SelectItem>
                        <SelectItem value="LISTENING">Listening</SelectItem>
                        <SelectItem value="WHEEL_OF_FORTUNE">Rueda de la fortuna</SelectItem>
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
              <h2 className="text-2xl font-bold mb-4">Temas Disponibles</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {topics.map(topic => (
                  <div key={topic} className="p-4 bg-secondary rounded-lg flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-lg">{topic}</h3>
                      <p className="text-sm text-muted-foreground">Nivel 1 - {topic}</p>
                    </div>
                    <Button
                      onClick={() => copyTopicLink(topic)}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                    >
                      <LinkIcon className="w-4 h-4" />
                      Copiar Enlace
                    </Button>
                  </div>
                ))}
                {topics.length === 0 && (
                  <p className="text-center text-muted-foreground py-8 col-span-2">
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
                              <div>
                                <Label>Nombre de usuario</Label>
                                <Input
                                  value={editingProfile.username}
                                  onChange={(e) => setEditingProfile({...editingProfile, username: e.target.value})}
                                />
                              </div>
                              <div>
                                <Label>Progreso de niveles (JSON)</Label>
                                <textarea
                                  className="w-full min-h-[100px] p-2 border rounded-md font-mono text-sm"
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
                              </div>
                              <Button onClick={() => handleUpdateProfile(editingProfile)} className="w-full">
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
          <TabsContent value="config">
            <Card className="p-6 bg-card/50 backdrop-blur-xl">
              <h2 className="text-2xl font-bold mb-6">Configuración Text-to-Speech</h2>
              <p className="text-muted-foreground mb-6">
                Configura cómo se reproducirán las palabras en alemán en los ejercicios de listening
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
                  Guardar Configuración
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}