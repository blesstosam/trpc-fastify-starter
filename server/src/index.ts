import { buildApp } from './app'

const app = buildApp()

app.listen({
  host: '0.0.0.0',
  port: 2022,
}).catch((err) => {
  console.error(err)
  process.exit(1)
})
