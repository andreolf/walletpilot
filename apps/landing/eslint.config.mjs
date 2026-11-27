import nextVitals from 'eslint-config-next/core-web-vitals';

const eslintConfig = [
  ...nextVitals,
  {
    rules: {
      'react/no-unescaped-entities': 'off',
    },
  },
  {
    ignores: ['.next/**', 'next-env.d.ts'],
  },
];

export default eslintConfig;
