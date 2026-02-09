import antfu from '@antfu/eslint-config'

export default antfu(
  {
    ignores: [
      '**/*.md',
      '**/*.json',
      '**/*.yml',
      '**/*.yaml',
      'server/src/generated/**/*.ts',
      'playwright.config.ts',
    ],
  },

  {
    rules: {
      /**
       * 不能打开这条规则
       * 因为装饰器被识别为了类型 导致import加了type前缀
       */
      'ts/consistent-type-imports': 'off',
      'test/prefer-lowercase-title': 'off',
      // 'no-console': 'off',
      'ts/ban-ts-comment': 'off',
      'node/prefer-global/process': 'off',
    },
  },
)
