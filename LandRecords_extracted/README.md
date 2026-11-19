# Land Records Blockchain

A Windows-first land-records demo built with Next.js, MongoDB, Node.js and Hyperledger Fabric. The installer sets up the project and the local Laya review model. You only need to run two scripts.

## Quick start

Requirements: Windows 10/11, internet access, and permission to install software. The installer can install Node.js, Python, Git, and Docker Desktop with `winget` if they are missing. Docker Desktop must be able to run Linux containers.

Open PowerShell in this folder and run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\install.ps1
```

The first install downloads Node packages, Fabric tools, Python packages, and the Laya checkpoint (about 843 MB). It can take a while. If Docker Desktop asks for a restart, restart Windows, open PowerShell here again, and rerun `powershell -NoProfile -ExecutionPolicy Bypass -File .\install.ps1`.

When install finishes, start the whole project with:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\start-local.ps1
```

Open **http://localhost:3000** yourself. The script does not open a browser. Stop the project with:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\stop-local.ps1
```

The stop script keeps Docker volumes and MongoDB data.

## What the scripts do

- `install.ps1` checks/installs system tools, installs all three Node projects, creates the local Laya Python environment, downloads the pinned model, and creates local environment files only when they are missing.
- On a brand-new machine, it initializes the Fabric network once. If it finds existing Fabric containers, network, or peer/orderer volumes, it keeps them and skips the reset/setup step.
- `start-local.ps1` starts Fabric, local MongoDB when configured, the Fabric API, Laya, and the Next.js app. Services run in the background; logs are in `client/.local/logs/`.
- `stop-local.ps1` stops those services without deleting ledger or database data.

Existing `client/.env.local` and `fabric-api/.env` files are never overwritten. On first setup, the client gets a local MongoDB default and Fabric API gets its project template. MongoDB runs in Docker. Pinata and SMTP are optional for local development; add credentials to `client/.env.local` when you want real IPFS storage or email delivery.

## Local addresses

| Service | Address |
| --- | --- |
| Web app | http://localhost:3000 |
| Fabric API health | http://localhost:3001/health |
| Laya health | http://127.0.0.1:8765/health |
| MongoDB | mongodb://127.0.0.1:27017/elandrecords |

## Laya review

The app uses the pinned `convaiinnovations/laya-typed-decisions` System 1 checkpoint through `laya==0.4.37`. Inference runs locally on CPU and is offline after the model download. It supports advisory document screening, clerk triage, and survey-report consistency checks. It never approves/rejects an application or changes the Fabric workflow.

PDF screening accepts searchable PDFs up to 10 MB and 8 pages. Scanned/image-only PDFs are sent to human review; this setup does not include a separate OCR engine. The UI displays the model result and raw score with an uncalibrated-score warning. Staff can escalate a case without changing its current workflow stage.

## If something does not start

- **Docker error:** open Docker Desktop, wait until it says it is running, then rerun `powershell -NoProfile -ExecutionPolicy Bypass -File .\start-local.ps1`.
- **Database error:** check that the `landrecords-mongodb` container is running, or verify `MONGODB_URI` in `client/.env.local`.
- **API/web/model error:** read the matching `.log` file in `client/.local/logs/`.
- **Install interrupted:** rerun `powershell -NoProfile -ExecutionPolicy Bypass -File .\install.ps1`; it keeps existing environment files and reuses downloaded packages/model files.

For project internals, see `PROJECT_GUIDE.md`. Do not commit `.env.local`, `.env`, model files, logs, or local databases.
