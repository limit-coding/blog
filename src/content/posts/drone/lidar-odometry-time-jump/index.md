---
title: 雷达里程计突然发散：一次系统时间跳变的排查
description: 从点云算法异常追到 NTP 校时，记录嵌入式系统中“时间也是传感器”的调试经验。
section: drone
date: 2026-08-02
tags: [激光雷达, 里程计, ROS, Linux, 调试]
---

# 解决飞行雷达跳动问题


根因我基本能确定：**系统时间跳变导致 FAST_LIO 崩掉，是第一嫌疑，而且证据很硬。**

日志里有这个现象：

```text
[INFO] [0946684899.x] relative_pose 正常，小范围 0.01m
[INFO] [1777717748.x] relative_pose 仍正常
[WARN] [1777717748.x] Odometry 跳变过大: 26364430.14m
```

`0946684899` 这个时间戳接近 **2000 年**，`1777717748` 是 **2026 年**。也就是说程序启动时系统时间还是假时间，后面热点/NTP/系统同步把时间突然跳到了真实年份。FAST_LIO 是强依赖雷达/IMU时间连续性的，时间一跳，它内部积分/匹配就会炸，于是 `/Odometry` 瞬间变成几百万米。你后面 May 10 那份日志里虽然没到几百万米，但表现一样：

```text
Odometry 跳变过大: 5.060968m
相对位移: dx=-672.024m, dy=+296.689m
首次 Odometry 值过大: x=-724.382945, y=318.412164
```

所以不是飞控接收错，也不是我串口帧格式先错，是 `/Odometry` 已经漂了，`relative_pose` 只是把它抓出来了。

解决方案按优先级来：

1. **不要让 FAST_LIO 在系统时间没同步时启动。**

你板子上的旧 `start_auto.sh` 只等网络，不等时间。应该加上时间等待：

```bash
MIN_VALID_EPOCH=1704067200  # [具体时间已隐去]

echo "[时间] 等待系统时间同步..."
for i in {1..180}; do
    now_epoch=$(date +%s)
    if [ "$now_epoch" -ge "$MIN_VALID_EPOCH" ]; then
        echo "[时间] 系统时间有效: $(date)"
        break
    fi
    if [ "$i" -eq 180 ]; then
        echo "[时间] 系统时间仍无效，退出让 systemd 重启"
        exit 1
    fi
    sleep 1
done
```

这段我之前其实已经放在 `[本地补丁目录]/start_auto.sh` 里了，但你当前板子快照里的 `/home/[设备用户]/project/start_auto.sh` 还是旧版，没有这段。

2. **systemd 也要等时间同步，但不能只靠它。**

服务文件可以有：

```ini
After=network-online.target time-sync.target dev-ttyFC.device
Wants=network-online.target time-sync.target
```

但这个不一定百分百挡住时间跳，所以 `start_auto.sh` 里的 `date +%s` 检查更关键。

3. **以后调试时先看时间，再启动雷达链路。**

开机后先跑：

```bash
date
```

如果显示 2000 年，别启动 FAST_LIO。等它变成真实日期后再：

```bash
sudo systemctl restart lidar-fc
```

4. **用你刚才那个 xy 命令验证是不是还漂。**

```bash
ros2 topic echo /Odometry --field pose.pose.position | awk '
/x:/ {x=$2}
/y:/ {y=$2; printf "%s  x=%s  y=%s\n", strftime("%H:%M:%S"), x, y}
'
```

如果时间同步修好后，静止时 x/y 还会慢慢飘或突然跳，那第二嫌疑才是 FAST_LIO 场景退化/雷达安装震动/IMU外参问题。但从这份日志看，**第一刀先砍系统时间问题**，这个太明显了。

`auto_flight.launch.py` 是 **ROS2 的 launch 启动文件**，不是飞行逻辑本身，也不是性能瓶颈。

它虽然后缀是 `.py`，但作用只是告诉 ROS2：

```text
先启动 Livox 驱动
2 秒后启动 FAST_LIO
4 秒后启动 mid360_xy / relative_pose / fc_bridge / qr_detector
```

也就是“拉起一堆节点的启动清单”。ROS2 官方 launch 文件本来就常用 Python 写。**没必要改成 C++**，也基本不能按普通节点那样“改成 C++ 更快”。真正该用 C++ 的是高频运行节点，比如：

```text
relative_pose_cpp
fc_bridge_cpp
mid360_xy_cpp
```

这些我们已经是 C++ 版了。`auto_flight.launch.py` 只在启动时执行，启动完就负责管理进程，不参与 20Hz 串口发送，也不参与 FAST_LIO 计算。

你这次自己传，我给你完整命令。假设你在电脑当前目录就是：

```bash
/Users/[用户]/[项目目录]
```

先传脚本到板子临时文件：

```bash
scp [本地补丁目录]/start_auto.sh [设备用户]@[IP已隐去]:/home/[设备用户]/project/start_auto.sh.tmp
```

登录板子：

```bash
ssh [设备用户]@[IP已隐去]
```

在板子上检查新脚本内容：

```bash
grep -n "等待系统时间" /home/[设备用户]/project/start_auto.sh.tmp
grep -n "MIN_VALID_EPOCH" /home/[设备用户]/project/start_auto.sh.tmp
bash -n /home/[设备用户]/project/start_auto.sh.tmp
```

备份旧脚本：

```bash
cp /home/[设备用户]/project/start_auto.sh /home/[设备用户]/project/start_auto.sh.bak.$(date +%Y%m%d_%H%M%S)
```

替换正式脚本：

```bash
cp /home/[设备用户]/project/start_auto.sh.tmp /home/[设备用户]/project/start_auto.sh
chmod +x /home/[设备用户]/project/start_auto.sh
```

确认替换成功：

```bash
grep -n "等待系统时间" /home/[设备用户]/project/start_auto.sh
grep -n "MIN_VALID_EPOCH" /home/[设备用户]/project/start_auto.sh
```

重启服务：

```bash
sudo systemctl restart lidar-fc
```

看启动日志，确认顺序对：

```bash
sudo journalctl -u lidar-fc -n 80 --no-pager
```

你应该看到类似：

```text
[网络] 检查 eth0 网络状态
[网络] eth0 已就绪
[时间] 等待系统时间同步到有效年份
[时间] 系统时间有效
[环境] 加载 ROS2 Humble
[启动] 启动 auto_flight.launch.py
```

然后再用这个盯 `/Odometry` 的 xy：

```bash
source /opt/ros/humble/setup.bash
source /home/[设备用户]/lidar_ws/install/setup.bash
source /home/[设备用户]/project/install/setup.bash

ros2 topic echo /Odometry --field pose.pose.position | awk '
/x:/ {x=$2}
/y:/ {y=$2; printf "%s  x=%s  y=%s\n", strftime("%H:%M:%S"), x, y}
'
```

如果你还想检查 `auto_flight.launch.py` 当前启动的是不是 C++ 节点：

```bash
grep -n "executable" /home/[设备用户]/project/auto_flight.launch.py
```

理想情况下应该能看到类似：

```text
mid360_xy_cpp
relative_pose_cpp
fc_bridge_cpp
qr_detector_cpp
```

如果看到的是不带 `_cpp` 的 `mid360_xy`、`relative_pose`、`fc_bridge`，那说明板子还在跑 Python 老节点，需要再同步 C++ 版 launch。

对，先验尸再动刀。你在板子上先跑这些命令，专门确认有没有“启动时 2000 年，后来跳到真实时间”的证据。

**1. 看当前系统时间**

```bash
date
timedatectl
```

重点看 `System clock synchronized` 是不是 `yes`，当前日期是不是正常。

**2. 查 lidar-fc 本次启动日志里有没有 2000 年**

```bash
sudo journalctl -u lidar-fc -b --no-pager | grep -E "2000|946684|094668|1777"
```

解释一下：

```text
2000        日志文本日期里可能直接出现 2000 年
946684      Unix 时间戳 [具体时间已隐去] 附近
094668      ROS 日志里常见补零格式
1777        2026 年附近时间戳，用来对比是否从 2000 跳到 2026
```

**3. 更直接：看 relative_pose 的 ROS 日志时间戳是否前后跳变**

```bash
sudo journalctl -u lidar-fc -b --no-pager | grep "relative_pose" | grep -E "\[0?94668|\[177"
```

如果同一轮启动里同时出现类似：

```text
[0946684893.x] [relative_pose_node]: ...
[1777717748.x] [relative_pose_node]: ...
```

那就坐实了：ROS 节点运行期间系统时间从 2000 年跳到了真实年份。

**4. 看 FAST_LIO 有没有跟着炸**

```bash
sudo journalctl -u lidar-fc -b --no-pager | grep -E "Odometry 跳变|首次 Odometry 值过大|No point|Too few|VoxelGrid"
```

如果你看到：

```text
Odometry 跳变过大
首次 Odometry 值过大
```

而且前面刚好有 `094668... -> 177...` 的时间跳变，那基本就能定性。

**5. 看服务是什么时候启动的**

```bash
systemctl status lidar-fc --no-pager
```

如果里面显示类似：

```text
Active: active (running) since Sat [具体时间已隐去] ...
```

这也是很强证据，说明服务是在假时间下启动的。

最关键的一条其实是这个：

```bash
sudo journalctl -u lidar-fc -b --no-pager | grep "relative_pose" | grep -E "\[0?94668|\[177"
```

你把输出贴给我，我就能判断是不是这个锅。
