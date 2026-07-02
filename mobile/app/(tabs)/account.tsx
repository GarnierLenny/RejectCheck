import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/lib/auth';
import {
  analysesFromCredits,
  getEntitlement,
  type Entitlement,
} from '@/lib/api';
import { Button, Card, MonoLabel, Pill, Title } from '@/components/ui';
import { Font, RC, Spacing } from '@/theme';

const PLAN_LABEL: Record<Entitlement['plan'], string> = {
  free: 'Free',
  shortlisted: 'Shortlisted',
  hired: 'Hired',
};

export default function Account() {
  const { session, signOut } = useAuth();
  const [ent, setEnt] = useState<Entitlement | null>(null);

  useEffect(() => {
    getEntitlement()
      .then(setEnt)
      .catch(() => setEnt(null));
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: RC.bg }} edges={['top']}>
      <View style={{ flex: 1, padding: Spacing.five, gap: Spacing.four }}>
        <View style={{ gap: Spacing.two }}>
          <MonoLabel>Réglages</MonoLabel>
          <Title>Compte</Title>
        </View>

        <Card>
          <MonoLabel>Email</MonoLabel>
          <Text
            style={{
              fontFamily: Font.sans,
              fontSize: 16,
              color: RC.text,
              marginTop: Spacing.two,
            }}
          >
            {session?.user.email ?? '—'}
          </Text>
        </Card>

        <Card>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <MonoLabel>Abonnement</MonoLabel>
            {ent ? (
              <Pill
                label={PLAN_LABEL[ent.plan]}
                tone={ent.isPremium ? 'brand' : 'neutral'}
              />
            ) : null}
          </View>
          <Text
            style={{
              fontFamily: Font.sans,
              fontSize: 14,
              color: RC.muted,
              marginTop: Spacing.two,
            }}
          >
            {ent
              ? `${analysesFromCredits(ent.monthlyCap)} analyses / mois`
              : 'Chargement…'}
          </Text>
        </Card>

        <View style={{ flex: 1 }} />

        <Button label="Se déconnecter" variant="secondary" onPress={signOut} />
      </View>
    </SafeAreaView>
  );
}
