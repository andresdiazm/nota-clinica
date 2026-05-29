# Foco Clinico

PWA mobile-first para capturar y seguir casos hospitalizados identificados exclusivamente por cama.

## Instalacion

```bash
npm install
Copy-Item .env.example .env
npm run db:init
npm run dev
```

La app queda disponible en `http://localhost:3000`.

## Variables de entorno

```bash
DATABASE_URL="file:./dev.db"
OPENAI_API_KEY=""
```

Si `OPENAI_API_KEY` esta vacia, `/api/transcribe` usa modo mock. Si existe, envia el audio temporal al endpoint de transcripcion de OpenAI desde el backend.

## Comandos

```bash
npm run dev
npm run build
npm run lint
npm run db:init
npm run prisma:studio
```

## Flujo de uso

1. Abrir la bandeja y crear un caso nuevo.
2. Ingresar cama obligatoria, por ejemplo `601-2`, `UTI-7` o `NEO 3`.
3. Grabar una nota breve sin datos identificatorios.
4. Revisar y editar la transcripcion antes de guardar.
5. Buscar por cama, cambiar estado, archivar o eliminar casos.

## Advertencias de privacidad

- No registrar nombre, RUT, diagnostico, tratamiento ni evolucion clinica.
- No usar esta app como ficha clinica paralela.
- El audio no se guarda en base de datos y se descarta luego de transcribir.
- La app marca posibles datos sensibles si detecta terminos como `RUT`, `se llama`, `don`, `dona`, `doña`, `paciente llamado` o numeros largos.

## Proximos pasos recomendados

- Agregar autenticacion institucional y completar `createdBy`/`actor`.
- Migrar SQLite a PostgreSQL o Supabase manteniendo Prisma.
- Afinar reglas locales de privacidad con el equipo juridico/clinico.
- Agregar pruebas automatizadas de API y componentes criticos.
