---
title: 机器人公开课怎么学：从运动学到接触丰富的操作
description: 用三门开放课程组织机器人学习路线，并把每一阶段落到可运行的小项目上。
section: self-study
date: 2026-08-02
tags: [机器人, 公开课, 自学路线]
---

# 公开课推荐


按你说的 **CS 四大＝MIT、Stanford、CMU、Berkeley**，结合你正在做的机械臂画画、GELLO/YAM、UMI、遥操作，我最终建议如下。
## **第一推荐：Berkeley EECS C106A**
**Introduction to Robotics**
这是你现在最应该系统学习的一门。内容包括：
* 刚体位姿、旋转矩阵、指数坐标
* 正运动学与逆运动学
* Jacobian
* 机械臂动力学
* 轨迹与反馈控制
* 相机标定和基础机器视觉
它比 Northwestern Modern Robotics 更像一门正常大学课程：理论、编程、实验和机械臂应用结合得更紧，不只是连续讲公式。([GitHub](https://pages.github.berkeley.edu/EECS-106/fa25-site/about/?utm_source=chatgpt.com))
**建议学习方式：**
先完整学 C106A，但不用严格跟学期节奏。你目前最重要的是依次学：
1. 位姿与坐标变换
2. 正逆运动学
3. Jacobian 与 differential IK
4. 轨迹生成
5. 机械臂动力学
6. 位置控制、重力补偿
7. 相机标定
这些内容会直接解释：
* GELLO 为什么能通过关节角控制 follower
* leader 重力补偿怎么做
* PiPER 末端怎么沿画板运动
* UMI 相机坐标如何转到机器人坐标
* 为什么有时逆运动学突然跳解
**对你而言：四大公开课里的最佳入门课。**

## **第二推荐：MIT 6.4210 / 6.4212 Robotic Manipulation**
这是我认为**最适合你未来半年科研方向**的一门。
它不是从零开始慢慢讲机械臂，而是教你怎样建立一个完整的 manipulation system：
* Drake 仿真
* 坐标系与运动学
* differential IK 与优化
* 点云、配准、几何感知
* 抓取与接触
* 轨迹规划
* 无碰撞运动规划
* task and motion planning
* 模型控制与学习控制
MIT 官方把全部课程材料、讲义和大量作业内容开放出来；2023 年课程还提供公开录像。课程本身也明确表示不要求先学过机器人，只要求线性代数、概率、算法、Python和一些神经网络基础。([机器人操控](https://manipulation.mit.edu/Fall2025/index.html?utm_source=chatgpt.com))
它与你的 UMI、EgoMimic、机械臂画画更接近，因为它关心的不是“算出一个六轴机械臂的 DH 参数”就结束，而是：
相机看见物体之后，机器人如何理解、规划、控制并完成操作。
## **为什么不让你第一门就学它？**
因为它在运动学和控制基础部分走得比较快，而且大量使用 Drake 和优化。如果你还没有形成 Jacobian、逆运动学、动力学的基本直觉，容易变成“会运行 notebook，但不真正理解”。
所以路线应当是：
**Berkeley C106A 基础章节 → MIT Robotic Manipulation**
不必等 C106A 全部学完。学完 Jacobian、IK 和基本控制后，就可以并行进入 MIT。

## **第三推荐：Stanford CS223A**
**Introduction to Robotics**
Stanford CS223A 是传统机械臂理论课程，覆盖：
* 广义坐标
* 刚体变换
* DH 参数
* 正逆运动学
* 动力学
* PID 控制
Stanford Robotics Lab 还给出后续课程：
* **CS225A Experimental Robotics**：控制真实机器人并完成项目
* **CS327A Advanced Robotics**：非线性控制、冗余机械臂、力位混合控制、双臂与多接触控制 ([Computer Science](https://cs.stanford.edu/group/manips/teaching.html?utm_source=chatgpt.com))
这套课程的优点是**机械臂本体理论扎实**。缺点是公开材料的完整性和学习体验通常不如 MIT 那套统一，部分材料也可能依赖校内页面。
因此它更适合当作：
* C106A 的另一种讲法
* 查漏补缺
* 深入理解动力学和控制
* 将来学习力控制、重力补偿和双臂控制
而不是你唯一的主线课程。

## **第四推荐：CMU 16-741 Mechanics of Manipulation**
这是四门里理论最“硬核”的一门，重点不是普通机械臂运动学，而是：
* 机械臂与物体相互作用
* 刚体接触
* 摩擦
* 约束
* 静力学和动力学
* 基于物理的 manipulation planning
* 柔性物体操作
* 动态操作
CMU 当前课程目录仍将它列为研究生级 manipulation 核心课。([课程目录](https://coursecatalog.web.cmu.edu/schools-colleges/schoolofcomputerscience/robotics/?utm_source=chatgpt.com))
它特别适合你未来研究：
* UMI 夹爪为什么能够稳定夹住物体
* 夹紧力和摩擦之间的关系
* 画笔接触画板时的法向力
* 柔性材料、布料或线缆操作
* 为什么纯位置控制在接触任务中容易失败
但它**现在不是第一优先级**。等你掌握运动学、动力学和基本控制后再读，会非常有价值。

## **后续课程：Berkeley EECS C106B**
C106B 是 C106A 的自然后续，内容包括：
* 多指手与抓取
* 接触和力控制
* 多机械臂协同
* 主动感知
* 路径规划
* SLAM
* 非刚体操作
* 部分强化学习和高级机器人研究内容
官方明确把它定位为 C106A/C206A 后续的 advanced robotics 与 manipulation 课程。([加州大学伯克利分校电子工程与计算机科学系](https://www2.eecs.berkeley.edu/Courses/EECSCourseCode.phpC106B/?utm_source=chatgpt.com))
这门课对你未来研究有用，但范围比较广。你不必从头到尾学，可以针对项目选择：
* grasping
* contact / force control
* active perception
* deformable manipulation

# **给你的最终路线**
## **当前阶段**
**主线：Berkeley C106A**
同时继续装机械臂、调 DYNAMIXEL、做 Fusion，不要等学完理论才动手。
## **学完 IK 和 Jacobian 后**
**进入 MIT 6.4210 Robotic Manipulation**
优先看：
1. Manipulation system anatomy
2. Frames
3. Kinematics
4. Differential kinematics via optimization
5. Cameras and point clouds
6. Grasping
7. Motion planning
## **项目遇到具体问题时**
* 遇到动力学、重力补偿、控制：查 Stanford CS223A/225A
* 遇到接触、摩擦、夹持、画笔压力：查 CMU 16-741
* 遇到抓取、力控制、主动感知：查 Berkeley C106B
## **最终排序**
| 排名                  | 课程                  | 你现在的用途              |
|---------------------|---------------------|---------------------|
| 1                   | Berkeley EECS C106A | 建立机械臂基础体系           |
| 2                   | MIT 6.4210/6.4212   | 进入现代机器人操作科研         |
| 3                   | Stanford CS223A     | 深化运动学、动力学与控制        |
| 4                   | CMU 16-741          | 接触、摩擦与操作力学          |
| 5                   | Berkeley C106B      | 按研究方向选学高级章节         |

**只让我给你选一门：Berkeley C106A。**
**只让我给你选一套组合：先 Berkeley C106A，再 MIT Robotic Manipulation。**
这套路线比继续硬啃 Northwestern Modern Robotics 更适合你：你不是为了考试学一套抽象公式，而是需要把真实机械臂、舵机、相机、遥操作、控制和研究论文连接起来。
