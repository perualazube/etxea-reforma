# Servidor de EtxeBerriAI (proxy de Gemini con créditos y lista de espera)

Guarda la clave de Google Gemini en el servidor y cobra créditos por cada generación, para que los usuarios
solo necesiten un código de acceso. Es un Cloudflare Worker; el plan gratuito basta para la beta.

| Llamada | Coste |
| --- | --- |
| Foto (`response_format.type = image`) | 1 crédito |
| Vídeo (`response_format.type = video`) | 10 créditos |
| Texto y diseño | 0 |

Si Google devuelve error, el crédito se devuelve.

## Publicación automática (recomendada)

El workflow `.github/workflows/servidor.yml` lo publica en cada cambio de `server/` en `main` (o a mano desde la pestaña Actions).
Solo hacen falta tres secretos del repositorio (Settings → Secrets and variables → Actions):
`CLOUDFLARE_API_TOKEN` (plantilla «Edit Cloudflare Workers»), `CLOUDFLARE_ACCOUNT_ID` y `GEMINI_KEY`.
La primera vez crea la base de datos de códigos (`etxeberriai-codes`). La dirección del servidor aparece en el resumen de la ejecución.

## Lista de espera

`POST /waitlist` con `{"email", "consent": true, "profile", "source"}` guarda `wait:<email>` en KV. Para verlas:
`npx wrangler kv key list --binding CODES --prefix wait: --remote`

## Puesta en marcha a mano

1. Crear una cuenta gratuita en Cloudflare.
2. `cd server && npx wrangler login`
3. `npx wrangler kv namespace create CODES` y copiar el `id` en `wrangler.toml`.
4. `npx wrangler secret put GEMINI_KEY` y pegar la clave de Gemini (con facturación activada).
5. `npx wrangler deploy` → da una dirección tipo `https://etxea-api.<cuenta>.workers.dev`.

## Dar un código de acceso

```sh
npx wrangler kv key put --binding CODES "code:PRUEBA-ANA-7Q2" '{"name":"Ana","credits":30}' --remote
```

En la app: Ajustes → Google Gemini → «Usar el servidor de Etxea», poner la dirección del Worker y pegar el código en «Clave de API».

## Pruebas

`node --test server/worker.test.mjs`

## Límites conocidos

- Los créditos están en KV, que no es transaccional: dos peticiones a la vez pueden gastar un crédito de menos. Vale para una beta cerrada; antes de abrir registros pasan a una base de datos (Supabase o D1) junto con las cuentas y los pagos.
