import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useAuth } from '@/lib/auth';
import {
  analysesFromCredits,
  getEntitlement,
  type Entitlement,
} from '@/lib/api';
import { Button, Card, MonoLabel, Pill } from '@/components/ui';
import { Font, RC, Spacing } from '@/theme';

const PLAN_LABEL: Record<Entitlement['plan'], string> = {
  free: 'Free',
  shortlisted: 'Shortlisted',
  hired: 'Hired',
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.three,
        borderTopWidth: 1,
        borderTopColor: RC.border,
      }}
    >
      <Text style={{ fontFamily: Font.sans, fontSize: 14, color: RC.muted }}>
        {label}
      </Text>
      <Text
        style={{
          fontFamily: Font.mono,
          fontSize: 14,
          fontWeight: '600',
          color: RC.text,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

export default function Home() {
  const { session } = useAuth();
  const router = useRouter();
  const [ent, setEnt] = useState<Entitlement | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setEnt(await getEntitlement());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Chargement impossible');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const email = session?.user.email ?? '';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: RC.bg }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: Spacing.five, gap: Spacing.four }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={RC.red}
          />
        }
      >
        <View style={{ gap: Spacing.two }}>
          <MonoLabel>RejectCheck</MonoLabel>
          <Text
            style={{
              fontFamily: Font.sans,
              fontSize: 26,
              fontWeight: '600',
              letterSpacing: -0.5,
              color: RC.text,
            }}
          >
            Bon retour
          </Text>
          <Text style={{ fontFamily: Font.sans, fontSize: 14, color: RC.hint }}>
            {email}
          </Text>
        </View>

        <Button
          label="Nouvelle analyse"
          onPress={() => router.push('/analyze')}
        />

        {loading ? (
          <View style={{ paddingVertical: Spacing.six }}>
            <ActivityIndicator color={RC.red} />
          </View>
        ) : error ? (
          <Card style={{ borderColor: RC.redBorder, backgroundColor: RC.redBg }}>
            <Text style={{ fontFamily: Font.sans, color: RC.red, fontSize: 14 }}>
              {error}
            </Text>
            <View style={{ marginTop: Spacing.four }}>
              <Button label="Réessayer" variant="secondary" onPress={load} />
            </View>
          </Card>
        ) : ent ? (
          <Card>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: Spacing.three,
              }}
            >
              <MonoLabel>Ton plan</MonoLabel>
              <Pill
                label={PLAN_LABEL[ent.plan]}
                tone={ent.isPremium ? 'brand' : 'neutral'}
              />
            </View>
            <Row label="Statut" value={ent.isPremium ? 'Actif' : 'Gratuit'} />
            <Row
              label="Analyses / mois"
              value={String(analysesFromCredits(ent.monthlyCap))}
            />
            <Row label="Crédits en plus" value={String(ent.creditsBalance)} />
            {ent.currentPeriodEnd ? (
              <Row
                label="Renouvellement"
                value={new Date(ent.currentPeriodEnd).toLocaleDateString()}
              />
            ) : null}
          </Card>
        ) : null}

        <Text
          style={{
            fontFamily: Font.sans,
            fontSize: 13,
            color: RC.hint,
            textAlign: 'center',
            marginTop: Spacing.two,
          }}
        >
          Tes analyses récentes apparaîtront ici.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
