import { useMemo } from 'react';
import { SvgXml } from 'react-native-svg';
import { SVG, type SvgName } from '@/theme/svg';

type IconProps = {
  name: SvgName;
  size: number;
  /** Verilirse çizimdeki `currentColor`, `#25C300` ve `#005003` bu renge çevrilir (tek renkli ikonlar için). */
  color?: string;
};

export function Icon({ name, size, color }: IconProps) {
  const xml = useMemo(() => {
    const raw: string = SVG[name];
    return color ? raw.replace(/currentColor|#25C300|#005003/g, color) : raw;
  }, [name, color]);
  return <SvgXml xml={xml} width={size} height={size} />;
}
