---
title: "Leetcode543 二叉树的直径"
description: "原始备忘录《Leetcode543 二叉树的直径》，保留原有表达，仅做格式清理和必要脱敏。"
section: algorithms
date: 2026-08-02
updated: 2026-08-02
tags: [算法, 二叉树, 递归]
---

# Leetcode543 二叉树的直径




```
/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode() : val(0), left(nullptr), right(nullptr) {}
 *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
 *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
 * };
 */
class Solution {
public:
    int ans=0;
    int height(TreeNode* node){
      if(!node) return 0;
      int left=height(node->left);
      int right=height(node->right);
      ans=max(ans,left+right);
      return max(left,right)+1;

    }
    int diameterOfBinaryTree(TreeNode* root) {
        height(root);
        return ans;
    }
};

```

本质 3递归，先一直往下钻钻到叶子节点，然后max(left,right)+1就是返回较高节点的上一个父节点；

但是这个的关键是怎么理解直径，直径就是左子树+右子树的高度
**2. 为什么"任意两点间最长路径"能转化成"左高度+右高度"？**
任意一条路径，一定存在一个"最高点"（也就是路径上深度最小的那个节点，图论里叫 LCA，最近公共祖先）。这条路径可以拆成两段：从最高点往左下走的一段，和往右下走的一段。
比如路径 5 → 3 → 2 → 4，最高点是 2。从 2 往左下（经过3）走到5，长度2；从2往右下走到4，长度1。加起来就是路径总长度 3。
所以：**任意一条路径的长度，等于它的最高点的"左子树深度 + 右子树深度"。**
**3. 于是问题变成：枚举每个节点当"最高点"，看它撑起的路径有多长。**
对每个节点 node，以它为最高点能撑起的最长路径 = 左子树的高度 + 右子树的高度（因为路径要往左边尽量深地扎、往右边尽量深地扎，才能最长）。
