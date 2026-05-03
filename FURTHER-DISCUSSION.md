# Further Discussion

## 1. Zero-cost hosting for dev, staging, and production

### What is feasible

This project can support separate `dev`, `stage`, and `prod` environments.

- `dev` can run locally with the existing `docker-compose.yml` and Spring profiles.
- `stage` can be created as a low-cost or temporary preview environment from pull requests.
- `prod` should be treated separately because this project includes OCR, PDF generation, file storage, email delivery, and scheduled jobs.

### Recommendation

A realistic zero-cost approach is:

- `dev`: local Docker-based environment
- `stage`: free preview/static deployment for the frontend plus a temporary backend instance
- `prod`: move to a paid environment when OCR and scheduler reliability become important

The current codebase is already structured for environment separation:

- Spring profiles: `application.yml`, `application-dev.yml`, `application-prod.yml`
- Frontend/backend split
- pluggable storage and email configuration
- schedulers already isolated by configuration

### Current platform notes

- Vercel Hobby currently supports hobby deployments and preview workflows, but it is best suited to the frontend, not the Java OCR backend. Source: [Vercel limits](https://vercel.com/docs/limits)
- Netlify supports deploy previews for pull requests, which is useful for frontend staging. Source: [Netlify Deploy Previews](https://docs.netlify.com/site-deploys/deploy-previews/)
- Render currently offers free services for testing and hobby usage, but explicitly says they should not be used for production. Source: [Render free instances](https://render.com/docs/free)

### Conclusion

`dev` and a lightweight `stage` can be done without cost. A serious `prod` setup for this project should not rely on a fully free stack.

---

## 2. Managing three agents in one project

### Proposed structure

If the system is split into:

1. Frontend
2. Java backend
3. Python image-processing backend

they can still live in a single monorepo.

Suggested folder structure:

- `frontend/`
- `backend-java/`
- `backend-python/`
- `infra/`

### How to control them

Each agent should work only in its own scoped paths and open its own pull request.

Recommended controls:

- branch-per-agent workflow
- path-based ownership rules with `CODEOWNERS`
- GitHub Actions checks triggered only for changed paths
- protected branches so nothing merges without passing checks

### Remote coordination

You can control this remotely through:

- GitHub pull requests
- GitHub Actions
- GitHub Projects or Linear/Jira for work tracking
- separate CI pipelines per service

### Practical rule

Do not let all three agents write everywhere. Each one should have:

- a clear directory boundary
- its own test workflow
- its own PR

That is the minimum structure needed to keep parallel work safe.

---

## 3. Do you need Argo CD? Can Supabase cover this?

### Short answer

If you end up with at least three independently deployed services, a GitOps/deployment control layer becomes valuable. Argo CD is one valid option, but only if you are deploying on Kubernetes.

### What Supabase can do

Supabase can help with:

- PostgreSQL
- authentication
- file storage
- scheduled database jobs with Cron
- Edge Functions
- branching for staging/preview database environments

Sources:

- [Supabase Cron](https://supabase.com/docs/guides/cron)
- [Supabase Branching](https://supabase.com/docs/guides/deployment/branching)
- [Supabase Deployment & Branching](https://supabase.com/docs/guides/deployment)
- [Scheduling Edge Functions](https://supabase.com/docs/guides/functions/schedule-functions)

### What Supabase does not replace

Supabase is not a deployment orchestrator for:

- a Java backend service
- a Python image-processing service
- a frontend service with independent release cycles

It can replace some infrastructure pieces, but it does not replace Argo CD for multi-service rollout control.

### Conclusion

- If you stay on simple PaaS hosting, use GitHub Actions plus per-service deployments.
- If you move to Kubernetes, Argo CD becomes a strong fit.
- Supabase can be one part of the stack, but not the full service orchestration layer.

---

## 4. Can Getir, Yemeksepeti, or Migros invoices be pulled automatically?

### What is feasible in principle

This is technically possible only if at least one of the following exists:

- an official public API
- a partner integration API
- invoice emails that can be ingested from a mailbox
- a legal and stable automation path approved by the provider

### What is not yet defined

This repository does not currently contain:

- third-party marketplace integrations
- credential vaulting for external consumer accounts
- webhook receivers for provider-specific invoice events
- consent, legal, or security handling for stored third-party login sessions

### Product and security concerns

If you store credentials for external systems inside Settings, you would need:

- encrypted secret storage
- credential rotation rules
- provider-specific session handling
- re-authentication flows
- audit logging
- clear legal review for scraping or automation

### Recommendation

The safer first version is not direct credential-based scraping. A better first step would be:

- import forwarded invoice emails
- upload PDFs automatically from a connected mailbox
- parse attached receipts using the existing OCR/document pipeline

### Conclusion

This feature is not ready to implement from the current codebase without provider-specific validation. It should stay in discovery until API availability and legal constraints are confirmed.

---

## 5. Can the scheduler service be deployed separately?

### Yes

This is feasible and is a good architectural option once the system grows.

### Why it makes sense

The current project already contains scheduler responsibilities that are logically separate:

- exchange rate refresh
- monthly summary email
- monthly PDF report email
- recurring expense/income generation

Those can be moved into a dedicated worker service later.

### Recommended future split

- `frontend`: UI only
- `api-service`: authentication, CRUD, reporting, document metadata
- `worker-service`: OCR jobs, scheduled jobs, email sending, PDF compilation
- optional `image-service`: Python-based extraction pipeline

### Benefits

- scheduler failures do not affect the API directly
- deployments can happen independently
- background jobs can scale separately
- OCR/image-processing workloads can be isolated from user-facing traffic

### Conclusion

Yes, the scheduler can and probably should become its own deployable worker once the Python processing service is introduced.
