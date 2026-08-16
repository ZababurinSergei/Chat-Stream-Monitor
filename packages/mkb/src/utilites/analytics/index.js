import Analytics from 'analytics';
import { analyticsPluginMkb } from './analytics-plugin-mkb';

const analytics = Analytics({
  debug: true,
  app: 'mkb-11',
  plugins: [analyticsPluginMkb()],
});

export default analytics;
