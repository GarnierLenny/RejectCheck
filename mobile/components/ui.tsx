import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Font, RC, Radius, Spacing } from '@/theme';

export function Screen({
  children,
  style,
  scroll,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  scroll?: boolean;
}) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: RC.bg }} edges={['top']}>
      <View style={[{ flex: 1, padding: Spacing.five }, style]}>{children}</View>
    </SafeAreaView>
  );
}

export function MonoLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        fontFamily: Font.mono,
        fontSize: 11,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        color: RC.hint,
      }}
    >
      {children}
    </Text>
  );
}

export function Title({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        fontFamily: Font.sans,
        fontSize: 28,
        fontWeight: '600',
        letterSpacing: -0.5,
        color: RC.text,
      }}
    >
      {children}
    </Text>
  );
}

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View
      style={[
        {
          backgroundColor: RC.surface,
          borderWidth: 1,
          borderColor: RC.border,
          borderRadius: Radius.lg,
          padding: Spacing.five,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Pill({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'brand';
}) {
  const brand = tone === 'brand';
  return (
    <View
      style={{
        backgroundColor: brand ? RC.red : RC.surfaceHero,
        borderRadius: Radius.pill,
        paddingVertical: 4,
        paddingHorizontal: 12,
        alignSelf: 'flex-start',
      }}
    >
      <Text
        style={{
          fontFamily: Font.mono,
          fontSize: 12,
          fontWeight: '700',
          letterSpacing: 0.5,
          color: brand ? '#fff' : RC.muted,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export function Button({
  label,
  onPress,
  loading,
  disabled,
  variant = 'primary',
  icon,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'dark';
  icon?: React.ReactNode;
}) {
  const isDisabled = disabled || loading;
  const bg =
    variant === 'primary' ? RC.red : variant === 'dark' ? RC.text : 'transparent';
  const fg = variant === 'secondary' ? RC.text : '#fff';
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => ({
        flexDirection: 'row',
        gap: Spacing.two,
        backgroundColor: bg,
        borderWidth: variant === 'secondary' ? 1 : 0,
        borderColor: RC.border,
        borderRadius: Radius.md,
        paddingVertical: 14,
        paddingHorizontal: Spacing.five,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
      })}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon}
          <Text
            style={{
              color: fg,
              fontFamily: Font.sans,
              fontSize: 15,
              fontWeight: '600',
            }}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

export function Field(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={RC.hint}
      {...props}
      style={[
        {
          backgroundColor: RC.surface,
          borderWidth: 1,
          borderColor: RC.border,
          borderRadius: Radius.md,
          paddingVertical: 14,
          paddingHorizontal: Spacing.four,
          fontFamily: Font.sans,
          fontSize: 16,
          color: RC.text,
        },
        props.style,
      ]}
    />
  );
}
