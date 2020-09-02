export type LoggingConfig = boolean | null
export type ProfilingConfig = boolean | null

export interface ElectronConfig {
  width: number
  height: number
}

export interface ApplicationConfig {
  electron: ElectronConfig
  logging: LoggingConfig
  profiling: ProfilingConfig
  oauthClient: OAuthClientConfig
}

export interface OAuthClientConfig {
  openIdConnectUrl: string
  clientId: string
  redirectUri: string
  scope: string
}

const config: ApplicationConfig = {
  electron: {
    width: parseInt(process.env.APP_WINDOW_WIDTH || '1600'),
    height: parseInt(process.env.APP_WINDOW_HEIGHT || '900')
  },
  logging: (/true/i).test(process.env.APP_LOGGING || 'true'),
  profiling: (/true/i).test(process.env.APP_PROFILING || 'false'),
  oauthClient: {
    openIdConnectUrl: process.env.APP_OAUTH_OPENID_CONNECT_URL as string || 'https://demo.identityserver.io/',
    clientId: process.env.APP_OAUTH_CLIENT_ID as string || 'interactive.public',
    redirectUri: process.env.APP_OAUTH_REDIRECT_URL as string || 'http://localhost:8000',
    scope: process.env.APP_OAUTH_SCOPE as string || 'openid profile email api offline_access',
  }
}

export default config
