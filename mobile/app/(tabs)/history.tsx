import { Text, View } from 'react-native';
import { MonoLabel, Screen, Title } from '@/components/ui';
import { Font, RC, Spacing } from '@/theme';

export default function History() {
  return (
    <Screen>
      <View style={{ gap: Spacing.two, marginBottom: Spacing.five }}>
        <MonoLabel>Tes analyses</MonoLabel>
        <Title>Historique</Title>
      </View>
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          gap: Spacing.three,
        }}
      >
        <Text style={{ fontSize: 40 }}>🗂️</Text>
        <Text
          style={{
            fontFamily: Font.sans,
            fontSize: 16,
            color: RC.muted,
            textAlign: 'center',
            maxWidth: 280,
            lineHeight: 23,
          }}
        >
          La liste de tes analyses passées arrive bientôt.
        </Text>
      </View>
    </Screen>
  );
}
