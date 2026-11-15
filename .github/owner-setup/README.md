# 只需账户本人处理的 GitHub 设置

本次网站修改已经获得授权；这里剩下的是 GitHub 认证和权限边界。当前集成令牌的管理接口返回 403，账户接口也不返回 2FA 状态，无法据此断言账号未开启 2FA。

## 双重验证

打开 https://github.com/settings/security ，确认开启 TOTP、通行密钥或安全密钥等受支持方式，并把恢复码存入你自己的密码管理器。不要把密码、二维码密钥、验证码或恢复码发给聊天助手。

官方步骤：https://docs.github.com/en/authentication/securing-your-account-with-two-factor-authentication-2fa/configuring-two-factor-authentication

## 主分支保护

已准备 main-protection.json 和 apply-main-protection.sh。用你自己的、具备仓库管理权限的 GitHub CLI 登录后，在此目录执行：

```sh
bash apply-main-protection.sh --apply
```

脚本先核对账号，然后设置 main 分支：要求已验证的 GitHub Actions validate 检查、禁止强制推送及删除、对管理员生效、保持线性历史。它不会读取或保存任何认证秘密。启用后，后续修改应走分支和 PR，让检查先通过再合并；不会再直接推送未经检查的新提交到 main。

如果当前 CLI 登录没有 Administration: write 权限，GitHub 仍会拒绝。请在本人电脑通过 gh auth login 使用自己的授权会话，或在仓库 Settings → Branches 中设置。不要为了运行脚本公开访问令牌。
