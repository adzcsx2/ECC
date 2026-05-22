# /ecc:x-api

X/Twitter API 集成：发推、读时间线、搜索、媒体上传与分析。

---

## 功能

- OAuth 2.0 Bearer Token 读取 / OAuth 1.0a 写入双认证
- 核心操作：发推、发主题串、读取用户时间线、搜索推文
- 媒体上传（v1.1 端点）组合发推
- 速率限制运行时检测与自动退避
- 与 content-engine/brand-voice 技能联动内容生产

## 用法

- `/ecc:x-api` - 通过 X API 编程化发推与搜索

## 适用场景

- 编程化发布推文或主题串
- 构建 X 机器人或集成
- 拉取推文数据进行语音风格建模

> 源文件：[SKILL.md](SKILL.md)
