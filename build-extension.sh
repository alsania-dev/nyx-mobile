#!/bin/bash
# Quick build script for Nyx Control extension

cd /home/sigma/Desktop/insidedev/sigma-lab/nyx-control-hub

echo "Building Nyx Control extension..."

# Run the build
pnpm build

# Check if build succeeded
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"

    # Copy addons to the build
    echo "Copying addons to build..."
    mkdir -p dist/addons
    cp addons/*.js dist/addons/ 2>/dev/null || echo "No addons to copy"

    echo ""
    echo "✅ Extension built to: dist/"
    echo "✅ Addons included in: dist/addons/"
    echo ""
    echo "To load the extension in Chrome:"
    echo "1. Open chrome://extensions/"
    echo "2. Enable Developer mode"
    echo "3. Click 'Load unpacked'"
    echo "4. Select: $(pwd)/Nyx-Control"
else
    echo "❌ Build failed. Check the error messages above."
    exit 1
fi
