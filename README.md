# Prediction SDK

SDK for prediction market trading including Polymarket, Kalshi, Limitless, and more.

## 安装

```bash
npm install prediction-sdk
```

## 使用教程

### Polymarket

#### 1. 初始化客户端

```typescript
import Polymarket from 'prediction-sdk'

const polymarket = new Polymarket({
  rpcUrl: 'https://polygon-rpc.com',  // Polygon RPC 端点
  privateKey: '0x...',                 // 你的私钥
})
```

#### 2. 创建客户端连接

```typescript
await polymarket.createClient()
```

#### 3. 授权交易（首次使用需要）

在交易前，需要授权 Polymarket 交易所管理你的代币：

```typescript
// 检查是否已授权
const isApproved = await polymarket.isApproved()

if (!isApproved) {
  // 授权交易所管理所有代币
  await polymarket.approvalAll()
}
```

#### 4. 提交订单

```typescript
import { UserMarketOrder } from '@polymarket/clob-client'

const order: UserMarketOrder = {
  market: '0x...',           // 市场合约地址
  side: 'YES',               // 'YES' 或 'NO'
  size: '1000000000',        // 订单数量（原始单位）
  price: '0.5',              // 价格（0-1之间）
}

await polymarket.postOrder(order)
```

#### 完整示例

```typescript
import Polymarket from 'prediction-sdk'

async function trade() {
  // 1. 初始化
  const polymarket = new Polymarket({
    rpcUrl: 'https://polygon-rpc.com',
    privateKey: process.env.PRIVATE_KEY!,
  })

  // 2. 创建客户端
  await polymarket.createClient()

  // 3. 检查并授权
  if (!(await polymarket.isApproved())) {
    await polymarket.approvalAll()
  }

  // 4. 提交订单
  await polymarket.postOrder({
    market: '0x...',
    side: 'YES',
    size: '1000000000',
    price: '0.5',
  })
}
```

### 工具函数

#### 格式化金额

```typescript
import { formatClobAmount } from 'prediction-sdk'

// 将原始金额转换为可读格式
const amount = formatClobAmount('1000000', 6)  // "1.0" (USDC)
```

#### 检查是否为 Gnosis Safe

```typescript
import { isGnosisSafe } from 'prediction-sdk'

const isSafe = await isGnosisSafe('0x...', 'https://polygon-rpc.com')
```

## 开发

```bash
# 安装依赖
bun install

# 构建
bun run build

# 开发模式（监听文件变化）
bun run dev
```

## License

ISC
