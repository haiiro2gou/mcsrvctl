FROM mcr.microsoft.com/devcontainers/base:ubuntu-24.04

# python3: the base image only has python3-minimal, which lacks the stdlib the Jev hook needs (shlex)
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 \
    && rm -rf /var/lib/apt/lists/*
