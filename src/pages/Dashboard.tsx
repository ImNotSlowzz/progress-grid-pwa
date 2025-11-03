import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Dumbbell, Plus, TrendingUp, Calendar, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Workout {
  id: string;
  name: string;
  date: string;
  notes: string | null;
}

interface Stats {
  totalWorkouts: number;
  thisWeek: number;
  thisMonth: number;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [stats, setStats] = useState<Stats>({ totalWorkouts: 0, thisWeek: 0, thisMonth: 0 });
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
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .order('date', { ascending: false })
        .limit(5);

      if (error) throw error;

      setWorkouts(data || []);
      calculateStats(data || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar treinos',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (workouts: Workout[]) => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const thisWeek = workouts.filter((w) => new Date(w.date) >= weekAgo).length;
    const thisMonth = workouts.filter((w) => new Date(w.date) >= monthAgo).length;

    setStats({
      totalWorkouts: workouts.length,
      thisWeek,
      thisMonth,
    });
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
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
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl neon-glow">
              <Dumbbell className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">FitTrack</h1>
              <p className="text-sm text-muted-foreground">Olá, {user?.email?.split('@')[0]}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="w-5 h-5" />
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="glass-card p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Treinos</p>
                  <p className="text-2xl font-bold">{stats.totalWorkouts}</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="glass-card p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Esta Semana</p>
                  <p className="text-2xl font-bold">{stats.thisWeek}</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="glass-card p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Dumbbell className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Este Mês</p>
                  <p className="text-2xl font-bold">{stats.thisMonth}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="glass-card p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Treinos Recentes</h2>
              <Button onClick={() => navigate('/workout')} className="bg-primary text-primary-foreground neon-glow">
                <Plus className="w-4 h-4 mr-2" />
                Novo Treino
              </Button>
            </div>

            {workouts.length === 0 ? (
              <div className="text-center py-12">
                <Dumbbell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum treino registrado ainda</p>
                <Button onClick={() => navigate('/workout')} variant="outline" className="mt-4">
                  Criar seu primeiro treino
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {workouts.map((workout) => (
                  <motion.div
                    key={workout.id}
                    whileHover={{ scale: 1.02 }}
                    className="p-4 bg-secondary/30 rounded-xl smooth-transition cursor-pointer hover:bg-secondary/50"
                    onClick={() => navigate('/history')}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold">{workout.name}</h3>
                        {workout.notes && <p className="text-sm text-muted-foreground">{workout.notes}</p>}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(workout.date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>

        <div className="fixed bottom-4 right-4 flex gap-2">
          <Button onClick={() => navigate('/history')} variant="secondary" size="lg" className="rounded-full shadow-lg">
            <Calendar className="w-5 h-5 mr-2" />
            Histórico
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;