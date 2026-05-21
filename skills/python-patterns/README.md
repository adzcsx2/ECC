# /ecc:python-patterns

Python 惯用模式速查，涵盖类型提示、错误处理、上下文管理器、数据类、装饰器和并发编程。

---

## 功能

- 核心原则：可读性优先、显式优于隐式、EAFP 风格
- 现代类型提示：Python 3.9+ 内建泛型、TypeVar、Protocol 鸭子类型
- 上下文管理器（with 语句）、数据类和命名元组
- 装饰器模式（函数装饰器、参数化装饰器、类装饰器）
- 并发模式：ThreadPoolExecutor、ProcessPoolExecutor、asyncio
- 反模式：可变默认参数、裸 except、from module import * 等

## 用法

- `/ecc:python-patterns` - 编写、审查或重构 Python 代码时参考
- 搭配 `python-reviewer` 代理进行代码审查

## 适用场景

- 编写新的 Python 代码时参考惯用写法
- 审查 Python 代码质量
- 重构现有 Python 代码
- 设计 Python 包/模块结构

> 源文件：[SKILL.md](SKILL.md)
