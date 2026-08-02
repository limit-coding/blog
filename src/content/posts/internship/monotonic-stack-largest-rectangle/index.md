---
title: 单调栈求柱状图最大矩形：每根柱子何时结算
description: 从暴力扩展到单调递增栈，解释哨兵、弹栈时机与矩形宽度的由来。
section: internship
date: 2026-08-02
tags: [算法, 单调栈, 柱状图]
---

# Leetcode84 最大矩形


我先讲讲我对这个题最初的看法。我首先觉得它很像“接雨水”，然后自然而然想到双指针，结果发现不是双指针，而是滑动窗口。接下来我觉得它能优化到 O(n)，但我一直在想，就先用 O(n) 的做法去做。

这种问题的一种显然做法是用 O(n^3) 写，当然是可以的，但显然不行对吧？首先 i 到 j 跑一轮，一个 i 循环是一层，然后内部的 j 再跑一轮是第 2 层，第 3 层是找到 i、j 之间的最小值。

我觉得用 ON 方的话，就是 IG 跑一个二重循环，然后再直接写那个内部的最小值，可以用前缀和维护一下。


```
class Solution {
public:
    int largestRectangleArea(vector<int>& heights) {
        stack<int> st;
        int n=heights.size();
        int maxArea=0;
        for(int i=0;i<n;i++){
          while(!st.empty() && heights[i]<heights[st.top()]){
            int h=heights[st.top()];
            st.pop();
            int left=st.empty() ? -1:st.top();
            maxArea=max(maxArea,h*(i-left-1));
          }
          st.push(i);
        }
        while(!st.empty()){
          int h=heights[st.top()];
          st.pop();
          int left=st.empty()? -1:st.top();
          maxArea=max(maxArea,h*(n-left-1));
        }
        return maxArea;
    }
};

```



这就是用单调栈写的这个做法。这个栈维护的是一个下标，然后栈顶就是说你当前的这个高度。

这个题还是有点难做，这题我再想想，我再出一个解法吧
