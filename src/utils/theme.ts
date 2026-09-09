export type ThemeColor = 'blue' | 'emerald' | 'amber';

export interface ThemeConfig {
  color: ThemeColor;
  primaryBg: string;
  primaryHoverBg: string;
  primaryText: string;
  primaryLightBg: string;
  primaryBorder: string;
  primaryRing: string;
  badgeBg: string;
  badgeText: string;
  buttonBg: string;
  buttonHoverBg: string;
  cardActiveBorder: string;
  hex: string;
  label: string;
}

export function getSupervisorTheme(category?: string | null): ThemeConfig {
  if (!category) {
    return {
      color: 'blue',
      primaryBg: 'bg-blue-600',
      primaryHoverBg: 'hover:bg-blue-700',
      primaryText: 'text-blue-600',
      primaryLightBg: 'bg-blue-50/70',
      primaryBorder: 'border-blue-200',
      primaryRing: 'ring-blue-600/20',
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
      badgeText: 'text-blue-700',
      buttonBg: 'bg-blue-600',
      buttonHoverBg: 'hover:bg-blue-700',
      cardActiveBorder: 'border-blue-600 ring-2 ring-blue-600/15',
      hex: '#2563eb',
      label: 'DOLE General',
    };
  }

  if (category.toLowerCase().includes('piña')) {
    // Jason Cruz - Piña y Banano (Tema Ámbar / Dorado)
    return {
      color: 'amber',
      primaryBg: 'bg-amber-600',
      primaryHoverBg: 'hover:bg-amber-700',
      primaryText: 'text-amber-600',
      primaryLightBg: 'bg-amber-50/70',
      primaryBorder: 'border-amber-200',
      primaryRing: 'ring-amber-600/20',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
      badgeText: 'text-amber-800',
      buttonBg: 'bg-amber-600',
      buttonHoverBg: 'hover:bg-amber-700',
      cardActiveBorder: 'border-amber-600 ring-2 ring-amber-600/20',
      hex: '#d97706',
      label: 'Jason Cruz • Piña y Banano',
    };
  }

  // Ronnie Flores - Banano (Tema Esmeralda / Verde Banano)
  return {
    color: 'emerald',
    primaryBg: 'bg-emerald-600',
    primaryHoverBg: 'hover:bg-emerald-700',
    primaryText: 'text-emerald-600',
    primaryLightBg: 'bg-emerald-50/70',
    primaryBorder: 'border-emerald-200',
    primaryRing: 'ring-emerald-600/20',
    badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    badgeText: 'text-emerald-800',
    buttonBg: 'bg-emerald-600',
    buttonHoverBg: 'hover:bg-emerald-700',
    cardActiveBorder: 'border-emerald-600 ring-2 ring-emerald-600/20',
    hex: '#059669',
    label: 'Ronnie Flores • Banano',
  };
}
