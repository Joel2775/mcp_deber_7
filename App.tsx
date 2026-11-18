import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { supabase } from './supabase';

type Tarea = {
  id: string;
  titulo: string;
  completada: boolean;
  created_at: string;
};

export default function App() {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [titulo, setTitulo] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const cargarTareas = useCallback(async () => {
    const { data, error } = await supabase
      .from('tareas_movil')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setTareas((data ?? []) as Tarea[]);
    }
    setCargando(false);
  }, []);

  useEffect(() => {
    cargarTareas();
  }, [cargarTareas]);

  const guardarTarea = async () => {
    const nuevoTitulo = titulo.trim();

    if (!nuevoTitulo) {
      Alert.alert('Título requerido', 'Escribe un título para la tarea.');
      return;
    }

    setGuardando(true);
    const { data, error } = await supabase
      .from('tareas_movil')
      .insert({ titulo: nuevoTitulo })
      .select()
      .single();
    setGuardando(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    if (data) {
      setTareas((actuales) => [data as Tarea, ...actuales]);
    }
    setTitulo('');
  };

  const borrarTarea = async (id: string) => {
    const { error } = await supabase.from('tareas_movil').delete().eq('id', id);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    setTareas((actuales) => actuales.filter((tarea) => tarea.id !== id));
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>Mis tareas</Text>
        <Text style={styles.subtitle}>Administra tus tareas con Supabase</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Nueva tarea..."
          value={titulo}
          onChangeText={setTitulo}
          onSubmitEditing={guardarTarea}
          returnKeyType="done"
        />
        <TouchableOpacity
          style={[styles.button, guardando && styles.buttonDisabled]}
          onPress={guardarTarea}
          disabled={guardando}
        >
          {guardando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Guardar</Text>
          )}
        </TouchableOpacity>
      </View>

      {cargando ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={tareas}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>No hay tareas todavía.</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.taskInfo}>
                <Text style={styles.taskTitle}>{item.titulo}</Text>
                <Text
                  style={[
                    styles.status,
                    item.completada ? styles.statusDone : styles.statusPending,
                  ]}
                >
                  {item.completada ? 'Completada' : 'Pendiente'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => borrarTarea(item.id)}
              >
                <Text style={styles.deleteText}>Borrar</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 56,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#2563eb',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#dbeafe',
    marginTop: 4,
  },
  form: {
    flexDirection: 'row',
    gap: 10,
    padding: 20,
  },
  input: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#0f172a',
  },
  button: {
    height: 48,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  taskInfo: {
    flex: 1,
    marginRight: 12,
  },
  taskTitle: {
    fontSize: 16,
    color: '#0f172a',
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
  statusDone: {
    color: '#16a34a',
  },
  statusPending: {
    color: '#d97706',
  },
  deleteButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
  },
  deleteText: {
    color: '#dc2626',
    fontWeight: '600',
  },
  empty: {
    textAlign: 'center',
    color: '#64748b',
    marginTop: 40,
    fontSize: 15,
  },
});
