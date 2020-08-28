export type LoggingConfig = boolean | null
export type ProfilingConfig = boolean | null

export interface WindowConfig {
  width: number
  height: number
}

export interface ApplicationConfig {
  window: WindowConfig
  logging: LoggingConfig
  profiling: ProfilingConfig
}

const config: ApplicationConfig = {
  window: {
    width: parseInt(process.env.APP_WINDOW_WIDTH || '1600'),
    height: parseInt(process.env.APP_WINDOW_HEIGHT || '900')
  },
  logging: (/true/i).test(process.env.APP_LOGGING || 'true'), //returns true
  profiling: (/true/i).test(process.env.APP_PROFILING || 'false')
}

export default config
