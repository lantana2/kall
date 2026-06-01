import { Component } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Ловит ошибки рендера дочерних экранов, чтобы не было «белого экрана».
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.box}>
          <Text style={styles.emoji}>😕</Text>
          <Text style={styles.title}>Что-то пошло не так на этом экране</Text>
          <ScrollView style={styles.scroll}>
            <Text style={styles.msg}>{String(this.state.error?.message || this.state.error)}</Text>
          </ScrollView>
          <TouchableOpacity style={styles.btn} onPress={() => this.setState({ error: null })}>
            <Text style={styles.btnText}>Обновить</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  box: { flex: 1, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center', padding: 24 },
  emoji: { fontSize: 48, marginBottom: 10 },
  title: { color: '#f8fafc', fontSize: 16, fontWeight: '700', textAlign: 'center', marginBottom: 10 },
  scroll: { maxHeight: 200, alignSelf: 'stretch' },
  msg: { color: '#fca5a5', fontSize: 12, textAlign: 'center' },
  btn: { backgroundColor: '#22c55e', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 28, marginTop: 16 },
  btnText: { color: '#fff', fontWeight: '700' },
});
