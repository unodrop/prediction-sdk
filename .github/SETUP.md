# GitHub Actions 发布设置指南

## npm 发布认证问题解决

如果遇到 `403 Forbidden - Two-factor authentication or granular access token with bypass 2fa enabled is required` 错误，请按照以下步骤操作：

## 步骤 1: 创建 npm Automation Token

1. **登录 npm 账户**
   - 访问 https://www.npmjs.com/
   - 登录你的账户

2. **创建 Automation Token**
   - 访问：https://www.npmjs.com/settings/YOUR_USERNAME/tokens
   - 将 `YOUR_USERNAME` 替换为你的 npm 用户名
   - 点击 "Generate New Token" 按钮
   - **重要**：选择 "Automation" 类型（不是 "Classic Token"）
     - Automation token 专门用于 CI/CD，可以绕过 2FA 要求
     - 这是 npm 推荐的用于自动化发布的方式
   - 点击 "Generate Token"
   - **立即复制 token**（只显示一次！）

## 步骤 2: 添加到 GitHub Secrets

1. **进入 GitHub 仓库设置**
   - 打开你的仓库页面
   - 点击 "Settings" 标签

2. **添加 Secret**
   - 在左侧菜单找到 "Secrets and variables" → "Actions"
   - 点击 "New repository secret" 按钮
   - Name: `NPM_TOKEN`（必须完全一致，包括大小写）
   - Value: 粘贴刚才复制的 npm token
   - 点击 "Add secret"

## 步骤 3: 验证设置

1. **检查 Secret 是否存在**
   - 在 Secrets 列表中应该能看到 `NPM_TOKEN`
   - 确保名称完全匹配（区分大小写）

2. **测试发布**
   - 可以通过创建 GitHub Release 来触发自动发布
   - 或者在 Actions 中手动运行 "Publish to npm" 工作流

## 常见问题

### Q: 为什么必须使用 Automation Token？
A: npm 现在要求所有发布操作都需要 2FA 或 Automation token。Automation token 是专门为 CI/CD 设计的，可以绕过 2FA 要求，更安全且方便。

### Q: 我创建了 Classic Token 但还是报错？
A: Classic Token 需要账户启用 2FA。如果不想启用 2FA，请使用 Automation Token。

### Q: 如何检查我的 npm 账户是否启用了 2FA？
A: 访问 https://www.npmjs.com/settings/YOUR_USERNAME/profile，查看 "Two-Factor Authentication" 部分。

### Q: Secret 名称必须完全一致吗？
A: 是的，工作流中使用的是 `NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}`，所以 Secret 名称必须是 `NPM_TOKEN`。

## 手动发布（本地）

如果你想在本地手动发布：

```bash
# 1. 登录 npm（需要启用 2FA 或使用 Classic Token）
npm login

# 2. 构建项目
bun run build

# 3. 发布
npm publish
```

注意：本地发布需要你的 npm 账户启用 2FA，或者使用 `npm login` 登录。
