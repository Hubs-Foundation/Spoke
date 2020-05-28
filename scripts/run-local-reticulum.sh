#!/usr/bin/env bash
NODE_TLS_REJECT_UNAUTHORIZED=0 ROUTER_BASE_PATH=/spoke BASE_ASSETS_PATH=https://localhost:9090/ CLIENT_ADDRESS=localhost:4000 API_SERVER_ADDRESS=localhost:4000 yarn start
