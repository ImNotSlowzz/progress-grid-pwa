import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
  notes: string;
}

const Workout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [workoutName, setWorkoutName] = useState('');
  const [workoutNotes, setWorkoutNotes] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const addExercise = () => {
    const newExercise: Exercise = {
      id: crypto.randomUUID(),
      name: '',
      sets: 0,
      reps: 0,
      weight: 0,
      notes: '',
    };
    setExercises([...exercises, newExercise]);
  };

  const removeExercise = (id: string) => {
    setExercises(exercises.filter((ex) => ex.id !== id));
  };

  const updateExercise = (id: string, field: keyof Exercise, value: any) => {
    setExercises(
      exercises.map((ex) =>
        ex.id === id ? { ...ex, [field]: value } : ex
      )
    );
  };

  const saveWorkout = async () => {
    if (!workoutName.trim()) {
      toast({
        title: 'Nome do treino obrigatório',
        variant: 'destructive',
      });
      return;
    }

    if (exercises.length === 0) {
      toast({
        title: 'Adicione pelo menos um exercício',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      const { data: workout, error: workoutError } = await supabase
        .from('workouts')
        .insert({
          user_id: user!.id,
          name: workoutName,
          notes: workoutNotes,
        })
        .select()
        .single();

      if (workoutError) throw workoutError;

      const exercisesData = exercises.map((ex) => ({
        workout_id: workout.id,
        name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        weight: ex.weight,
        notes: ex.notes,
      }));

      const { error: exercisesError } = await supabase
        .from('exercises')
        .insert(exercisesData);

      if (exercisesError) throw exercisesError;

      toast({
        title: 'Treino salvo!',
        description: 'Seu treino foi registrado com sucesso.',
      });

      navigate('/');
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar treino',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-background">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-bold">Novo Treino</h1>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="glass-card p-6 mb-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Treino</Label>
                <Input
                  id="name"
                  placeholder="Ex: Treino de Peito"
                  value={workoutName}
                  onChange={(e) => setWorkoutName(e.target.value)}
                  className="bg-secondary/50 border-border mt-2"
                />
              </div>
              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  placeholder="Adicione observações sobre o treino..."
                  value={workoutNotes}
                  onChange={(e) => setWorkoutNotes(e.target.value)}
                  className="bg-secondary/50 border-border mt-2 min-h-[80px]"
                />
              </div>
            </div>
          </Card>

          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Exercícios</h2>
            <Button onClick={addExercise} size="sm" className="bg-primary text-primary-foreground neon-glow">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar
            </Button>
          </div>

          <div className="space-y-4 mb-6">
            {exercises.map((exercise, index) => (
              <motion.div
                key={exercise.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="glass-card p-4">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-semibold text-lg">Exercício {index + 1}</h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeExercise(exercise.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label>Nome do Exercício</Label>
                      <Input
                        placeholder="Ex: Supino Reto"
                        value={exercise.name}
                        onChange={(e) => updateExercise(exercise.id, 'name', e.target.value)}
                        className="bg-secondary/50 border-border mt-1"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label>Séries</Label>
                        <Input
                          type="number"
                          min="0"
                          value={exercise.sets || ''}
                          onChange={(e) => updateExercise(exercise.id, 'sets', parseInt(e.target.value) || 0)}
                          className="bg-secondary/50 border-border mt-1"
                        />
                      </div>
                      <div>
                        <Label>Reps</Label>
                        <Input
                          type="number"
                          min="0"
                          value={exercise.reps || ''}
                          onChange={(e) => updateExercise(exercise.id, 'reps', parseInt(e.target.value) || 0)}
                          className="bg-secondary/50 border-border mt-1"
                        />
                      </div>
                      <div>
                        <Label>Peso (kg)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.5"
                          value={exercise.weight || ''}
                          onChange={(e) => updateExercise(exercise.id, 'weight', parseFloat(e.target.value) || 0)}
                          className="bg-secondary/50 border-border mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Observações</Label>
                      <Input
                        placeholder="Ex: Aumentar peso na próxima vez"
                        value={exercise.notes}
                        onChange={(e) => updateExercise(exercise.id, 'notes', e.target.value)}
                        className="bg-secondary/50 border-border mt-1"
                      />
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}

            {exercises.length === 0 && (
              <Card className="glass-card p-12 text-center">
                <p className="text-muted-foreground mb-4">Nenhum exercício adicionado</p>
                <Button onClick={addExercise} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar primeiro exercício
                </Button>
              </Card>
            )}
          </div>

          <Button
            onClick={saveWorkout}
            disabled={saving}
            className="w-full bg-primary text-primary-foreground neon-glow"
            size="lg"
          >
            <Save className="w-5 h-5 mr-2" />
            {saving ? 'Salvando...' : 'Salvar Treino'}
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default Workout;