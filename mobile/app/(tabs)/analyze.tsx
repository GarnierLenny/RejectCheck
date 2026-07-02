import { Text, View } from 'react-native';
import { MonoLabel, Screen, Title } from '@/components/ui';
import { Font, RC, Spacing } from '@/theme';

export default function Analyze() {
  return (
    <Screen>
      <View style={{ gap: Spacing.two, marginBottom: Spacing.five }}>
        <MonoLabel>Nouvelle analyse</MonoLabel>
        <Title>Analyser</Title>
      </View>
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          gap: Spacing.three,
        }}
      >
        <Text style={{ fontSize: 40 }}>⚡️</Text>
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
          Le flow d’analyse (CV + offre → diagnostic streamé) arrive à l’étape
          suivante.
        </Text>
      </View>
    </Screen>
  );
}
