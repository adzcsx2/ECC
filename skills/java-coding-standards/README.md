# /ecc:java-coding-standards

Spring Boot 和 Quarkus 项目的 Java 编码规范，自动识别框架并应用对应约定。

---

## 功能

- 自动检测项目框架（Spring Boot / Quarkus）并应用对应的命名、注入、测试约定
- 强制不可变性（records、final 字段）、Optional 正确使用、streams 最佳实践
- 标准化异常处理模式（Spring 用 @RestControllerAdvice、Quarkus 用 ExceptionMapper）
- 定义项目结构规范（controller vs resource、config vs ConfigMapping）
- 覆盖日志、配置、null 处理、测试策略等全面编码标准

## 用法

- `/ecc:java-coding-standards` - 编写或审查 Java 代码时自动应用框架特定的编码规范

## 适用场景

- 编写或审查 Spring Boot 或 Quarkus 项目的 Java 代码
- 强制执行命名、不可变性、异常处理等约定
- 使用 Java 17+ 特性（records、sealed classes、pattern matching）
- 审查 Optional、streams、泛型的使用

> 源文件：[SKILL.md](SKILL.md)
