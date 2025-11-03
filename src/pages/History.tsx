import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Dumbbell, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  notes: string | null;
}

interface Workout {
  id: string;
  name: string;
  date: string;
  notes: string | null;
  exercises?: Exercise[];
  expanded?: boolean;
}

const History = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchWorkouts();
  }, [user, navigate]);

  const fetchWorkouts = async () => {
    try {
      const { data: workoutsData, error: workoutsError } = await supabase
        .from('workouts')
        .select('*')
        .order('date', { ascending: false });

      if (workoutsError) throw workoutsError;

      const workoutsWithExercises = await Promise.all(
        (workoutsData || []).map(async (workout) => {
          const { data: exercises } = await supabase
            .from('exercises')
            .select('*')
            .eq('workout_id', workout.id);

          return {
            ...workout,
            exercises: exercises || [],
            expanded: false,
          };
        })
      );

      setWorkouts(workoutsWithExercises);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar histórico',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleWorkout = (id: string) => {
    setWorkouts(
      workouts.map((w) =>
        w.id === id ? { ...w, expanded: !w.expanded } : w
      )
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary">Carregando...</div>
      </div>
    );
  }

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
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Histórico de Treinos</h1>
          </div>
        </motion.div>

        {workouts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <Card className="glass-card p-12">
              <Dumbbell className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Nenhum treino registrado</h2>
              <p className="text-muted-foreground mb-6">
                Comece agora a registrar seus treinos!
              </p>
              <Button onClick={() => navigate('/workout')} className="bg-primary text-primary-foreground neon-glow">
                Criar primeiro treino
              </Button>
            </Card>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {workouts.map((workout, index) => (
              <motion.div
                key={workout.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="glass-card overflow-hidden">
                  <div
                    className="p-4 cursor-pointer hover:bg-secondary/20 smooth-transition"
                    onClick={() => toggleWorkout(workout.id)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Dumbbell className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{workout.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {new Date(workout.date).toLocaleDateString('pt-BR', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {workout.exercises?.length || 0} exercícios
                        </span>
                        {workout.expanded ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </div>
                    </div>
                  </div>

                  {workout.expanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-border"
                    >
                      <div className="p-4 space-y-3 bg-secondary/10">
                        {workout.notes && (
                          <div className="mb-3">
                            <p className="text-sm text-muted-foreground">
                              <strong>Observações:</strong> {workout.notes}
                            </p>
                          </div>
                        )}
                        {workout.exercises && workout.exercises.length > 0 ? (
                          workout.exercises.map((exercise) => (
                            <div
                              key={exercise.id}
                              className="p-3 bg-card/50 rounded-lg"
                            >
                              <h4 className="font-semibold mb-2">{exercise.name}</h4>
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground">Séries</p>
                                  <p className="font-semibold">{exercise.sets}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Reps</p>
                                  <p className="font-semibold">{exercise.reps}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Peso</p>
                                  <p className="font-semibold">{exercise.weight} kg</p>
                                </div>
                              </div>
                              {exercise.notes && (
                                <p className="text-sm text-muted-foreground mt-2">
                                  {exercise.notes}
                                </p>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            Nenhum exercício registrado
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;