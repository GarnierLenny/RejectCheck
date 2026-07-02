import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';

import { supabase } from '@/lib/supabase';
import { Button, Field, MonoLabel, Screen, Title } from '@/components/ui';
import { Font, RC, Spacing } from '@/theme';

WebBrowser.maybeCompleteAuthSession();

// Redirect target for the OAuth round-trip. In Expo Go this is an exp:// URL; in
// a standalone/dev build it's rejectcheck://. The exact value must be added to
// Supabase → Authentication → URL Configuration → Redirect URLs.
const redirectTo = makeRedirectUri();

type OAuthProvider = 'google' | 'apple';

export default function Login() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  const normalizedEmail = email.trim().toLowerCase();

  async function signInWithProvider(provider: OAuthProvider) {
    setError(null);
    setOauthLoading(provider);
    try {
      const { data, error: err } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (err || !data?.url) throw err ?? new Error('OAuth init failed');
      const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (res.type === 'success' && res.url) {
        const codeParam = new URL(res.url).searchParams.get('code');
        if (codeParam) {
          const { error: exErr } =
            await supabase.auth.exchangeCodeForSession(codeParam);
          if (exErr) throw exErr;
        }
      }
      // On success the AuthProvider session updates → the root gate redirects.
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Connexion impossible');
    } finally {
      setOauthLoading(null);
    }
  }

  async function sendCode() {
    setError(null);
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setStep('code');
  }

  async function verify() {
    setError(null);
    setLoading(true);
    const { error: err } = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token: code.trim(),
      type: 'email',
    });
    setLoading(false);
    if (err) setError(err.message);
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, justifyContent: 'center', gap: Spacing.four }}
      >
        <View style={{ gap: Spacing.two, marginBottom: Spacing.three }}>
          <MonoLabel>RejectCheck</MonoLabel>
          <Title>{step === 'code' ? 'Entre ton code' : 'Connexion'}</Title>
          <Text style={{ fontFamily: Font.sans, fontSize: 15, color: RC.muted }}>
            {step === 'code'
              ? `Envoyé à ${normalizedEmail}`
              : 'Continue pour analyser ton CV.'}
          </Text>
        </View>

        {step === 'email' ? (
          <>
            <Button
              label="Continuer avec Apple"
              variant="dark"
              loading={oauthLoading === 'apple'}
              disabled={oauthLoading !== null}
              onPress={() => signInWithProvider('apple')}
              icon={<FontAwesome name="apple" size={18} color="#fff" />}
            />
            <Button
              label="Continuer avec Google"
              variant="secondary"
              loading={oauthLoading === 'google'}
              disabled={oauthLoading !== null}
              onPress={() => signInWithProvider('google')}
              icon={<FontAwesome name="google" size={16} color={RC.text} />}
            />

            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}
            >
              <View style={{ flex: 1, height: 1, backgroundColor: RC.border }} />
              <Text style={{ fontFamily: Font.mono, fontSize: 11, color: RC.hint }}>
                OU
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: RC.border }} />
            </View>

            <Field
              placeholder="you@example.com"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              inputMode="email"
              value={email}
              onChangeText={setEmail}
              onSubmitEditing={sendCode}
              returnKeyType="send"
            />
            {error ? (
              <Text style={{ color: RC.red, fontFamily: Font.sans, fontSize: 13 }}>
                {error}
              </Text>
            ) : null}
            <Button
              label="Recevoir un code par email"
              onPress={sendCode}
              loading={loading}
              disabled={!email.includes('@') || oauthLoading !== null}
            />
          </>
        ) : (
          <>
            <Field
              placeholder="Code à 6 chiffres"
              keyboardType="number-pad"
              value={code}
              onChangeText={setCode}
              onSubmitEditing={verify}
              returnKeyType="done"
              autoFocus
            />
            {error ? (
              <Text style={{ color: RC.red, fontFamily: Font.sans, fontSize: 13 }}>
                {error}
              </Text>
            ) : null}
            <Button
              label="Vérifier & continuer"
              onPress={verify}
              loading={loading}
              disabled={code.trim().length < 6}
            />
            <Button
              label="Utiliser un autre email"
              variant="secondary"
              onPress={() => {
                setStep('email');
                setCode('');
                setError(null);
              }}
            />
          </>
        )}
      </KeyboardAvoidingView>
    </Screen>
  );
}
