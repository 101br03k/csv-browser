#!/bin/bash
docker compose down
docker image rm ghcr.io/101br03k/csv-builder
docker build . -t ghcr.io/101br03k/csv-builder
docker compose up -d
