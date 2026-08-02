---
title: "Hot100-54. 螺旋矩阵"
description: "方向向量 + 边界判断，把二维矩阵拧成一维遍历"
section: algorithms
date: 2026-07-02
tags: [LeetCode, Hot100, C++]
---

## 思路：方向向量 + visited

第一反应是这题要用方向矩阵写：设一个默认方向（先往右），按当前方向走，走到越界或碰到已访问过的格子就转向，直到把 `m * n` 个格子都走完。

卡住的点是怎么判断"该转向了"。想过用双重 for 循环分别走行和列，但很快发现不对——for 循环走到头之后还得判断能不能继续往同一方向走，写起来别扭，最后想清楚：这本质是把一个二维矩阵拧成一维序列来遍历，用 `while`（或者说用一个统一的 for 循环走满 `m*n` 步）+ 方向向量 + 取模式转向，比强行拆行列循环更干净。

```cpp
class Solution {
public:
    vector<int> spiralOrder(vector<vector<int>>& matrix) {
        int m = matrix.size();
        int n = matrix[0].size();
        // (0,1) 右  (1,0) 下  (0,-1) 左  (-1,0) 上
        int directions[4][2] = {{0,1},{1,0},{0,-1},{-1,0}};
        vector<vector<bool>> visited(m, vector<bool>(n, false));
        int x = 0, y = 0, d = 0;
        vector<int> res;
        for (int i = 0; i < m * n; i++) {
            res.push_back(matrix[x][y]);
            visited[x][y] = true;
            int nx = x + directions[d][0];
            int ny = y + directions[d][1];
            if (nx < 0 || nx >= m || ny < 0 || ny >= n || visited[nx][ny]) {
                d = (d + 1) % 4;
                nx = x + directions[d][0];
                ny = y + directions[d][1];
            }
            x = nx;
            y = ny;
        }
        return res;
    }
};
```

关键逻辑：每走一步先判断沿当前方向的下一格是否越界或已访问，是的话就把方向索引 `d` 加一取模 4（右→下→左→上循环），再重新计算下一格坐标。用 `visited` 数组代替维护四条边界值，写法更直接，代价是多了 O(m*n) 的额外空间——更省空间的写法是维护 `top`/`bottom`/`left`/`right` 四个边界变量，每绕完一圈收缩一次边界，不需要 `visited` 数组。
