---
title: 单调栈求柱状图最大矩形：每根柱子何时结算
description: 从暴力扩展到单调递增栈，解释哨兵、弹栈时机与矩形宽度的由来。
section: internship
date: 2026-08-02
tags: [算法, 单调栈, 柱状图]
---

柱状图最大矩形的直接做法是：以每根柱子为最低高度，向左右扩展直到遇到更矮柱子。重复扫描会达到 `O(n²)`。单调栈的作用，是在一次遍历中为柱子找到左右第一个更矮的位置。

## 栈里保存什么

维护一个高度单调递增的下标栈。当新柱子比栈顶更矮，说明栈顶柱子向右扩展的边界已经确定，可以结算它作为最低高度的最大矩形。

弹出下标 `mid` 后：

- 右边第一个更矮位置是当前下标 `i`；
- 左边第一个更矮位置是弹栈后的新栈顶；
- 宽度为 `i - stack.top() - 1`。

## 用哨兵统一边界

```cpp
int largestRectangleArea(vector<int>& heights) {
    vector<int> h;
    h.reserve(heights.size() + 2);
    h.push_back(0);
    h.insert(h.end(), heights.begin(), heights.end());
    h.push_back(0);

    stack<int> st;
    st.push(0);
    long long ans = 0;

    for (int i = 1; i < static_cast<int>(h.size()); ++i) {
        while (h[st.top()] > h[i]) {
            int mid = st.top();
            st.pop();
            long long width = i - st.top() - 1;
            ans = max(ans, width * h[mid]);
        }
        st.push(i);
    }
    return static_cast<int>(ans);
}
```

左侧零哨兵保证弹栈后仍有边界，右侧零哨兵迫使所有未结算柱子出栈，因此不需要循环结束后的额外清理。

这里使用严格的 `>`。相等高度可以同时留在栈中，较早的柱子最终获得更宽范围；也可以设计成遇到相等就合并，但边界公式必须与策略一致。

## 用一个例子理解宽度

对于高度 `[2, 1, 5, 6, 2, 3]`，读到第二个 `2` 时，`6` 和 `5` 依次出栈。高度 `5` 出栈后，新栈顶指向左侧高度 `1`，当前下标是右侧高度 `2`，中间两根柱子都至少有高度 `5`，面积为 `5 × 2`。

单调栈题的共同问题不是“怎样写栈”，而是：一个元素什么时候得到足够信息，可以被永久结算？把这个时刻和左右边界说清楚，代码就会从模板变成可推导的方法。
