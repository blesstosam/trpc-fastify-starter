import { Snowflake } from '@sapphire/snowflake'

const snowflake = new Snowflake(new Date('2025-01-01T00:00:00.000Z'))

export function nextSnowflakeId() {
  return snowflake.generate()
}
