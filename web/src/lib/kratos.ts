import { Configuration, FrontendApi } from '@ory/client';

const kratosUrl = import.meta.env.VITE_KRATOS_URL || 'http://localhost:4433';

const kratosConfig = new Configuration({
  basePath: kratosUrl,
  baseOptions: {
    withCredentials: true,
  },
});

export const kratos = new FrontendApi(kratosConfig);
