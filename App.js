import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Onboarding from './screens/Onboarding';
import Home from './screens/Home';
import Stats from './screens/Stats';
import AddFoodModal from './components/AddFoodModal';
import ApiKeyScreen from './components/ApiKeyScreen';
import ErrorBoundary from './components/ErrorBoundary';
import { getProfile, saveProfile, getApiKey, saveApiKey } from './lib/storage';
import { setupNotifications } from './lib/notifications';

export default function App() {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState('home');
  const [addOpen, setAddOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [keyDismissed, setKeyDismissed] = useState(false); // «пропустить» в этой сессии
  const notifDone = useRef(false);

  async function handleSaveKey(k) {
    await saveApiKey(k);
    setApiKey(k);
  }

  useEffect(() => {
    (async () => {
      setProfile(await getProfile());
      setApiKey(await getApiKey());
      setReady(true);
    })();
  }, []);

  // После онбординга — поставить ежедневные напоминания (один раз).
  useEffect(() => {
    if (ready && profile && !editing && !notifDone.current) {
      notifDone.current = true;
      setupNotifications();
    }
  }, [ready, profile, editing]);

  async function handleOnboardDone(p) {
    await saveProfile(p);
    setProfile(p);
    setEditing(false);
  }

  if (!ready) {
    return (
      <View style={styles.splash}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#22c55e" />
      </View>
    );
  }

  const showOnboarding = !profile || editing;
  const showKeyScreen = !showOnboarding && !apiKey && !keyDismissed;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      {showOnboarding ? (
        <Onboarding onDone={handleOnboardDone} />
      ) : showKeyScreen ? (
        <ApiKeyScreen
          initial={apiKey}
          onSave={handleSaveKey}
          onSkip={() => setKeyDismissed(true)}
        />
      ) : (
        <>
          <View style={{ flex: 1 }}>
            <ErrorBoundary key={tab}>
              {tab === 'home' ? (
                <Home
                  profile={profile}
                  apiKey={apiKey}
                  onApiKey={setApiKey}
                  onEditProfile={() => setEditing(true)}
                  refreshKey={refreshKey}
                />
              ) : (
                <Stats profile={profile} refreshKey={refreshKey} />
              )}
            </ErrorBoundary>
          </View>

          {/* Нижняя панель с центральной кнопкой ➕ */}
          <View style={styles.tabbar}>
            <Tab label="Главная" icon="🍎" active={tab === 'home'} onPress={() => setTab('home')} />
            <View style={styles.addWrap}>
              <TouchableOpacity style={styles.addBtn} onPress={() => setAddOpen(true)} activeOpacity={0.85}>
                <Text style={styles.addPlus}>＋</Text>
              </TouchableOpacity>
            </View>
            <Tab label="Статистика" icon="📊" active={tab === 'stats'} onPress={() => setTab('stats')} />
          </View>

          <AddFoodModal
            visible={addOpen}
            onClose={() => setAddOpen(false)}
            apiKey={apiKey}
            onSaved={() => setRefreshKey((k) => k + 1)}
          />
        </>
      )}
    </View>
  );
}

function Tab({ label, icon, active, onPress }) {
  return (
    <TouchableOpacity style={styles.tab} onPress={onPress}>
      <Text style={[styles.tabIcon, { opacity: active ? 1 : 0.45 }]}>{icon}</Text>
      <Text style={[styles.tabLabel, { color: active ? '#22c55e' : '#64748b' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0f172a' },
  splash: { flex: 1, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center' },
  tabbar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderTopWidth: 1,
    borderTopColor: '#0f172a',
    paddingBottom: 22,
    paddingTop: 10,
  },
  tab: { flex: 1, alignItems: 'center' },
  tabIcon: { fontSize: 22 },
  tabLabel: { fontSize: 11, fontWeight: '700', marginTop: 2 },
  addWrap: { width: 80, alignItems: 'center' },
  addBtn: {
    width: 62, height: 62, borderRadius: 31, backgroundColor: '#22c55e',
    alignItems: 'center', justifyContent: 'center', marginTop: -32,
    borderWidth: 5, borderColor: '#0f172a',
  },
  addPlus: { color: '#fff', fontSize: 32, fontWeight: '300', marginTop: -2 },
});
