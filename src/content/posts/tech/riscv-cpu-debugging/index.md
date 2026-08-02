---
title: 调试一个简化 RISC-V CPU：先找第一个错误周期
description: 记录我在数字逻辑模拟器中排查处理器错误的方法：从指令轨迹、控制信号和位宽边界逐层收缩范围。
section: tech
date: 2026-08-02
tags: [RISC-V, 数字逻辑, CPU, 调试]
---

# cs61c bug

第一步:重新生成测试文件

cd /Users/[用户]/[课程项目目录]
建一个文件 tests/integration-custom/in/storeload-check.s,内容:
addi t0, x0, 100
addi t1, x0, 0x42
sw t1, 0(t0)
lw t2, 0(t0)
然后跑:
bash test.sh test_custom
跑完之后,会在 tests/integration-custom/ 目录下生成一个 storeload-check.circ 文件——这个文件是重点,直接用 Logisim 打开它(不是打开cpu.circ,是打开这个自动生成的、已经把程序装好的完整电路)。

第二步:在 Logisim 里打开它,准备单步执行

1. 打开后你会看到一个大电路(最外层,包含了IMEM、DMEM、还有你的cpu作为一个子模块)
2. 找菜单栏 Simulate,把里面的 "Simulate → Ticks Enabled" 先关掉(如果开着的话),这样时钟不会自动跑,方便你一步步点
3. 同样在 Simulate 菜单里,找 "Tick Once" 这个选项(或者看有没有快捷键,通常是这个功能),每点一次,时钟走一个周期,相当于执行一条指令

第三步:点4次时钟(执行到sw那条指令完成)

题目里 addi、addi、sw、lw 一共4条指令,sw是第3条。点3次"Tick Once",这时候sw应该刚执行完。

第四步:找到DMEM,看里面的数据

1. 在画布上找到标着 "DMEM" 的那个大方块(最外层电路里应该能看到,可能需要滚动画布或者缩小视图)
2. 双击这个DMEM方块——如果它是个子电路,双击会"进入"它内部,能看到里面的RAM
3. 里面应该有几个RAM小方块(可能是4个,分别存字节0/1/2/3)。双击其中一个RAM,会弹出一个表格/网格,显示这个RAM每个地址存的值
4. 地址100(十六进制是0x64)对应的那一格,看看是不是变成了 0x42(或者对应字节,因为可能分散在4个RAM里,每个RAM存一个字节)

把你看到的情况告诉我(RAM里那个地址到底有没有变成写进去的值),我们根据这个继续往下查。

看到你的菜单了,用词稍微不一样,对应关系是:

"Manual Tick Full Cycle"(快捷键 F9) = 我说的"点一次时钟,执行一条指令"

具体操作:
1. 先点一下 "Reset Simulation"(⌘R),确保从头开始
2. 然后按 F9 三次(或者每次都从菜单里点 "Manual Tick Full Cycle"),执行完前3条指令(addi、addi、sw),这时候 sw 应该刚执行完
3. 不用点第4次(那是lw,还没执行到,我们现在只想看sw有没有真的把值写进内存)

小提示:你也可以打开 "Assembly viewer" 这个选项(菜单最下面那个),它应该会显示当前执行到哪一行汇编,方便你确认自己点到第几条指令了,不容易数错。

点完3次F9之后,去找DMEM那个方块,双击进去看RAM内容,跟我说说看到了什么。
