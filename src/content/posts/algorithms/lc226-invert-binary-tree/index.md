---
title: "Leetcode226 翻转二叉树"
description: "原始备忘录《Leetcode226 翻转二叉树》，保留原有表达，仅做格式清理和必要脱敏。"
section: algorithms
date: 2026-08-02
updated: 2026-08-02
tags: [算法, 二叉树, 递归]
---

# Leetcode226 翻转二叉树



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
    TreeNode* invertTree(TreeNode* root) {
        //仍然用递归
        if(root==nullptr) return nullptr;
        //应该有个交换
        swap(root->left,root->right);
        invertTree(root->left);
        invertTree(root->right);
        return root;
    }
};

```



这个的关键就是左和右

二叉树是跟递归很深的东西‘

有个交换就行，交换完了返回root
