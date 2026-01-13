# Prediction SDK

SDK for prediction market trading including Polymarket, Kalshi, Limitless, and more.

## Installation

```bash
npm install prediction-sdk
```

## Usage

```typescript
import { PredictionSDK } from 'prediction-sdk'

const sdk = new PredictionSDK()
// TODO: Add usage examples
```

## Development

```bash
# Install dependencies
bun install

# Build
bun run build

# Watch mode
bun run dev
```

## Publishing

### Manual Publishing

1. Update version in `package.json` (or use `bun run version:patch/minor/major`)
2. Run `bun run build`
3. Run `npm publish` (npm is still used for publishing to npm registry)

### Automated Publishing via GitHub Actions

#### Option 1: Create a Release
1. Go to GitHub repository
2. Create a new release
3. The workflow will automatically publish to npm

#### Option 2: Manual Workflow Dispatch
1. Go to Actions tab
2. Select "Publish to npm" workflow
3. Click "Run workflow"
4. Choose version type (patch/minor/major)
5. The workflow will version, build, and publish

## Setup Instructions

1. **NPM Token Setup**:
   - Go to npmjs.com and create an access token
   - Add it to GitHub repository secrets as `NPM_TOKEN`

2. **Update Repository URL**:
   - Update the `repository.url` in `package.json` with your actual GitHub repository URL

3. **First Publish**:
   ```bash
   npm login  # npm is used for publishing to npm registry
   bun run build
   npm publish
   ```

## License

ISC
