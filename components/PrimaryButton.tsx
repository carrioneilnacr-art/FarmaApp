import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { Colors } from '../theme/colors';

export interface PrimaryButtonProps extends TouchableOpacityProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  ...rest
}) => {
  const isDisabled = disabled || loading;

  const getButtonStyle = (): ViewStyle => {
    let base: ViewStyle = {};

    // Variant style
    switch (variant) {
      case 'primary':
        base = {
          backgroundColor: isDisabled ? Colors.border : Colors.primary,
        };
        break;
      case 'secondary':
        base = {
          backgroundColor: isDisabled ? Colors.border : Colors.secondary,
        };
        break;
      case 'danger':
        base = {
          backgroundColor: isDisabled ? Colors.border : Colors.danger,
        };
        break;
      case 'outline':
        base = {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: isDisabled ? Colors.border : Colors.primary,
        };
        break;
      case 'ghost':
        base = {
          backgroundColor: 'transparent',
        };
        break;
    }

    // Size style
    switch (size) {
      case 'sm':
        base = { ...base, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 };
        break;
      case 'lg':
        base = { ...base, paddingVertical: 16, paddingHorizontal: 24, borderRadius: 14 };
        break;
      case 'md':
      default:
        base = { ...base, paddingVertical: 12, paddingHorizontal: 18, borderRadius: 10 };
        break;
    }

    return base;
  };

  const getTextStyle = (): TextStyle => {
    let color = Colors.white;

    if (variant === 'outline' || variant === 'ghost') {
      color = isDisabled ? Colors.textMuted : Colors.primary;
    } else if (isDisabled) {
      color = Colors.textMuted;
    }

    const fontSize = size === 'sm' ? 13 : size === 'lg' ? 17 : 15;

    return {
      color,
      fontSize,
      fontWeight: '600',
    };
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={isDisabled}
      style={[styles.baseButton, getButtonStyle(), style]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? Colors.primary : Colors.white}
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && <>{icon}</>}
          <Text style={[getTextStyle(), icon && iconPosition === 'left' ? { marginLeft: 8 } : null, icon && iconPosition === 'right' ? { marginRight: 8 } : null, textStyle]}>
            {title}
          </Text>
          {icon && iconPosition === 'right' && <>{icon}</>}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});
