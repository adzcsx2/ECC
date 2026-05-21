# /ecc:springboot-patterns

Spring Boot 架构模式：REST API、分层服务、数据访问、缓存、异步处理。

---

## 功能

- REST API 结构：Controller -> Service -> Repository 分层，DTO 与验证
- Spring Data JPA：自定义查询、分页与排序
- 全局异常处理：@ControllerAdvice 统一处理验证、权限和通用异常
- 缓存：@Cacheable/@CacheEvict 注解式缓存，需 @EnableCaching
- 异步处理：@Async 异步服务，需 @EnableAsync
- 中间件与过滤器：请求日志、速率限制（Bucket4j）、重试机制
- 生产环境默认配置：构造器注入、Problem Details、HikariCP、只读事务

## 用法

- `/ecc:springboot-patterns` - 进行 Java Spring Boot 后端开发时激活

## 适用场景

- 使用 Spring MVC 或 WebFlux 构建 REST API
- 搭建 Controller -> Service -> Repository 分层架构
- 配置 Spring Data JPA、缓存或异步处理
- 实现验证、异常处理或分页
- 设置 dev/staging/production 多环境 Profile

> 源文件：[SKILL.md](SKILL.md)
