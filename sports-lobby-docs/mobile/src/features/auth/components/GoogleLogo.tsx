import React from 'react';
import Svg, { Path } from 'react-native-svg';

export function GoogleLogo({
  size = 24,
}: {
  size?: number;
}): React.JSX.Element {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      accessibilityLabel="Google"
    >
      <Path
        fill="#4285F4"
        d="M23.49 12.28c0-.79-.07-1.55-.2-2.28H12v4.32h6.45a5.52 5.52 0 0 1-2.39 3.62v3.01h3.88c2.27-2.09 3.55-5.17 3.55-8.67Z"
      />
      <Path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.9l-3.88-3.01c-1.08.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.73-4.95h-4v3.1A12 12 0 0 0 12 24Z"
      />
      <Path
        fill="#FBBC05"
        d="M5.27 14.29A7.2 7.2 0 0 1 4.9 12c0-.8.14-1.57.37-2.29v-3.1h-4A12 12 0 0 0 0 12c0 1.93.46 3.75 1.27 5.39l4-3.1Z"
      />
      <Path
        fill="#EA4335"
        d="M12 4.76c1.77 0 3.35.61 4.6 1.8l3.43-3.44A11.55 11.55 0 0 0 12 0 12 12 0 0 0 1.27 6.61l4 3.1C6.22 6.87 8.87 4.76 12 4.76Z"
      />
    </Svg>
  );
}
