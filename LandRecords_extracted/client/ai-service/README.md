# Laya service

The root [README](../../README.md) has the one-file setup, whole-project startup, and troubleshooting steps. Run `install.ps1` from the repository root once, then `start-local.ps1` to start the project. The Laya service is started with the rest of the app.

This folder contains the local inference server and pinned Python requirements. It listens only on `127.0.0.1:8765`; the typed-decision model is advisory and does not approve or reject applications. See the root guide for supported PDF limits and OCR/manual-review behavior.
