---
title: "调试环境速查：SSH、ROS2 日志与看门狗"
description: "板载设备常用调试命令合集：连接、日志分级查看、串口抓帧，以及部署文件清单和看门狗机制"
section: drone
date: 2026-06-10
tags: [无人机, ROS2, 调试记录]
---

## 连接板子

```bash
ssh sunrise@172.20.10.2       # 热点直连
ssh sunrise@192.168.1.100     # 局域网
ssh -X sunrise@172.20.10.2    # 需要转发图形界面时
```

## 环境准备

每次跑 ROS2 相关命令前先 source 好环境：

```bash
source /opt/ros/humble/setup.bash && source /home/sunrise/project/install/setup.bash
```

## 常用调试命令

启动视觉识别节点（可指定模型路径）：

```bash
ros2 run camera mission_vision --ros-args \
  -p image_topic:=/image \
  -p cls_model_path:=/home/sunrise/project/camera/resource/cifar100_cls.onnx \
  -p cls_names_path:=/home/sunrise/project/camera/resource/cifar100_names.txt \
  -p show:=true
```

看画面 / 单独跑视觉识别：

```bash
python3 /home/sunrise/project/mjpeg_view.py
python3 /home/sunrise/project/standalone_vision.py
```

## 按模块分类看日志

```bash
tail -f /tmp/flight_logs/mission_vision.log   # 视觉识别（QR + 分类结果）
tail -f /tmp/flight_logs/task_sm.log          # 任务状态机（状态变化、匹配结果）
tail -f /tmp/flight_logs/fc_bridge.log        # 飞控串口（发出去的每一帧 hex）
tail -f /tmp/flight_logs/uart.log             # 串口通信（收到飞控的高度/IMU）
tail -f /tmp/flight_logs/bridge.log           # 桥接节点
tail -f /tmp/flight_logs/usb_cam.log          # 摄像头
tail -f /tmp/flight_logs/startup.log          # 启动流程（各节点是否正常拉起）

# 只看飞控命令相关的行
tail -f /tmp/flight_logs/fc_bridge.log | grep "飞控命令"
tail -f /tmp/flight_logs/fc_bridge.log | grep "位置帧"
```

## 串口原始帧抓取

配合[串口通信协议](/drone/serial-protocol)对照着看最直接：

```bash
cat /dev/ttyFC | xxd
# 或者更清晰的逐行输出
stdbuf -oL xxd /dev/ttyFC
# 只看识别命令帧（AA FF 01 开头）
stdbuf -oL xxd /dev/ttyFC | grep "aa ff 01"
```

## 舵机测试

```bash
python3 ~/servo_test.py
python3 ~/servo_sweep.py
```

## 杀掉卡死的串口节点

```bash
pkill -f "ros2 run communication uart"
```

## 部署文件清单

传到板子上跑起来最少需要这几个文件：

| 文件 | 板子上的路径 |
|------|--------------|
| `fc_bridge.py` | `/home/sunrise/project/main/main/fc_bridge.py` |
| `start_all.sh` | `/home/sunrise/project/start_all.sh` |
| `watchdog.sh` | `/home/sunrise/project/watchdog.sh` |

## 看门狗机制

```bash
cat /tmp/flight_logs/health.log       # 看节点状态快照
tail -f /tmp/flight_logs/watchdog.log # 实时看 watchdog 告警
```

`health.log` 每 5 秒更新一次。`fc_bridge` 崩了会被 watchdog 自动重启；其他节点崩了只打警告、不自动重启——这是故意的，防止有状态的节点重启后丢失当前任务进度（比如已经识别过几个靶子）。
