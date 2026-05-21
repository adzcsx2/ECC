# /ecc:pytorch-patterns

PyTorch 深度学习最佳实践速查，涵盖设备无关代码、可复现训练、模型架构、数据管道和性能优化。

---

## 功能

- 设备无关代码模式（CPU/GPU 自适应）
- 可复现性设置（随机种子、deterministic 模式）
- 模型架构模式：clean nn.Module、权重初始化
- 标准训练循环：混合精度训练、梯度裁剪、验证循环
- 数据管道：自定义 Dataset、DataLoader 优化配置、变长数据 collate
- 性能优化：AMP 混合精度、gradient checkpointing、torch.compile
- 反模式：忘记 model.eval()、in-place 操作破坏 autograd、.item() 在 backward 前调用

## 用法

- `/ecc:pytorch-patterns` - 编写 PyTorch 模型、调试训练循环或优化 GPU 内存时参考

## 适用场景

- 编写新的 PyTorch 模型或训练脚本
- 审查深度学习代码
- 调试训练循环或数据管道
- 优化 GPU 内存使用或训练速度
- 设置可复现实验

> 源文件：[SKILL.md](SKILL.md)
