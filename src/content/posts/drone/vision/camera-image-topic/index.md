---
title: "摄像头取流踩坑记：为什么不能直接开 /dev/video0"
description: "板载摄像头被 ROS2 节点独占，正确的抓图方式是订阅 /image 话题的 CompressedImage"
section: drone
date: 2026-05-30
tags: [无人机, ROS2, 调试记录]
---

## 现象：直接开摄像头设备不行

一开始想直接读 `/dev/video0` 抓图，但这个设备节点在系统上永远被 `hobot_usb_cam` 占着，根本打不开。

## 排查：追踪整条相机链路

SSH 上板子看看跑了什么进程（`ps aux | grep -E 'ros|hobot|camera'`），再看开机自启动脚本 `auto_flight_cpp.launch.py` 的内容，链路就清楚了：

```
/dev/video0
    ↓
hobot_usb_cam 节点（独占硬件）
    ↓ 发布
/image 话题（CompressedImage，1280×720 MJPEG，30fps）
    ↓ 订阅
mission_vision 节点（YOLO11 目标检测 + 二维码识别）
    ↓
mission_task 节点
    ↓
fc_bridge → 飞控串口
```

摄像头被占用是设计如此，不是 bug：开机自启动的任务链路里，`hobot_usb_cam` 节点独占 `/dev/video0`，把画面发布到 ROS2 话题，下游所有节点都应该走话题订阅，而不是直接抢设备。

## 正确方案：订阅 /image 话题

结论就一句话：**订阅 `/image` 话题（`CompressedImage` 类型），不要碰 `/dev/video0`。**

```python
import rclpy
from rclpy.node import Node
from sensor_msgs.msg import CompressedImage
import cv2
import numpy as np

class GrabOne(Node):
    def __init__(self):
        super().__init__('grab_one')
        self.done = False
        self.sub = self.create_subscription(CompressedImage, '/image', self.cb, 1)

    def cb(self, msg):
        if self.done:
            return
        self.done = True
        arr = np.frombuffer(msg.data, np.uint8)
        frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        cv2.imwrite('/tmp/capture.jpg', frame)

rclpy.init()
node = GrabOne()
import time; t = time.time()
while not node.done and time.time() - t < 10:
    rclpy.spin_once(node, timeout_sec=0.1)
node.destroy_node()
rclpy.shutdown()
```

运行前需要 source 好 ROS2 环境：

```bash
source /opt/ros/humble/setup.bash
source /home/sunrise/project/install/setup.bash
python3 grab.py
```

## 关键参数速查

| 项目 | 值 |
|------|-----|
| 话题 | `/image` |
| 消息类型 | `sensor_msgs/msg/CompressedImage` |
| 分辨率 | 1280 × 720 |
| 格式 | MJPEG |
| 帧率 | 30fps |
| 解码方式 | `np.frombuffer` + `cv2.imdecode` |

`video1` 是 UVC 的元数据通道，没用。以后调试视觉或抓图都走 `/image`，不用再折腾别的方式了。脚本存了两份：本地 `/Users/limit/Desktop/grab.py`，板子上 `/home/sunrise/grab.py`。
