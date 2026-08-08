#!/bin/bash
# Build script for Nyx Control extension to Nyx-Control

echo "Building Nyx Control extension to /home/sigma/Extensions/Nyx-Control"

# Ensure the target directory exists
mkdir -p /home/sigma/Extensions/Nyx-Control

# Run the build
pnpm build

# Copy any additional files needed (public assets, etc.)
if [ -d "chrome-extension/public" ]; then
  echo "Copying public assets..."
  cp -r chrome-extension/public/* /home/sigma/Extensions/Nyx-Control/ 2>/dev/null || true
fi

# Copy the manifest if not already generated
if [ -f "chrome-extension/manifest.ts" ]; then
  echo "Manifest will be generated during build"
fi

echo "Build complete! Extension is at /home/sigma/Extensions/Nyx-Control"
