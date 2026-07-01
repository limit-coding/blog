---
title: "Hot100-42. 接雨水"
description: "从双指针卡壳到 DP 解法：每个位置的储水量取决于左右两侧的最大高度"
section: internship
date: 2026-07-02
tags: [LeetCode, 动态规划, Hot100, C++]
---

## 初步想法：卡在双指针上

第一反应是这题跟 [LC11 盛最多水的容器](/internship/hot11-container-with-most-water)很像，也想用双指针两侧逼近。但很快卡住了：LC11 只关心两个端点围出的最大面积，而接雨水要算的是**每一个位置**能存多少水，判定条件是"左边最高柱子和右边最高柱子中较矮的那个，减去当前柱子的高度"——这依赖的是左右两侧各自的最大值，不是简单的两端收缩能覆盖的。

## 正确方案：DP 预处理左右最大值

对每个位置 `i`，能装的水 = `min(leftMax[i], rightMax[i]) - height[i]`，其中：
- `leftMax[i]`：`0..i` 范围内的最大高度
- `rightMax[i]`：`i..n-1` 范围内的最大高度

先分别从左往右、从右往左扫一遍，预处理出这两个数组，再遍历一次求和。

```cpp
class Solution {
public:
    int trap(vector<int>& height) {
        int n = height.size();
        vector<int> leftMax(n);
        vector<int> rightMax(n);
        vector<int> capacity(n);

        leftMax[0] = height[0];
        for (int i = 1; i < n; i++) {
            leftMax[i] = max(leftMax[i - 1], height[i]);
        }

        rightMax[n - 1] = height[n - 1];
        for (int i = n - 2; i >= 0; i--) {
            rightMax[i] = max(rightMax[i + 1], height[i]);
        }

        for (int i = 0; i < n; i++) {
            capacity[i] = min(rightMax[i], leftMax[i]) - height[i];
        }

        int res = 0;
        for (int i = 0; i < n; i++) {
            res += capacity[i];
        }
        return res;
    }
};
```

需要注意的边界：`leftMax[0]` 和 `rightMax[n-1]` 必须单独初始化，否则递推公式 `leftMax[i] = max(leftMax[i-1], height[i])` 在 `i = 1` 时会读到未初始化的 `leftMax[0]`。

这题本质是三个数组的 DP，空间复杂度 O(n)。更优的写法是用双指针 + 两个变量滚动 `leftMax`/`rightMax`，把空间压到 O(1)，但先吃透"每个位置的水量由左右最大值决定"这个核心逻辑更重要。
